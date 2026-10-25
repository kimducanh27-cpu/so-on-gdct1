# Sổ Ôn GDCT1

Landing page ở `/` và app ôn trắc nghiệm ở `/app/`. Toàn bộ là HTML/CSS/JS tĩnh, không build, không backend, không tài khoản. Motion dùng GSAP 3.15 tự host (core + ScrollTrigger), nạp sau `load`; hero dùng CSS keyframes để không chặn LCP. Tiến độ lưu trong `localStorage` của trình duyệt.

Bản đang chạy: https://kimducanh27-cpu.github.io/so-on-gdct1/ (UI v2 `c4ae353`). Motion v3 đang là local release candidate trong working tree, **chưa deploy**.

App ôn 100 câu GDCT1 từ 70 ảnh đề, lên lịch 20 ngày tới **12.11.2026**, có chuỗi ngày học, nhắc qua `.ics`, thi thử và tra – gán đáp án.

## Chạy thử

Từ thư mục gốc repo:

```bash
node scripts/serve.mjs
# mở http://127.0.0.1:8123/so-on-gdct1/
```

Server giữ đúng base path của GitHub Pages, trả `404.html` cho route lạ và không cache. Đổi cổng bằng `PORT=8124 node scripts/serve.mjs`; `QA_PORT` dùng cho `verify.sh`. Không mở thẳng `index.html` bằng `file://` khi cần kiểm tra service worker, PWA, redirect legacy hoặc clipboard.

## Cấu trúc

```
/                     landing, 404.html, robots.txt, sitemap.xml
                      sw.js (kill-switch SW cũ ở scope gốc)
assets/               landing.css/js + motion.js, og-cover.png, fonts/, landing/ (ảnh chụp app), vendor/ (GSAP)
app/                  app shell, manifest, sw.js, data/, icons/, assets/ (app.css/js, motion.js, vendor/)
scripts/              serve.mjs + các script QA
.plan/ .memory/ docs/ kế hoạch, quyết định, bằng chứng, spec
```

Chỉ các thư mục/thư mục tệp ở root, `assets/` và `app/` được dùng khi chạy; phần còn lại là tài liệu và công cụ phát triển.

## URL và redirect

- `/` — landing; CTA `Mở sổ ôn ngay` trỏ `./app/#/today`.
- `/app/` — ứng dụng; route hash `#/today|study|done|library|check|stats|settings|exam-setup`, mặc định `today`.
- `/#/...` cũ được `assets/landing.js` chuyển sang `./app/#/...`; khi chạy standalone (PWA) vào thẳng `./app/#/today`.
- `404.html` dùng `<base href="/so-on-gdct1/">` cố định theo tên repo hiện tại.

## Dữ liệu câu hỏi

- 70 ảnh Google Forms → 120 lượt câu (form đảo thứ tự phương án nên có câu lặp).
- Sau chuẩn hoá và khử trùng theo nội dung: **100 câu**, id ổn định `gdct1-001` … `gdct1-100`. Không đổi id: đáp án và tiến độ đã lưu gắn với id.
- Ảnh đề gốc không nằm trong repo; mỗi câu giữ `sourceImage`.
- 6 nhóm: Triết học Mác – Lênin (20), Kinh tế chính trị Mác – Lênin (16), Chủ nghĩa xã hội khoa học (4), Tư tưởng Hồ Chí Minh (20), Đạo đức – Phong cách Hồ Chí Minh (20), Công dân & Người lao động (20).

## Đáp án: chính sách và mức tin cậy

Trong ảnh đề **không có bảng đáp án**; phương án được khoanh/chọn trong ảnh không được dùng làm đáp án. `app/data/answers.js` có 100 đáp án do người dựng soạn và đối chiếu:

