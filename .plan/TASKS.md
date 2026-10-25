# TASKS — Sổ Ôn GDCT1 · Landing page

Trạng thái: `todo` · `doing` · `blocked` · `done-verified`. Chỉ 1 task `doing`/agent.
Plan: `.plan/PLAN.md` · Research: `.memory/RESEARCH.md` · Quyết định: `.memory/DECISIONS.md`.

## Tổng hợp

| ID | Task | Size | U | Phụ thuộc | Mốc | Trạng thái |
|---|---|---|---|---|---|---|
| T-BASE-01 | Chuyển app sang `/app/`, giữ hành vi | M | U1 | — | M1 | done-verified |
| T-PWA-01 | Gỡ SW scope gốc, chuyển cache `gdct1-v4` | M | U2 | T-BASE-01 | M1 | done-verified |
| T-REDIR-01 | Chuyển deep link cũ vào view mới | S | U1 | T-LAND-01 | M2 | done-verified |
| T-LAND-01 | Dựng shell + hero + CTA landing | M | U1 | T-BASE-01 | M1 | done-verified |
| T-LAND-02 | Viết section giá trị, 3 bước, minh bạch đáp án | M | U1 | T-LAND-01 | M2 | done-verified |
| T-ASSET-01 | Chụp app + tạo OG đạt budget | M | U2 | T-BASE-01 | M2 | done-verified |
| T-LAND-03 | Thêm preview, FAQ, CTA cuối, footer | M | U1 | T-LAND-01, T-ASSET-01 | M2 | done-verified |
| T-SEO-01 | Metadata, OG, sitemap, robots, 404 | S | U1 | T-LAND-03, T-ASSET-01 | M3 | done-verified |
| T-A11Y-01 | WCAG 2.2 AA cho landing | S | U1 | T-LAND-03 | M3 | done-verified |
| T-PERF-01 | Budget Lighthouse mobile | S | U2 | T-LAND-03, T-ASSET-01 | M3 | done-verified |
| T-QA-01 | `verify.sh` + smoke toàn bộ | S | U2 | tất cả trừ DOC/DEPLOY | M3/M4 | done-verified |
| T-DOC-01 | README, rollback, bàn giao | S | U1 | T-QA-01 | M4 | done-verified |
| T-DEPLOY-01 | Deploy Pages + smoke live | S | U2 | T-DOC-01 + Q1 | M5 | done-verified |

Tổng: 13 task (6 M, 7 S). Nền = 3/13 = 23% (< 25%). Không task XL, không U3.

## Chi tiết

### T-BASE-01 — Chuyển app sang `/app/`, giữ hành vi
- **Mục tiêu:** app chạy đủ 8 hash view tại `/app/` như trước khi chuyển.
- **File:** `index.html` → `app/index.html`; `assets/`, `data/`, `icons/`, `manifest.webmanifest`, `sw.js` → `app/`.
- **DoR:** plan được duyệt; baseline P0 đã ghi; không ai khác đang sửa repo.
- **DoD:**
  - `app/` chứa toàn bộ app; đường dẫn trong HTML/SW/manifest vẫn tương đối.
  - Serve thư mục cha dưới `/so-on-gdct1/`: `/app/` 200; `today|study|done|library|check|stats|settings|exam-setup` render; asset 200; 0 console error.
  - localStorage `so-on-gdct1.v1` (khóa thật trong `app.js`) còn sau reload; id câu `gdct1-001…100` không đổi.
- **Bằng chứng:** vòng `curl` 200; screenshot Application/localStorage; `git status`.
- **Rủi ro:** giả định URL tuyệt đối trong JS/CSS — kiểm bằng `grep` trước khi chạy.

