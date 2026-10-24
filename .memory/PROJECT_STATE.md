# PROJECT STATE

Cập nhật: 2026-10-24 · **Đã deploy** `main` @ `b3f89a1` lên https://kimducanh27-cpu.github.io/so-on-gdct1/ · Nhánh `landing-page` giữ nguyên tại `b3f89a1` · Nguồn gốc: repo `kimducanh27-cpu/so-on-gdct1` @ `e4cac8c` · T-DOC-01 và T-DEPLOY-01 done-verified.

## Stack & môi trường

- HTML/CSS/JS thuần; **không** `package.json`, lockfile, build, lint, test, CI.
- Host: GitHub Pages, source `main` `/`, build legacy. Live https://kimducanh27-cpu.github.io/so-on-gdct1/ đã là landing mới; app ở `/app/`.
- Không backend, không tài khoản; dữ liệu ở `localStorage` khóa **`so-on-gdct1.v1`** (README cũ ghi nhầm `gdct1.state.v1`).
- PWA: app ở `/app/`; `manifest.webmanifest` (`id: "../"`, `start_url: "./#/today"`, `scope: "./"`); `app/sw.js` cache `gdct1-v4`; root `sw.js` là kill-switch (không fetch handler).
- Test local: server tĩnh tự viết dưới base `/so-on-gdct1/`, cổng 8123; `npx` cho công cụ QA (không thêm dependency runtime).

## Cấu trúc hiện tại

```
/                 index.html (landing), 404.html, robots.txt, sitemap.xml, sw.js (kill-switch)
                  manifest? không — manifest nằm trong app/
assets/           landing.css, landing.js, og-cover.png
assets/fonts/     4 woff2: Newsreader 400 + Space Grotesk 300–700 (latin + vietnamese)
assets/landing/   today-390, library-390, check-390, today-1280 (.webp)
app/              index.html, manifest.webmanifest, sw.js
app/assets/       app.css, app.js, fonts/ (22 file)
app/data/         questions.js (100), answers.js (100)
app/icons/        favicon + 192/512 + maskable
scripts/          serve.mjs, check-contrast.mjs, check-data.mjs, browser-audit.mjs, firefox-smoke.mjs, firefox-keyboard.mjs, verify.sh
.plan/ .memory/ docs/ AGENTS.md README.md .nojekyll
```

Route app: `app/#/today|study|done|library|check|stats|settings|exam-setup`; mặc định `today`.

## Landing (T-LAND-01..03)

- Hero: “20 ngày, / 100 câu hỏi, / một cuốn sổ.”; CTA chính `Mở sổ ôn ngay` → `./app/#/today`; CTA phụ `Xem cách học` → `#cach-hoc`.
- Signature: rail 20 ngày (12 vạch đặc + 8 vạch rỗng) đặt dưới ảnh Hôm nay, mốc 01/20 và 12.11.2026.
- Sections: `#vi-sao`, dải đáp án 44/56/7 (không id), `#cach-hoc`, `#trong-so`, `#hoi-dap`, CTA cuối; footer nêu dữ liệu trên máy, không backend, link GitHub.
- 7 needsReview là cờ trên 7 câu (2 verified + 5 reference), không phải nhóm thứ tư.
- Số liệu lấy từ data thật: 100 câu / 70 ảnh / 44 verified / 56 reference / 7 needsReview / 20 ngày tới 12.11.2026 / 6 nhóm.
- Không JS vẫn dùng được CTA; JS chỉ redirect legacy và PWA standalone.

## SEO / 404 (T-SEO-01)

- Landing: title, description, canonical, OG + Twitter đầy đủ, ảnh OG tuyệt đối 1200×630 (`assets/og-cover.png`, 128,061 B).
- `/app/` có `<meta name="robots" content="noindex">`; sitemap chỉ URL gốc; robots trỏ sitemap.
- `404.html` dùng `<base href="/so-on-gdct1/">` (hard-code base deploy; đổi tên repo phải sửa), có CTA về `/` và `/app/`, `noindex`.
- html-validate: 0 error (1 warning `no-inline-style` của app noscript).

## A11Y (T-A11Y-01)

