# DECISIONS

## 2026-10-24 — Hướng thị giác landing: “sổ chỉ mục kỳ thi” (chọn A)

**Bối cảnh:** Brief yêu cầu dùng lại nhận diện app (`#F4F1EA`, Newsreader/Space, nền giấy, accent rust). Đối tượng: sinh viên ôn GDCT1 trên điện thoại, hạn 12.11.2026.

**Hướng A — Sổ chỉ mục kỳ thi (chọn):**
- Palette: giấy `#F4F1EA`, mực `#141A18`, rust `#D24A2E`, xanh `#1F5C4A`, hổ phách `#8A6414`, đường kẻ `#DAD2C1`.
- Type: Newsreader 400 cho display; Space Grotesk 400 cho body/nhãn. Bỏ mono để đạt budget 2 family/4 file.
- Layout: editorial 12 cột, lề trái rộng như vở, nội dung ≤68ch, đường kẻ mảnh; hero 7/5 với ảnh app thật.
- Signature: **rail 20 ngày** — 20 vạch ngày thật từ 24.10 đến 12.11, 12 ngày học mới + 8 ngày ôn, khoanh “hôm nay”; đặt dưới ảnh như bookmark.
- Risk: dễ trượt thành “retro paper” chung chung; giữ kỷ luật bằng spacing chính xác, ảnh sản phẩm thật, không gradient/glass/shadow lớn.

**Hướng B — Bảng ôn kỹ thuật (loại):**
- Palette: nền mực `#0E1512`, chữ `#E8EFE9`, mint `#B7E4CE`, hổ phách `#E2B45C`; tương phản cao.
- Type: Space Grotesk display + JetBrains Mono cho dữ liệu; dày đặc.
- Layout: dashboard tối toàn màn, lưới 20 ngày, screenshot như cửa sổ console.
- Signature: ma trận đếm ngày trực tiếp.
- Lý do loại: đọc như dev tool, lệch nhận diện giấy của app; cần family thứ ba (mono) vượt budget; mobile đọc mệt hơn.

**Hệ quả:** Landing dùng 4 file font (Newsreader 400, Space 400; latin + vietnamese) và không dùng mono. Ảnh chụp app phải là ảnh thật, không mock.

## 2026-10-24 — Landing tại `/`, app tại `/app/` (C3, người dùng chọn)
**Bối cảnh:** App tĩnh đang chiếm `/`; cần landing giới thiệu và một CTA mở app.
**Chọn:** Landing mới tại `/`; toàn bộ app chuyển sang `/app/`; deep link cũ `/#/...` chuyển tiếp sang `/app/#/...`.
**Loại:** Giữ app ở `/` + landing tại `/gioi-thieu/` (không đúng vai trò entry); trang độc lập `/landing.html` (không thay entry).
**Lý do:** Người dùng chọn mô hình landing → app; CTA chính là “Mở sổ ôn ngay”.
**Hệ quả:** Phải xử lý legacy hash, SW scope gốc, manifest `start_url/scope/id`, README và base path GitHub Pages.
**Ảnh hưởng:** T-BASE-01, T-PWA-01, T-REDIR-01, T-SEO-01, T-DOC-01, T-DEPLOY-01.

## 2026-10-24 — Giữ site tĩnh, không dependency runtime [GIẢ ĐỊNH]
**Bối cảnh:** Landing 1 trang; repo hiện không có package manager/build.
**Chọn:** HTML/CSS/JS thuần, không framework/build; chỉ dùng `npx` cho công cụ kiểm tra khi cần.
**Loại:** Thêm framework/landing builder.
**Lý do:** “Đơn giản nhất đủ dùng”; tránh bundle và pipeline cho một trang.
**Hệ quả:** Không có typecheck/build gate; bù bằng `verify.sh`, html-validate, pa11y, Lighthouse.
**Ảnh hưởng:** T-LAND-*, T-QA-01, T-PERF-01. [GIẢ ĐỊNH]