### T-PWA-01 — Gỡ SW scope gốc, chuyển cache `gdct1-v4`
- **Mục tiêu:** không còn SW cũ điều khiển `/`; app có SW mới ở scope `/app/`.
- **File:** `sw.js` (kill-switch ở root), `app/sw.js`, `app/manifest.webmanifest`.
- **DoR:** T-BASE-01 xong; đã đọc MDN trong `RESEARCH.md`.
- **DoD:**
  - Root `sw.js`: không fetch handler; `skipWaiting()` + `clients.claim()`; xoá cache legacy `gdct1-v1..v3`; `unregister()` registration scope gốc.
  - App SW: `CACHE = 'gdct1-v4'`; activate xoá mọi cache khác; offline reload `/app/` vẫn chạy.
  - Manifest: `id: "../"`, `start_url: "./#/today"`, `scope: "./"`; Chrome không tạo bản cài trùng. Nếu `id` không được hỗ trợ → ghi `blocked` mục này + hướng dẫn cài lại, không tuyên bố pass.
- **Bằng chứng:** Application panel (`registration.scope`, Manifest), `caches.keys()`; screenshot offline.
- **Rủi ro:** thời điểm cập nhật SW; `id` limited availability.

### T-REDIR-01 — Chuyển deep link cũ vào view mới
- **Mục tiêu:** link `/#/...` cũ mở đúng view trong `/app/`.
- **File:** `assets/landing.js`, `index.html`.
- **DoR:** T-LAND-01 có chỗ gắn script.
- **DoD:**
  - `/#/check` → `./app/#/check` cho mọi hash `#/...`; không loop; hash rỗng không redirect.
  - Ở `display-mode: standalone` vào thẳng `./app/#/today`.
  - Đúng dưới base `/so-on-gdct1/`; không hard-code `/app/`.
- **Bằng chứng:** URL trước/sau với 5 hash; console 0 error.

### T-LAND-01 — Dựng shell + hero + CTA landing
- **Mục tiêu:** landing có khung trang, hero và CTA chính ở 320–1440.
- **File:** `index.html`, `assets/landing.css` (và icon root nếu cần).
- **DoR:** T-BASE-01 xong (đích CTA tồn tại).
- **DoD:**
  - header/brand, skip link, `main`, footer; đúng 1 `h1`; CTA `Mở sổ ôn ngay` → `./app/#/today`.
  - Không overflow 320/360/390/768/1280; focus thấy rõ; CTA dùng được khi JS tắt.
  - Dùng lại token/typography app (`#F4F1EA`, Newsreader/Space); không thêm brand mới.
- **Bằng chứng:** screenshot 360/1280 + 320/768; DevTools responsive; `curl` 200.

### T-LAND-02 — Viết section giá trị, 3 bước, minh bạch đáp án
- **Mục tiêu:** người xem hiểu lợi ích và độ tin cậy đáp án trong 1 trang.
- **File:** `index.html`, `assets/landing.css`, `.memory/CONTENT_MAP.md`.
- **DoR:** T-LAND-01 xong.
- **DoD:**
  - 3–4 giá trị: 100 câu từ 70 ảnh; lịch 20 ngày tới 12.11.2026; SRS + chuỗi; offline/PWA; tra–gán đáp án.
  - 3 bước học; section 44 `verified` / 56 `reference` / 7 “Cần kiểm tra”; số khớp script đếm từ `data/answers.js`.
  - Không testimonial/số liệu bịa; tiếng Việt đúng dấu; heading tuần tự, section semantic.
- **Bằng chứng:** screenshot; output script đối chiếu số; CONTENT_MAP cập nhật.

### T-ASSET-01 — Chụp app + tạo OG đạt budget
- **Mục tiêu:** có ảnh sản phẩm thật và ảnh OG nhẹ.
- **File:** `assets/landing/{today,library,check}-390.webp`, `assets/landing/today-1280.webp`, `assets/og-cover.png`, `.memory/visual_ledger/`.
- **DoR:** T-BASE-01 xong (app ở `/app/`).
- **DoD:**
  - 3 ảnh mobile 390×844 (today/library/check) + 1 desktop 1280×800, chụp từ app thật.
  - Hero ≤200KB; ảnh khác ≤150KB; có `width`/`height`; alt mô tả.
  - OG 1200×630 ≤300KB, chữ đọc được ở 50%.
