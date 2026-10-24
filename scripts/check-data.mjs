import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(read('app/data/questions.js'), sandbox);
vm.runInContext(read('app/data/answers.js'), sandbox);

const questions = sandbox.window.GDCT_QUESTIONS;
const answers = sandbox.window.GDCT_ANSWERS;
const qids = questions.map((q) => q.id);
const aids = Object.keys(answers);

const checks = [];
const check = (ok, label, detail = '') => {
  checks.push({ ok, label, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
};

check(Array.isArray(questions) && questions.length === 100, '100 câu hỏi', String(questions.length));
check(aids.length === 100, '100 đáp án', String(aids.length));
check(new Set(qids).size === qids.length, 'id câu không trùng');
check(new Set(aids).size === aids.length, 'id đáp án không trùng');

const missing = qids.filter((id) => !aids.includes(id));
const extra = aids.filter((id) => !qids.includes(id));
check(missing.length === 0, 'không thiếu đáp án', missing.join(','));
check(extra.length === 0, 'không thừa đáp án', extra.join(','));

const byLevel = {};
for (const id of aids) byLevel[answers[id].level] = (byLevel[answers[id].level] || 0) + 1;
check(byLevel.verified === 44, '44 verified', String(byLevel.verified));
check(byLevel.reference === 56, '56 reference', String(byLevel.reference));

const expectedReview = ['gdct1-021', 'gdct1-027', 'gdct1-047', 'gdct1-064', 'gdct1-086', 'gdct1-097', 'gdct1-098'];
const review = aids.filter((id) => answers[id].needsReview).sort();
check(review.length === 7, '7 needsReview', review.join(','));
check(JSON.stringify(review) === JSON.stringify(expectedReview), 'đúng 7 id needsReview');

const chapters = [...new Set(questions.map((q) => q.chapter))];
check(chapters.length === 6, '6 nhóm kiến thức', chapters.join(' | '));
check(questions.every((q) => q.correctIndex === null), 'correctIndex null trong questions.js');

const landing = read('index.html');
const copyClaims = [
  ['100 câu từ 70 ảnh đề', '100 câu / 70 ảnh'],
  ['44 câu đã đối chiếu giáo trình', '44 verified'],
  ['56 câu', '56 reference'],
  ['7 câu', '7 needsReview'],
  ['20 ngày', '20 ngày'],
  ['12.11.2026', 'hạn 12.11.2026'],
];
for (const [needle, label] of copyClaims) {
  check(landing.includes(needle), `landing nêu ${label}`, needle);
}

const app = read('app/assets/app.js');
check(app.includes("'so-on-gdct1.v1'"), 'giữ khóa localStorage so-on-gdct1.v1');

const manifest = JSON.parse(read('app/manifest.webmanifest'));
check(manifest.id === '../', 'manifest id "../"', manifest.id);
check(manifest.start_url === './#/today', 'manifest start_url', manifest.start_url);
check(manifest.scope === './', 'manifest scope', manifest.scope);

const appSw = read('app/sw.js');
check(appSw.includes("'gdct1-v4'"), 'app SW cache gdct1-v4');

const rootSw = read('sw.js');
check(!/addEventListener\(\s*['"]fetch['"]/.test(rootSw), 'root SW không có fetch handler');
check(rootSw.includes('unregister()'), 'root SW unregister scope gốc');
check(['gdct1-v1', 'gdct1-v2', 'gdct1-v3'].every((key) => rootSw.includes(key)), 'root SW xoá cache legacy v1..v3');

const canonical = 'https://kimducanh27-cpu.github.io/so-on-gdct1/';
check(landing.includes(`<link rel="canonical" href="${canonical}">`), 'landing canonical tuyệt đối', canonical);
check(landing.includes(`<meta property="og:url" content="${canonical}">`), 'landing og:url tuyệt đối');
check(landing.includes('og:image" content="https://kimducanh27-cpu.github.io/so-on-gdct1/assets/og-cover.png"'), 'og:image tuyệt đối');
check(landing.includes('<meta name="twitter:card" content="summary_large_image">'), 'twitter card');

const appHtml = read('app/index.html');
check(appHtml.includes('<meta name="robots" content="noindex">'), 'app noindex');

const sitemap = read('sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check(locs.length === 1 && locs[0] === canonical, 'sitemap chỉ URL gốc', locs.join(','));
const robots = read('robots.txt');
check(robots.includes(`Sitemap: ${canonical}sitemap.xml`), 'robots trỏ sitemap');

const notFound = read('404.html');
check(notFound.includes('<base href="/so-on-gdct1/">'), '404 dùng base deploy');
check(notFound.includes('href="./app/#/today"'), '404 có link vào app');
check(notFound.includes('<meta name="robots" content="noindex">'), '404 noindex');

const fileSize = (p) => fs.statSync(new URL(p, root)).size;
const og = fs.readFileSync(new URL('assets/og-cover.png', root));
check(og[0] === 0x89 && og.subarray(1, 4).toString() === 'PNG', 'OG là PNG');
check(og.readUInt32BE(16) === 1200 && og.readUInt32BE(20) === 630, 'OG 1200×630');
check(fileSize('assets/og-cover.png') <= 300 * 1024, 'OG ≤300KB', `${fileSize('assets/og-cover.png')} B`);

const fonts = fs.readdirSync(new URL('assets/fonts/', root)).filter((name) => name.endsWith('.woff2'));
const fontBytes = fonts.reduce((total, name) => total + fileSize(`assets/fonts/${name}`), 0);
check(fonts.length === 4, 'landing dùng 4 file font', fonts.join(','));
check(fontBytes <= 180 * 1024, 'font ≤180KB', `${fontBytes} B`);

const shots = ['today-390.webp', 'library-390.webp', 'check-390.webp', 'today-1280.webp'];
check(shots.every((name) => fs.existsSync(new URL(`assets/landing/${name}`, root))), 'đủ 4 ảnh app');
check(shots.every((name) => fileSize(`assets/landing/${name}`) <= 150 * 1024), 'ảnh app ≤150KB');

check(fileSize('assets/landing.js') <= 170 * 1024, 'JS landing ≤170KB', `${fileSize('assets/landing.js')} B`);
check(fileSize('assets/landing.css') <= 60 * 1024, 'CSS landing ≤60KB', `${fileSize('assets/landing.css')} B`);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error(`${failed.length} data/content check(s) failed`);
  process.exit(1);
}
console.log(`All ${checks.length} data/content checks pass`);
