# PROJECT STATE

Cập nhật: 2026-10-25 · **Đã deploy UI v2** `main` @ `c4ae353` lên https://kimducanh27-cpu.github.io/so-on-gdct1/ · Bản trước `b3f89a1` (UI v1) là mốc rollback; nhánh `landing-page` giữ nguyên tại `b3f89a1` · Nguồn gốc: repo `kimducanh27-cpu/so-on-gdct1` @ `e4cac8c` · T-DOC-01, T-DEPLOY-01 và T-UI-01..07 done-verified.

**Motion v3 local RC (2026-10-25):** working tree có GSAP 3.15 tự host + hero CSS + app motion + SW `gdct1-v8`; sau hard review đã sửa CTA fixed, feedback scroll, tap-target 44px, topbar 320. `verify.sh` exit 0, motion-audit 46/46, LHCI local Perf 0.98 / LCP median 2,375ms / CLS 0. **Chưa commit/push/deploy**; live vẫn là UI v2 `c4ae353`.

## Stack & môi trường

- HTML/CSS/JS thuần; **không** `package.json`, lockfile, build, lint, test, CI. Ngoại lệ đã duyệt: GSAP 3.15.0 core + ScrollTrigger tự host trong `assets/vendor/` và `app/assets/vendor/` (không CDN; license + SHA trong `LICENSE-GSAP.txt`).
- Host: GitHub Pages, source `main` `/`, build legacy. Live https://kimducanh27-cpu.github.io/so-on-gdct1/ đã là landing mới; app ở `/app/`.
- Không backend, không tài khoản; dữ liệu ở `localStorage` khóa **`so-on-gdct1.v1`** (README cũ ghi nhầm `gdct1.state.v1`).
- PWA: app ở `/app/`; `manifest.webmanifest` (`id: "../"`, `start_url: "./#/today"`, `scope: "./"`); `app/sw.js` cache `gdct1-v8`; root `sw.js` là kill-switch (không fetch handler). App SW `activate` chỉ xoá cache tên bắt đầu `gdct1-`, giữ cache khác trên origin. `gdct1-v8` precache thêm `assets/motion.js` + `assets/vendor/gsap.min.js`.
- Test local: server tĩnh tự viết dưới base `/so-on-gdct1/`, cổng 8123; `npx` cho công cụ QA (không thêm dependency runtime).

## Cấu trúc hiện tại

```
/                 index.html (landing), 404.html, robots.txt, sitemap.xml, sw.js (kill-switch)
                  manifest? không — manifest nằm trong app/
assets/           landing.css, landing.js, motion.js, og-cover.png
assets/vendor/    gsap.min.js, ScrollTrigger.min.js, LICENSE-GSAP.txt
assets/fonts/     4 woff2: Newsreader 400 + Space Grotesk 300–700 (latin + vietnamese)
assets/landing/   today-390, library-390, check-390, today-1280 (.webp)
app/              index.html, manifest.webmanifest, sw.js
app/assets/       app.css, app.js, motion.js, fonts/ (22 file), vendor/gsap.min.js + LICENSE
app/data/         questions.js (100), answers.js (100)
app/icons/        favicon + 192/512 + maskable
scripts/          serve.mjs, check-contrast.mjs, check-data.mjs, browser-audit.mjs, motion-audit.mjs, firefox-smoke.mjs, firefox-keyboard.mjs, verify.sh
.plan/ .memory/ docs/ AGENTS.md README.md .nojekyll
```

Route app: `app/#/today|study|done|library|check|stats|settings|exam-setup`; mặc định `today`.

## Landing (T-LAND-01..03, UI v2 T-UI-02)

