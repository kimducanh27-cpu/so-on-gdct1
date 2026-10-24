# UI_REVIEW — design_revision 02 · “Phiếu thi & bút đỏ”

Ngày: 2026-10-25 · Phạm vi: landing `/` + 8 hash view của app `/app/` · Chế độ: `ui_rework` · Target: `release_candidate`.

Tham chiếu: mockup `ui-direction-v2.html` (visual reference, không phải code sản phẩm); brief người dùng chọn hướng **“Phiếu thi & bút đỏ”**, sau đó duyệt mockup và yêu cầu “cải thiện gui lại tí”.

## 1. Keep / change

**Giữ**
- Nội dung, số liệu 100/70/20/6, 44 verified / 56 reference / 7 `needsReview`; 7 cờ là lớp phủ **nằm trong** 44 + 56, không phải nhóm thứ tư.
- URL: landing `/`, app `/app/`, redirect `/#/...` → `/app/#/...`.
- Hành vi app, route, `so-on-gdct1.v1`, id `gdct1-001…100`, đáp án.
- Font: landing 2 family / 4 woff2; app giữ bộ font hiện có.
- Không backend, không analytics, không third-party, không build step.
- CTA chính `Mở sổ ôn ngay` → `./app/#/today`; skip link; `#hoi-dap`; `.hero`.

**Đổi**
- Ngôn ngữ thị giác từ “tạp chí giấy” sang **phiếu ôn / bài chấm**: đường kẻ biểu mẫu, mã phiếu, ô đáp án, dấu bút đỏ.
- Đỏ trở thành mực sửa bài (CTA, focus, cờ, câu sai, gạch chân điều hướng), không còn là màu trang trí lớn.
- Hero landing: bỏ ảnh điện thoại, thay bằng **bảng 100 ô đáp án thật** (10×10) + rail 20 ngày; ảnh app thật vẫn nằm ở mục “Trong sổ”.
- App: panel vuông, header dạng phiếu, nhãn ≥11px, số tabular; nhịp chữ và mật độ rõ hơn.
- Ảnh app + OG + 404 + cache SW phải theo UI mới.

## 2. F-UI — phát hiện từ audit (before 2026-10-25, `bash scripts/verify.sh` xanh)

| ID | Vấn đề | Mức | Hướng xử lý |
|---|---|---|---|
| F-UI-01 | Hero landing dùng screenshot + serif editorial; có thể là bất kỳ “study journal” nào, thiếu dấu hiệu riêng của một phiếu ôn 100 câu. | cao | Bảng 100 ô đáp án + form strip + rail ngày. |
| F-UI-02 | Rust đang dùng cho H1 và nhấn trang trí; CTA lại màu mực, nên “bút đỏ” không mang nghĩa thao tác. | cao | Đỏ = hành động/sửa bài; mực = cấu trúc. Giữ đỏ ≤10% bề mặt. |
| F-UI-03 | App card bo tròn + pill + bóng mờ đọc như SaaS template, lệch chất “sổ giấy”. | cao | Panel vuông 2px, hairline, form strip, header có nhãn. |
| F-UI-04 | Nhãn 9.5–10.5px ở badge, rail, tabbar; khó đọc trên 390px. | trung | Nhãn ≥11px (badge 10.5px có tracking), body 14.5–16px, số tabular. |
| F-UI-05 | 44/56/7 là bảng số; quan hệ “7 nằm trong 44+56” dễ bị đọc thành ba nhóm cộng lại. | cao | Hiển thị trên 100 ô + chú thích “7 cờ nằm trong 44 + 56 — không phải nhóm thứ tư”. |
| F-UI-06 | 8 route app không có header chung; mỗi trang dùng inline style, thiếu nhịp. | trung | Chuẩn hoá `.eyebrow` + `.display` + strip đầu trang. |
| F-UI-07 | Đúng/sai trong Study dựa nhiều vào màu xanh/đỏ; tag chữ nhỏ. | trung | Thêm dấu ✓/✕, nhãn chữ, viền đậm; vẫn đạt tương phản. |
| F-UI-08 | Library dày: câu, nhóm, badge, trạng thái cùng cỡ nhỏ, thiếu phân cấp. | trung | Số thứ tự kiểu chỉ mục, câu lớn hơn, badge tách hàng. |
| F-UI-09 | Ảnh app/OG sẽ lệch sau restyle. | cao | Chụp lại 4 ảnh + OG từ UI mới. |
| F-UI-10 | SW `gdct1-v4` sẽ phục vụ CSS cũ sau deploy. | cao | Bump `gdct1-v5`, test offline + migration. |

