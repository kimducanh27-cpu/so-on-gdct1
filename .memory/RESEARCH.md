# RESEARCH — Landing page & PWA migration

Ngày: 2026-10-24 · Phạm vi: landing mới + chuyển app sang `/app/` · Ngưỡng: brownfield feature ≥ 2 mục → đạt 3.

## Câu hỏi (viết trước khi tra)

- **RQ1:** Khi chuyển một PWA sang subpath, làm sao gỡ service worker ở scope gốc và xoá cache cũ mà không để lại app shell cũ?
- **RQ2:** Manifest `id` có giữ được định danh bản cài khi `start_url` đổi không?
- **RQ3:** Có cần framework/thư viện cho landing tĩnh này không, hay HTML/CSS/JS thuần đủ?

## Bảng bằng chứng

| # | Nguồn | Xác nhận | Ngày/phiên bản | Áp dụng vào |
|---|---|---|---|---|
| 1 | MDN — `ServiceWorkerRegistration.unregister()` https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/unregister | `unregister()` không dừng SW ngay (đợi tác vụ xong); **không tự xoá Cache Storage**; cần tự `caches.delete()`; secure context; widely available từ 04/2018 | Trang sửa 2024-03-06; truy cập 2026-10-24 | Kill-switch SW phải tự xoá cache legacy; client/landing không thể chỉ gọi unregister |
| 2 | MDN — Web app manifest `id` https://developer.mozilla.org/en-US/docs/Web/Manifest/Reference/id | `id` resolve theo origin của `start_url`; được nằm ngoài `scope`; đổi `id` = app khác; giữ `id` = cập nhật bản đã cài; hỗ trợ **limited availability** | Trang sửa 2025-05-05; truy cập 2026-10-24 | Đặt `id: "../"` trong `app/manifest.webmanifest` để về id gốc `/so-on-gdct1/`; test Chrome, không giả định Safari |
| 3 | MDN — Using Service Workers https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers | Browser kiểm tra SW mới khi đăng ký và khi load/refresh; SW mới chờ tới khi client cũ đóng; `skipWaiting()` + `clients.claim()` để thay ngay; `activate` là lúc xoá cache cũ | Trang sửa 2026-09-25; truy cập 2026-10-24 | Kill-switch dùng `skipWaiting`/`claim`; app SW bump cache và dọn cache khác trong `activate` |

## Repo đã đọc

- Repo của dự án: `kimducanh27-cpu/so-on-gdct1` @ `e4cac8c` — `sw.js`, `manifest.webmanifest`, `index.html`, `assets/app.js`, `data/*`.
- Không đọc repo mẫu ngoài: thay đổi nội bộ, không chọn stack/dependency mới; 3 nguồn chuẩn ở trên đủ ngưỡng.

## 3 điều áp dụng

1. **Kill-switch ở scope gốc** + tự xoá cache legacy; không dựa vào `unregister()` để dừng ngay.
2. **Manifest `id: "../"`** để giữ định danh cũ; nếu trình duyệt không hỗ trợ, ghi nhận cài lại thay vì tuyên bố giữ được.
3. **Cache mới `gdct1-v4`** (sau đó bump `gdct1-v5` ở UI v2) + dọn cache khác trong `activate`, vì cache là origin-global và tên cũ `gdct1-v3` đang chứa entry của app ở root.

## 3 điều không áp dụng

1. Không dùng framework/landing builder — RQ3: 1 trang tĩnh, HTML/CSS/JS thuần đủ; tránh dependency runtime.
2. Không dùng push notification/backend — ngoài phạm vi; nhắc học vẫn qua `.ics` + tab mở.
3. Không dùng manifest/theme toggle riêng cho landing — landing không cần cài đặt; app giữ manifest hiện có (đã sửa scope/start_url/id).

## Điều đã bị bác bỏ

- **Giữ tên cache `gdct1-v3` khi chuyển app:** bị bác bỏ. Cache Storage là origin-global; tên cũ đang giữ entry `index.html`, `assets/*` của app root, dễ trộn với app mới. Chọn `gdct1-v4`.
- **Chỉ gọi `navigator.serviceWorker.getRegistrations()` từ landing để gỡ SW:** bị bác bỏ làm cơ chế duy nhất. `unregister()` không dừng ngay và không xoá cache; đồng thời landing ở root có thể thấy registration của `/app/`. Chọn kill-switch SW ở root, landing chỉ lọc registration scope gốc nếu cần.
- **Giả định chuyển file là PWA tự đổi scope:** bị bác bỏ. Phải đăng ký SW mới ở `/app/sw.js`, cập nhật manifest và dọn registration cũ.