## 2026-10-24 — Migration PWA: kill-switch + cache `gdct1-v4` + `id: "../"`
**Bối cảnh:** SW `gdct1-v3` đang ở scope `/so-on-gdct1/`, cache 32 file của app root; manifest cũ có `start_url: "./#/today"`, `scope: "./"`.
**Chọn:** Root `sw.js` thành kill-switch (skipWaiting/claim, xoá cache legacy, unregister scope gốc); `app/sw.js` dùng `gdct1-v4`; manifest mới đặt `id: "../"` để resolve về định danh cũ.
**Loại:** Giữ nguyên SW/cache cũ; chỉ unregister từ landing; đổi id (tạo bản cài mới).
**Lý do:** `unregister()` không dừng ngay và không xoá cache (MDN #1); `id` ngoài scope được và giữ được bản cài (MDN #2); SW update cần skipWaiting/claim (MDN #3).
**Hệ quả:** Người đã cài app cũ có thể phải mở lại một lần; nếu trình duyệt không hỗ trợ `id`, ghi nhận cài lại. Không tuyên bố pass khi chưa test Chrome.
**Kiểm chứng 2026-10-24:** Chrome 155 (headless, profile sạch) — manifest `id: "../"` resolve thành `http://127.0.0.1:8123/so-on-gdct1/`; kill-switch gỡ registration scope gốc, xoá `gdct1-v3`, cache `gdct1-v4` của app còn nguyên. Chưa cài bản PWA cũ để test trùng bản cài; ghi rõ “chưa kiểm chứng” thay vì pass.
**Ảnh hưởng:** T-PWA-01, T-REDIR-01, T-DEPLOY-01.

## 2026-10-24 — SEO: landing indexable, app `noindex`, sitemap chỉ `/` [GIẢ ĐỊNH]
**Bối cảnh:** App là công cụ hash-route, không có nội dung index theo route; landing là mặt tiền.
**Chọn:** Landing có title/description/canonical/OG; `/app/` `noindex`; sitemap chỉ `/`.
**Loại:** Index cả app; sitemap nhiều URL hash.
**Lý do:** Tránh nội dung mỏng/trùng; hash không được index riêng.
**Hệ quả:** Người tìm “Sổ Ôn GDCT1” vào landing rồi CTA sang app.
**Ảnh hưởng:** T-SEO-01. [GIẢ ĐỊNH]

## 2026-10-24 — Font landing: tối đa 2 family, 4 file woff2 [GIẢ ĐỊNH]
**Bối cảnh:** App dùng 3 family (Newsreader, Space, mono) với 22 file font; budget lab cho phép ≤ 2 family/4 file/180KB.
**Chọn:** Landing chỉ dùng 2 family cần thiết, subset latin + vietnamese; không tải toàn bộ font app.
**Loại:** Dùng nguyên bộ font app.
**Lý do:** Giữ nhận diện nhưng không vượt budget LCP/transfer.
**Hệ quả:** Có thể lệch nhẹ so với app; review thị giác ở M3.
**Ảnh hưởng:** T-LAND-01, T-PERF-01. [GIẢ ĐỊNH]

## 2026-10-24 — Không placeholder; số liệu lấy từ dữ liệu thật [GIẢ ĐỊNH]
**Bối cảnh:** README/data đã có nội dung thật; không có testimonial hay số liệu bịa.
**Chọn:** Landing dùng đúng 100 câu/70 ảnh/20 ngày/44 verified/56 reference/7 cần kiểm tra; đối chiếu bằng script.
**Loại:** Viết số tay hoặc dùng placeholder.
**Lý do:** W5 — không bịa nội dung; tránh lệch dữ liệu.
**Hệ quả:** Nếu dữ liệu đổi, phải cập nhật landing và chạy `verify.sh`.
**Ảnh hưởng:** T-LAND-02, T-QA-01. [GIẢ ĐỊNH]

## 2026-10-24 — Giữ khóa localStorage và id câu [GIẢ ĐỊNH]
**Bối cảnh:** Tiến độ người dùng nằm ở `so-on-gdct1.v1` theo origin (README ghi nhầm `gdct1.state.v1`; code là nguồn sự thật); id câu `gdct1-001…100` dùng cho đáp án.
**Chọn:** Không đổi khóa, không đổi id câu, không migrate dữ liệu.
**Loại:** Đổi tên khóa/id cho “sạch”.
**Lý do:** Tránh mất tiến độ; cùng origin nên URL mới vẫn đọc được dữ liệu cũ.
**Hệ quả:** Phải test localStorage sau khi chuyển app.
**Ảnh hưởng:** T-BASE-01. [GIẢ ĐỊNH]

## 2026-10-24 — Không analytics/third-party [GIẢ ĐỊNH]
**Bối cảnh:** App hiện không gửi dữ liệu đi đâu; không có nhu cầu đo.
**Chọn:** Landing 0 request khác origin; không cookie, không tracker.
**Loại:** Thêm analytics nhẹ.
**Lý do:** Quyền riêng tư và đơn giản; analytics cần consent (4.2 PLAN_SPEC).
**Hệ quả:** Không có số liệu field; dùng Lighthouse lab.
**Ảnh hưởng:** T-LAND-01..03, T-PERF-01. [GIẢ ĐỊNH]

## 2026-10-24 — Font landing: instance tĩnh Newsreader 400 thay variable

**Bối cảnh:** LHCI mobile 3 run cho LCP 2.402 s (vẫn ≤2.5 nhưng sát ngưỡng). Thử bỏ font → LCP 1.35 s, perf 1.0, xác định payload font là nguyên nhân.
**Chọn:** Instance `newsreader-latin.woff2` + `newsreader-vietnamese.woff2` ở wght=400 tĩnh, giữ axis `opsz` 6–72; Space Grotesk vẫn variable 300–700.
**Loại:** Giữ variable 200–800; bỏ hẳn Newsreader; dùng system font.
**Lý do:** Landing chỉ dùng Newsreader 400; cắt 120,400→51,072 B và 26,720→11,700 B (font tổng 147.1→62.8 KB cho cặp Newsreader, toàn bộ 88,372 B), LCP 2.10 s, không đổi hình ảnh.
**Hệ quả:** Nếu sau này cần weight khác cho display, phải tạo thêm instance hoặc quay lại variable; script/README ghi cách tái tạo subset.
**Ảnh hưởng:** T-PERF-01, T-DOC-01.

## 2026-10-24 — Bỏ animation hero; reduced motion mặc định

**Bối cảnh:** Animation opacity/translate không cải thiện LCP (font mới là nguyên nhân) nhưng thêm rủi ro che nội dung và không cần cho brief.
**Chọn:** Xoá toàn bộ animation/keyframe hero; giữ universal reduced-motion block cho transition còn lại.
**Loại:** Giữ animation và tắt khi reduce.
**Lý do:** Ít chuyển động hơn, LCP ổn định, không cần JS; đúng tinh thần “một cuốn sổ”, không phải landing demo.
**Ảnh hưởng:** T-A11Y-01, T-PERF-01.

## 2026-10-24 — Target 44×44: nới control, giữ ngoại lệ inline link

**Bối cảnh:** Nav “Vì sao” 40×?; CTA phụ 40 cao; footer link 31 cao/41 rộng. axe target-size báo lỗi.
**Chọn:** `min-width/min-height: 44px` + center cho nav link, hero text-link, footer link. Link GitHub nằm inline trong câu văn giữ nguyên kích thước.
**Loại:** Nới mọi link kể cả inline (phá nhịp chữ); bỏ qua toàn bộ rule.
**Lý do:** WCAG 2.2 có ngoại lệ cho link inline trong câu; các control tương tác độc lập vẫn đạt 44.
**Hệ quả:** README ghi ngoại lệ; nếu link GitHub rời khỏi câu văn phải nới 44.
**Ảnh hưởng:** T-A11Y-01, T-QA-01.

## 2026-10-24 — QA bằng Chromium CDP + Firefox BiDi, WebKit ghi blocked

**Bối cảnh:** Không có package manager/browser driver; máy có Chrome 155 và Firefox 158; Playwright/WebKit browser chưa cài.
**Chọn:** `scripts/browser-audit.mjs` dùng CDP Chrome cho layout/console/keyboard/axe phụ; `scripts/firefox-smoke.mjs` dùng WebDriver BiDi sẵn có của Firefox (`--remote-debugging-port`) cho render/overflow/console/keyboard; WebKit không có → in `BLOCKED`, không pass khống.
**Loại:** Cài Playwright browser; chỉ test Chromium; giả pass WebKit.
**Lý do:** Tận dụng browser hệ thống, verify.sh fail-closed, không thêm dependency runtime.
**Hệ quả:** Firefox smoke cần Firefox ≥ hỗ trợ BiDi; CI/người nhận thiếu Firefox sẽ fail rõ ràng.
**Ảnh hưởng:** T-QA-01, T-DOC-01.

## 2026-10-24 — Chỉ lập plan lần này; deploy chờ duyệt
**Bối cảnh:** Người dùng chọn “Chỉ lập plan”; deploy production là hành động công khai (W8).
**Chọn:** Không viết code, không push/deploy trong lượt này; `T-DEPLOY-01` blocked bởi Q1.
**Loại:** Tự duyệt và triển khai ngay.
**Lý do:** Đúng chỉ đạo và W8.
**Hệ quả:** Khi duyệt plan, bắt đầu từ T-BASE-01; deploy chỉ sau M4 + Q1.
**Ảnh hưởng:** Toàn bộ TASKS; T-DEPLOY-01.

## 2026-10-24 — Marionette keyboard gate: bỏ probe, retry connect + handshake

**Bối cảnh:** `firefox-keyboard.mjs` fail `ECONNREFUSED` 1/3 lần khi chạy ngay sau Firefox BiDi smoke; chạy đơn lẻ pass 3/3. Log cho thấy `waitForPort` kết nối thành công nhưng kết nối thật ngay sau đó bị từ chối.

**Chọn:** Bỏ probe TCP riêng; gộp `connectMarionette` + `WebDriver:NewSession` vào `openSession()` retry 250 ms tới 20 s, đóng socket thì reject mọi request đang chờ.
**Loại:** Retry ở lớp bash; tăng timeout; bỏ Firefox gate.
**Lý do:** Probe và kết nối thật không nguyên tử — listener Marionette có thể vắng giữa hai lần trong lúc khởi động/khởi động lại. Retry có điều kiện giữ gate fail-closed nếu Marionette không lên, đồng thời không che lỗi app.
**Kiểm chứng:** 5/5 cặp BiDi → Marionette pass sau sửa; `bash scripts/verify.sh` exit 0.
**Ảnh hưởng:** T-QA-01, T-DOC-01.
