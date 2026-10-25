# CONTENT MAP — Landing page

Ngày 2026-10-25 · Không có placeholder `[[...]]`; nội dung lấy từ README, `app/data/*.js` và landing đã dựng.
Motion v3 (2026-10-25) không đổi copy, số liệu hay URL; chỉ thêm lớp trình bày/chuyển động. Không có placeholder.

Số liệu khớp dữ liệu: 100 câu · 70 ảnh · 6 nhóm · 20 ngày (24.10 → 12.11.2026) · 44 verified · 56 reference · 7 cần kiểm tra (cờ riêng, 2 verified + 5 reference).

## Landing

| # | Section | Nội dung | Nguồn | Trạng thái | Task |
|---|---|---|---|---|---|
| 1 | Header + form strip | Strip “PHIẾU ÔN TẬP · GDCT1” + “100 câu · 6 nhóm / Hạn 12.11.2026”; brand “Sổ Ôn · GDCT1”; nav “Vì sao”, “Cách học”, “Trong sổ”, “Hỏi đáp”; CTA “Mở sổ ôn” → `./app/#/today` | brand app | done-verified | T-UI-02 |
| 2 | Hero | Bảng meta Môn GDCT1 / Hình thức Trắc nghiệm · 100 câu / Hạn ôn 12.11.2026; H1 “20 ngày, / 100 câu hỏi, / một cuốn sổ.” với “sổ” khoanh bút đỏ; lede “Một phiên vừa sức mỗi ngày…”; meta “Không đăng ký · Chạy offline sau lần đầu · Dữ liệu trên máy bạn” | README + brief | done-verified | T-UI-02 |
| 3 | Hero actions + signature | “Mở sổ ôn ngay” → `./app/#/today`; phụ “Xem cách học” → `#cach-hoc`; phiếu “Bảng đáp án” 100 ô (44 xanh, 56 giấy, 7 cờ hổ phách) + rail 20 ngày (12 ngày học mới + 8 ngày ôn), mốc 01 · hôm nay / 20 · 12.11.2026 | dữ liệu lịch thật | done-verified | T-UI-02 |
| 4 | `#vi-sao` | H2 “Đủ câu để ôn. Đủ nhẹ để mở mỗi ngày.”; 4 mục Dữ liệu / Lịch / Nhịp / Riêng tư: 100 câu từ 70 ảnh, 20 ngày tới 12.11.2026, phiên ngắn, không backend | README | done-verified | T-LAND-02 |
| 5 | Dải đáp án | H2 “Biết câu nào đã chắc, câu nào còn phải kiểm.”; 44 đối chiếu giáo trình / 56 đáp án tham khảo / 7 cần kiểm tra; ghi rõ có thể xem, sửa, xác nhận | README + data | done-verified | T-UI-02 |
| 6 | `#cach-hoc` | H2 “Mở sổ. Ôn phiên hôm nay. Chốt lại.”; 3 bước 01 Mở sổ → 02 Ôn phiên hôm nay → 03 Chốt lại | README | done-verified | T-LAND-02 |
| 7 | `#trong-so` | H2 “Ba trang bạn sẽ mở nhiều nhất.”; 3 ảnh thật: Hôm nay / Ôn theo câu / Kiểm đáp án; caption nêu 44-56-7 | app live | done-verified | T-LAND-03 |
| 8 | `#hoi-dap` | H2 “Vài điều nên biết trước khi mở.”; 5 FAQ: tài khoản/mạng, nơi lưu tiến độ, “Đáp án tham khảo”, sửa đáp án, quan hệ với giáo trình; link GitHub | README | done-verified | T-UI-02 |
| 9 | CTA cuối | H2 “Ngày 01 bắt đầu từ một cú bấm.”; “Mở sổ ôn ngay”; meta “24.10 – 12.11.2026 · 100 câu · 6 nhóm” | README | done-verified | T-LAND-03 |
| 10 | Footer | “Một cuốn sổ ôn GDCT1, chạy trên máy bạn.”; cột “Trong trang”“Mở sổ”; fine print “Không backend · Không tài khoản · Dữ liệu lưu trong trình duyệt.” + cập nhật 24.10.2026 + không liên kết đơn vị tổ chức thi | README | done-verified | T-LAND-03 |
| 11 | Meta/OG | Title “Sổ Ôn GDCT1 — 100 câu, 20 ngày tới 12.11.2026”; description; canonical; OG/Twitter; ảnh 1200×630 từ UI mới (131,423 B) | brief | done-verified | T-SEO-01, T-UI-05 |

## Ghi chú nội dung

- 7 câu “Cần kiểm tra” là **cờ** trên 7 câu trong 100, không phải nhóm thứ tư: 2 câu thuộc 44 `verified`, 5 câu thuộc 56 `reference`. Không viết “7 trong 56” và không cộng 44 + 56 + 7.
- Không dùng testimonial, “hiệu quả gấp X lần”, hay số liệu không có trong dữ liệu.
- Không hứa “đáp án chính thức”; nói rõ là tài liệu ôn tập, người học chốt.
- 7 câu “Cần kiểm tra” chỉ **công bố**, không sửa đáp án trong phạm vi landing.
- Mọi thay đổi copy phải chạy `bash scripts/verify.sh`; `scripts/check-data.mjs` đối chiếu các chuỗi số liệu chính.

## App (chỉ đổi UI, không đổi nội dung)

- 100 câu, 6 nhóm; id `gdct1-001…100`; 7 câu `needsReview`; tiến độ `so-on-gdct1.v1` (khóa thật trong `app.js`).
- Không thay nội dung/đáp án, không đổi id, không đổi khóa localStorage.
- App ở `/app/`, `noindex`; route hash `today|study|done|library|check|stats|settings|exam-setup`.
- UI rework: form strip, nhãn “Đáp án tham khảo” (thay “Bản tham khảo”), chip lọc wrap thay vì cắt ngang, sheet có footer dính đáy, tab active đúng cho `study/exam/done`.