- Ngôn ngữ thị giác “phiếu thi & bút đỏ”: form strip `PHIẾU ÔN TẬP · GDCT1`, meta phiếu, đường kẻ biểu mẫu, đỏ `#C0392B` dùng cho hành động/sửa bài; giấy `#F4F1EA`.
- Hero: meta Môn/Hình thức/Hạn; H1 “20 ngày, / 100 câu hỏi, / một cuốn sổ.” với “sổ” khoanh nét bút đỏ; CTA chính `Mở sổ ôn ngay` → `./app/#/today`; CTA phụ `Xem cách học` → `#cach-hoc`.
- Signature: phiếu “Bảng đáp án” 100 ô (44 xanh, 56 giấy, 7 cờ hổ phách) + ghi chú “7 cờ nằm trong 44 + 56”; rail 20 ngày 12 mới + 8 ôn, mốc 01/20 và 12.11.2026.
- Sections: `#vi-sao`, dải đáp án 44/56/7 (không id), `#cach-hoc`, `#trong-so` (3 ảnh app thật UI mới), `#hoi-dap`, CTA cuối; footer nêu dữ liệu trên máy, không backend, link GitHub.
- 7 needsReview là cờ trên 7 câu (2 verified + 5 reference), không phải nhóm thứ tư.
- Số liệu lấy từ data thật: 100 câu / 70 ảnh / 44 verified / 56 reference / 7 needsReview / 20 ngày tới 12.11.2026 / 6 nhóm.
- Không JS vẫn dùng được CTA và đọc đủ landing; JS chỉ redirect legacy, PWA standalone và (từ Motion v3) scroll/micro sau `load`; hero CSS chạy độc lập với JS.

## UI rework v2 (T-UI-02..06) — done local

- Landing: hero phiếu thi, dải form strip, đáp án 44/56/7 thành bảng led, section `#vi-sao` / `#cach-hoc` / `#trong-so` / `#hoi-dap`, 404 đồng bộ; `error-page` flex giữ footer đáy.
- App: shell + 8 route dùng token giấy/mực/đỏ; Hôm nay có rail 20 ngày cố định đúng cấu trúc; tab active map `study/done/exam/exam-setup` về `today`; stats lịch 10 cột; sheet có footer sticky; chip lọc wrap mọi width (hết cắt mép mobile).
- Copy: “Đáp án tham khảo” thống nhất landing + app; nhãn “Bản tham khảo” cũ đã thay.
- Ảnh: 4 WebP chụp lại UI v2 (390×844 ×3, 1280×800), 24,790–40,928 B; OG 1200×630 131,423 B; screenshot copy trong `.memory/visual_ledger/{screens,qa,after-ui-v2}`.
- Bằng chứng thị giác: `.memory/visual_ledger/after-ui-v2/` 14 ảnh (landing 320/390/768/1280, 404-390, 7 route app 390 + today 1280), console 0 error, không overflow; LEDGER README ghi before/after.
- Không đổi dữ liệu, id câu, khóa localStorage, hành vi tính năng; chỉ CSS/markup/copy trình bày và cache SW.

## Motion v3 (2026-10-25) — local RC

- **Hero landing CSS-only:** `mo-rise`/`mo-line`/`mo-scan`/`mo-flag`/`mo-pen` chạy ngay khi CSS tải; H1 3 line stagger, exam fields, lede/actions, sheet-card, grid scan, rail 20 ngày, 7 cờ, pen ellipse. Không có nội dung/LCP phải chờ JS.
- **GSAP tự host:** `assets/vendor/gsap.min.js` 72,927B + `ScrollTrigger.min.js` 44,575B; `assets/motion.js` 4,151B nạp vendor **sau `load`** rồi bật ScrollTrigger batch once, margin progress, parallax 8px `(pointer:fine)` ≥761px, focusin reveal.
- **App:** `app/assets/motion.js` 5,153B + `app/assets/vendor/gsap.min.js`; hook `beforeRender/enter(route,qid)`; entrance chỉ khi route/qid đổi (pick/filter/search không replay); feedback pen ✓/✕, bar scaleX từ width cũ, stats cells/bars, sheet open 160/200ms (close đồng bộ), toast 160ms.
- **Không dùng:** SplitText, Lenis, Lottie, tsParticles, Motion/anime, SplitType; không pinning/horizontal/custom cursor/particle. View Transitions hoãn (Chrome 111+/FF 144+/Safari 18+, router/focus/test chưa cần).
- **LCP:** GSAP defer trong critical path cho LCP 2,616ms → hero CSS + vendor lazy: **2,375ms median**, Perf 0.98; không nới ngưỡng.
- **SW:** `gdct1-v8` 36 entry, gồm `assets/motion.js` + `assets/vendor/gsap.min.js`; migration v7→v8 xoá v7, giữ cache `landing-probe`; offline reload app render 1,147 ký tự.
- **QA:** `verify.sh` exit 0; `motion-audit` 46/46 (reduce 0 animation, no-JS, block GSAP, app gating/bars/sheet, negative control); LHCI local 3 run Perf 0.98, A11y/BP/SEO 1, LCP median 2,375ms, TBT 20ms, CLS 0.
- **Chưa làm:** commit/push/deploy; WebKit/iOS motion; PWA cài thật/đè bản cũ; low-end Android; zoom 400%.