- `level: "verified"` — **44 câu** khớp câu chữ hoặc ý với *Giáo trình Giáo dục chính trị* (Bộ LĐTBXH, 2024, bản PDF của ydmekong.edu.vn). Nguồn hiển thị kèm số bài/mục.
- `level: "reference"` — **56 câu** là đáp án tham khảo theo chuẩn kiến thức, chưa có nguồn trực tuyến đối chiếu từng câu.
- `needsReview: true` — **7 câu** (021, 027, 047, 064, 086, 097, 098): đề gốc mơ hồ hoặc phương án trùng lặp. Đây là **cờ riêng**, không phải nhóm thứ tư: 2 câu nằm trong 44 `verified`, 5 câu trong 56 `reference`. Không cộng 44 + 56 + 7.

Trong app, mỗi câu có nút **Tra / gán đáp án**: mở Google theo nội dung câu hỏi, chọn phương án đúng, ghi nguồn rồi lưu. Đáp án bạn lưu có mức `Bạn xác nhận`, được ưu tiên và dùng để chấm điểm; có thể xoá xác nhận để quay về đáp án gốc.

Nhập hàng loạt tại tab **Đáp án** → `Nhập CSV / JSON`. CSV:

```csv
id,correctIndex,explanation
gdct1-001,B,"Giải trình ngắn"
gdct1-002,0,""
```

`correctIndex` nhận 0–3 hoặc A–D. JSON có thể là `{"gdct1-001":{"correctIndex":1,"explanation":"..."}}` hoặc mảng `[{id, correctIndex, explanation}]`.

## Lịch ôn, chuỗi, nhắc học

- Bắt đầu 24.10.2026, hạn 12.11.2026: **20 ngày**; 2 ngày cuối chỉ ôn câu sai/đánh dấu.
- 100 câu mới dồn vào ~12 ngày đầu (~9 câu/ngày); các ngày sau dành cho ôn ngắt quãng (SRS kiểu SM-2: 1 → 3 → 3×ease ngày).
- Mỗi ngày tối đa 25 câu/phiên; chia phiên theo cài đặt (mặc định 12 câu/phiên).
- Chuỗi chỉ tăng khi số câu trả lời trong ngày đạt mục tiêu; tính lại theo ngày Việt Nam (UTC+7).
- Nhắc trong app chỉ chạy khi tab mở. Nút **Tải .ics** xuất 40 sự kiện (2 nhắc/ngày, `VALARM` 10 phút trước) để thêm vào Google Calendar/Apple Calendar; đây là cách nhắc hoạt động khi app đóng. Không có push server.

## Dữ liệu cục bộ

- Khóa `localStorage`: **`so-on-gdct1.v1`** (tiến độ, lịch, chuỗi, cài đặt, đáp án tự nhập).
- **Cài đặt → Sao lưu tiến độ** xuất JSON; nhập lại bằng nút chọn tệp trong cùng mục.
- **Xoá tiến độ** chỉ xoá tiến độ/chuỗi, giữ đáp án đã nhập.
- PWA: manifest ở `/app/` với `id: "../"`, `start_url: "./#/today"`, `scope: "./"`; `app/sw.js` cache shell + dữ liệu + font + GSAP/motion, hiện là `gdct1-v8`. Khi kích hoạt, app chỉ dọn cache cùng tiền tố `gdct1-` để không đụng cache khác trên origin.
- `sw.js` ở root là kill-switch một lần cho SW cũ scope `/so-on-gdct1/`: xoá cache `gdct1-v1..v3` và tự unregister, không có fetch handler.

## Kiểm tra trước khi phát hành

```bash
bash scripts/verify.sh
```

Yêu cầu: Node.js (đã chạy với v24.21.0), `npx` và mạng cho lần tải công cụ đầu tiên, Chrome/Edge và Firefox, Git Bash/WSL trên Windows, cổng 8123 trống. Script fail-closed; log mặc định ở `$TMPDIR/gdct1-qa`, đổi bằng `QA_OUT`, đổi cổng bằng `QA_PORT`.

Các gate: cú pháp JS, JSON, html-validate, đối chiếu 100 câu/44-56-7/6 nhóm/copy landing/localStorage/manifest/SW, contrast, secret + file khóa, TODO/`console.log`/`debugger`, HTTP 200/404, linkinator nội bộ, pa11y WCAG2AA, Chromium CDP (5 viewport, keyboard, FAQ, reduced motion, third-party), motion-audit (hero/reveal, reduce, no-JS, block GSAP, app gating/bars/sheet, negative control), Firefox BiDi (layout/console/routes), Firefox Marionette (focus/keyboard thật).

