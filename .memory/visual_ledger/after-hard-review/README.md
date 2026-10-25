# After hard review — 2026-10-25

Ảnh chụp trực tiếp trên bản local sau các fix UI/UX (Chrome headless, DPR 1, viewport 320/390/1280). Không chỉnh sửa ảnh.

## Lỗi đã sửa

| ID | Trước | Sau |
|---|---|---|
| F-UI-14 | Route entrance đặt transform lên `.view` → `.study-cta` fixed bị chui dưới tabbar ở 320/390 | View chỉ fade; `.study-cta` nằm trên tabbar, cách 12px (`transform:none`, CTA bottom 766, tabbar 778 ở 390) |
| F-UI-15 | Feedback `scrollIntoView({block:'center'})` cuộn mất option vừa chọn; smooth scroll cả khi reduce | Một scroll target căn `.opt.is-selected` dưới sticky top; feedback ở dưới; reduce dùng `auto` |
| F-UI-16 | Nhiều control 21–40px | Tool/icon/streak/chip/btn-sm/link-btn/select/time/search ≥44; switch hit 44×44, track 44×25 |
| F-UI-17 | 320px brand “Sổ Ôn” wrap + nav “Sổ” 41px | Brand nowrap, ≤360 ẩn dot/code; nav min-width 44; 0 overflow |
| F-UI-18 | Nét bút quanh “sổ” là hai ellipse cắt qua chữ/dấu, đỏ trên đỏ | Một path có gap; SVG `width/height:calc()` tường minh; chữ “sổ” mực + nét đỏ; tách dòng 3 `.30em` |
| F-UI-19 | Icon tab “Đáp án” check + hai gạch rời | Ô vuông + check (checkbox), active đỏ; crop 4× |
| — | FAQ “22px” | Chỉ là phantom box `::details-content`; item đóng = summary + 1px; giữ accordion |

## Ảnh chính

| Tệp | Nội dung |
|---|---|
| `app-320-study.png` | 320: topbar gọn, CTA “Câu tiếp” trên tabbar |
| `app-320-feedback.png` | 320: option đã chọn (A) vẫn hiện, feedback ngay dưới |
| `app-320-library/check/settings/stats/sheet.png` | 320: chip 44px wrap, form 44px, sheet full-screen |
| `app-390-feedback.png` | 390: option đã chọn + feedback, không bị sticky che |
| `app-390-settings.png` | Switch track 44×25, hit area 44×44; select 44 |
| `app-390-sheet.png` | Sheet mở, close 44, footer sticky |
| `app-1280-*.png` | Desktop today/stats/library; nav “Sổ” 44px |
| `landing-320/390/768/1280-top.png`, `landing-390-faq.png` | Landing không hồi quy; FAQ đóng đúng |
| `404-390.png`, `404-1280.png` | 404 + nét gạch gradient trong hộp |
| `pen-1280/390/320.png` | Cận cảnh nét bút quanh “sổ” sau fix: một path, bao ngoài dấu mũ, không cắt glyph |
| `tab-active-390.png`, `tab-inactive-390.png` | Icon tab “Đáp án” mới (checkbox), active/inactive |
| `full-1280/390/320.png` | Hero đầy đủ sau fix để thấy khoảng tách dòng 3 + vòng bút trong ngữ cảnh |
| `before-pen-detail.png`, `before-tab-detail.png` | Ảnh crop **do người dùng cung cấp** từ UI cũ (before); không tái dựng, dùng để đối chiếu chi tiết |
| `before-landing-1280.png`, `before-landing-390.png` | Controlled before UI v2 từ `before-ui-v2/` cùng viewport; so với `full-1280/390.png` (after) |

## Đo

- UI review 320/390/1280: **0 overflow**, **0 visible target <44** (chỉ còn 3 input `type=file` ẩn 1×1), console **0 error**.
- `motion-audit` **46/46**: CTA trên tabbar + `transform:none`, selected option unobstructed, 5 target check theo route, reduce/no-JS/block GSAP.
- `bash scripts/verify.sh` exit 0; LHCI local 3 run sau fix pen: Perf 0.98, LCP median **2,375ms**, TBT **20ms**, CLS 0; `aggregationMethod: median` trong `lighthouserc.json`.
- Cache **`gdct1-v8`**: 36 entry; migration v7→v8 xoá v7, giữ cache ngoài; offline reload pass (`node scripts/sw-audit.mjs`). Hard reload một lần nếu trình duyệt đang giữ cache v7.

## Chưa xác minh

WebKit/Safari/iOS thật, PWA cài thật/đè bản cũ, low-end Android, zoom 400%; các mục này vẫn blocked/not_run, không tính pass.