### Hard review UI fixes (2026-10-25)

- **F-UI-14 (cao):** route entrance từng đặt `transform` lên `.view`, tạo containing block cho `.study-cta` fixed → CTA “Câu tiếp” chui dưới tabbar trên mobile. Sửa: view chỉ fade 180ms + `clearProps:'transform'`; regression check xác nhận `transform:none` và CTA trên tabbar.
- **F-UI-15 (cao):** feedback auto-scroll `block:'center'` làm mất option đã chọn; smooth scroll không tôn trọng reduce. Sửa: một scroll target căn `.opt.is-selected` dưới `.study-top`; feedback ở dưới; `behavior:auto` khi reduce; check `elementFromPoint` không bị che.
- **F-UI-16 (trung):** tap-target app <44. Đã nâng tool/icon/streak/chip/btn-sm/link-btn/select/time/search; switch hit area 44×44 với track 44×25; thêm 5 check target (study/sheet/today/library/check/settings).
- **F-UI-17 (trung):** 320px brand wrap + nav “Sổ” 41px. Đã `white-space:nowrap`, ẩn dot/code brand ≤360, nav min-width 44; UI review 320 không overflow.
- **F-UI-18 (cao, thị giác):** nét bút hai ellipse cắt qua “sổ”. Root cause: SVG replaced element không kéo giãn theo `inset` (height thực 34.6px thay vì 71px), hai ellipse, chữ/nét cùng đỏ, leading quá sát. Sửa: một path có gap, `width/height:calc()` tường minh, chữ mực + nét đỏ, tách dòng 3 `.30em`; ảnh cận cảnh trong ledger.
- **F-UI-19 (trung):** icon tab “Đáp án” check + hai gạch rời. Đổi sang ô vuông + check; active đỏ; crop 4×.
- **FAQ “22px”:** chỉ là box phantom của `::details-content`; item thực = summary + 1px, body height không đổi. Giữ grid accordion; check mới đo `item − summary`.
- **Bằng chứng:** UI review 320/390/1280 landing + 8 route + study/feedback/sheet: 0 overflow, 0 visible target <44 (chỉ input file ẩn), console 0 error; motion-audit **46/46**; `verify.sh` exit 0; ảnh `.memory/visual_ledger/after-hard-review/`.

## SEO / 404 (T-SEO-01)

- Landing: title, description, canonical, OG + Twitter đầy đủ, ảnh OG tuyệt đối 1200×630 (`assets/og-cover.png`, 131,423 B, render lại từ UI v2).
- `/app/` có `<meta name="robots" content="noindex">`; sitemap chỉ URL gốc; robots trỏ sitemap.
- `404.html` dùng `<base href="/so-on-gdct1/">` (hard-code base deploy; đổi tên repo phải sửa), có CTA về `/` và `/app/`, `noindex`; body flex 100svh giữ footer ở đáy.
- html-validate: 0 error (1 warning `no-inline-style` của app noscript).

## A11Y (T-A11Y-01)