Giới hạn của gate:

- **WebKit/iOS: BLOCKED** — môi trường hiện tại không có runtime/thiết bị; không tính là pass.
- pa11y chỉ chạy landing + 404. App dùng hash route nên pa11y báo 13 false positive “anchor thiếu”; app được kiểm bằng Chromium/Firefox smoke.
- Server test local không gzip; GitHub Pages có nén. Chỉ số `uses-text-compression` của Lighthouse local là artifact, không dùng làm assertion.
- Keyboard Firefox tách sang Marionette vì Firefox headless qua BiDi không cấp focus thật.

Lighthouse mobile (3 run, local, median sau Motion v3):

| Perf | A11y | BP | SEO | LCP | TBT | CLS | TTFB | Total |
|---|---|---|---|---|---|---|---|---|
| **0.98** | **1** | **1** | **1** | **2,375 ms** | **20 ms** | **0** | **1 ms** | 275,386 B (chưa gzip) |

Bản live UI v2 trước Motion v3: Perf 1.0, LCP 1,207 ms; sau khi deploy Motion v3 cần đo lại live. Server local không gzip; GitHub Pages nén nên số byte live thấp hơn.

```bash
# cửa sổ 1
node scripts/serve.mjs
# cửa sổ 2
npx --yes @lhci/cli@0.14.0 autorun --config=lighthouserc.json
```

Ngưỡng nằm trong `lighthouserc.json`; mọi assertion required khai báo `"aggregationMethod": "median"` (3 run), báo cáo ghi vào `.lighthouseci/` (đã ignore).

Kiểm SW cache/migration/offline (sau khi server đang chạy):

```bash
node scripts/sw-audit.mjs
```

Check matrix và evidence index: `.plan/QA_MATRIX.md`; motion spec MO-* trong `.memory/UI_REVIEW.md`.

## Phát hành GitHub Pages

1. Repo → **Settings → Pages → Build and deployment**.
2. **Source: Deploy from a branch**; chọn nhánh phát hành (`main`) và thư mục **`/ (root)`**.
3. Không cần build command; `.nojekyll` đã có để Pages phục vụ nguyên cấu trúc.
4. Giữ `/sw.js` (kill-switch) và `/app/sw.js` đúng vị trí; không gộp hai file.

Nếu đổi tên repo hoặc gắn custom domain, cập nhật đồng bộ: canonical/OG/Twitter trong `index.html`, `sitemap.xml`, `robots.txt`, `<base>` trong `404.html`, và base mặc định trong `scripts/serve.mjs` cùng các script QA. GitHub Pages không đặt được header bảo mật tùy biến.

Cloudflare Pages/Netlify: build command để trống, output directory là root repo.

## Cache và rollback

- Sửa app shell, dữ liệu, manifest hoặc font app → tăng `CACHE` trong `app/sw.js` (`gdct1-v8` → `gdct1-v8`…). Sửa riêng landing không cần đổi SW.
- Không xoá root `sw.js`; người đã cài bản cũ cần file này để gỡ SW/cache cũ.
- Rollback bằng commit mới: `git revert <commit-xấu>` rồi phát hành lại. Không force-push, không sửa lịch sử đã công khai.
- Nếu rollback làm đổi app shell, tăng cache trước khi phát hành lại để client không giữ bản lỗi.

## Motion

