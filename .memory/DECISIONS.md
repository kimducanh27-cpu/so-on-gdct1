# DECISIONS

## 2026-10-25 — Hard review UI: fixed CTA, feedback context, tap targets

**Bối cảnh:** Review sau Motion v3 phát hiện lỗi thật trên mobile: CTA “Câu tiếp” bị khuất, feedback auto-scroll làm mất option đã chọn, nhiều control <44px, 320px brand/nav chật.

**Chọn:**
- **Route entrance chỉ fade**, không translate/transform `.view`: transform trên ancestor tạo containing block cho `.study-cta` fixed, khiến CTA chui dưới tabbar. Thêm `clearProps:'transform'` và check hồi quy.
- **Feedback scroll một target duy nhất**: căn `.opt.is-selected` ngay dưới `.study-top`, feedback ở dưới; dùng `behavior:'auto'` khi reduce. Không dùng `scrollIntoView({block:'center'})`.
- **Tap target ≥44px** cho app: brand/streak/icon/tool/btn-sm/chip/link-btn/select/time/search; switch giữ track 44×25 nhưng hit area 44×44; nav min-width 44; ≤360 ẩn dot/code brand. Thêm check target theo route.
- **FAQ:** giữ grid accordion; “22px” là phantom box của `::details-content`, không phải layout gap (item − summary = 1px). Check mới đo item thật.
- **Pen mark:** chữ “sổ” đổi sang mực, nét bút đỏ; bỏ ellipse thứ hai, dùng một path có gap. SVG phải có `width/height:calc()` tường minh vì replaced element không tự kéo giãn theo `inset`; tách dòng 3 bằng `margin-top:.30em` để vòng không chạm dấu phẩy dòng trên.
- **Icon “Đáp án”:** đổi check + hai gạch rời thành ô vuông + check (checkbox) cùng stroke 1.6; active giữ đỏ.
- **Cache:** bump `gdct1-v8` sau khi sửa app shell (icon tab); test migration v7→v8 + offline pass.

**Đo:** UI review 320/390/1280: 0 overflow, 0 visible target <44 (chỉ input file ẩn), console 0 error; motion-audit 46/46; verify exit 0. **Đã deploy 2026-10-26** `2671b02`; live v8, LHCI 1.0/LCP 1,354ms/TBT 0/CLS 0; live smoke pass.

## 2026-10-25 — Motion v3: GSAP tự host + hero CSS, app subtle

**Bối cảnh:** Người dùng yêu cầu nâng visual/motion toàn diện, ưu tiên GSAP; ràng buộc site tĩnh, 0 third-party, LCP ≤2.5s, reduced-motion/no-JS, gate Lighthouse.

**Chọn:**
- **GSAP 3.15.0 core + ScrollTrigger tự host** trong `assets/vendor/` và `app/assets/vendor/` (bản core cho app). Không CDN, không thêm engine khác.
  - SHA-256: gsap `92bb9a96…570fbb`, ScrollTrigger `b0b14d67…916a2`; ghi trong `LICENSE-GSAP.txt`.
  - License GreenSock Standard “no charge” (không phải OSI); giữ nguyên header license; đã ghi README.
- **Hero landing bằng CSS keyframes**, không dùng GSAP trong critical path: line stagger, grid/rail scan, 7 cờ, pen draw. GSAP/ScrollTrigger chỉ nạp **sau `load`** cho scroll reveal, progress, parallax, micro.
- **App subtle:** `app/assets/motion.js` + GSAP core; entrance chỉ khi route/qid đổi; feedback/pen mark, bar scaleX, sheet/toast. Không scroll reveal nội dung app.
- **SW `gdct1-v8`**, precache `assets/motion.js` + `assets/vendor/gsap.min.js`; migration/offline đã test.
- **View Transitions API: hoãn** (router đồng bộ, focus/scroll/test; Firefox cross-document chưa có). Ghi backlog.
- **Không deploy** trong phiên này; live vẫn UI v2 `d0f962c`.

**Loại (có đo):** SplitText 3.6KB gzip (đã có 3 `.line`, tránh a11y/re-split); Lenis 5.4KB (scroll hijack, hại AT); Lottie 76.6KB (không cần scene JSON); tsParticles engine 24.3KB (trang trí, lệch brand); Motion 46.5KB và anime 29.1KB (trùng vai trò GSAP); SplitType (license không rõ, ngừng 2023); pinning/horizontal/particle/custom cursor/tilt (lệch form ngắn, hại mobile/a11y).