## Kết quả kiểm chứng (2026-10-24)

- **Chrome 155.0.8059.86, profile sạch, CDP:** staging SW cũ tại scope `/so-on-gdct1/` → active, cache `gdct1-v3` 34 entry. Thay root `sw.js` bằng kill-switch → version mới cài/activate, registration root bị xoá (`isDeleted: true`), `caches.keys()` rỗng; cache app `gdct1-v4` không bị kill-switch xoá.
- **App SW:** scope `/so-on-gdct1/app/`, cache `gdct1-v4` 34 entry, controller là `app/sw.js`; reload khi server tắt vẫn render app (offline fallback).
- **Manifest:** `id: "../"` resolve thành `/so-on-gdct1/`; `start_url` resolve thành `/so-on-gdct1/app/#/today`.
- **Chưa kiểm chứng:** hành vi “không tạo bản cài trùng” trên Chrome có bản cài cũ (cần cài PWA thật); Safari/Firefox với `id` limited availability.

## Kết quả kiểm chứng UI v2 (2026-10-25)

- **Verify:** `bash scripts/verify.sh` exit 0 sau thay đổi UI — html-validate 0 error; check-data 45/45 (SW `gdct1-v5`); contrast 15/15; secret/file khóa sạch; HTTP 200/404 đúng; linkinator 18 link 0 chết; pa11y 2/2 URL 0 error; Chromium CDP 5 viewport + 8 route + keyboard 24 bước + FAQ + reduced motion + 0 third-party; Firefox BiDi + Marionette pass; WebKit BLOCKED.
- **Cache v4 → v5 (Chrome 155, profile sạch):** trước khi mở app tạo `gdct1-v4` (1 entry) + `landing-probe`; sau activate còn `['landing-probe','gdct1-v5']`; v4 bị xoá, v5 34 entry; offline `/app/#/library` render 100 dòng, 0 console error. Xác nhận logic chỉ xoá cache tiền tố `gdct1-`.
- **Lighthouse 12.1.0 / LHCI 0.14.0, mobile, 3 run local:** Performance 0.99 ×3; A11y/BP/SEO 1; LCP 1,955.99 / 1,953.56 / 1,955.03 ms; TBT 0; CLS 0; total 149,034 B. CSS landing 31,735 B, 4 font 88,372 B, OG 131,423 B, screenshot 24,790–40,928 B.
- **Thị giác:** 14 ảnh `.memory/visual_ledger/after-ui-v2/` (landing 320/390/768/1280, 404-390, 7 route app 390 + today 1280) — không overflow, console 0 error; chip lọc wrap đủ trên mobile; 404 footer không bị cắt ở 900px.
- **Không đổi:** id câu, nội dung đáp án, khóa `so-on-gdct1.v1`, route app, tính năng. Chỉ CSS/markup/copy trình bày và cache SW.

## Kết quả kiểm chứng live UI v2 (2026-10-25, `c4ae353`)

- **Deploy:** push `c7ce653..c4ae353`; live đổi sau ~30 s. 16 endpoint 200 đúng content-type; landing 25,989 B có form strip + bảng 100 ô; OG 131,423 B 1200×630; 404 tùy biến trả 404 cho path lạ; robots + sitemap đúng.
- **PWA:** `app/sw.js` `gdct1-v5`, scope `/app/`, active + controller, `caches.keys()` chỉ `['gdct1-v5']` trong profile sạch; root kill-switch; manifest `id: "../"`.
- **Redirect:** 5 hash legacy tải document mới → `/app/#/...` render (25,221 / 1,315 / 13,404 / 559 / 1,398 ký tự); root không hash giữ landing.
- **Browser:** Chromium live audit pass 2 lần liên tiếp; Firefox BiDi 5 viewport + 8 route pass; Marionette keyboard 22 bước pass; pa11y live 2/2 URL 0 error. Lần audit đầu có 1 flake không truy được check (không lặp lại).
- **LHCI live 3 run:** Perf 1.0 cả 3; A11y/BP/SEO 1; LCP 1,205.78 / 1,454.54 / 1,207.13 ms (median 1,207.13); TBT 0; CLS 0; TTFB median 31.96 ms; total bytes median 102,518.