- **Hero landing:** CSS keyframes (`mo-rise`, `mo-line`, `mo-scan`, `mo-flag`, `mo-pen`) chạy ngay khi CSS tải, không chờ JS; vì vậy LCP không phụ thuộc vendor. Gồm line stagger, phiếu/grid quét, rail 20 ngày, 7 cờ và nét bút khoanh “sổ”.
- **Scroll & micro landing:** `assets/motion.js` nạp GSAP/ScrollTrigger **sau `load`**, dùng `ScrollTrigger.batch(once)`, margin progress, parallax 8px chỉ với `(pointer:fine)` và ≥761px; `focusin` mở reveal nếu người dùng Tab vào.
- **App:** `app/assets/motion.js` + GSAP core; chỉ chạy entrance khi route/qid đổi (không replay khi pick/filter/search), **route fade 180ms không transform** để CTA fixed luôn đúng; feedback + dấu ✓/✕ vẽ nét, progress bar scaleX từ width cũ, sheet mở 200ms (đóng đồng bộ), toast 160ms. Feedback scroll căn option đã chọn dưới sticky top, tôn trọng reduce; control hiển thị ≥44px.
- **Hard review:** đã sửa CTA “Câu tiếp” bị khuất do transform, feedback scroll mất option, tap-target <44, topbar 320, **nét bút quanh “sổ”** (một path, SVG sizing tường minh, chữ mực/nét đỏ) và **icon tab “Đáp án”** (checkbox). Xem `.memory/UI_REVIEW.md` F-UI-14..19 và ảnh `.memory/visual_ledger/after-hard-review/`.
- **Vendor:** `assets/vendor/` và `app/assets/vendor/` chứa GSAP 3.15.0 core; ScrollTrigger chỉ ở landing. License GreenSock Standard “no charge” (không phải OSI) + SHA-256 ghi trong `LICENSE-GSAP.txt`; không CDN, 0 request third-party. Không dùng SplitText, Lenis, Lottie, particle.
- **Reduced motion / no-JS:** media query tắt hero CSS, `gsap.matchMedia`/listener dọn tween; không có nội dung nào bị ẩn chờ JS. Chặn GSAP vẫn đọc và dùng được toàn bộ nội dung.
- **Kiểm tra:** `bash scripts/verify.sh` đã gồm `scripts/motion-audit.mjs` (46 check: hero/reveal, reduce, no-JS, block GSAP, app gating/bars/sheet, negative control). Chạy riêng khi server đang chạy: `node scripts/motion-audit.mjs`. Ảnh frame hero + trạng thái cuối ở `.memory/visual_ledger/after-motion/`.

## Font landing

Landing chỉ dùng 4 file woff2 trong `assets/fonts/`: Newsreader 400 (instance tĩnh, giữ axis `opsz` 6–72) và Space Grotesk variable 300–700, mỗi family có subset latin + vietnamese. `@font-face` và `unicode-range` nằm trong `assets/landing.css`; tổng dung lượng hiện 88.372 B, ngưỡng 180 KB. App có bộ font riêng trong `app/assets/fonts/` và không được landing tải.

Nếu tạo lại font, giữ đúng 4 tên file, đúng family/weight/subset và cập nhật preload trong `index.html`; không thêm family thứ ba cho landing.

## Giới hạn

- Đáp án là tài liệu ôn tập, không phải đáp án chính thức của trường/đề thi; người học chốt đáp án cuối.
- 7 câu `needsReview` nên được đối chiếu lại trước khi tin.
- Câu 066 có hai phương án trùng câu chữ do bản ghi từ ảnh; đáp án đúng không bị ảnh hưởng.
- Chưa kiểm trên WebKit/Safari/iOS thật; chưa kiểm việc cài PWA đè lên bản cũ có tạo bản trùng không; chưa tự động hoá zoom 400%. Motion chưa kiểm trên WebKit/iOS; bằng chứng động hiện có Chromium + Firefox.
- GSAP là license “no charge” của GreenSock (không OSI); file tự host, giữ nguyên header/license. Nếu nâng version phải cập nhật SHA-256 trong `LICENSE-GSAP.txt` và chạy lại motion-audit.
- Link GitHub nằm inline trong câu văn giữ kích thước chữ, không nới 44×44 (ngoại lệ target-size của WCAG 2.2 cho inline link); các control độc lập khác đạt 44×44.
- Không analytics, không cookie, không request third-party. Ứng dụng không gửi dữ liệu đi đâu; mọi thứ lưu trên máy người dùng.