- pa11y-ci 5.0.0 (WCAG2AA, axe runner): landing + 404 sạch.
- axe-core 4.10.3 qua CDP: 0 violation ở landing/404 × 1280/390/320 (tag wcag2a/2aa/21a/21aa/22aa).
- 1 `h1`, heading tuần tự; skip link; landmark header/main/footer; focus ring 2px rust, offset 3; không focus nào bị che.
- Target 44×44 cho nav, CTA phụ, footer link. Ngoại lệ hợp lệ: link GitHub inline trong câu văn (WCAG 2.2 target-size exception cho inline link); ghi rõ trong README thay vì nới rule.
- Reduced motion: đã bỏ toàn bộ animation hero (không chỉ tắt khi reduce); universal reduce block giữ lại cho transition.
- Contrast script 15 cặp PASS sau UI v2 (text ≥4.5; rust `#C0392B` trên giấy 4.82, trên paper-deep 4.54, trên paper-soft 5.25; ngưỡng lớn/focus ≥3).
- Reflow 320px: không overflow; zoom 400% không kiểm tự động (ghi nợ).

## Perf (T-PERF-01, T-UI-06) — done

UI v2 (2026-10-25):

| Hạng mục | Run 1 | Run 2 | Run 3 | Median | Ngưỡng |
|---|---|---|---|---|---|
| Performance | 0.99 | 0.99 | 0.99 | **0.99** | ≥0.90 |
| Accessibility | 1 | 1 | 1 | **1** | =1 |
| Best Practices | 1 | 1 | 1 | **1** | ≥0.95 |
| SEO | 1 | 1 | 1 | **1** | =1 |
| LCP | 1955.99 ms | 1953.56 ms | 1955.03 ms | **1955.03 ms** | ≤2500 |
| TBT | 0 | 0 | 0 | **0** | ≤200 |
| CLS | 0 | 0 | 0 | **0** | ≤0.1 |
| TTFB | 1.25 ms | 1.014 ms | 1.183 ms | **1.183 ms** | ≤800 |
| Total bytes | 149,034 | 149,034 | 149,034 | **149,034** | ≤1.5 MB |

- Lighthouse 12.1.0 qua LHCI 0.14.0, mobile preset, 3 run, base `http://127.0.0.1:8123/so-on-gdct1/`; báo cáo ở `.lighthouseci/` (ignored, giữ local).
- Budget asset: JS landing 378 B; CSS landing 31,735 B; font 4 file / **88,372 B** (Newsreader latin 51,072 + viet 11,700; Space latin 19,796 + viet 5,804); OG 131,423 B; screenshot 24,790–40,928 B/ảnh.
- 0 request third-party lúc runtime.
- Trước UI v2 (T-PERF-01): LCP local 2.10 s, total 156,129 B; UI v2 nặng hơn CSS/ảnh một chút nhưng LCP local còn 1.955 s. LCP từng 2.40 s trước khi đổi Newsreader sang instance tĩnh wght=400; bản gốc backup ở `%TEMP%/gdct1-font-backup/`.
- Lưu ý: server local không gzip; GitHub Pages nén. `uses-text-compression` là artifact local, không đưa vào assertion.

### Lighthouse local Motion v3 (2026-10-25)

| Hạng mục | Run 1 | Run 2 | Run 3 | Median | Ngưỡng |
|---|---|---|---|---|---|
| Performance | 0.98 | 0.98 | 0.98 | **0.98** | ≥0.90 |
| Accessibility | 1 | 1 | 1 | **1** | =1 |
| Best Practices | 1 | 1 | 1 | **1** | ≥0.95 |
| SEO | 1 | 1 | 1 | **1** | =1 |
| LCP | 2,385 ms | 2,375 ms | 2,255 ms | **2,375 ms** | ≤2,500 |
| TBT | 13 ms | 30 ms | 20 ms | **20 ms** | ≤200 |
| CLS | 0 | 0 | 0 | **0** | ≤0.1 |
| TTFB | 1 ms | 1 ms | 1 ms | **1 ms** | ≤800 |
| Total bytes | 275,386 | 275,386 | 275,386 | **275,386** | ≤1.5 MB |

