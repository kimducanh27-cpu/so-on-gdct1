import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const base = process.env.QA_BASE || 'http://127.0.0.1:8123/so-on-gdct1/';
const shotsDir = process.env.QA_SHOTS || '';
const baseOrigin = new URL(base).origin;
const failures = [];
const thirdParty = new Set();
let currentErrors = [];
let ignoreErrors = false;

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
    if (ignoreErrors) return;
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gdct1-motion-chrome-'));
  const framesDir = shotsDir ? path.join(shotsDir, 'motion') : '';
  if (framesDir) fs.mkdirSync(framesDir, { recursive: true });

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
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source:
        'window.__cls=0;(function(){try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(!e.hadRecentInput)window.__cls+=e.value;});}).observe({type:"layout-shift",buffered:true});}catch(e){}})();'
    });

    const evaluate = async (expression, awaitPromise = false) => {
      const result = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise
      });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };

    const viewport = async (width, height) => {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 700,
        screenWidth: width,
        screenHeight: height
      });
      await sleep(120);
    };

    const waitReady = async (extra = 0) => {
      for (let i = 0; i < 60; i++) {
        const state = await evaluate('document.readyState');
        if (state === 'complete') break;
        await sleep(100);
      }
      await evaluate('document.fonts.ready.then(() => true)', true).catch(() => {});
      if (extra) await sleep(extra);
    };

    const navigate = async (url, extra = 0) => {
      currentErrors = [];
      await cdp.send('Page.navigate', { url });
      await waitReady(extra);
    };

    const shot = async (name) => {
      if (!framesDir) return;
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      fs.writeFileSync(path.join(framesDir, name), Buffer.from(data, 'base64'));
    };

    const landingState = () =>
      evaluate(`(() => {
        const style = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const cs = getComputedStyle(el);
          return { opacity: +cs.opacity, visibility: cs.visibility, transform: cs.transform, clip: cs.clipPath };
        };
        const reveals = [...document.querySelectorAll('[data-reveal]')].map((el) => {
          const cs = getComputedStyle(el);
          return { opacity: +cs.opacity, visibility: cs.visibility };
        });
        const running = document.getAnimations().filter((a) => a.playState === 'running');
        const infinite = document.getAnimations().filter((a) => {
          try { return a.effect && a.effect.getTiming().iterations === Infinity; } catch (e) { return false; }
        });
        const de = document.documentElement;
        return {
          hero: style('.hero'),
          lede: style('.hero-lede'),
          actions: style('.hero-actions'),
          card: style('.sheet-card'),
          block: style('.sheet-block'),
          tick: style('.tick'),
          flag: style('.bubble.is-f'),
          reveals,
          hiddenReveals: reveals.filter((r) => r.opacity < 0.99 || r.visibility !== 'visible').length,
          running: running.length,
          infinite: infinite.length,
          overflow: de.scrollWidth - de.clientWidth,
          armed: de.classList.contains('motion-armed'),
          failed: !!window.__motionFailed
        };
      })()`);

    const appState = () =>
      evaluate(`(() => {
        const q = document.querySelector('.q-wrap');
        const fb = document.querySelector('.feedback');
        const ov = document.querySelector('#overlay');
        const running = document.getAnimations().filter((a) => a.playState === 'running');
        return {
          text: (document.querySelector('#app')?.innerText || '').trim().length,
          qOpacity: q ? +getComputedStyle(q).opacity : null,
          qid: q?.dataset.qid || null,
          qTweens: q && window.gsap ? window.gsap.getTweensOf(q).length : 0,
          fbOpacity: fb ? +getComputedStyle(fb).opacity : null,
          overlay: ov ? +getComputedStyle(ov).opacity : null,
          sheet: ov?.querySelector('.sheet') ? +getComputedStyle(ov.querySelector('.sheet')).opacity : null,
          focusInSheet: !!(document.activeElement?.closest?.('.sheet')),
          running: running.length,
          motion: !!window.GDCTMotion,
          gsap: !!window.gsap,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      })()`);

    const appHash = async (hash, wait = 300) => {
      await evaluate(`location.hash = '${hash}'; true`);
      await sleep(wait);
    };

    const smallTargets = () =>
      evaluate(`(() => {
        const sel = 'a,button,summary,input:not([type="file"]),select,textarea';
        const vis = (el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05;
        };
        return [...document.querySelectorAll(sel)].filter(vis).map((el) => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 40),
            w: Math.round(r.width),
            h: Math.round(r.height)
          };
        }).filter((x) => (x.w < 44 || x.h < 44)).slice(0, 20);
      })()`);

    const checkTargets = async (label) => {
      const small = await smallTargets();
      if (small.length === 0) pass(`app ${label}: target ≥44px`);
      else fail(`app ${label}: target ≥44px`, JSON.stringify(small));
    };

    /* ---------- 1. landing normal ---------- */
    await viewport(1280, 900);
    await navigate(base, 0);
    await sleep(120);
    await shot('hero-1280-150ms.png');
    await sleep(300);
    await shot('hero-1280-450ms.png');
    await sleep(600);
    await shot('hero-1280-1050ms.png');
    let state = await landingState();
    if (state.hero && state.hero.opacity >= 0.99 && state.hero.visibility === 'visible') pass('hero hiện sau settle');
    else fail('hero hiện sau settle', JSON.stringify(state.hero));
    for (const key of ['lede', 'actions', 'card', 'flag']) {
      if (state[key] && state[key].opacity >= 0.99 && state[key].visibility === 'visible') pass(`${key} hiện sau settle`);
      else fail(`${key} hiện sau settle`, JSON.stringify(state[key]));
    }
    if (state.running === 0) pass('0 animation chạy sau settle');
    else fail('0 animation chạy sau settle', String(state.running));
    if (state.infinite === 0) pass('không animation vô hạn');
    else fail('không animation vô hạn', String(state.infinite));
    if (state.overflow <= 1) pass('landing 1280 không overflow');
    else fail('landing 1280 không overflow', String(state.overflow));
    const cls = await evaluate('window.__cls');
    if (cls < 0.05) pass('CLS landing < 0.05', String(cls));
    else fail('CLS landing < 0.05', String(cls));

    const faqClosed = await evaluate(`(() => {
      const items = [...document.querySelectorAll('#hoi-dap .faq-item')].map((d) => {
        const s = d.querySelector('summary');
        const dr = d.getBoundingClientRect();
        const sr = s.getBoundingClientRect();
        return { open: d.open, item: +dr.height.toFixed(1), summary: +sr.height.toFixed(1), extra: +(dr.height - sr.height).toFixed(1) };
      });
      return { items, maxExtra: Math.max(...items.filter((x) => !x.open).map((x) => x.extra), 0) };
    })()`);
    if (faqClosed && faqClosed.maxExtra <= 2) {
      pass('FAQ đóng không chiếm chỗ', `maxExtra ${faqClosed.maxExtra}px`);
    } else {
      fail('FAQ đóng không chiếm chỗ', JSON.stringify(faqClosed));
    }

    /* ---------- 2. fast scroll + resize ---------- */
    await evaluate('window.scrollTo(0, document.documentElement.scrollHeight); true');
    await sleep(450);
    await evaluate('window.scrollTo(0, 0); true');
    await sleep(150);
    for (const width of [320, 768, 1440]) {
      await viewport(width, width === 320 ? 800 : width === 768 ? 1024 : 900);
      await sleep(250);
      const mid = await landingState();
      if (mid.overflow > 1) fail(`landing ${width} không overflow`, String(mid.overflow));
      else pass(`landing ${width} không overflow`);
      await evaluate('window.scrollTo(0, document.documentElement.scrollHeight); true');
      await sleep(500);
      await evaluate('window.scrollTo(0, 0); true');
      await sleep(120);
    }
    await viewport(1280, 900);
    await evaluate('window.scrollTo(0, document.documentElement.scrollHeight); true');
    await sleep(1400);
    state = await landingState();
    if (state.hiddenReveals === 0) pass('mọi reveal hiện sau fast scroll/resize');
    else fail('mọi reveal hiện sau fast scroll/resize', `${state.hiddenReveals} phần tử kẹt`);
    await evaluate('window.scrollTo(0, 0); true');
    await sleep(150);
    await shot('landing-1280-final.png');

    /* ---------- 3. reduced motion at load ---------- */
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await navigate(base, 350);
    state = await landingState();
    if (state.running === 0) pass('reduce: 0 animation khi load');
    else fail('reduce: 0 animation khi load', String(state.running));
    if (state.hero && state.hero.opacity >= 0.99) pass('reduce: hero hiện');
    else fail('reduce: hero hiện', JSON.stringify(state.hero));
    if (state.hiddenReveals === 0) pass('reduce: mọi reveal hiện');
    else fail('reduce: mọi reveal hiện', String(state.hiddenReveals));
    if (!state.armed) pass('reduce: không armed');
    else fail('reduce: không armed');

    /* ---------- 4. reduced motion live switch ---------- */
    await cdp.send('Emulation.setEmulatedMedia', { features: [] });
    await navigate(base, 1200);
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await sleep(350);
    state = await landingState();
    if (state.running === 0 && state.hero && state.hero.opacity >= 0.99 && state.hiddenReveals === 0) {
      pass('reduce live: animation dừng, nội dung hiện');
    } else {
      fail('reduce live: animation dừng, nội dung hiện', JSON.stringify({ running: state.running, hero: state.hero, hidden: state.hiddenReveals }));
    }
    await cdp.send('Emulation.setEmulatedMedia', { features: [] });

    /* ---------- 5. no-JS ---------- */
    await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
    await cdp.send('Page.navigate', { url: base });
    await sleep(600);
    await cdp.send('Emulation.setScriptExecutionDisabled', { value: false });
    const noJs = await evaluate(`(() => {
      const hero = document.querySelector('.hero');
      const lede = document.querySelector('.hero-lede');
      const cta = [...document.querySelectorAll('a')].find((a) => (a.textContent || '').replace(/\\s+/g, ' ').trim() === 'Mở sổ ôn ngay');
      return {
        hero: hero ? +getComputedStyle(hero).opacity : null,
        lede: lede ? +getComputedStyle(lede).opacity : null,
        cta: !!cta,
        armed: document.documentElement.classList.contains('motion-armed'),
        text: (document.querySelector('main')?.innerText || '').trim().length
      };
    })()`);
    if (noJs.hero === 1 && noJs.lede === 1 && noJs.cta && !noJs.armed && noJs.text > 40) pass('no-JS: nội dung + CTA hiện');
    else fail('no-JS: nội dung + CTA hiện', JSON.stringify(noJs));

    /* ---------- 6. blocked GSAP failsafe ---------- */
    ignoreErrors = true;
    await cdp.send('Network.setBlockedURLs', { urls: ['*gsap.min.js*'] });
    await navigate(base, 2200);
    state = await landingState();
    if (state.hero && state.hero.opacity >= 0.99 && state.lede && state.lede.opacity >= 0.99 && !state.armed) {
      pass('block GSAP: nội dung vẫn hiện (không phụ thuộc JS)');
    } else {
      fail('block GSAP: nội dung vẫn hiện (không phụ thuộc JS)', JSON.stringify({ hero: state.hero, lede: state.lede, armed: state.armed }));
    }
    await navigate(`${base}app/`, 500);
    const blockedApp = await appState();
    if (blockedApp.text > 40) pass('block GSAP: app vẫn dùng được');
    else fail('block GSAP: app vẫn dùng được', JSON.stringify(blockedApp));
    await cdp.send('Network.setBlockedURLs', { urls: [] });
    ignoreErrors = false;

    /* ---------- 7. app normal: gating, feedback, bars, sheet ---------- */
    await viewport(390, 844);
    await navigate(`${base}app/`, 450);
    let app = await appState();
    if (app.motion && app.gsap) pass('app nạp GSAP + GDCTMotion');
    else fail('app nạp GSAP + GDCTMotion', JSON.stringify(app));
    await evaluate('document.querySelector("[data-act=\\"start-today\\"]").click(); true');
    await sleep(450);
    app = await appState();
    if (app.qOpacity === 1) pass('app: câu đầu hiện sau enter');
    else fail('app: câu đầu hiện sau enter', String(app.qOpacity));
    await checkTargets('study');

    const ctaLayout = await evaluate(`(() => {
      const v = document.querySelector('#app > .view');
      const b = document.querySelector('.study-cta .btn');
      const t = document.querySelector('.tabbar');
      if (!v || !b || !t) return null;
      const br = b.getBoundingClientRect();
      const tr = t.getBoundingClientRect();
      return {
        transform: getComputedStyle(v).transform,
        top: Math.round(br.top),
        bottom: Math.round(br.bottom),
        tabTop: Math.round(tr.top),
        gap: Math.round(tr.top - br.bottom),
        vh: innerHeight,
        visible: br.top >= 0 && br.bottom <= innerHeight,
        covered: br.bottom > tr.top
      };
    })()`);
    if (ctaLayout && ctaLayout.transform === 'none' && ctaLayout.visible && !ctaLayout.covered && ctaLayout.gap >= 8) {
      pass('app: CTA câu tiếp cách tabbar ≥8px, view không transform', JSON.stringify(ctaLayout));
    } else {
      fail('app: CTA câu tiếp cách tabbar ≥8px, view không transform', JSON.stringify(ctaLayout));
    }

    await evaluate('document.querySelector("[data-act=\\"pick\\"]").click(); true');
    await sleep(350);
    await evaluate('document.querySelector("[data-act=\\"next\\"]").click(); true');
    const qAt0 = await appState();
    const barNow = await evaluate(`(() => {
      const el = document.querySelector('.bar i');
      if (!el) return null;
      return { transform: getComputedStyle(el).transform, width: el.offsetWidth };
    })()`);
    await sleep(260);
    const qAt260 = await appState();
    if (qAt0.qOpacity !== null && qAt0.qid !== 'gdct1-001' && (qAt0.qOpacity < 0.5 || qAt0.qTweens > 0) && qAt260.qOpacity >= 0.99) {
      pass('app: câu mới có entrance 180ms');
    } else {
      fail('app: câu mới có entrance 180ms', JSON.stringify({ at0: qAt0.qOpacity, qid: qAt0.qid, tweens: qAt0.qTweens, at260: qAt260.qOpacity }));
    }
    await sleep(200);
    const barAfter = await evaluate(`(() => {
      const el = document.querySelector('.bar i');
      if (!el) return null;
      return { transform: getComputedStyle(el).transform, width: el.offsetWidth };
    })()`);
    if (barNow && barNow.transform !== 'none' && barAfter && (barAfter.transform === 'none' || /matrix\(1, 0, 0, 1/.test(barAfter.transform))) {
      pass('app: thanh tiến độ chạy từ width cũ');
    } else {
      fail('app: thanh tiến độ chạy từ width cũ', JSON.stringify({ barNow, barAfter }));
    }

    await evaluate('document.querySelector("[data-act=\\"pick\\"]").click(); true');
    const pickNow = await appState();
    await sleep(360);
    const pickAfter = await appState();
    const mark = await evaluate(`(() => {
      const el = document.querySelector('.fb-head svg path');
      return el ? { dash: el.style.strokeDasharray, off: el.style.strokeDashoffset } : null;
    })()`);
    if (pickNow.qOpacity === 1 && pickNow.fbOpacity !== null && pickNow.fbOpacity < 0.5 && pickAfter.fbOpacity >= 0.99) {
      pass('app: pick không replay câu, feedback 0→1');
    } else {
      fail('app: pick không replay câu, feedback 0→1', JSON.stringify({ pickNow, pickAfter }));
    }
    if (mark && mark.dash && mark.off === '0px') pass('app: pen mark vẽ xong');
    else fail('app: pen mark vẽ xong', JSON.stringify(mark));

    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    const pickLayout = await evaluate(`(() => {
      const probe = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
        const y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
        const hit = document.elementFromPoint(x, y);
        return {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          inViewport: r.top < innerHeight && r.bottom > 0,
          unobstructed: !!hit && (hit === el || el.contains(hit))
        };
      };
      const btn = document.querySelector('.study-cta .btn');
      if (btn) btn.focus();
      const cs = btn ? getComputedStyle(btn) : null;
      const br = btn ? btn.getBoundingClientRect() : null;
      const tab = document.querySelector('.tabbar').getBoundingClientRect();
      const ow = cs ? parseFloat(cs.outlineWidth) || 0 : 0;
      const oo = cs ? parseFloat(cs.outlineOffset) || 0 : 0;
      return {
        selected: probe(document.querySelector('.opt.is-selected')),
        feedback: probe(document.querySelector('.feedback')),
        vh: innerHeight,
        focus: {
          active: document.activeElement === btn,
          outlineStyle: cs ? cs.outlineStyle : null,
          outlineWidth: ow,
          outlineOffset: oo,
          ringBottom: br ? Math.round(br.bottom + ow + oo) : null,
          tabTop: Math.round(tab.top)
        }
      };
    })()`);
    if (
      pickLayout.selected?.inViewport && pickLayout.selected?.unobstructed &&
      pickLayout.feedback?.inViewport && pickLayout.feedback?.unobstructed &&
      pickLayout.focus.active && pickLayout.focus.outlineWidth >= 2 &&
      pickLayout.focus.ringBottom <= pickLayout.focus.tabTop
    ) {
      pass('app: feedback giữ option đã chọn; focus CTA không bị che', JSON.stringify(pickLayout));
    } else {
      fail('app: feedback giữ option đã chọn; focus CTA không bị che', JSON.stringify(pickLayout));
    }

    await evaluate('document.querySelector("[data-act=\\"open-lookup\\"]").click(); true');
    const sheetNow = await appState();
    await sleep(300);
    const sheetAfter = await appState();
    if (sheetNow.overlay !== null && sheetNow.overlay < 0.5 && sheetAfter.overlay >= 0.99 && sheetAfter.focusInSheet) {
      pass('app: sheet mở 200ms, focus vào dialog');
    } else {
      fail('app: sheet mở 200ms, focus vào dialog', JSON.stringify({ sheetNow, sheetAfter }));
    }
    await checkTargets('sheet');
    await evaluate('document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); true');
    await sleep(100);
    const sheetClosed = await evaluate('!document.querySelector("#overlay")');
    if (sheetClosed) pass('app: Escape đóng sheet');
    else fail('app: Escape đóng sheet');

    const hashes = ['today', 'library', 'check', 'stats', 'settings', 'today'];
    for (const hash of hashes) await appHash(hash, 90);
    await sleep(350);
    app = await appState();
    if (app.text > 40 && app.overflow <= 1) pass('app: route storm ổn định, không overflow');
    else fail('app: route storm ổn định, không overflow', JSON.stringify(app));
    await checkTargets('today');

    for (const route of ['library', 'check', 'settings']) {
      await appHash(route, 450);
      await checkTargets(route);
    }

    await appHash('stats', 450);
    const stats = await evaluate(`(() => {
      const cells = [...document.querySelectorAll('.cal-cell')];
      const bars = [...document.querySelectorAll('.track i')];
      return {
        cells: cells.length,
        hiddenCells: cells.filter((c) => +getComputedStyle(c).opacity < 0.99).length,
        bars: bars.length,
        badBars: bars.filter((b) => {
          const t = getComputedStyle(b).transform;
          return t !== 'none' && !/matrix\\(1, 0, 0, 1/.test(t);
        }).length
      };
    })()`);
    if (stats.cells > 0 && stats.hiddenCells === 0 && stats.badBars === 0) pass('app: stats cells/bars settle');
    else fail('app: stats cells/bars settle', JSON.stringify(stats));

    /* ---------- 8. app reduced motion ---------- */
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await navigate(`${base}app/`, 350);
    app = await appState();
    if (app.running === 0) pass('app reduce: 0 animation khi load');
    else fail('app reduce: 0 animation khi load', String(app.running));
    await evaluate('document.querySelector("[data-act=\\"start-today\\"]").click(); true');
    await sleep(300);
    app = await appState();
    if (app.qOpacity === 1) pass('app reduce: câu hiện ngay');
    else fail('app reduce: câu hiện ngay', String(app.qOpacity));
    await evaluate('document.querySelector("[data-act=\\"open-lookup\\"]").click(); true');
    await sleep(250);
    app = await appState();
    if (app.running === 0 && app.overlay >= 0.99) pass('app reduce: sheet hiện, 0 animation');
    else fail('app reduce: sheet hiện, 0 animation', JSON.stringify(app));
    await cdp.send('Emulation.setEmulatedMedia', { features: [] });

    /* ---------- 9. negative control ---------- */
    ignoreErrors = true;
    await cdp.send('Network.setBlockedURLs', { urls: ['*gsap.min.js*'] });
    await navigate(`${base}app/`, 500);
    await evaluate('document.querySelector("[data-act=\\"start-today\\"]").click(); true');
    await sleep(350);
    await evaluate('document.querySelector("[data-act=\\"pick\\"]").click(); true');
    await sleep(250);
    await evaluate('document.querySelector("[data-act=\\"next\\"]").click(); true');
    const noMotion = await appState();
    if (noMotion.qOpacity === 1 && noMotion.qid !== 'gdct1-001') pass('negative control: không có entrance khi GSAP bị chặn');
    else fail('negative control: không có entrance khi GSAP bị chặn', JSON.stringify(noMotion));
    await cdp.send('Network.setBlockedURLs', { urls: [] });
    ignoreErrors = false;

    /* ---------- 10. third-party + console ---------- */
    if (thirdParty.size === 0) pass('0 request third-party');
    else fail('0 request third-party', [...thirdParty].join(', '));

    if (currentErrors.length === 0) pass('console sạch ở lần kiểm cuối');
    else fail('console sạch ở lần kiểm cuối', currentErrors.join(' | '));
  } finally {
    try { cdp?.ws.close(); } catch { /* ignore */ }
    child.kill();
    await sleep(400);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  if (failures.length) {
    console.error(`\n${failures.length} motion audit check(s) failed`);
    process.exit(1);
  }
  console.log('\nAll motion audit checks pass');
}

main().catch((error) => {
  console.error(`ERROR ${error.message}`);
  process.exit(1);
});