**Đo sau triển khai:** LHCI local 3 run: Perf 0.98, A11y/BP/SEO 1, LCP median 2,375ms (max 2,385), TBT 20ms, CLS 0; `verify.sh` exit 0; motion-audit 46/46. LCP vượt 2.5s khi GSAP còn trong critical path (2,616ms) → đổi hero sang CSS + lazy vendor; không nới ngưỡng.

**Hệ quả:** `AGENTS.md` có ngoại lệ dependency GSAP; mọi thay đổi motion phải chạy `bash scripts/verify.sh` (gồm motion-audit) và cập nhật ledger; tăng version GSAP phải cập nhật SHA + license + test lại.

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
**Cập nhật 2026-10-25:** vẫn không build/framework/package manager; có **ngoại lệ GSAP tự host** cho motion (xem decision Motion v3 ở đầu file), không CDN và không thêm engine khác.

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
**Cập nhật 2026-10-24:** Q1 đã được trả lời “cho phép push + deploy”; xem quyết định deploy bên dưới.
**Ảnh hưởng:** Toàn bộ TASKS; T-DEPLOY-01.

## 2026-10-24 — Marionette keyboard gate: bỏ probe, retry connect + handshake

**Bối cảnh:** `firefox-keyboard.mjs` fail `ECONNREFUSED` 1/3 lần khi chạy ngay sau Firefox BiDi smoke; chạy đơn lẻ pass 3/3. Log cho thấy `waitForPort` kết nối thành công nhưng kết nối thật ngay sau đó bị từ chối.

**Chọn:** Bỏ probe TCP riêng; gộp `connectMarionette` + `WebDriver:NewSession` vào `openSession()` retry 250 ms tới 20 s, đóng socket thì reject mọi request đang chờ.
**Loại:** Retry ở lớp bash; tăng timeout; bỏ Firefox gate.
**Lý do:** Probe và kết nối thật không nguyên tử — listener Marionette có thể vắng giữa hai lần trong lúc khởi động/khởi động lại. Retry có điều kiện giữ gate fail-closed nếu Marionette không lên, đồng thời không che lỗi app.
**Kiểm chứng:** 5/5 cặp BiDi → Marionette pass sau sửa; `bash scripts/verify.sh` exit 0.
**Ảnh hưởng:** T-QA-01, T-DOC-01.

## 2026-10-24 — Deploy production từ `main`, giữ nhánh `landing-page`

**Bối cảnh:** M4 đã pass `verify.sh`; người dùng trả lời Q1 “Cho phép push + deploy” và xác nhận “Đồng ý, deploy từ main”, đồng thời chọn giữ nhánh.
**Chọn:** Fast-forward `landing-page` vào `main`, push `main` lên `origin`, để GitHub Pages (source `main`, `/`, legacy) build; giữ nguyên nhánh `landing-page` tại cùng commit; không force push.
**Loại:** Push trực tiếp nhánh feature và đổi Pages source; tạo tag/release; xoá nhánh sau merge.
**Lý do:** `main` là nguồn Pages đã cấu hình; fast-forward giữ lịch sử tuyến tính và không tạo merge commit không cần thiết. Giữ nhánh để đối chiếu/rollback mềm. Rollback chuẩn là `git revert b3f89a1` + push, không force.
**Kiểm chứng:** Push `e4cac8c..b3f89a1`; live 200 với landing mới; 14 endpoint 200; redirect legacy 5 route; Chromium/Firefox/pa11y live pass; LHCI live 3 run exit 0 (Perf 1.0, A11y/BP/SEO 1, LCP 1,379 ms).
**Lưu ý:** Khi test redirect legacy phải tải document mới; `Page.navigate` chỉ đổi hash trong cùng document sẽ không chạy lại `landing.js` — đây là artifact của test, không phải lỗi sản phẩm.
**Ảnh hưởng:** T-DEPLOY-01, README, PROJECT_STATE.

## 2026-10-25 — UI v2 “Phiếu thi & bút đỏ”: đổi trình bày, không đổi dữ liệu/hành vi

