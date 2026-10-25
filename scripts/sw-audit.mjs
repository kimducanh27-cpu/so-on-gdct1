/* Sổ Ôn GDCT1 — SW cache/migration/offline check (v8).
   Run after `node scripts/serve.mjs`: `QA_BASE=... node scripts/sw-audit.mjs`.
   Creates its own temporary Chrome profile; does not touch the user's browser data. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const base = process.env.QA_BASE || 'http://127.0.0.1:8123/so-on-gdct1/';
const failures = [];
const pass = (l, d = '') => console.log(`PASS ${l}${d ? ` — ${d}` : ''}`);
const fail = (l, d = '') => { failures.push(l); console.log(`FAIL ${l}${d ? ` — ${d}` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findBrowser() {
  const c = [process.env.CHROME_BIN, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'), '/usr/bin/google-chrome'];
  return c.filter(Boolean).find((p) => fs.existsSync(p));
}
function freePort() { return new Promise((res, rej) => { const s = net.createServer(); s.once('error', rej); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); }); }
async function waitCdp(port) { for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) return; } catch {} await sleep(200); } throw new Error('CDP timeout'); }
function connect(url) {
  const ws = new WebSocket(url); let id = 0; const pending = new Map();
  const ready = new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws error')); });
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const n = ++id; pending.set(n, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: n, method, params })); });
  return { ws, ready, send };
}

async function main() {
  const browser = findBrowser();
  if (!browser) throw new Error('no chrome');
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gdct1-sw-'));
  const child = spawn(browser, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
  let cdp;
  try {
    await waitCdp(port);
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    cdp = connect(target.webSocketDebuggerUrl); await cdp.ready;
    await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable');
    const ev = async (expr, awaitPromise = false) => { const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
    const navigate = async (url) => { await cdp.send('Page.navigate', { url }); for (let i = 0; i < 60; i++) { if ((await ev('document.readyState')) === 'complete') break; await sleep(150); } await sleep(700); };

    await navigate(`${base}app/`);
    const sw = await ev(`(async () => {
      const reg = await navigator.serviceWorker.ready;
      for (let i=0;i<40;i++){ if (navigator.serviceWorker.controller) break; await new Promise(r=>setTimeout(r,150)); }
      const keys = await caches.keys();
      const c = await caches.open('gdct1-v8');
      const urls = (await c.keys()).map(r => r.url);
      return { scope: reg.scope, controller: !!navigator.serviceWorker.controller, keys, count: urls.length,
        hasMotion: urls.some(u => u.endsWith('/app/assets/motion.js')),
        hasGsap: urls.some(u => u.endsWith('/app/assets/vendor/gsap.min.js')),
        hasApp: urls.some(u => u.endsWith('/app/assets/app.js')),
        hasShell: urls.some(u => u.endsWith('/app/index.html')) || urls.some(u => u.endsWith('/app/')) };
    })()`, true);
    if (sw.controller && sw.scope.endsWith('/app/')) pass('SW controller scope /app/', sw.scope); else fail('SW controller scope /app/', JSON.stringify(sw));
    if (sw.keys.includes('gdct1-v8')) pass('cache gdct1-v8 tồn tại', `${sw.count} entry`);
    else fail('cache gdct1-v8 tồn tại', sw.keys.join(','));
    if (sw.hasMotion && sw.hasGsap && sw.hasApp && sw.hasShell) pass('v8 precache app + motion + gsap');
    else fail('v8 precache app + motion + gsap', JSON.stringify(sw));

    await ev(`(async () => {
      await caches.open('gdct1-v7').then(c => c.put('./probe', new Response('old')));
      await caches.open('landing-probe').then(c => c.put('./probe', new Response('keep')));
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.unregister();
      return true;
    })()`, true);
    await cdp.send('Page.reload', { ignoreCache: false });
    await sleep(3000);
    const migrated = await ev(`(async () => {
      for (let i=0;i<30;i++){ if (navigator.serviceWorker.controller) break; await new Promise(r=>setTimeout(r,200)); }
      await new Promise(r=>setTimeout(r,1000));
      const keys = await caches.keys();
      return { keys, v7: keys.includes('gdct1-v7'), v8: keys.includes('gdct1-v8'), probe: keys.includes('landing-probe'), controller: !!navigator.serviceWorker.controller };
    })()`, true);
    if (!migrated.v7 && migrated.v8 && migrated.probe) pass('migration: v7 xoá, v8 giữ, cache ngoài giữ', migrated.keys.join(','));
    else fail('migration: v7 xoá, v8 giữ, cache ngoài giữ', JSON.stringify(migrated));

    await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await cdp.send('Page.reload', { ignoreCache: false });
    await sleep(1800);
    const offline = await ev(`(() => ({
      text: (document.querySelector('#app')?.innerText || '').trim().length,
      route: location.hash,
      controller: !!navigator.serviceWorker.controller,
      v8: false
    }))()`);
    const keysOffline = await ev(`caches.keys()`, true);
    offline.v8 = keysOffline.includes('gdct1-v8');
    if (offline.text > 40 && offline.controller && offline.v8) pass('offline reload app render', `${offline.text} ký tự, ${offline.route}`);
    else fail('offline reload app render', JSON.stringify(offline));
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  } finally {
    try { cdp?.ws.close(); } catch {}
    child.kill(); await sleep(400);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
  if (failures.length) { console.error(`${failures.length} SW check(s) failed`); process.exit(1); }
  console.log('All SW checks pass');
}
main().catch((e) => { console.error(e.message); process.exit(1); });
