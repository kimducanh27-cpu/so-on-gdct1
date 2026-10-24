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
| T-DOC-01 | README, rollback, bàn giao | S | U1 | T-QA-01 | M4 | doing |
| T-DEPLOY-01 | Deploy Pages + smoke live | S | U2 | T-DOC-01 + Q1 | M5 | blocked |

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

### T-DEPLOY-01 — Deploy Pages + smoke live (blocked)
- **Mục tiêu:** phát hành bản M4 lên GitHub Pages.
- **File:** không sửa thêm; push commit đã duyệt.
- **DoR:** T-DOC-01 xong **và Q1 được trả lời “cho phép”**.
- **DoD:** live `/` + `/app/` 200; CTA; redirect legacy; SW cũ được gỡ; Lighthouse live; tag/commit rollback.
- **Bằng chứng:** URL live, commit hash, screenshot, LHCI.
- **Blocker:** `[CẦN QUYẾT] Q1` — quyền push/deploy.