- pa11y-ci 5.0.0 (WCAG2AA, axe runner): landing + 404 sạch.
- axe-core 4.10.3 qua CDP: 0 violation ở landing/404 × 1280/390/320 (tag wcag2a/2aa/21a/21aa/22aa).
- 1 `h1`, heading tuần tự; skip link; landmark header/main/footer; focus ring 2px rust, offset 3; không focus nào bị che.
- Target 44×44 cho nav, CTA phụ, footer link. Ngoại lệ hợp lệ: link GitHub inline trong câu văn (WCAG 2.2 target-size exception cho inline link); ghi rõ trong README thay vì nới rule.
- Reduced motion: đã bỏ toàn bộ animation hero (không chỉ tắt khi reduce); universal reduce block giữ lại cho transition.
- Contrast script 15 cặp PASS (text ≥4.5, rust lớn/focus ≥3).
- Reflow 320px: không overflow; zoom 400% không kiểm tự động (ghi nợ).

## Perf (T-PERF-01) — done

| Hạng mục | Run 1 | Run 2 | Run 3 | Median | Ngưỡng |
|---|---|---|---|---|---|
| Performance | 0.99 | 0.99 | 0.99 | **0.99** | ≥0.90 |
| Accessibility | 1 | 1 | 1 | **1** | =1 |
| Best Practices | 1 | 1 | 1 | **1** | ≥0.95 |
| SEO | 1 | 1 | 1 | **1** | =1 |
| LCP | 2102.31 ms | 2104.48 ms | 2102.78 ms | **2102.78 ms** | ≤2500 |
| TBT | 0 | 0 | 0 | **0** | ≤200 |
| CLS | 0 | 0 | 0 | **0** | ≤0.1 |
| TTFB | 1.191 ms | 0.919 ms | 0.838 ms | **0.919 ms** | ≤800 |
| Total bytes | 156,129 | 156,129 | 156,129 | **156,129** | ≤1.5 MB |

- Lighthouse 12.1.0 qua LHCI 0.14.0, mobile preset, 3 run, base `http://127.0.0.1:8123/so-on-gdct1/`; báo cáo ở `.lighthouseci/` (ignored, giữ local).
- Budget asset: JS landing 364 B; CSS landing 23,494 B; font 4 file / **88,372 B** (Newsreader latin 51,072 + viet 11,700; Space latin 19,796 + viet 5,804); OG 128,061 B; screenshot 21–28 KB/ảnh.
- 0 request third-party lúc runtime.
- LCP trước tối ưu: 2.40 s; bỏ font thử nghiệm → 1.35 s, xác định font là nguyên nhân. Đổi Newsreader từ variable 200–800 sang static wght=400 (giữ opsz) giảm font 147.1 KB → 62.8 KB (Newsreader) và LCP → 2.10 s. Bản gốc backup ở `%TEMP%/gdct1-font-backup/`.
- Lưu ý: server local không gzip; GitHub Pages nén. `uses-text-compression` là artifact local, không đưa vào assertion.

### Lighthouse production (2026-10-24)

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

## QA gate (T-QA-01) — done

- Một lệnh: `bash scripts/verify.sh` → exit 0, chạy trên server test base `/so-on-gdct1/` cổng 8123; fail-closed (thiếu Chrome/Firefox/npx/cổng bận đều fail).
- Gate đã pass: `node --check` toàn bộ JS/MJS; JSON manifest/LHCI/html-validate/pa11yci; html-validate 0 error; `check-data` 45 check (100 câu/đáp án, 44/56/7, 6 nhóm, copy landing, manifest, SW, localStorage, SEO, kích thước asset); contrast 15 cặp; secret scan + file khóa; không TODO/console.log/debugger/conflict marker; HTTP 200 cho landing/app/asset + 404 tùy biến cho route lạ; linkinator 18 link nội bộ 0 chết; pa11y 2/2 URL 0 error.
- Chromium CDP (`scripts/browser-audit.mjs`): landing + 404 × 5 viewport không overflow, 1 h1, font tải, console sạch, ảnh lazy tải đủ, CTA đúng `app/#/today`; 8 route app render; keyboard 24 bước ring ≥2px không bị che; FAQ Enter; reduced motion; 0 request third-party.
- Firefox BiDi (`scripts/firefox-smoke.mjs`): landing + 404 × 5 viewport, console sạch, 8 route app, 0 console error.
- Firefox Marionette (`scripts/firefox-keyboard.mjs`): focus thật (`document.hasFocus()`), skip link, 22 bước Tab ring ≥2px không bị che, FAQ Enter.
- **Live 2026-10-24:** Chromium audit cùng script trên base production pass toàn bộ (landing + 404 × 5 viewport, 8 route app, keyboard 24 bước, FAQ, reduced motion, 0 third-party, 0 console error); Firefox BiDi 8 route pass; Marionette keyboard pass; pa11y live 2/2 URL 0 error; redirect legacy 5 route pass khi tải trang mới; HTTP 200 cho 14 endpoint (landing, app, manifest, 2 SW, CSS/JS, OG, ảnh, font, robots, sitemap, 404, data).
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

