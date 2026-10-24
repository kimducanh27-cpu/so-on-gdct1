# Sổ Ôn GDCT1

Ứng dụng tĩnh để ôn trắc nghiệm GDCT1 từ 70 ảnh đề đã tải lên, lên lịch tới **12.11.2026**, có chuỗi ngày học, nhắc học, thi thử và tra – gán đáp án bán tự động. Không backend, không tài khoản, dữ liệu nằm trong `localStorage` của trình duyệt.

## Chạy thử

```bash
cd app
python3 -m http.server 8123
# mở http://localhost:8123
```

Mở trực tiếp `index.html` bằng `file://` vẫn xem được, nhưng service worker/PWA và clipboard chỉ hoạt động trên `http(s)`. Khi deploy lên GitHub Pages, Cloudflare Pages hoặc Netlify, không cần build.

## Cấu trúc

```
app/
  index.html
  manifest.webmanifest
  sw.js
  assets/app.css, app.js, fonts/
  data/questions.js     # 100 câu
  data/answers.js       # đáp án + giải thích + mức tin cậy
  icons/
build_answers.py        # sinh answers.js từ bảng đáp án đã soạn
merge_questions.py      # gộp 4 phần transcribe, chuẩn hoá, khử trùng
```

## Dữ liệu câu hỏi

- 70 ảnh Google Forms → 120 lượt câu (form đảo thứ tự phương án nên có câu lặp).
- Sau khi chuẩn hoá và khử trùng theo nội dung: **100 câu**, id ổn định `gdct1-001` … `gdct1-100`.
- Ảnh gốc được giữ nguyên trong thư mục ngoài bản deploy; mỗi câu lưu `sourceImage`.
- Chia 6 nhóm: Triết học Mác – Lênin, Kinh tế chính trị Mác – Lênin, Chủ nghĩa xã hội khoa học, Tư tưởng Hồ Chí Minh, Đạo đức – Phong cách Hồ Chí Minh, Công dân & Người lao động.

## Đáp án: chính sách và mức tin cậy

Trong ảnh đề **không có bảng đáp án**; phương án được khoanh/chọn trong ảnh không được dùng làm đáp án. `answers.js` gồm 100 đáp án do người dựng soạn và đối chiếu:

- `level: "verified"` — **44 câu**: câu chữ hoặc ý khớp với *Giáo trình Giáo dục chính trị* (Bộ LĐTBXH, 2024, bản PDF của ydmekong.edu.vn). Nguồn hiển thị kèm số bài/mục; bấm “Nguồn tham khảo” để mở giáo trình.
- `level: "reference"` — **56 câu**: đáp án tham khảo theo chuẩn kiến thức; chưa có nguồn trực tuyến đối chiếu từng câu.
- `needsReview: true` — **7 câu** (021, 027, 047, 064, 086, 097, 098): đề gốc mơ hồ hoặc phương án trùng lặp; app hiện badge “Cần kiểm tra” và bạn nên tra lại trước khi tin.

Trong app, mỗi câu luôn có nút **Tra / gán đáp án**: mở Google theo đúng nội dung câu hỏi, tìm trên Studocu/Scribd/Quizlet, chọn phương án đúng, ghi chú nguồn rồi lưu. Đáp án bạn lưu có mức `Bạn xác nhận`, được ưu tiên hơn đáp án có sẵn và dùng để chấm điểm. Có thể xoá xác nhận để quay về đáp án gốc.

Nhập hàng loạt: CSV/JSON tại tab **Đáp án** → `Nhập CSV / JSON`. Định dạng CSV:

```csv
id,correctIndex,explanation
gdct1-001,B,"Giải trình ngắn"
gdct1-002,0,""
```

`correctIndex` nhận 0–3 hoặc A–D. JSON có thể là `{"gdct1-001":{"correctIndex":1,"explanation":"..."}}` hoặc mảng `[{id, correctIndex, explanation}]`.

## Lịch ôn, chuỗi, nhắc học

- Bắt đầu 24.10.2026, hạn 12.11.2026: **20 ngày**, 2 ngày cuối chỉ ôn câu sai/đánh dấu.
- 100 câu mới được dồn vào ~12 ngày đầu (~9 câu/ngày); các ngày sau dành cho ôn ngắt quãng (SRS kiểu SM-2: 1 → 3 → 3×ease ngày).
- Mỗi ngày tối đa 25 câu/phiên, chia phiên theo cài đặt (mặc định 12 câu/phiên).
- Chuỗi chỉ tăng khi số câu trả lời trong ngày đạt mục tiêu; chuỗi được tính lại theo ngày Việt Nam (UTC+7).
- Nhắc trong app hoạt động khi tab đang mở. Nút **Tải .ics** xuất 40 sự kiện (2 nhắc/ngày, kèm `VALARM` 10 phút trước) để thêm vào Google Calendar/Apple Calendar; đây là cách nhắc hoạt động cả khi app đóng.
- Không có push server. Thông báo trình duyệt chỉ bật được khi trang đang mở.

## Dữ liệu cục bộ

- Khóa `localStorage`: `gdct1.state.v1` (tiến độ, lịch, chuỗi, cài đặt, đáp án tự nhập).
- **Cài đặt → Sao lưu tiến độ** xuất JSON; nhập lại bằng nút chọn tệp trong cùng mục.
- **Xoá tiến độ** chỉ xoá tiến độ/chuỗi, giữ đáp án đã nhập.
- PWA có nút cài đặt trong app (nếu trình duyệt hỗ trợ); service worker cache `gdct1-v3` gồm shell, dữ liệu và font.

## Ghi chú triển khai

- GitHub Pages: đặt toàn bộ nội dung `app/` ở nhánh `gh-pages` (hoặc thư mục `/docs`), bật Pages. Service worker phải được phục vụ từ HTTPS hoặc localhost.
- Cloudflare Pages/Netlify: build command để trống, output directory là `app`.
- Không đổi tên id câu (`gdct1-001`…) kẻo mất liên kết đáp án và tiến độ đã lưu.
- Nếu cập nhật nội dung tĩnh, đổi `CACHE` trong `sw.js` để buộc làm mới cache.

## Giới hạn

- Đáp án là tài liệu ôn tập, không phải đáp án chính thức của trường/đề thi.
- 7 câu đánh dấu “Cần kiểm tra” nên được đối chiếu lại.
- Câu 066 có hai phương án trùng câu chữ do bản ghi từ ảnh; đáp án đúng không bị ảnh hưởng.
- Ứng dụng không gửi dữ liệu đi đâu; mọi thứ lưu trên máy người dùng.