- LHCI 0.14.0, mobile preset, 3 run, base `http://127.0.0.1:8123/so-on-gdct1/`; assert exit 0. Server local không gzip; GitHub Pages nén nên live sẽ nhẹ hơn.
- LCP 2,616ms khi GSAP defer còn trong critical path; sau khi chuyển hero sang CSS + lazy vendor còn 2,375ms median.

### Lighthouse production UI v2 (2026-10-25)

| Hạng mục | Run 1 | Run 2 | Run 3 | Median | Ngưỡng |
|---|---|---|---|---|---|
| Performance | 1.00 | 1.00 | 1.00 | **1.00** | ≥0.90 |
| Accessibility | 1 | 1 | 1 | **1** | =1 |
| Best Practices | 1 | 1 | 1 | **1** | ≥0.95 |
| SEO | 1 | 1 | 1 | **1** | =1 |
| LCP | 1205.78 ms | 1454.54 ms | 1207.13 ms | **1207.13 ms** | ≤2500 |
| TBT | 0 | 0 | 0 | **0** | ≤200 |
| CLS | 0 | 0 | 0 | **0** | ≤0.1 |
| TTFB | 23.47 ms | 257.52 ms | 31.96 ms | **31.96 ms** | ≤800 |
| Total bytes | 102,567 | 102,374 | 102,518 | **102,518** | ≤1.5 MB |

- Chạy LHCI 0.14.0 trỏ live, 3 run mobile, output `C:/tmp/lhci-live-out` (manifest lần chạy mới); assertion exit 0. Nhanh hơn local nhờ gzip GitHub Pages.

### Lighthouse production trước UI v2 (2026-10-24)

| Hạng mục | Run 1 | Run 2 | Run 3 | Median | Ngưỡng |
|---|---|---|---|---|---|
| Performance | 0.99 | 1.00 | 1.00 | **1.00** | ≥0.90 |
| Accessibility | 1 | 1 | 1 | **1** | =1 |
| Best Practices | 1 | 1 | 1 | **1** | ≥0.95 |
| SEO | 1 | 1 | 1 | **1** | =1 |
| LCP | 1612.49 ms | 1379.46 ms | 1378.40 ms | **1379 ms** | ≤2500 |
| TBT | 0 | 0 | 0 | **0** | ≤200 |
| CLS | 0 | 0 | 0 | **0** | ≤0.1 |
| TTFB | 267.06 ms | 25.28 ms | 23.53 ms | **25.28 ms** | ≤800 |
| Total bytes | 122,175 | 122,129 | 122,123 | **122,129** | ≤1.5 MB |

- Chạy cùng `lighthouserc.json` (3 run, mobile) trỏ URL live, output tạm `C:/tmp/lhci-live-out`; assertion exit 0. Live nhanh hơn local nhờ gzip của GitHub Pages.

## QA gate (T-QA-01, T-UI-06) — done

