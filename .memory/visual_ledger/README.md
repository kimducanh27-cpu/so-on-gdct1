# Visual ledger — landing Sổ Ôn GDCT1

Ảnh sản phẩm thật, không mock. Chụp 2026-10-25 bằng Chrome 155 headless (CDP), viewport 390×844 và 1280×800, DPR 1, `prefers-reduced-motion: reduce`, timezone `Asia/Ho_Chi_Minh`, đồng hồ cố định 07:00 ngày 24.10.2026 để không hiện cảnh báo nhắc học.

## Ảnh dùng trên landing

Canonical nằm ở `assets/landing/`; bản sao trong `screens/` là chứng cứ tại thời điểm chụp.

| Tệp | Kích thước | Dung lượng | Nội dung / alt dự kiến |
|---|---|---|---|
| `today-390.webp` | 390×844 | 24.2 KB | “Màn hình Hôm nay: Ngày 01/20, chuỗi 0 ngày, 0/100 câu, phiên học chính 9 câu và các lối tắt.” |
| `library-390.webp` | 390×844 | 35.8 KB | “Danh sách 100 câu hỏi, mỗi câu có nhãn Đáp án tham khảo; bộ lọc Tất cả, Chưa học, Đến hạn, Câu sai.” |
| `check-390.webp` | 390×844 | 33.8 KB | “Trang Kiểm đáp án: 44 câu đã đối chiếu giáo trình, 56 câu tham khảo, bộ lọc Kiểm tra 7.” |
| `today-1280.webp` | 1280×800 | 40.0 KB | “Bản desktop màn hình Hôm nay với phiên học chính và các lối tắt.” |

Ngân sách: hero ≤200 KB, ảnh khác ≤150 KB — tất cả đạt. Khi chèn HTML dùng đúng `width`/`height` ở bảng trên, ảnh dưới màn hình đầu `loading="lazy"`, ảnh hero `fetchpriority="high"`.

## OG cover

- `assets/og-cover.png` — 1200×630, 128.3 KB (ngân sách 300 KB), RGB; render lại 2026-10-25 từ UI phiếu thi & bút đỏ.
- Bố cục: nền giấy, tiêu đề Newsreader “20 ngày, 100 câu hỏi, một cuốn sổ.”, ảnh thật `today-390`, rail 20 ngày full-width (12 ngày học mới + 8 ngày ôn, chấm “hôm nay” ở vạch 01), ngày thi 12.11.2026. Phụ đề dùng đúng thông điệp hero: “Một phiên vừa sức mỗi ngày: câu mới, câu đến hạn và chỗ chốt đáp án. Không tài khoản, không backend.”
- Đọc ở 50%: `og-cover-50.png` (600×315) — tiêu đề, mô tả, brand và ngày thi vẫn đọc được; nhãn rail chỉ mang tính trang trí.
- Nguồn: `og-source.html` (giữ trong ledger, không publish). Render lại:
  `chrome --headless=new --window-size=1200,630 --force-device-scale-factor=1 --screenshot=assets/og-cover.png <url tới og-source.html>`
- Copy OG dùng đúng thông điệp hero để landing và ảnh chia sẻ không lệch nhau.

## Focus / keyboard

| Tệp | Nội dung |
|---|---|
| `focus-skip-1280.png` | Skip link hiện sau Tab đầu, viền focus 2px rust |
| `focus-cta-1280.png` | CTA chính có focus ring, không bị header che |
| `focus-cta-390.png` | CTA trên mobile 390, focus ring đủ tương phản |

Chụp bằng Chrome 155 headless + CDP, `Emulation.setFocusEmulationEnabled`, chờ scroll mượt xong. Firefox Marionette có bộ kiểm riêng (`scripts/firefox-keyboard.mjs`) vì Firefox headless BiDi không cấp `document.hasFocus()`.

## QA 5 viewport (T-UI-06, 2026-10-25)

`qa/` là ảnh chụp từ `scripts/verify.sh` (Chromium CDP + Firefox BiDi), viewport 320×800, 360×800, 390×844, 768×1024, 1280×900.

| Tệp | Nội dung |
|---|---|
| `qa/landing-{320,360,390,768,1280}.png` | Landing đủ 5 viewport, không overflow |
| `qa/404-{320,360,390,768,1280}.png` | 404 tùy biến, footer neo cuối khung nhìn |
| `qa/app-390.png` | App ở route cuối của audit (`#/exam-setup`) |
| `qa/ff-landing-1280.png`, `qa/ff-app-390.png`, `qa/ff-404-1280.png` | Đối chiếu Firefox |

## Before / after (T-UI-06)

- `before-ui-v2/` — UI trước restyle (landing 4 viewport, app 8 route + sheet, 404).
- `after-ui-v2/` — UI sau restyle, cùng bộ ảnh: landing 320/390/768/1280, app today 390/1280, study, library, check, stats, settings, exam-setup, sheet tra đáp án, 404 390. Chụp 2026-10-25 bằng Chrome 155 headless CDP, DPR 1, đồng hồ cố định 24.10.2026, reduced motion; console 0 error, không overflow.

## Motion v3 (2026-10-25)

- `after-motion/` — hero frame 150/450/1050ms + landing 320/390/768/1280 + 404 + app + CTA sau cuộn; README riêng ghi rõ ảnh tĩnh không chứng minh motion, log `motion-audit` 46/46 mới là evidence động.
- `qa/` được làm mới từ lần `verify.sh` cuối (Chromium + Firefox), gồm 5 viewport landing/404 + app.
- LHCI local 3 run: Perf 0.98, A11y/BP/SEO 1, LCP median 2,375ms, TBT 20ms, CLS 0.
- Hero dùng CSS keyframes; GSAP/ScrollTrigger nạp sau `load`; SW `gdct1-v8`.

## Hard review UI (2026-10-25)

- `after-hard-review/` — ảnh landing + 8 route app ở 320/390/1280, study/feedback/sheet sau các fix CTA fixed, feedback scroll, tap-target 44px, topbar 320.
- Đo: 0 overflow, 0 visible target <44 (chỉ input file ẩn), console 0 error; motion-audit 46/46. README riêng trong thư mục ghi before/after.

## Ghi chú

- Ảnh chụp trạng thái khởi đầu (0/100) — không tạo cảm giác đã có tiến độ sẵn.
- Không dùng gradient, glass, mock thiết bị giả; khung điện thoại trong OG chỉ là viền giấy mảnh.
- Ảnh PNG trung gian đã xoá sau khi chuyển WebP.
- Tương phản chữ đã đo lại ở T-UI-06; palette hiện dùng: giấy `#F4F1EA`, mực `#141A18`, rust `#C0392B`, rust đậm `#8E2A16`, xanh `#1F5C4A`, hổ phách `#6F4F0D`, đường kẻ `#D8D2C2`, phụ `#555C55`.
- 404: nội dung dùng chung landing.css, footer neo cuối khung nhìn (body flex 100svh) từ T-UI-05.
- Font Newsreader được instance tĩnh wght=400 (giữ `opsz` 6–72) sau T-PERF-01; xem README mục “Font landing” để tái tạo. Hình ảnh không đổi.