**Bối cảnh:** Brief v2 yêu cầu làm rõ ngôn ngữ “phiếu thi & bút đỏ” cho cả landing + app; người dùng đã duyệt mockup và yêu cầu “cải thiện GUI rồi triển luôn”.
**Chọn:** Giữ Newsreader + Space Grotesk, không thêm dependency/build. Áp token giấy `#F4F1EA`, mực `#141A18`, đỏ `#C0392B`, xanh `#1F5C4A`, hổ phách `#8A6414` (landing) / `#6F4F0D` (app), đường kẻ `#D8D2C2`; đỏ chỉ dùng cho CTA/đánh dấu/sửa bài. Landing dựng hero như phiếu thi, bảng đáp án 100 ô làm signature, rail 20 ngày; app đổi shell/route/sheet theo cùng token.
**Loại:** Đổi nhận diện sang hướng khác (dashboard tối, mono); viết lại nội dung/feature; thêm font mới.
**Lý do:** Tăng nhận diện và tính “sổ ôn” nhưng giữ nguyên dữ liệu, id, khóa localStorage và hành vi tính năng — rủi ro thấp, không phá tiến độ người dùng.
**Hệ quả:** CSS landing tăng 23,494 → 31,735 B; ảnh/OG chụp lại; copy “Đáp án tham khảo” thống nhất hai nơi; 7 needsReview vẫn là cờ, không thành nhóm thứ tư.
**Kiểm chứng:** `verify.sh` exit 0; LHCI 3 run Perf 0.99 / A11y/BP/SEO 1, LCP median 1,955 ms, CLS 0; ảnh after-ui-v2 14 ảnh không overflow/console error.
**Ảnh hưởng:** T-UI-01..07, README, PROJECT_STATE, CONTENT_MAP.

## 2026-10-25 — Chip lọc app wrap thay vì cuộn ngang

**Bối cảnh:** Ảnh mobile 390 cho thấy hàng chip cuộn ngang chỉ lộ ~3.5 chip; người dùng khó thấy bộ lọc còn lại và trông như bị cắt mép.
**Chọn:** `.chips` dùng `flex-wrap: wrap` ở mọi width; bỏ overflow-x/scrollbar và media rule ≥640.
**Loại:** Giữ cuộn ngang + fade mép; thu nhỏ chip.
**Lý do:** Tất cả bộ lọc hiện đủ trong 2–3 hàng, target vẫn ≥44px, không thêm JS; rõ ràng hơn trên màn hẹp.
**Hệ quả:** Hàng lọc cao hơn một chút trên mobile; desktop không đổi đáng kể.
**Kiểm chứng:** Ảnh app-library/check 390 trong `.memory/visual_ledger/after-ui-v2/`; Chromium audit không overflow.
**Ảnh hưởng:** T-UI-04, T-UI-06.

## 2026-10-25 — PWA cache `gdct1-v5`, activate chỉ xoá cache `gdct1-`

**Bối cảnh:** UI v2 đổi CSS/JS/markup nên cần bump cache; bản cũ xoá mọi cache ngoài `CACHE`, có thể xoá cache không liên quan trên cùng origin.
**Chọn:** Bump `gdct1-v5`; `activate` chỉ xoá key bắt đầu `gdct1-` và khác `CACHE`.
**Loại:** Giữ v4 (người dùng thấy UI cũ); xoá toàn bộ cache origin.
**Lý do:** Tránh phục vụ asset cũ và không đụng cache của landing/probe khác; migration kiểm bằng profile sạch.
**Kiểm chứng:** Chrome 155 — `gdct1-v4` bị xoá, `gdct1-v5` 34 entry, cache `landing-probe` còn; offline `/app/#/library` render 100 dòng, 0 console error. `check-data` assert `'gdct1-v5'`.
**Ảnh hưởng:** T-UI-05, T-PWA-01, README.

## 2026-10-25 — Deploy UI v2 từ `main` @ `c4ae353`

**Bối cảnh:** Người dùng nói “cải thiện gui lại tí là ngon, triển luôn”; T-UI-06 đã xanh local và live UI v1 đang là `b3f89a1`.
**Chọn:** Commit `c4ae353` (source + tài liệu + bằng chứng), push trực tiếp `main`, để Pages build legacy; không force push, không đụng nhánh `landing-page` (`b3f89a1`).
**Loại:** Tạo nhánh release/tag riêng; push lên nhánh khác rồi merge.
**Lý do:** `main` là nguồn Pages; một commit duy nhất gói cả UI + cache bump giúp rollback sạch. “Triển luôn” là uỷ quyền cho phát hành này, không mở rộng cho thay đổi khác.
**Kiểm chứng:** Push `c7ce653..c4ae353`; live đổi sau ~30 s; 16 endpoint 200; 404 tùy biến; redirect legacy 5 route; app SW `gdct1-v5` active/controller; Chromium 2 lần pass liên tiếp, Firefox + Marionette pass, pa11y 2/2, LHCI live Perf 1.0, LCP median 1,207 ms.
**Ảnh hưởng:** T-UI-07, PROJECT_STATE, TASKS. Rollback: `git revert c4ae353` + push.