- **Motion v3 local (2026-10-25):** `bash scripts/verify.sh` exit 0 sau khi thêm GSAP/vendor + hero CSS + app motion; gate gồm html-validate 0 error, check-data **60/60** (SW v7, vendor/sha/license, size caps), contrast 15/15, secret/file khóa sạch, HTTP 200/404 đúng (thêm vendor/motion), linkinator 0 chết, pa11y 2/2, Chromium 5 viewport + keyboard 24 bước + reduce, **motion-audit 46/46**, Firefox BiDi + Marionette. Ảnh QA copy vào `.memory/visual_ledger/qa/`; frame hero ở `.memory/visual_ledger/after-motion/`.
- **UI v2 2026-10-25:** `bash scripts/verify.sh` exit 0 sau toàn bộ thay đổi UI; gate gồm html-validate 0 error, check-data 45/45 (đã assert SW `gdct1-v5`), contrast 15/15, secret/file khóa sạch, HTTP 200/404 đúng, linkinator 18 link 0 chết, pa11y 2/2 URL 0 error, Chromium CDP (5 viewport + 8 route + keyboard 24 bước + FAQ + reduced motion + 0 third-party), Firefox BiDi + Marionette keyboard; WebKit BLOCKED. Ảnh QA copy vào `.memory/visual_ledger/qa/`.
- Một lệnh: `bash scripts/verify.sh` → exit 0, chạy trên server test base `/so-on-gdct1/` cổng 8123; fail-closed (thiếu Chrome/Firefox/npx/cổng bận đều fail).
- Gate đã pass: `node --check` toàn bộ JS/MJS; JSON manifest/LHCI/html-validate/pa11yci; html-validate 0 error; `check-data` 45 check (100 câu/đáp án, 44/56/7, 6 nhóm, copy landing, manifest, SW, localStorage, SEO, kích thước asset); contrast 15 cặp; secret scan + file khóa; không TODO/console.log/debugger/conflict marker; HTTP 200 cho landing/app/asset + 404 tùy biến cho route lạ; linkinator 18 link nội bộ 0 chết; pa11y 2/2 URL 0 error.
- Chromium CDP (`scripts/browser-audit.mjs`): landing + 404 × 5 viewport không overflow, 1 h1, font tải, console sạch, ảnh lazy tải đủ, CTA đúng `app/#/today`; 8 route app render; keyboard 24 bước ring ≥2px không bị che; FAQ Enter; reduced motion; 0 request third-party.
- Firefox BiDi (`scripts/firefox-smoke.mjs`): landing + 404 × 5 viewport, console sạch, 8 route app, 0 console error.
- Firefox Marionette (`scripts/firefox-keyboard.mjs`): focus thật (`document.hasFocus()`), skip link, 22 bước Tab ring ≥2px không bị che, FAQ Enter.
- **Live UI v2 2026-10-25 (commit `c4ae353`):** 16 endpoint 200 đúng content-type (landing 25,989 B, app, manifest, 2 SW, CSS/JS, OG 131,423 B, ảnh, font, data, robots, sitemap, 404); 404 tùy biến 404 cho path lạ; `/app/sw.js` `gdct1-v5`, root kill-switch, manifest `id: "../"`; redirect legacy 5 route tải document mới → `/app/#/...` render; app SW scope `/app/` active + controller + cache `gdct1-v5`; Chromium audit pass 2/2 lần (lần đầu 1 flake không truy được, 2 lần sau exit 0); Firefox BiDi + Marionette 22 bước pass; pa11y live 2/2 URL 0 error; LHCI 3 run Perf 1.0, LCP median 1,207 ms, CLS 0, TTFB 32 ms.
- **Live UI v1 2026-10-24:** Chromium audit cùng script trên base production pass toàn bộ (landing + 404 × 5 viewport, 8 route app, keyboard 24 bước, FAQ, reduced motion, 0 third-party, 0 console error); Firefox BiDi 8 route pass; Marionette keyboard pass; pa11y live 2/2 URL 0 error; redirect legacy 5 route pass khi tải trang mới; HTTP 200 cho 14 endpoint (landing, app, manifest, 2 SW, CSS/JS, OG, ảnh, font, robots, sitemap, 404, data).
- WebKit/iOS: **BLOCKED** — không có runtime/thiết bị; không tính pass.
- Artifact: log ở `%TEMP%/gdct1-qa` (hoặc `QA_OUT`); ảnh 5 viewport copy vào `.memory/visual_ledger/qa/`.
- Lưu ý: Firefox headless BiDi không cấp focus thật nên keyboard tách sang Marionette; app hash route bị pa11y coi là anchor thiếu (13 false positive) nên pa11y chỉ chạy landing + 404.
- Sửa harness 2026-10-24: `firefox-keyboard.mjs` từng fail `ECONNREFUSED` 1/3 lần khi chạy ngay sau BiDi smoke. Nguyên nhân: probe TCP của `waitForPort` và kết nối thật không nguyên tử; listener Marionette có thể vắng giữa hai lần. Bỏ probe, gộp connect + `WebDriver:NewSession` vào `openSession()` retry 250 ms tới 20 s; đóng socket reject pending. Xác minh 5/5 cặp BiDi → Marionette pass.