**Đã xử lý (2026-10-25):** F-UI-01/02/05 → hero phiếu thi + bảng 100 ô + chú thích “7 cờ nằm trong 44 + 56”; F-UI-03/06 → panel vuông, form strip, header chung 8 route; F-UI-04 → nhãn ≥11px, số tabular; F-UI-07 → dấu ✓/✕ + nhãn chữ; F-UI-08 → thứ tự chỉ mục, câu lớn hơn, badge tách hàng; F-UI-09 → 4 ảnh + OG chụp lại; F-UI-10 → `gdct1-v5` + migration/offline pass. Tất cả xác nhận bằng `verify.sh` exit 0 và bộ ảnh after.

## 3. Refinement so với mockup (theo “cải thiện gui lại tí”)

1. **Bảng đáp án 10×10** thay vì 5×20: vừa trên màn hình đầu, vẫn đủ 100 ô, có vạch chia 50.
2. **Không xoay chữ** cho stamp/nhãn; dùng khung 1.5px + letter-spacing để giữ dễ đọc.
3. **Không thêm animation trang trí** trên landing; chỉ transition hover/focus và thanh tiến độ. Tôn trọng reduced-motion ngay khi bật.
4. **Không dùng mono trên landing** (giữ budget 4 font); mã phiếu dùng Space Grotesk tabular.
5. **Đỏ có nghĩa**: CTA, focus ring, gạch chân active, cờ, câu sai, khoanh “sổ”. Xanh giữ nghĩa “đã đạt/đã đối chiếu”, hổ phách giữ “cần kiểm tra” trong app.
6. **Khoanh “sổ”** bằng nét ellipse 2 lớp mảnh, không dùng SVG/ảnh để nhẹ và không lệch khi zoom.
7. **Rail Hôm nay** sửa lại đúng cấu trúc DOM: rail nằm ngoài hàng nút, không bị đẩy vào grid; 20 vạch đọc được ở 390 và 1280.
8. **Chip lọc** wrap mọi width thay vì cuộn ngang — mobile thấy đủ bộ lọc, không còn cảm giác bị cắt mép.
9. **Sheet đáp án** có footer sticky (nút “Câu tiếp” luôn trong tầm tay) và padding đáy chừa chỗ.
10. **404** dùng `error-page` flex 100svh, footer không bị cắt ở viewport 900px; CTA về `/` và `/app/`.
11. **Copy thống nhất** “Đáp án tham khảo” ở landing ledger, FAQ, alt ảnh thư viện và app; nhãn “Bản tham khảo” cũ bỏ.
12. **Tab active** map `study/done/exam/exam-setup` về tab `today`, không còn trạng thái không tab nào sáng.

## 4. Motion contract

- Mức chọn: **subtle**.
- M-01 Active state: tab/nav đổi màu + gạch chân 2px, 160ms ease; không dịch layout.
- M-02 Hover: viền panel/card đổi màu, 160ms; không scale.
- M-03 Progress: width thanh tiến độ 600ms; ở reduced-motion còn 0.01ms.
- M-04 Question enter: opacity/translate 6px, 250ms (đã có trong app); tắt hoàn toàn khi `prefers-reduced-motion: reduce`.
- Không có animation tự chạy trên landing → audit `getAnimations()` khi reduce phải rỗng.

## 5. Bằng chứng before/after

- Before: `.memory/visual_ledger/before-ui-v2/` — landing 320/390/768/1280, today 390/1280, library/check/stats/settings/exam-setup/study/review sheet 390; chụp 2026-10-25, Chrome headless CDP, DPR 1, console 0 error.
- After: `.memory/visual_ledger/after-ui-v2/` cùng bộ viewport/flow + ảnh dùng trên landing — 14 ảnh (landing 320/390/768/1280, 404-390, today 390/1280, study/library/check/stats/settings/exam-setup/review-sheet 390); console 0 error, không overflow.
- Ảnh canonical dùng trên landing: `.memory/visual_ledger/screens/` + `assets/landing/*.webp` (24,790–40,928 B), OG `.memory/visual_ledger/og-cover-50.png`.
- Ảnh QA đầy đủ 5 viewport: `.memory/visual_ledger/qa/` (landing + 404 320/360/390/768/1280, app + Firefox).
- Baseline gate trước thay đổi: `bash scripts/verify.sh` → `VERIFY PASS` (2026-10-25). Sau thay đổi: `verify.sh` exit 0; LHCI 3 run Perf 0.99 / A11y/BP/SEO 1; LCP median 1,955 ms.

## 6. Trạng thái design review

`verified` — F-UI-01..10 đã xử lý và kiểm bằng gate local; người dùng duyệt mockup (“muốn”) và yêu cầu tinh chỉnh + triển khai (“cải thiện gui lại tí là ngon, triển luôn”). Đã deploy `main` @ `c4ae353`; live smoke pass (Chromium 2 lần, Firefox BiDi/Marionette, pa11y 2/2, LHCI Perf 1.0, LCP median 1,207 ms).
