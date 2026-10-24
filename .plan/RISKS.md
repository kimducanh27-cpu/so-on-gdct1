# RISKS — Sổ Ôn GDCT1 · Landing page

Cập nhật 2026-10-24. Mỗi dòng có **dấu hiệu sớm quan sát được**; rủi ro không có dấu hiệu sớm là rủi ro chưa hiểu.

## Rủi ro

| # | Rủi ro | Xác suất | Tác động | Dấu hiệu sớm (quan sát được) | Hành động | Task bị ảnh hưởng |
|---|---|---|---|---|---|---|
| R1 | SW gốc `gdct1-v3` phục vụ cache cũ, che landing | Cao | M1/M2 trượt | `/` vẫn trả app shell dù file `index.html` mới; `caches.keys()` còn `gdct1-v3`; `registration.scope` vẫn là `/so-on-gdct1/` | Kill-switch SW ở root (`skipWaiting`, xoá cache legacy, unregister); app SW dùng `gdct1-v4`; test với SW cũ đã cài trước khi deploy | T-PWA-01, T-REDIR-01, T-DEPLOY-01 |
| R2 | Đổi URL làm mất định danh PWA / tạo bản cài trùng | Trung bình | Người dùng phải cài lại, mất shortcut | Chrome Application hiện 2 app; `id` trong manifest khác `/so-on-gdct1/` | Manifest `id: "../"` để giữ id cũ; test Chrome; nếu `id` không được hỗ trợ → ghi `blocked` + hướng dẫn cài lại, không tuyên bố pass | T-PWA-01 |
| R3 | Base path GitHub Pages làm 404 asset/redirect sai | Cao | Landing hoặc app trắng | Asset 404 khi phục vụ dưới `/so-on-gdct1/`; redirect tới `/app/` thay vì `/so-on-gdct1/app/` | URL tương đối; JS tính base từ `location`; test bằng server ở thư mục cha | T-BASE-01, T-REDIR-01, T-SEO-01, T-QA-01 |
| R4 | Số liệu landing lệch dữ liệu thật | Trung bình | Mất tin cậy, nội dung sai | Số trong HTML khác script đếm từ `data/answers.js` (100/44/56/7) | Script đối chiếu trong `verify.sh`; lấy số từ data, không gõ tay nhiều nơi | T-LAND-02, T-QA-01 |
| R5 | Ảnh chụp/OG nặng làm LCP vượt budget | Trung bình | M3 trượt | Hero > 200KB; LCP > 2.5s trên Lighthouse mobile | WebP/AVIF, kích thước hiển thị thật, `width`/`height`, ưu tiên tải ảnh hero; có fallback CSS | T-ASSET-01, T-PERF-01 |
| R6 | Deep link cũ `/#/...` hỏng hoặc loop | Trung bình | Người dùng cũ mất view đang học | `/#/check` mở landing hoặc app today; console lỗi redirect | Redirect base-aware, chỉ khi hash `#/...`; test 5 hash; không redirect hash rỗng | T-REDIR-01 |
| R7 | Thiếu engine thứ hai để kiểm cross-browser | Trung bình | Không chứng minh được DoD 0.6 | Không có Firefox/WebKit hoặc thiết bị iOS | Chromium + Firefox; WebKit/iOS nếu có thiết bị; thiếu thì ghi `blocked`, không pass khống | T-QA-01 |
| R8 | Font landing vượt budget do dùng lại 3 family của app | Thấp | Tăng tải, M3 trượt | > 4 file woff2 hoặc > 180KB trong landing | Chỉ dùng 2 family, 4 file, subset latin+vietnamese | T-LAND-01, T-PERF-01 |

## Giả định & hạn xác minh

| # | Giả định | Cách xác minh | Hạn xác minh |
|---|---|---|---|
| A1 | Giữ site tĩnh, không thêm dependency runtime | Không có `package.json`/bundle runtime; `git diff` không thêm thư viện | M4 |
| A2 | localStorage giữ nguyên khi đổi URL | Đặt tiến độ ở `/app/`, reload, mở lại | M1 |
| A3 | Manifest `id: "../"` giữ được định danh cũ | Chrome Application panel; so id trước/sau | M1 |
| A4 | 44 verified / 56 reference / 7 cần kiểm tra | Script đếm `level` + `needsReview` từ `data/answers.js` | M2 |
| A5 | URL tương đối chạy đúng dưới `/so-on-gdct1/` | Serve từ thư mục cha; curl asset + app | M1 |
| A6 | Token/font app đủ dùng cho landing | Review thị giác + budget font ở M3 | M3 |
| A7 | Landing indexable, app `noindex` | `curl` meta; sitemap chỉ `/` | M3 |
| A8 | Được phép deploy sau M4 | Trả lời Q1 | Trước M5 |
| A9 | README + app live phản ánh đúng dữ liệu hiện tại | Đối chiếu commit `e4cac8c`, data counts, live 200 | Đã xác minh P0 (2026-10-24) |
| A10 | Không có third-party/analytics | DevTools Network khi tải landing: 0 request khác origin | M3 |