## Bàn giao (T-DOC-01) — done

- README viết lại cho `/` + `/app/`, chạy từ root bằng `node scripts/serve.mjs` (bỏ `cd app`), QA, deploy Pages root, bump `gdct1-v4`, rollback bằng `git revert`, font, giới hạn.
- Clone sạch tại HEAD code `827e36a`: `node scripts/serve.mjs` → 200 cho `/`, `/app/`, `/app/#/today`, CSS, data; linkinator nội bộ 18 link, 0 chết.
- `bash scripts/verify.sh` exit 0 trên cây làm việc trước commit; commit chỉ chứa source + tài liệu.
- Tại thời điểm bàn giao chưa push; sau đó Q1 cho phép và đã deploy (xem T-Deploy bên dưới).

## Deploy (T-DEPLOY-01) — done

- Q1: cho phép push + deploy, chốt deploy từ `main`, giữ nhánh `landing-page`.
- `landing-page` fast-forward vào `main`; push `e4cac8c..b3f89a1 main -> main`; `verify.sh` exit 0 trên `main` trước khi push.
- Pages API: `source.branch: main`, `source.path: /`, build legacy; live 200 với landing mới. Commit phát hành **`b3f89a1`**; rollback `git revert b3f89a1` + push (không force push).
- Live smoke: title mới, 1 h1, CTA `./app/#/today`, 4 section, OG absolute, canonical; `/app/` `noindex`; `sw.js` kill-switch + `app/sw.js` `gdct1-v4`; manifest `id: "../"`; 404 tùy biến; robots + sitemap.
- Redirect `#/check|today|library|exam-setup|stats` → `/app/#/...`, app render; lưu ý test phải tải document mới (điều hướng chỉ đổi hash trong cùng document không chạy lại `landing.js`).
- Chưa kiểm chứng: cài PWA thật/gỡ bản cài cũ, WebKit/iOS.

### Deploy UI v2 (T-UI-07) — done 2026-10-25

- Push `c7ce653..c4ae353 main -> main`; Pages build legacy từ `main` `/` cập nhật sau ~30 s. Commit phát hành **`c4ae353`**; rollback `git revert c4ae353` + push (không force push). `landing-page` vẫn ở `b3f89a1`.
- Live xác nhận landing mới (form strip, bảng 100 ô, CTA), app render 8 route, 404 tùy biến, OG 131,423 B, SW `gdct1-v5` và cache đúng scope. Chi tiết bằng chứng ở mục QA gate “Live UI v2”.
- Lighthouse live UI v2: Perf 1.0 cả 3 run, A11y/BP/SEO 1, LCP median 1,207 ms, TBT/CLS 0.

### Motion v3 (2026-10-25) — local RC, chưa deploy

- Working tree: GSAP vendor + hero CSS + app motion + SW `gdct1-v8`; `verify.sh` exit 0, motion-audit 46/46, LHCI local 0.98/LCP 2,375ms/CLS 0; SW migration/offline pass.
- **Chưa commit, chưa push, chưa deploy.** Live vẫn UI v2 `c4ae353`; `landing-page` vẫn `b3f89a1`.
- Khi được duyệt phát hành: commit motion → push `main` → Pages build → smoke live (LCP/live, SW v7, motion reduce, redirect); rollback `git revert <motion-commit>` + push, không force.
- Giữ `gdct1-v8`; nếu sửa app shell sau đó phải bump v7.

## Redirect legacy (T-REDIR-01)

- `assets/landing.js` (364 B, blocking trong head): hash `#/...` → `./app/` + hash, base-aware; `display-mode: standalone` vào `./app/#/today`; hash rỗng không redirect.
- Test CDP 10/10 case pass (5 hash sâu, root, standalone, base path, không loop), console 0 error.
- Live 2026-10-24: 5 route legacy tải trang mới đều chuyển đúng sang `/app/#/...` và app render; root không hash giữ landing.
- Standalone được mô phỏng bằng stub `matchMedia` (CDP headless không emulate được display-mode); ghi rõ là mô phỏng, chưa test trên PWA cài thật.

