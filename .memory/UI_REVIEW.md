# UI_REVIEW — design_revision 03 · Motion v3 + hard review (deployed 2026-10-26)

Ngày: 2026-10-25/26 · Phạm vi: landing `/`, 404, 8 route app · Chế độ: `ui_rework` · Target: release candidate · **Đã deploy** `2671b02` (SW v8); design review **awaiting_feedback**.

## 0. Revision 03 — Motion v3 (yêu cầu mới)

**Kích hoạt:** người dùng yêu cầu nâng visual/UI/UX + motion toàn diện (hero sequence, scroll reveal, micro-interaction, icon/illustration, 10+ ý tưởng, hard review). Revision 02 đã deploy; không reset lịch sử.

### Audit feedback mới
| ID | Vấn đề | Mức | Hướng xử lý |
|---|---|---|---|
| F-UI-11 | Landing gần như không có motion; hero “phiếu thi” đứng yên, các section chỉ nối tiếp | cao | Hero CSS sequence + pen/grid/rail; section reveal riêng; margin progress |
| F-UI-12 | App replay `.q-wrap`/`.feedback` mỗi lần pick/filter/search; entrance không gắn với chuyển câu | cao | `GDCTMotion` gating route/qid; bỏ `qin`/`fin`; context cleanup |
| F-UI-13 | Thanh tiến độ viết width cuối trong markup nên transition không chạy; sheet đóng/mở giật | trung | Bar scaleX từ width cũ; sheet open 200ms, close đồng bộ |

### Giữ / đổi
- **Giữ:** nội dung, số liệu, token giấy/mực/đỏ, font, URL, route, `so-on-gdct1.v1`, id câu, CTA `Mở sổ ôn ngay`, skip link, 0 third-party, PWA.
- **Đổi:** thêm motion layer + SVG pen mark; hero text/card CSS-only; GSAP lazy sau `load`; app motion module; SW `gdct1-v8`; motion-audit.

### Motion contract 03 (thay contract rev 02 §4)
- Mức: **landing expressive, app subtle**. Tất cả animation là thiết kế mới cho “phiếu thi & bút đỏ”; không sao chép demo.
- **Hero CSS:** `exam-field` 220ms (delay .05/.1); H1 line 320/480ms (0/.04/.1); lede 220ms (.12); actions 220ms (.18); sheet-card 480ms (.14); grid scan 480ms (+.06); rail 500ms (.38); 7 flags 180ms (.6); pen ellipse 700ms (.24) + 600ms (.28). Chỉ transform/opacity/clip-path/stroke-dashoffset.
- **Scroll:** `ScrollTrigger.batch`, `once`, start `top 85%`, 320ms stagger 60ms; `focusin` mở reveal (160ms); margin rule scrub .2; parallax ảnh 8px scrub .4 chỉ `(pointer:fine)` + ≥761px.
- **App:** route fade 180ms **không transform** (để `.study-cta` fixed đúng); question enter 180ms; feedback 220ms + pen ✓/✕ draw; option press 120ms; bar 320ms scaleX; sheet open 160/200ms, **close đồng bộ**; toast 160ms; feedback scroll căn option đã chọn dưới sticky top; target control ≥44px; không scroll reveal nội dung.
- **LCP guard:** hero không phụ thuộc JS; GSAP/ScrollTrigger nạp sau `load`; text/card không bị `opacity:0` chờ vendor. LCP local 2,616ms (GSAP trong critical path) → **2,375ms median** sau khi đổi; Perf 0.98.
- **Reduced motion:** CSS `@media no-preference`; `gsap.matchMedia`/listener dọn tween; `getAnimations()` = 0 khi reduce; live switch pass.
- **No-JS / block GSAP:** hero CSS vẫn chạy, CTA và toàn bộ nội dung hiện; app guard `GDCTMotion`; negative control pass.
- **Loại:** pinning/horizontal/particle/custom cursor/tilt/Lottie/Lenis/SplitText; View Transitions hoãn (same-doc Chrome 111+/FF 144+/Safari 18+, nhưng router/focus/test chưa cần đánh đổi).

### Motion spec (MO-*) — revision 03

| MO | Target / V | Kind & trigger | Property / owner | Once / replay | Interrupt / cancel | Reduce / fallback | Cleanup |
|---|---|---|---|---|---|---|---|
| MO-HERO-01 | Hero meta, H1 lines, lede, actions, card / V-MOTION-01 | tween on load, CSS keyframes | opacity + transform; CSS | once per load | reload restarts; no JS interrupt | reduce: none; CSS vẫn hiện | n/a |
| MO-HERO-02 | Pen ring / V-UI-18 | tween on load, CSS stroke | stroke-dashoffset; CSS | once | no reverse; final path | reduce: path đầy đủ; không JS | n/a |
| MO-HERO-03 | Grid/rail/flags / V-MOTION-01 | tween on load, CSS clip/scale | clip-path/opacity/transform; CSS | once | n/a | reduce: final | n/a |
| MO-SCROLL-01 | Section reveal / V-MOTION-01 | scroll batch, ScrollTrigger | opacity/transform; GSAP | once/element | focusin mở sớm; no reverse | reduce: không tạo trigger; engine fail: hiện | kill trigger, `clearProps` khi reduce |
| MO-SCROLL-02 | Margin progress/parallax / V-MOTION-01 | scroll scrub, ScrollTrigger | transform; GSAP | scroll-linked | resize → matchMedia revert | reduce/pointer coarse: tắt | `mm.revert()` |
| MO-UI-01 | FAQ open / V-MOTION-01 | native details toggle | grid-template-rows; CSS | each open | close native; no stale | reduce: instant | native |
| MO-APP-01 | Route view / V-UI-14 | hashchange render, GSAP | opacity; GSAP context | route change | rapid hash → context revert | reduce: không motion; engine fail: instant | `ctx.revert()` |
| MO-APP-02 | Question/feedback/bars / V-UI-15 | render + qid/feedback key | opacity/transform/stroke; GSAP | qid/route/feedback once | next nhanh → context revert | reduce: không; engine fail: instant | `ctx.revert`/`clear` |
| MO-APP-03 | Sheet/toast / V-MOTION-01 | open/class | opacity/transform; GSAP | open once; close sync; toast each show | close sync; no animationend dependency | reduce: instant | no persistent listener |

