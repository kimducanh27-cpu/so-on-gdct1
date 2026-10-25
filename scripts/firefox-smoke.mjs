import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const base = process.env.QA_BASE || 'http://127.0.0.1:8123/so-on-gdct1/';
const shotsDir = process.env.QA_SHOTS || '';
const failures = [];
const consoleErrors = [];
let currentErrors = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (label, detail) => {
  failures.push({ label, detail });
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
};
const pass = (label, detail = '') => console.log(`PASS ${label}${detail ? ` — ${detail}` : ''}`);

function findFirefox() {
  const candidates = [
    process.env.FIREFOX_BIN,
    'C:/Program Files/Mozilla Firefox/firefox.exe',
    'C:/Program Files (x86)/Mozilla Firefox/firefox.exe',
    '/Applications/Firefox.app/Contents/MacOS/firefox',
    '/usr/bin/firefox',
    '/usr/bin/firefox-esr',
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function waitForPort(port, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const attempt = () => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) reject(new Error(`Firefox BiDi không mở sau ${timeoutMs}ms`));
        else setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

async function connect(port) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/session`);
  let seq = 0;
  const pending = new Map();
  const listeners = [];
  const ready = new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('Firefox BiDi WebSocket error'));
  });
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
      return;
    }
    for (const listener of listeners) listener(message);
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  return { ws, ready, send, listeners };
}

async function main() {
  const firefox = findFirefox();
  if (!firefox) throw new Error('Không tìm thấy Firefox (đặt FIREFOX_BIN)');
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gdct1-qa-firefox-'));
  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });

  const child = spawn(
    firefox,
    [
      '--headless',
      '--no-remote',
      '--wait-for-browser',
      `--profile`,
      profile,
      `--remote-debugging-port=${port}`,
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true }
  );

  let session;
  try {
    await waitForPort(port);
    const client = await connect(port);
    await client.ready;
    session = client;
    await session.send('session.new', { capabilities: {} });
    await session.send('session.subscribe', { events: ['log.entryAdded'] });

    session.listeners.push((message) => {
      if (message.method !== 'log.entryAdded') return;
      const entry = message.params;
      if (entry.level !== 'error') return;
      currentErrors.push(`log: ${entry.text || entry.type || 'error'}`);
    });

    const tree = await session.send('browsingContext.getTree', {});
    const context = tree.contexts[0].context;

    const evaluate = async (expression, awaitPromise = false) => {
      const result = await session.send('script.evaluate', {
        expression,
        target: { context },
        awaitPromise,
        resultOwnership: 'none',
      });
      if (result.type === 'exception') throw new Error(JSON.stringify(result.exceptionDetails || result));
      return result.result?.value;
    };

    const waitReady = async () => {
      for (let i = 0; i < 50; i++) {
        if ((await evaluate('document.readyState')) === 'complete') break;
        await sleep(100);
      }
      await evaluate('document.fonts.ready.then(() => "ok")', true);
      await sleep(250);
    };

    const navigate = async (url) => {
      currentErrors = [];
      await session.send('browsingContext.navigate', { context, url, wait: 'complete' });
      await waitReady();
    };

    const viewport = async (width, height) => {
      await session.send('browsingContext.setViewport', {
        context,
        viewport: { width, height, devicePixelRatio: 1 },
      });
      await sleep(120);
    };

    const pageState = async () =>
      JSON.parse(
        await evaluate(`JSON.stringify((() => {
          const de = document.documentElement;
          const imgs = [...document.images].map((img) => ({
            src: img.currentSrc || img.src,
            ok: img.complete && img.naturalWidth > 0,
          }));
          const h1 = [...document.querySelectorAll('h1')];
          const cta = [...document.querySelectorAll('a')].find((a) =>
            (a.textContent || '').replace(/\\s+/g, ' ').trim() === 'Mở sổ ôn ngay'
          );
          return {
            title: document.title,
            h1Count: h1.length,
            scrollWidth: de.scrollWidth,
            clientWidth: de.clientWidth,
            overflow: de.scrollWidth - de.clientWidth,
            imgs,
            ctaHref: cta ? cta.href : null,
            fontsStatus: document.fonts.status,
            newsreader: document.fonts.check('400 16px Newsreader'),
            space: document.fonts.check('400 16px "Space Grotesk"'),
            mainText: (document.querySelector('main')?.innerText || '').trim().length,
          };
        })())`)
      );

    const screenshot = async (name, width) => {
      if (!shotsDir) return;
      const { data } = await session.send('browsingContext.captureScreenshot', { context });
      fs.writeFileSync(path.join(shotsDir, `ff-${name}-${width}.png`), Buffer.from(data, 'base64'));
    };

    const pages = [
      { name: 'landing', url: base, h1: 1 },
      { name: '404', url: `${base}404.html`, h1: 1 },
    ];
    const viewports = [
      [320, 800],
      [360, 800],
      [390, 844],
      [768, 1024],
      [1280, 900],
    ];

    for (const page of pages) {
      for (const [width, height] of viewports) {
        await viewport(width, height);
        await navigate(page.url);
        const state = await pageState();
        const label = `ff ${page.name} ${width}x${height}`;
        if (state.overflow > 1) fail(`${label} không overflow ngang`, `scrollWidth ${state.scrollWidth} > ${state.clientWidth}`);
        else pass(`${label} không overflow ngang`);
        if (state.h1Count !== page.h1) fail(`${label} đúng ${page.h1} h1`, `có ${state.h1Count}`);
        else pass(`${label} đúng ${page.h1} h1`);
        if (state.mainText < 40) fail(`${label} main có nội dung`, `${state.mainText} ký tự`);
        else pass(`${label} main có nội dung`);
        if (state.fontsStatus !== 'loaded') fail(`${label} font tải xong`, state.fontsStatus);
        else pass(`${label} font tải xong`);
        if (!state.newsreader || !state.space) fail(`${label} font landing dùng được`, `Newsreader=${state.newsreader} Space=${state.space}`);
        else pass(`${label} font landing dùng được`);
        if (currentErrors.length) fail(`${label} console sạch`, currentErrors.join(' | '));
        else pass(`${label} console sạch`);
        await sleep(900);
        await screenshot(page.name, width);

        if (page.name === 'landing' && width === 1280) {
          if (state.ctaHref !== `${base}app/#/today`) fail('ff CTA trỏ đúng app', state.ctaHref);
          else pass('ff CTA trỏ đúng app');
        }

        if (page.name === 'landing' && (width === 390 || width === 1280)) {
          await evaluate('document.documentElement.style.scrollBehavior = "auto"; document.querySelector("#trong-so").scrollIntoView(); true');
          await sleep(800);
          await evaluate('window.scrollTo(0, document.documentElement.scrollHeight); true');
          await sleep(600);
          const after = await pageState();
          const broken = after.imgs.filter((img) => !img.ok);
          if (broken.length) fail(`${label} ảnh tải đủ`, broken.map((img) => img.src).join(', '));
          else pass(`${label} ảnh tải đủ (${after.imgs.length})`);
          await evaluate('window.scrollTo(0, 0); true');
        }
      }
    }

    await viewport(390, 844);
    await navigate(`${base}app/`);
    const routes = ['today', 'study', 'done', 'library', 'check', 'stats', 'settings', 'exam-setup'];
    for (const route of routes) {
      currentErrors = [];
      await evaluate(`location.hash = '#/${route}'; true`);
      await sleep(400);
      const state = await pageState();
      if (state.mainText < 40) fail(`ff app #/${route} render`, `${state.mainText} ký tự`);
      else pass(`ff app #/${route} render`);
      if (currentErrors.length) fail(`ff app #/${route} console sạch`, currentErrors.join(' | '));
    }
    await screenshot('app', 390);

    console.log('INFO Keyboard/focus Firefox do scripts/firefox-keyboard.mjs (Marionette) kiểm');
    if (consoleErrors.length === 0) pass('ff không có console error');
    else fail('ff không có console error', `${consoleErrors.length} nhóm`);
  } finally {
    try { await session?.send('session.end', {}); } catch { /* ignore */ }
    try { session?.ws.close(); } catch { /* ignore */ }
    if (process.platform === 'win32' && child.pid) {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    } else {
      child.kill();
    }
    await sleep(500);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  if (failures.length) {
    console.error(`\n${failures.length} Firefox check(s) failed`);
    process.exit(1);
  }
  console.log('\nAll Firefox checks pass');
}

main().catch((error) => {
  console.error(`ERROR ${error.message}`);
  process.exit(1);
});
