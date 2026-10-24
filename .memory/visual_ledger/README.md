# Visual ledger — landing Sổ Ôn GDCT1

Ảnh sản phẩm thật, không mock. Chụp 2026-10-24 bằng Chrome 155 headless (CDP), viewport 390×844 và 1280×800, DPR 1, `prefers-reduced-motion: reduce`, timezone `Asia/Ho_Chi_Minh`, đồng hồ cố định 07:00 ngày 24.10.2026 để không hiện cảnh báo nhắc học.

## Ảnh dùng trên landing

Canonical nằm ở `assets/landing/`; bản sao trong `screens/` là chứng cứ tại thời điểm chụp.

| Tệp | Kích thước | Dung lượng | Nội dung / alt dự kiến |
|---|---|---|---|
| `today-390.webp` | 390×844 | 21.2 KB | “Màn hình Hôm nay: Ngày 01/20, chuỗi 0 ngày, 0/100 câu, nút Bắt đầu phiên 1.” |
| `library-390.webp` | 390×844 | 25.6 KB | “Danh sách 100 câu hỏi, mỗi câu có nhãn Bản tham khảo; bộ lọc Tất cả, Chưa học, Đến hạn, Câu sai.” |
| `check-390.webp` | 390×844 | 26.0 KB | “Trang Kiểm đáp án: 44 câu đã đối chiếu giáo trình, 56 câu tham khảo, bộ lọc Kiểm tra 7.” |
| `today-1280.webp` | 1280×800 | 27.3 KB | “Bản desktop màn hình Hôm nay với phiên học chính và các lối tắt.” |

Ngân sách: hero ≤200 KB, ảnh khác ≤150 KB — tất cả đạt. Khi chèn HTML dùng đúng `width`/`height` ở bảng trên, ảnh dưới màn hình đầu `loading="lazy"`, ảnh hero `fetchpriority="high"`.

## OG cover

- `assets/og-cover.png` — 1200×630, 125.0 KB (ngân sách 300 KB), RGB.
- Bố cục: nền giấy, tiêu đề Newsreader “20 ngày, 100 câu hỏi, một cuốn sổ.”, ảnh thật `today-390`, rail 20 ngày full-width (12 ngày học mới + 8 ngày ôn, chấm “hôm nay” ở vạch 01), ngày thi 12.11.2026.
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

## QA 5 viewport (T-QA-01, 2026-10-24)

`qa/` là ảnh chụp từ `scripts/verify.sh` (Chromium CDP + Firefox BiDi), viewport 320×800, 360×800, 390×844, 768×1024, 1280×900.

| Tệp | Nội dung |
|---|---|
| `qa/landing-{320,360,390,768,1280}.png` | Landing đủ 5 viewport, không overflow |
| `qa/404-{320,390,1280}.png` | 404 tùy biến |
| `qa/app-390.png` | App ở `/app/#/today` |
| `qa/ff-landing-1280.png` | Đối chiếu Firefox |

## Ghi chú

- Ảnh chụp trạng thái khởi đầu (0/100) — không tạo cảm giác đã có tiến độ sẵn.
- Không dùng gradient, glass, mock thiết bị giả; khung điện thoại trong OG chỉ là viền giấy mảnh.
- Ảnh PNG trung gian đã xoá sau khi chuyển WebP.
- Tương phản chữ đã đo ở T-A11Y-01 (15 cặp pass); palette hiện dùng: giấy `#F4F1EA`, mực `#141A18`, rust `#D24A2E`, xanh `#1F5C4A`, hổ phách `#8A6414`, đường kẻ `#DAD2C1`, phụ `#555C55`.
- Font Newsreader được instance tĩnh wght=400 (giữ `opsz` 6–72) sau T-PERF-01; xem README mục “Font landing” để tái tạo. Hình ảnh không đổi.