- **Bằng chứng:** `ls -lh`, kích thước ảnh, screenshot trong `visual_ledger/`.

### T-LAND-03 — Thêm preview, FAQ, CTA cuối, footer
- **Mục tiêu:** landing đủ nội dung để tự tin bấm CTA.
- **File:** `index.html`, `assets/landing.css`.
- **DoR:** T-LAND-01 + T-ASSET-01 xong.
- **DoD:**
  - 3 screenshot có caption/alt; lazy-load ảnh dưới màn hình đầu; FAQ `<details>` mở bằng keyboard; CTA cuối.
  - Footer: “không backend, dữ liệu trên máy bạn”, link GitHub, ngày cập nhật; không placeholder.
  - Responsive và `prefers-reduced-motion` pass.
- **Bằng chứng:** screenshot 360/1280; linkinator; keyboard walk.

### T-SEO-01 — Metadata, OG, sitemap, robots, 404
- **Mục tiêu:** landing có SEO cơ bản, 404 rõ ràng; app không tạo nội dung trùng.
- **File:** `index.html`, `app/index.html`, `robots.txt`, `sitemap.xml`, `404.html`.
- **DoR:** T-LAND-03 + T-ASSET-01 xong.
- **DoD:**
  - Landing: title/description/canonical tuyệt đối `https://kimducanh27-cpu.github.io/so-on-gdct1/`; OG/Twitter + ảnh tuyệt đối 1200×630.
  - App `noindex`; sitemap chỉ `/`; robots trỏ sitemap; 404 có CTA về `/` và `/app/`.
  - URL tuyệt đối đúng base; html-validate 0 lỗi.
- **Bằng chứng:** `curl -s | grep` meta; screenshot 404; html-validate.

### T-A11Y-01 — WCAG 2.2 AA cho landing
- **Mục tiêu:** landing dùng được bằng bàn phím và đạt AA.
- **File:** `index.html`, `assets/landing.css`.
- **DoR:** T-LAND-03 xong.
- **DoD:**
  - Contrast text 4.5:1, UI/focus 3:1 (script đo); focus ≥2px không bị che; skip link; landmarks; 1 `h1`; heading tuần tự.
  - Icon có accessible name; target 44×44; reduced motion; không chỉ dùng màu; reflow 320/zoom 400%.
  - axe/pa11y 0 serious/critical.
- **Bằng chứng:** pa11y output; contrast script; screenshot focus/keyboard.

### T-PERF-01 — Budget Lighthouse mobile
- **Mục tiêu:** landing nhẹ, đạt budget lab của bản thi hành.
- **File:** `lighthouserc.json` (nếu dùng LHCI), asset landing.
- **DoR:** T-LAND-03 + T-ASSET-01 xong.
- **DoD:**
  - 3 run lấy median: Perf ≥90, A11y 100, BP ≥95, SEO 100.
  - LCP ≤2.5s, TBT ≤200ms, CLS ≤0.1, TTFB ≤800ms.
  - JS ≤170KB, CSS ≤60KB, font ≤2 family/4 file/180KB, tổng ≤1.5MB; 0 third-party.
- **Bằng chứng:** báo cáo LHCI: đường dẫn, version, điểm và metric median.

### T-QA-01 — `verify.sh` + smoke toàn bộ
- **Mục tiêu:** một lệnh chứng minh landing + app đạt gate.
- **File:** `scripts/verify.sh`, `.htmlvalidate.json`, `.pa11yci`.
- **DoR:** các task nội dung/asset/SEO/a11y/perf xong.
- **DoD:**
  - Script **fail** nếu thiếu gate: node --check, JSON, html-validate, linkinator internal, pa11y, HTTP 200/404, 5 viewport không overflow, keyboard, console, secret `git grep`, số liệu khớp data.
  - Chromium + Firefox pass; WebKit/iOS nếu có thiết bị, thiếu → ghi `blocked`, không pass khống.
  - Diff không còn `TODO`, `console.log`, `debugger`.
