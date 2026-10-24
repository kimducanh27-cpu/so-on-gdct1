import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const base = process.env.QA_BASE || 'http://127.0.0.1:8123/so-on-gdct1/';
const failures = [];
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

function connectMarionette(port) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1');
    let buffer = Buffer.alloc(0);
    let nextId = 1;
    const pending = new Map();
    const rejectPending = (error) => {
      for (const item of pending.values()) item.reject(error);
      pending.clear();
    };
    const send = (name, params = {}) =>
      new Promise((res, rej) => {
        const id = nextId++;
        pending.set(id, { resolve: res, reject: rej });
        const message = JSON.stringify([0, id, name, params]);
        socket.write(`${Buffer.byteLength(message)}:${message}`);
      });
    socket.once('error', (error) => {
      rejectPending(error);
      reject(error);
    });
    socket.on('close', () => rejectPending(new Error('Marionette socket closed')));
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (true) {
        const colon = buffer.indexOf(58);
        if (colon < 0) return;
        const length = Number(buffer.subarray(0, colon).toString());
        if (buffer.length < colon + 1 + length) return;
        const body = JSON.parse(buffer.subarray(colon + 1, colon + 1 + length).toString());
        buffer = buffer.subarray(colon + 1 + length);
        if (body[0] !== 1 || !pending.has(body[1])) continue;
        const item = pending.get(body[1]);
        pending.delete(body[1]);
        if (body[2]) item.reject(new Error(`${JSON.stringify(body[2])} ${body[3] ?? ''}`));
        else item.resolve(body[3]);
      }
    });
    socket.once('connect', () => resolve({ socket, send }));
  });
}

async function openSession(port, timeoutMs = 20000) {
  const started = Date.now();
  let lastError;
  // The Marionette listener can disappear between startup and connect; retry the whole handshake.
  while (Date.now() - started < timeoutMs) {
    let client;
    try {
      client = await connectMarionette(port);
      await client.send('WebDriver:NewSession', { capabilities: { alwaysMatch: { browserName: 'firefox' } } });
      return client;
    } catch (error) {
      lastError = error;
      try { client?.socket.destroy(); } catch { /* ignore */ }
      await sleep(250);
    }
  }
  throw new Error(`Marionette không sẵn sàng sau ${timeoutMs}ms: ${lastError?.message || 'không rõ'}`);
}

async function main() {
  const firefox = findFirefox();
  if (!firefox) throw new Error('Không tìm thấy Firefox (đặt FIREFOX_BIN)');
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gdct1-qa-ffkb-'));
  fs.writeFileSync(
    path.join(profile, 'user.js'),
    [
      `user_pref("marionette.port", ${port});`,
      'user_pref("focusmanager.testmode", true);',
      'user_pref("browser.tabs.warnOnClose", false);',
      'user_pref("browser.shell.checkDefaultBrowser", false);',
      '',
    ].join('\n')
  );

  const child = spawn(
    firefox,
    ['--headless', '--no-remote', '--wait-for-browser', '--marionette', '--profile', profile, 'about:blank'],
    { stdio: 'ignore', windowsHide: true }
  );

  let client;
  try {
    client = await openSession(port);
    await client.send('WebDriver:SetWindowRect', { x: 0, y: 0, width: 1280, height: 900 });
    await client.send('WebDriver:Navigate', { url: base });

    const script = async (body) => {
      const result = await client.send('WebDriver:ExecuteScript', { script: body, args: [] });
      return result?.value;
    };

    for (let i = 0; i < 40; i++) {
      if ((await script('return document.readyState;')) === 'complete') break;
      await sleep(100);
    }
    for (let i = 0; i < 40; i++) {
      if ((await script('return document.fonts.status;')) === 'loaded') break;
      await sleep(100);
    }
    await sleep(300);

    const key = (value) =>
      client.send('WebDriver:PerformActions', {
        actions: [
          {
            type: 'key',
            id: 'keyboard',
            actions: [
              { type: 'keyDown', value },
              { type: 'keyUp', value },
            ],
          },
        ],
      });

    const activeState = () =>
      script(`const el = document.activeElement;
        if (!el || el === document.body) return { none: true };
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          none: false,
          tag: el.tagName,
          text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 60),
          className: typeof el.className === 'string' ? el.className : '',
          outlineWidth: parseFloat(style.outlineWidth) || 0,
          hasFocus: document.hasFocus(),
          focus: el.matches(':focus'),
          rect: [Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height)],
          visible: rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0,
        };`);

    await key('\uE004');
    await sleep(700);
    const skip = await activeState();
    if (skip.none || !String(skip.className).includes('skip-link')) fail('ffkb Tab đầu tiên vào skip link', JSON.stringify(skip));
    else pass('ffkb Tab đầu tiên vào skip link');
    if (!skip.hasFocus || !skip.focus) fail('ffkb trang có focus thật', `hasFocus=${skip.hasFocus} focus=${skip.focus}`);
    else pass('ffkb trang có focus thật');
    if (skip.outlineWidth < 2) fail('ffkb skip link focus ring ≥2px', `${skip.outlineWidth}px`);
    else pass('ffkb skip link focus ring ≥2px');
    if (!skip.visible || skip.rect[1] < 0) fail('ffkb skip link hiện trong màn hình', JSON.stringify(skip.rect));
    else pass('ffkb skip link hiện trong màn hình');

    let focusedCount = 0;
    for (let i = 0; i < 22; i++) {
      await key('\uE004');
      await sleep(700);
      const focused = await activeState();
      if (focused.none) {
        fail(`ffkb focus bước ${i + 2}`, 'rơi về body');
        break;
      }
      focusedCount++;
      if (!focused.hasFocus || !focused.focus) fail(`ffkb focus thật bước ${i + 2}`, `${focused.text}`);
      if (focused.outlineWidth < 2) fail(`ffkb focus ring bước ${i + 2}`, `${focused.text}: ${focused.outlineWidth}px`);
      if (!focused.visible) fail(`ffkb focus không bị che bước ${i + 2}`, `${focused.text}: ${JSON.stringify(focused.rect)}`);
    }
    if (focusedCount >= 10) pass(`ffkb focus walk ${focusedCount} bước, ring ≥2px, không bị che`);
    else fail('ffkb focus walk đủ phần tử', `${focusedCount} bước`);

    const faqFocus = await script(`const summary = document.querySelector('#hoi-dap summary');
      if (!summary) return false;
      summary.focus();
      return document.activeElement === summary;`);
    if (!faqFocus) fail('ffkb FAQ focus được bằng bàn phím');
    else {
      await key('\uE007');
      await sleep(300);
      const opened = await script('return document.querySelector("#hoi-dap summary").parentElement.open;');
      await key('\uE007');
      await sleep(300);
      const closed = await script('return !document.querySelector("#hoi-dap summary").parentElement.open;');
      if (opened && closed) pass('ffkb FAQ mở/đóng bằng Enter');
      else fail('ffkb FAQ mở/đóng bằng Enter', `open=${opened} close=${closed}`);
    }
  } finally {
    try { await client?.send('Marionette:Quit', { flags: ['eForceQuit'] }); } catch { /* ignore */ }
    try { client?.socket.destroy(); } catch { /* ignore */ }
    if (process.platform === 'win32' && child.pid) {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    } else {
      child.kill();
    }
    await sleep(500);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  if (failures.length) {
    console.error(`\n${failures.length} Firefox keyboard check(s) failed`);
    process.exit(1);
  }
  console.log('\nAll Firefox keyboard checks pass');
}

main().catch((error) => {
  console.error(`ERROR ${error.message}`);
  process.exit(1);
});