## PWA migration (T-PWA-01, v8 Motion v3; v5 UI v2)

- Root `sw.js` kill-switch: `skipWaiting` + `clients.claim`, xoá `gdct1-v1..v3`, `unregister()`; không fetch handler.
- Test Chrome 155 profile sạch: SW cũ root active + `gdct1-v3` 34 entry → sau update registration root bị xoá, cache rỗng; `gdct1-v4` của app còn nguyên.
- App SW: scope `/app/`, cache `gdct1-v8` 36 entry (thêm motion + GSAP), controller `app/sw.js`; offline reload khi server tắt vẫn render.
- Migration v6 → v7 (Chrome profile sạch, 2026-10-26): tạo `gdct1-v6` + `landing-probe`, unregister/reload để SW v6 cài/activate; sau đó còn `['gdct1-v8','landing-probe']`, v6 bị xoá; cache `gdct1-v8` có `assets/motion.js` + `assets/vendor/gsap.min.js`; offline reload app render 1,147 ký tự.
- Manifest `id: "../"` resolve `/so-on-gdct1/`, `start_url` resolve `/so-on-gdct1/app/#/today`.
- Live UI v2: root `sw.js` trả kill-switch, `app/sw.js` trả `gdct1-v5`, manifest trả đúng nội dung; trang app live đăng ký SW scope `/app/` (controller xuất hiện sau ~1.5 s trong profile sạch). Local Motion v3 dùng `gdct1-v8` nhưng chưa deploy.
- **Chưa kiểm chứng:** không tạo bản cài trùng khi đã cài bản cũ (cần cài PWA thật); Safari/Firefox `id` limited availability.

## Dữ liệu & baseline

- 100 câu / 100 đáp án; id `gdct1-001…100`; 0 thiếu/thừa/trùng.
- 6 nhóm: Triết 20, KTCT 16, CNXHKH 4, TTHCM 20, Đạo đức 20, Công dân & NLĐ 20.
- 44 verified / 56 reference; 7 needsReview (021, 027, 047, 064, 086, 097, 098) — 7 không phải tập con của 56, không nói “7 trong 56”.
- Trong `questions.js` mọi `correctIndex` là `null`; đáp án lấy từ `answers.js` khi chạy — đúng thiết kế.

## Vấn đề mở / nợ

- **Motion v3 đang là local RC, chưa commit/push/deploy**; live vẫn UI v2 `c4ae353`. Cần người dùng duyệt trước khi phát hành.
- Motion chưa kiểm WebKit/iOS thật; PWA cài thật/đè bản cũ chưa kiểm; low-end Android chưa đo; zoom 400% chưa tự động.
- LCP local 2,375ms (margin ~120ms dưới ngưỡng); nếu thêm script/asset vào critical path phải đo lại LHCI.
- GSAP license “no charge” không phải OSI; đã ghi vendor + README/DECISIONS; nâng version phải cập nhật SHA + test.
- Ảnh/OG: OG vẫn dùng `og-source.html` riêng (không có pen mark) nên không phải render lại; 4 ảnh app không đổi giao diện tĩnh.
- 7 câu needsReview là backlog nội dung, ngoài phạm vi UI/motion.
- README đã cập nhật SW v7; linkinator chỉ tính link nội bộ.
- App pa11y có 13 false positive do hash route bị coi là anchor thiếu; phạm vi a11y là landing + 404, ghi trong README.
- 404 hard-code base `/so-on-gdct1/`.
- Chưa test PWA cài thật/standalone thật; chưa kiểm bản cài cũ có bị trùng sau deploy UI v2; WebKit/iOS chưa có thiết bị.
- Chưa kiểm zoom 400% tự động; chưa có field data (không analytics theo quyết định).
- Trang đã deploy không có header bảo mật tùy biến (giới hạn GitHub Pages).
- Chromium live audit có 1 lần fail không truy được check cụ thể trước khi pass 2/3 và 2 lần liên tiếp sau đó; nếu tái diễn cần bắt log đầy đủ.