- **Bằng chứng:** `bash scripts/verify.sh` exit 0 + tóm tắt; screenshot 5 viewport.

### T-DOC-01 — README, rollback, bàn giao
- **Mục tiêu:** người nhận chạy và rollback được từ clone sạch.
- **File:** `README.md`, `.memory/PROJECT_STATE.md`, `.memory/DECISIONS.md`, `.memory/visual_ledger/`.
- **DoR:** T-QA-01 xong.
- **DoD:**
  - README: cấu trúc `/` + `/app/`, chạy local từ root (bỏ `cd app`), deploy Pages, bump cache khi sửa app, rollback, giới hạn 7 câu.
  - Chạy đúng README từ clone tạm → 200; link nội bộ 0 chết.
  - Commit local message nêu vì sao; **không push**.
- **Bằng chứng:** clone tạm + server; linkinator; `git log`.
- **Kết quả 2026-10-24:** commit local `f6f2ac5` (không push). Clone sạch đúng commit, `node scripts/serve.mjs` → 200 cho `/`, `/app/`, `/app/#/today`, CSS, data; linkinator nội bộ 18 link, 0 chết; `bash scripts/verify.sh` exit 0 trên cây làm việc.

### T-DEPLOY-01 — Deploy Pages + smoke live
- **Mục tiêu:** phát hành bản M4 lên GitHub Pages.
- **File:** không sửa thêm; push commit đã duyệt.
- **DoR:** T-DOC-01 xong **và Q1 được trả lời “cho phép”**.
- **DoD:** live `/` + `/app/` 200; CTA; redirect legacy; SW cũ được gỡ; Lighthouse live; tag/commit rollback.
- **Bằng chứng:** URL live, commit hash, screenshot, LHCI.
- **Kết quả 2026-10-24:** Q1 = cho phép push + deploy từ `main`, giữ nhánh `landing-page`. Fast-forward `main` → `b3f89a1`, push `e4cac8c..b3f89a1`, Pages build từ `main` `/`. Live https://kimducanh27-cpu.github.io/so-on-gdct1/ trả 200 với landing mới (title “100 câu, 20 ngày tới 12.11.2026”, 1 h1, CTA `./app/#/today`); `/app/` 200 + `noindex`; `assets/og-cover.png` 200 (128,061 B, `image/png`); root `sw.js` kill-switch, `app/sw.js` `gdct1-v4`, manifest `id: "../"`; 404 tùy biến 404 + đúng nội dung; robots + sitemap 200. Redirect legacy từ tải trang mới: `#/check|today|library|exam-setup|stats` → `/app/#/...`, app render 418–25,082 ký tự. Chromium live audit pass toàn bộ (5 viewport, 8 route, keyboard 24 bước, FAQ, reduced motion, 0 third-party, 0 console error); Firefox BiDi + Marionette pass; pa11y 2/2 URL 0 error; LHCI live 3 run: Perf 1.0/0.99/1.0, A11y 1, BP 1, SEO 1, LCP median 1,379 ms, TBT 0, CLS 0, TTFB 25 ms, 122,129 B. Rollback: `git revert b3f89a1` + push (không force). Chưa kiểm chứng: cài PWA thật/gỡ bản cài cũ, WebKit/iOS.

---

## Phase 2 — UI rework “Phiếu thi & bút đỏ” (2026-10-25)