- Duration token: `--mo-120…700`; GSAP đọc token qua `getComputedStyle`; CSS dùng trực tiếp. Không pin/scrub toàn trang; parallax chỉ `(pointer:fine)` ≥761px. Negative control: block GSAP → app không entrance, nội dung vẫn dùng (V-NEG-01).

### Bằng chứng revision 03
- `bash scripts/verify.sh` exit 0: html-validate 0, check-data 60, contrast 15, pa11y 2/2, Chromium 5 viewport + keyboard + reduce, **motion-audit 46/46**, Firefox BiDi + Marionette.
- LHCI local 3 run: Perf **0.98**, A11y/BP/SEO **1**, LCP median **2,375ms** (2,370–2,385), TBT **20ms**, CLS **0**, TTFB 1ms, total 275,386B (chưa gzip; live sẽ nén).
- SW `gdct1-v8`: 36 entry gồm app + motion + GSAP; migration v7→v8 xoá v7, giữ cache ngoài; offline reload app render 1,147 ký tự.
- Ảnh: `.memory/visual_ledger/after-motion/` (hero 150/450/1050ms + final, landing 320/390/768/1280, 404, app) + `.memory/visual_ledger/qa/` cập nhật.
- Chưa xác minh: WebKit/iOS motion, PWA cài thật/đè bản cũ, low-end Android, zoom 400%, field data.

### Hard review 2026-10-25 — lỗi tìm thấy sau Motion v3

| ID | Vấn đề | Mức | Root cause | Cách sửa / kiểm |
|---|---|---|---|---|
| F-UI-14 | Nút “Câu tiếp” bị khuất/đặt sai trên mobile sau khi vào Study | **cao** | Route entrance đặt `transform` lên `.view`; transform tạo containing block cho `.study-cta` (`position:fixed`), nên CTA fixed theo view và chui dưới tabbar | Bỏ translate khỏi view entrance, chỉ fade + `clearProps:'transform'`; regression check trong motion-audit xác nhận `transform:none`, CTA trên tabbar |
| F-UI-15 | Auto-scroll feedback làm mất option vừa chọn và question | **cao** | `scrollIntoView({block:'center'})` + smooth scroll không tôn trọng reduce | Một scroll target duy nhất: căn option `.is-selected` ngay dưới `.study-top`; feedback nằm dưới; `behavior:auto` khi reduce; check `elementFromPoint` không bị che |
| F-UI-16 | Nhiều tap-target app <44px | **trung** | `.tool` 38, `.icon-btn` 40, `.chip/.btn-sm` ~35, `.link-btn` 21, select/time 38, switch 25 | Nâng control lên ≥44; switch giữ track 44×25 nhưng hit area 44×44; thêm 5 check target trong motion-audit (study/sheet/today/library/check/settings) |
| F-UI-17 | 320px: brand “Sổ Ôn” wrap 2 dòng, nav “Sổ” 41px | trung | Topbar thiếu chỗ sau khi target lớn hơn; nav thiếu min-width | `white-space:nowrap`; ≤360 ẩn dot/code brand; nav `min-width:44px`; UI review 320 không overflow |
| F-UI-18 | Nét bút quanh “sổ” là hai ellipse chồng, cắt qua chữ/dấu, đỏ trên đỏ | **cao (thị giác)** | SVG là replaced element: `inset` + `width/height:auto` không kéo giãn, height thực chỉ 34.6px thay vì 71px; thêm ellipse thứ hai; chữ và nét cùng đỏ; leading H1 quá sát dấu phẩy dòng trên | Một path liền mạch có gap; `width/height:calc()` tường minh; chữ “sổ” mực + nét đỏ; tách dòng 3 bằng `margin-top:.30em`; ảnh cận cảnh trong ledger |
| F-UI-19 | Icon tab “Đáp án”: check + hai gạch rời, khó đọc ở 20px | trung | Icon không theo hệ hình khối của tabbar | Đổi sang ô vuông + check (checkbox), cùng stroke 1.6; active đỏ; ảnh crop 4× trong ledger |
| — | FAQ đóng “chiếm 22px” | — | Đây là box phantom của `::details-content`; item thực chỉ cao bằng summary + border (extra 1px), body height không đổi | Không sửa grid accordion; check mới đo `item - summary ≤2px` thay vì `getBoundingClientRect` của answer |

**Bằng chứng hard review:** UI review 320/390/1280 (landing + 8 route + study/feedback/sheet) — 0 overflow, 0 visible target <44 (chỉ còn input file ẩn), console 0 error; motion-audit **46/46**; `verify.sh` exit 0. Ảnh: `.memory/visual_ledger/after-hard-review/` (gồm crop `pen-*`, `tab-active-390`, `tab-inactive-390`).

### Trạng thái
`deployed_verified` 2026-10-26 @ `2671b02` · design review **awaiting_feedback** · live LHCI Perf 1.0 / LCP 1,354ms / TBT 0 / CLS 0; live smoke Chromium/Firefox/SW/motion/pa11y pass. Revision 02 `c4ae353` chỉ còn lịch sử; rollback = `git revert 2671b02` (không force push).

---

# Revision 02 (history) — UI v2 “Phiếu thi & bút đỏ”

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
