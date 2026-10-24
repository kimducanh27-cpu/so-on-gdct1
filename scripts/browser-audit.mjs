import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const base = process.env.QA_BASE || 'http://127.0.0.1:8123/so-on-gdct1/';
const shotsDir = process.env.QA_SHOTS || '';
const baseOrigin = new URL(base).origin;
const failures = [];
const consoleErrors = [];
const thirdParty = new Set();
let currentErrors = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (label, detail) => {
  failures.push({ label, detail });
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
};
const pass = (label, detail = '') => console.log(`PASS ${label}${detail ? ` — ${detail}` : ''}`);

function findBrowser() {
  const candidates = [
    process.env.CHROME_BIN,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
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

async function waitForCdp(port, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await sleep(200);
  }
  throw new Error(`Chrome CDP không mở sau ${timeoutMs}ms`);
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let seq = 0;
  const pending = new Map();
  const ready = new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('CDP WebSocket error'));
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
    if (message.method === 'Runtime.exceptionThrown') {
      const text = message.params.exceptionDetails.text || '';
      const description = message.params.exceptionDetails.exception?.description || '';
      currentErrors.push(`exception: ${text} ${description}`.trim());
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      currentErrors.push(
        `console.error: ${message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ')}`.trim()
      );
    }
    if (
      message.method === 'Network.responseReceived' &&
      message.params.response.status >= 400 &&
      message.params.response.url.startsWith(base)
    ) {
      currentErrors.push(`HTTP ${message.params.response.status}: ${message.params.response.url}`);
    }
    if (message.method === 'Network.requestWillBeSent') {
      const url = message.params.request.url;
      if (/^https?:/i.test(url) && new URL(url).origin !== baseOrigin) thirdParty.add(url);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  return { ws, ready, send };
}

async function main() {
  const browser = findBrowser();
  if (!browser) throw new Error('Không tìm thấy Chrome/Edge/Chromium (đặt CHROME_BIN)');
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gdct1-qa-chrome-'));
  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });

  const child = spawn(
    browser,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-extensions',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let cdp;
  try {
    await waitForCdp(port);
    const target = await (
      await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })
    ).json();
    cdp = connect(target.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    const evaluate = async (expression, awaitPromise = false) => {
      const result = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise,
      });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };

    const waitReady = async () => {
      for (let i = 0; i < 50; i++) {
        if (await evaluate('document.readyState')) {
          const state = await evaluate('document.readyState');
          if (state === 'complete') break;
        }
        await sleep(100);
      }
      await evaluate('document.fonts.ready.then(() => true)', true);
      await sleep(250);
    };

    const navigate = async (url) => {
      currentErrors = [];
      await cdp.send('Page.navigate', { url });
      await waitReady();
    };

    const viewport = async (width, height) => {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 700,
        screenWidth: width,
        screenHeight: height,
      });
      await sleep(120);
    };

    const pageState = () =>
      evaluate(`(() => {
        const de = document.documentElement;
        const imgs = [...document.images].map((img) => ({
          src: img.currentSrc || img.src,
          ok: img.complete && img.naturalWidth > 0,
          width: img.naturalWidth,
        }));
        const h1 = [...document.querySelectorAll('h1')];
        const cta = [...document.querySelectorAll('a')].find((a) =>
          (a.textContent || '').replace(/\\s+/g, ' ').trim() === 'Mở sổ ôn ngay'
        );
        return {
          title: document.title,
          h1Count: h1.length,
          h1Text: (h1[0]?.innerText || '').trim(),
          scrollWidth: de.scrollWidth,
          clientWidth: de.clientWidth,
          overflow: de.scrollWidth - de.clientWidth,
          imgs,
          ctaHref: cta ? cta.href : null,
          fontsStatus: document.fonts.status,
          newsreader: document.fonts.check('400 16px Newsreader'),
          space: document.fonts.check('400 16px "Space Grotesk"'),
          mainText: (document.querySelector('main')?.innerText || '').trim().length,
          lang: de.lang,
        };
      })()`);

    const screenshot = async (name, width) => {
      if (!shotsDir) return;
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      fs.writeFileSync(path.join(shotsDir, `${name}-${width}.png`), Buffer.from(data, 'base64'));
    };

    const pages = [
      { name: 'landing', url: base, strict: true, h1: 1 },
      { name: '404', url: `${base}404.html`, strict: true, h1: 1 },
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
        const label = `${page.name} ${width}x${height}`;
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
        if (currentErrors.length) {
          consoleErrors.push({ label, errors: [...currentErrors] });
          fail(`${label} console sạch`, currentErrors.join(' | '));
        } else pass(`${label} console sạch`);
        await screenshot(page.name, width);

        if (page.name === 'landing' && width === 1280) {
          if (state.ctaHref !== `${base}app/#/today`) fail('CTA trỏ đúng app', state.ctaHref);
          else pass('CTA trỏ đúng app');
        }

        if (page.name === 'landing' && (width === 390 || width === 1280)) {
          await evaluate('window.scrollTo(0, document.body.scrollHeight); true');
          await sleep(700);
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
      await sleep(350);
      const state = await pageState();
      if (state.mainText < 40) fail(`app #/${route} render`, `${state.mainText} ký tự`);
      else pass(`app #/${route} render`);
      if (currentErrors.length) fail(`app #/${route} console sạch`, currentErrors.join(' | '));
    }
    await screenshot('app', 390);

    await viewport(1280, 900);
    currentErrors = [];
    await navigate(base);
    await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await cdp.send('Page.bringToFront');

    const pressKey = async (key, code, keyCode) => {
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'rawKeyDown',
        key,
        code,
        windowsVirtualKeyCode: keyCode,
      });
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key,
        code,
        windowsVirtualKeyCode: keyCode,
      });
    };

    const pressEnter = async () => {
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
        nativeVirtualKeyCode: 13,
        text: '\r',
        unmodifiedText: '\r',
      });
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
        nativeVirtualKeyCode: 13,
      });
    };

    const activeState = () =>
      evaluate(`(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return { none: true };
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 60),
          className: typeof el.className === 'string' ? el.className : '',
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth) || 0,
          outlineColor: style.outlineColor,
          rect: [Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height)],
          inViewport: rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0,
        };
      })()`);

    await pressKey('Tab', 'Tab', 9);
    await sleep(350);
    const skip = await activeState();
    if (!skip.className || !String(skip.className).includes('skip-link')) fail('Tab đầu tiên vào skip link', JSON.stringify(skip));
    else pass('Tab đầu tiên vào skip link');
    if (!skip.inViewport) fail('skip link hiện trong màn hình', JSON.stringify(skip.rect));
    else pass('skip link hiện trong màn hình');
    if (skip.outlineWidth < 2) fail('skip link có focus ring ≥2px', `${skip.outlineWidth}px`);
    else pass('skip link có focus ring ≥2px');

    const focusTrail = [];
    for (let i = 0; i < 24; i++) {
      await pressKey('Tab', 'Tab', 9);
      await sleep(650);
      const focused = await activeState();
      focusTrail.push(focused);
      if (focused.none) {
        fail(`focus bước ${i + 2}`, 'rơi về body');
        break;
      }
      if (focused.outlineWidth < 2) fail(`focus ring bước ${i + 2}`, `${focused.text}: ${focused.outlineWidth}px`);
      if (!focused.inViewport) fail(`focus không bị che bước ${i + 2}`, `${focused.text}: ${JSON.stringify(focused.rect)}`);
    }
    if (focusTrail.filter((item) => !item.none).length >= 10) {
      pass(`focus walk ${focusTrail.length} bước, ring ≥2px, không bị che`);
    } else fail('focus walk đủ phần tử', `${focusTrail.length} bước`);

    const faqFocus = await evaluate(`(() => {
      const summary = document.querySelector('#hoi-dap summary');
      if (!summary) return false;
      summary.focus();
      return document.activeElement === summary;
    })()`);
    if (!faqFocus) fail('FAQ focus được bằng bàn phím');
    else {
      await pressEnter();
      await sleep(250);
      const opened = await evaluate('document.querySelector("#hoi-dap summary").parentElement.open');
      await pressEnter();
      await sleep(250);
      const closed = await evaluate('!document.querySelector("#hoi-dap summary").parentElement.open');
      if (opened && closed) pass('FAQ mở/đóng bằng Enter');
      else fail('FAQ mở/đóng bằng Enter', `open=${opened} close=${closed}`);
    }

    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await navigate(base);
    const motion = await evaluate(`(() => {
      const running = document.getAnimations().filter((a) => a.playState === 'running');
      const hero = document.querySelector('.hero');
      return {
        running: running.length,
        heroOpacity: hero ? getComputedStyle(hero).opacity : null,
        heroVisible: hero ? hero.getBoundingClientRect().height > 0 : false,
      };
    })()`);
    if (motion.running !== 0) fail('reduced motion không chạy animation', `${motion.running}`);
    else pass('reduced motion không chạy animation');
    if (motion.heroOpacity !== '1' || !motion.heroVisible) fail('hero hiện khi reduced motion', JSON.stringify(motion));
    else pass('hero hiện khi reduced motion');
    await cdp.send('Emulation.setEmulatedMedia', { features: [] });

    if (consoleErrors.length === 0) pass('không có console error trên landing/404');
    else fail('không có console error trên landing/404', `${consoleErrors.length} nhóm`);

    if (thirdParty.size === 0) pass('0 request third-party lúc chạy');
    else fail('0 request third-party lúc chạy', [...thirdParty].join(', '));
  } finally {
    try { cdp?.ws.close(); } catch { /* ignore */ }
    child.kill();
    await sleep(400);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  if (failures.length) {
    console.error(`\n${failures.length} browser audit check(s) failed`);
    process.exit(1);
  }
  console.log('\nAll browser audit checks pass');
}

main().catch((error) => {
  console.error(`ERROR ${error.message}`);
  process.exit(1);
});