| ID | Task | Size | U | Phụ thuộc | Mốc | Trạng thái |
|---|---|---|---|---|---|---|
| T-UI-01 | Audit UI + before shots + UI_REVIEW | S | U1 | — | M1 | done-verified |
| T-UI-02 | Landing: token, bảng 100 ô, hero, section | M | U1 | T-UI-01 | M2 | done-verified |
| T-UI-03 | App shell + Hôm nay + Học | M | U2 | T-UI-01 | M2 | done-verified |
| T-UI-04 | App: Thư viện, Kiểm đáp án, Sổ, Cài đặt, Thi thử | M | U1 | T-UI-03 | M3 | done-verified |
| T-UI-05 | Ảnh app, OG, 404, SW cache v5 | M | U2 | T-UI-04 | M3 | done-verified |
| T-UI-06 | QA, before/after, tài liệu | S | U2 | T-UI-05 | M4 | done-verified |
| T-UI-07 | Deploy production + smoke live | S | U2 | T-UI-06 | M5 | done-verified |

### T-UI-01 — Audit UI + bằng chứng trước
- **DoD:** `bash scripts/verify.sh` xanh trước thay đổi; 13 ảnh before (landing 320/390/768/1280; app today 390/1280; library/check/stats/settings/exam-setup/study/review-sheet 390); F-UI-01..10 + design_revision ghi ở `.memory/UI_REVIEW.md`; 0 console error.
- **Kết quả 2026-10-25:** `verify.sh` exit 0 (Chromium + Firefox + pa11y + LHCI gate). Before shots ở `.memory/visual_ledger/before-ui-v2/`.

### T-UI-02 — Landing
- **Mục tiêu:** landing đọc như phiếu ôn, giữ nguyên nội dung và CTA.
- **DoD:** form strip; hero + bảng 100 ô (đúng 44/56/7, 7 cờ phủ trong 44+56); rail 20 ngày; 4 giá trị; bảng đáp án có chú thích “không phải nhóm thứ tư”; 3 bước; preview ảnh thật; FAQ; CTA cuối; 1 h1; không overflow 320–1280; CTA đúng text/href; html-validate 0 lỗi; contrast pass.
- **Bằng chứng:** 5 viewport after + pa11y + contrast.
- **Kết quả 2026-10-25:** landing UI v2 render đúng; `verify.sh` pass (html-validate 0, pa11y 0, contrast 15/15); ảnh after 320/390/768/1280 trong `.memory/visual_ledger/after-ui-v2/`; CTA `Mở sổ ôn ngay` → `./app/#/today`.

### T-UI-03 — App shell, Hôm nay, Học
- **DoD:** strip phiếu + topbar/tabbar mới; Today và Study theo phiếu; focus ring ≥2px; không đổi route/dữ liệu; 8 route render; 0 console error; 320/390/1280 không overflow.
- **Bằng chứng:** after shots, Chromium/Firefox gate.
- **Kết quả 2026-10-25:** shell + Today/Study mới; rail 20 ngày đặt đúng cấu trúc; tab active map `study/done/exam/exam-setup` → `today`; 8 route pass Chromium + Firefox, 0 console error.

### T-UI-04 — Các route còn lại
- **DoD:** Library/Check/Stats/Settings/Exam-setup + overlay/sheet/empty/notice dùng token mới; badge và nhãn đọc được; không overflow.
- **Bằng chứng:** after shots 390/1280.
- **Kết quả 2026-10-25:** 5 route còn lại + sheet/empty/notice theo token; chip lọc wrap mọi width; sheet footer sticky; stats lịch 10 cột; ảnh app 390 trong `.memory/visual_ledger/after-ui-v2/`.

### T-UI-05 — Assets, OG, 404, cache
- **DoD:** 4 ảnh app mới (3×390×844 + 1280×800, ≤150KB); OG 1200×630 ≤300KB từ UI mới; 404 style mới; `app/sw.js` `gdct1-v5` + `check-data` cập nhật; offline reload `/app/` pass; cache cũ bị dọn, không đụng cache landing.
- **Bằng chứng:** kích thước file, CDP cache keys, screenshot offline.
- **Kết quả 2026-10-25:** ảnh 24,790 / 36,664 / 34,652 / 40,928 B; OG 131,423 B; 404 flex footer; `gdct1-v5` + `check-data` assert; migration profile sạch: v4 bị xoá, `landing-probe` giữ, v5 34 entry; offline `/app/#/library` render 100 dòng.