## Redirect legacy (T-REDIR-01)

- `assets/landing.js` (364 B, blocking trong head): hash `#/...` → `./app/` + hash, base-aware; `display-mode: standalone` vào `./app/#/today`; hash rỗng không redirect.
- Test CDP 10/10 case pass (5 hash sâu, root, standalone, base path, không loop), console 0 error.
- Live 2026-10-24: 5 route legacy tải trang mới đều chuyển đúng sang `/app/#/...` và app render; root không hash giữ landing.
- Standalone được mô phỏng bằng stub `matchMedia` (CDP headless không emulate được display-mode); ghi rõ là mô phỏng, chưa test trên PWA cài thật.

## PWA migration (T-PWA-01)

- Root `sw.js` kill-switch: `skipWaiting` + `clients.claim`, xoá `gdct1-v1..v3`, `unregister()`; không fetch handler.
- Test Chrome 155 profile sạch: SW cũ root active + `gdct1-v3` 34 entry → sau update registration root bị xoá, cache rỗng; `gdct1-v4` của app còn nguyên.
- App SW: scope `/app/`, cache `gdct1-v4` 34 entry, controller `app/sw.js`; offline reload khi server tắt vẫn render.
- Manifest `id: "../"` resolve `/so-on-gdct1/`, `start_url` resolve `/so-on-gdct1/app/#/today`.
- Live: root `sw.js` trả kill-switch, `app/sw.js` trả `gdct1-v4`, manifest trả đúng nội dung; trang app live đăng ký SW scope `/app/` (controller xuất hiện sau ~1.5 s trong profile sạch).
- **Chưa kiểm chứng:** không tạo bản cài trùng khi đã cài bản cũ (cần cài PWA thật); Safari/Firefox `id` limited availability.

## Dữ liệu & baseline

- 100 câu / 100 đáp án; id `gdct1-001…100`; 0 thiếu/thừa/trùng.
- 6 nhóm: Triết 20, KTCT 16, CNXHKH 4, TTHCM 20, Đạo đức 20, Công dân & NLĐ 20.
- 44 verified / 56 reference; 7 needsReview (021, 027, 047, 064, 086, 097, 098) — 7 không phải tập con của 56, không nói “7 trong 56”.
- Trong `questions.js` mọi `correctIndex` là `null`; đáp án lấy từ `answers.js` khi chạy — đúng thiết kế.

## Vấn đề mở / nợ

- Đã deploy `main` @ `b3f89a1`; không còn nợ push/deploy. Ảnh OG tuyệt đối đã 200 trên live.
- 7 câu needsReview là backlog nội dung, ngoài phạm vi landing.
- README đã kiểm từ clone sạch; linkinator chỉ tính link nội bộ.
- App pa11y có 13 false positive do hash route bị coi là anchor thiếu; phạm vi a11y là landing + 404, ghi trong README.
- 404 hard-code base `/so-on-gdct1/`.
- Chưa test PWA cài thật/standalone thật; chưa kiểm bản cài cũ có bị trùng; WebKit/iOS chưa có thiết bị.
- Chưa kiểm zoom 400% tự động; chưa có field data (không analytics theo quyết định).
- Trang đã deploy không có header bảo mật tùy biến (giới hạn GitHub Pages).