### T-UI-06 — QA + tài liệu
- **DoD:** `verify.sh` xanh; LHCI mobile ≥ budget; after shots đủ bộ; README/.memory/PROJECT_STATE/DECISIONS/CONTENT_MAP/.plan cập nhật; diff không TODO/console.log.
- **Bằng chứng:** log gate + LHCI 3 run + before/after.
- **Kết quả 2026-10-25:** `verify.sh` exit 0; LHCI 3 run Perf 0.99, A11y/BP/SEO 1, LCP median 1,955.03 ms, CLS 0, total 149,034 B; after shots 14 ảnh; README + PROJECT_STATE + DECISIONS + RESEARCH + CONTENT_MAP + UI_REVIEW + TASKS/PLAN cập nhật; diff sạch TODO/console.log.

### T-UI-07 — Deploy
- **DoR:** T-UI-06 xanh + người dùng đã nói “triển luôn”.
- **DoD:** commit + push `main`; live `/`, `/app/`, ảnh, SW v5 trả 200; redirect legacy; manifest giữ `id: "../"`; smoke Chromium + LHCI live; ghi commit rollback.
- **Bằng chứng:** URL live, commit hash, log smoke.
- **Kết quả 2026-10-25:** commit `c4ae353`, push `c7ce653..c4ae353 main -> main`; Pages build xong sau ~30 s. Live 16 endpoint 200, landing có form strip + bảng 100 ô, 404 tùy biến, OG 131,423 B, app SW `gdct1-v5` scope `/app/` active/controller, cache đúng, manifest `id: "../"`; redirect legacy 5 route pass; Chromium audit 2 lần liên tiếp pass (lần đầu 1 flake không truy được), Firefox BiDi + Marionette pass, pa11y 2/2 URL 0 error; LHCI live 3 run Perf 1.0, A11y/BP/SEO 1, LCP median 1,207 ms, TBT/CLS 0, TTFB 32 ms. Rollback: `git revert c4ae353` + push; `landing-page` giữ `b3f89a1`.

---

## Phase 3 — Motion v3 “Phiếu thi chuyển động” (2026-10-25, local RC)

| ID | Task | Size | U | Phụ thuộc | Trạng thái |
|---|---|---|---|---|---|
| T-MOTION-01 | Vendor GSAP 3.15 + SW cache (v7→v8) + gate skeleton | M | U2 | — | done-verified (local) |
| T-MOTION-02 | Landing bootstrap/token/failsafe → CSS hero + lazy vendor | M | U1 | T-MOTION-01 | done-verified (local) |
| T-MOTION-03 | Hero sequence + pen SVG + grid/rail | M | U1 | T-MOTION-02 | done-verified (local) |
| T-MOTION-04 | Scroll reveals + margin progress + parallax | M | U2 | T-MOTION-02 | done-verified (local) |
| T-MOTION-05 | Micro-interaction + FAQ + 404 | S | U1 | T-MOTION-02 | done-verified (local) |
| T-MOTION-06 | App motion module + route/qid gating | M | U2 | T-MOTION-01 | done-verified (local) |
| T-MOTION-07 | App bars/stats/sheet/toast | S | U2 | T-MOTION-06 | done-verified (local) |
| T-MOTION-08 | `motion-audit.mjs` + verify integration | M | U2 | T-MOTION-03..07 | done-verified (local) |
| T-MOTION-09 | Docs/decisions/research/ledger/attribution | S | U1 | T-MOTION-03..08 | done-verified (local) |
| T-MOTION-10 | Validation RC local, không deploy | S | U2 | tất cả | done-verified (local) |

### Kết quả Phase 3

- **T-MOTION-01:** tải GSAP 3.15.0 + ScrollTrigger từ jsDelivr, SHA-256 ghi trong `assets/vendor/LICENSE-GSAP.txt`; SW `gdct1-v8` (36 entry) precache gsap + motion; check-data 60/60.
- **T-MOTION-02..05:** hero chuyển sang CSS keyframes để không chặn LCP; GSAP/ScrollTrigger nạp sau `load`; ScrollTrigger batch once; margin progress; parallax 8px pointer fine ≥761; FAQ grid-rows; 404 pen slash; pen ellipse SVG. LCP 2,616 → **2,375ms**.
- **T-MOTION-06..07:** `app/assets/motion.js` 5,153B; hook `beforeRender/enter(route,qid)`; pick/filter/search không replay; progress bar scaleX; feedback pen ✓/✕; sheet open 200ms close đồng bộ; stats cells/bars.
- **T-MOTION-08:** `scripts/motion-audit.mjs` 46 check pass; `verify.sh` gọi giữa Chromium và Firefox, fail-closed.
- **T-MOTION-10:** `bash scripts/verify.sh` exit 0 (html-validate 0, check-data 60, contrast 15, pa11y 2/2, Chromium + Firefox + Marionette, motion 46/46); LHCI local 3 run Perf 0.98, LCP median 2,375ms, TBT 20ms, CLS 0; SW v7→v8 migration + offline pass. **Đã deploy** `2671b02` (T-DEPLOY-02).
- **Blocked:** WebKit/iOS motion, PWA cài thật/đè bản cũ, low-end Android, zoom 400% (không có runtime/thiết bị).

### Hard review fixes (2026-10-25) — sau Motion v3

| ID | Việc | Mức | Trạng thái |
|---|---|---|---|
| T-FIX-01 | Route entrance fade-only, bỏ transform `.view`; CTA fixed trên tabbar | cao | done-verified |
| T-FIX-02 | Feedback scroll một target giữ option đã chọn; reduce-aware | cao | done-verified |
| T-FIX-03 | Tap-target app ≥44px; switch hit area 44×44; topbar/nav 320 | trung | done-verified |
| T-FIX-04 | Đo lại FAQ (phantom 22px), giữ grid accordion, check item−summary | trung | done-verified |
| T-FIX-05 | Nét bút “sổ”: một path, SVG sizing tường minh, chữ mực/nét đỏ, tách dòng | cao | done-verified |
| T-FIX-06 | Icon tab “Đáp án” → checkbox; bump cache v8 + migration | trung | done-verified |

- Evidence: UI review 320/390/1280 (landing + 8 route + study/feedback/sheet): 0 overflow, 0 visible target <44 (chỉ input file ẩn), console 0 error; motion-audit **46/46** (thêm CTA, feedback context, FAQ, 5 target check); `verify.sh` exit 0; ảnh `.memory/visual_ledger/after-hard-review/`.

### Deploy Motion v3 + hard review (T-DEPLOY-02) — done 2026-10-26

- Push `d0f962c..2671b02 main -> main`; commit phát hành **`2671b02`**; Pages build legacy từ `main` `/` xong sau ~80 s.
- Live `app/sw.js` = `gdct1-v8`, landing 26,690B có pen path + icon tab mới; app/manifest/vendor/motion 200; 404 tùy biến.
- Live smoke: `scripts/sw-audit.mjs` 5/5; Chromium 5 viewport + 8 route + keyboard + reduce; motion-audit 46/46; pa11y 2/2; Firefox smoke pass.
- Live LHCI 3 run median: Perf 1.0, A11y/BP/SEO 1, LCP 1,354ms, TBT 0, CLS 0, TTFB 24ms, total 152,364B; assertion median exit 0.
- Rollback: `git revert 2671b02` + push (không force). Giữ cache v8; sửa app shell sau đó bump v9.
