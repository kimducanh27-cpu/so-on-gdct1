# PLAN — Sổ Ôn GDCT1 · Landing page

## Mục tiêu
Thêm landing page tại `/` giới thiệu Sổ Ôn GDCT1 và đưa người học vào app ở `/app/`, không mất tiến độ đã lưu, deep link cũ hay khả năng offline.

## Quy mô & chế độ
**M** · brownfield · plan v1 · cập nhật 2026-10-24 · repo `kimducanh27-cpu/so-on-gdct1` @ `e4cac8c`

Lý do xếp M: 9 view (1 landing + 8 hash view của app), 0 integration, không auth/DB; brownfield chưa có test. Trần task M = 30.

## Brief (0.2)

```yaml
project:
  name: "Sổ Ôn GDCT1 — landing page"
  type: marketing            # landing giới thiệu sản phẩm học tập
  mode: brownfield
  locale: vi
  goal: "Giúp người học hiểu giá trị Sổ Ôn GDCT1 trong một màn hình và mở app ngay."
  audience: "Sinh viên ôn trắc nghiệm GDCT1, hạn 12.11.2026; chủ yếu điện thoại, cần dùng offline."
  pages: ["/", "/app/ (today, study, done, library, check, stats, settings, exam-setup)", "/404.html"]
  brand:
    logo: "chữ Sổ Ôn + chấm, dùng lại từ app"
    colors: "#F4F1EA (nền), token hiện có trong assets/app.css"
    fonts: "Newsreader + Space + mono hiện có"
    references: ["chính app hiện tại"]
  content:
    status: provided
    source: "README.md + data/questions.js + data/answers.js + app đang live"
  integrations: ["none"]
  deploy: github-pages
  constraints:
    - "site tĩnh, không backend"
    - "giữ nguyên localStorage so-on-gdct1.v1 (README ghi nhầm gdct1.state.v1)"
    - "deadline học 12.11.2026 (ràng buộc nội dung, không phải deadline code)"
    - "chưa được push/deploy khi chưa có phép"
```

## Hiện trạng (P0)

- Stack: HTML/CSS/JS thuần; không `package.json`, lockfile, lint, typecheck, test hay build. Host: GitHub Pages.
- Baseline: không có script gate để chạy. Đã kiểm: `node --check` 4 file JS → pass; `manifest.webmanifest` JSON hợp lệ; 100 câu / 100 đáp án, 0 trùng, 0 thiếu, 7 câu `needsReview`; site live trả 200.
- Route hiện tại: `/` là app shell; hash view: `today`, `study`, `done`, `library`, `check`, `stats`, `settings`, `exam-setup`. Chưa có 404 riêng, robots, sitemap, OG.
- PWA: `start_url: "./#/today"`, `scope: "./"`; `sw.js` cache `gdct1-v3` gồm 32 file shell, navigation network-first, đường dẫn tương đối.
- Nợ hiện hữu: README ghi `cd app` nhưng app đang ở root; SW scope `/` sẽ phủ landing mới; chưa có test/a11y/Lighthouse baseline.

## Trong phạm vi

- Landing một trang tại `/`: hero + CTA, giá trị chính, 3 bước học, ảnh chụp thật, minh bạch độ tin cậy đáp án, FAQ, CTA cuối, footer.
- Chuyển app nguyên trạng sang `/app/` (giữ 8 hash view), giữ nguyên khóa localStorage và dữ liệu người dùng.
- Redirect deep link cũ `/#/...` → `/app/#/...`; chế độ standalone mở thẳng app.
- Migration PWA: kill-switch SW ở scope gốc, cache mới `gdct1-v4`, cập nhật manifest (scope/start_url/id).
- SEO cơ bản cho landing, `404.html`, a11y, performance, script verify, README + rollback.
- Chỉ chạy local/preview trong phạm vi plan này.

## Ngoài phạm vi (không làm lần này)

- Xác minh/sửa 7 câu “Cần kiểm tra” và nội dung đáp án — backlog riêng, không chặn landing.
- Thêm tính năng học, đổi UI/logic app, dark mode toggle.
- Analytics, cookie, backend, tài khoản, push server.
- Framework, build pipeline hoặc dependency runtime mới.
- Push/deploy production — `T-DEPLOY-01` chờ duyệt.

## Thứ tự & mốc

```
M0 (plan) → M1 skeleton → M2 luồng chính → M3 chất lượng → M4 sẵn sàng phát hành → M5 (sau deploy)
```

| Mốc | Demo được gì | Gate |
|---|---|---|
| **M0** | One-pager + `.plan/*` + PG0–PG3 | PG2, PG3 |
| **M1** | Mở `/` thấy hero + CTA; bấm CTA → `/app/#/today`; mở `/#/library` → `/app/#/library`; 5 viewport (320–1280) không overflow | PASS 1 exit |
| **M2** | Landing đủ section với ảnh thật; app cũ/máy đã cài mở `/` được đưa vào app; app vẫn offline sau khi đổi cache | G2–G6 |
| **M3** | axe 0 serious/critical; Lighthouse mobile median đạt budget; keyboard đi hết luồng; 320→1440 | G7, G8 |
| **M4** | `verify.sh` xanh; README chạy từ clone sạch; có rollback; chưa deploy | PASS 3 exit |
| **M5** | Sau khi được duyệt: live `/` + `/app/` 200, redirect và PWA sạch trên origin thật | G9 |

## Đường găng

`T-BASE-01 → T-PWA-01 → T-LAND-01 → T-LAND-02 → T-LAND-03 → T-A11Y-01 → T-PERF-01 → T-QA-01 → T-DOC-01 → T-DEPLOY-01` (10 task)

Nhánh song song: `T-ASSET-01` (sau BASE-01) → LAND-03/PERF-01; `T-REDIR-01` sau LAND-01; `T-SEO-01` sau LAND-03. Không có U3; tối đa 2 task U2 nối tiếp trên đường găng nên không cần spike/checkpoint bổ sung.

## Rủi ro lớn nhất

1. **SW gốc phục vụ cache cũ che landing** — dấu hiệu: `/` vẫn trả app shell dù đã có `index.html` mới, `caches.keys()` còn `gdct1-v3` — hành động: kill-switch + cache `gdct1-v4` + test với SW cũ đã cài.
2. **Đổi URL làm mất deep link/cài đặt PWA** — dấu hiệu: `/#/check` không chuyển, Chrome hiện 2 bản cài — hành động: redirect + manifest `id` giữ định danh cũ; nếu trình duyệt không hỗ trợ `id`, ghi nhận cài lại, không tuyên bố pass.
3. **Base path GitHub Pages** — dấu hiệu: asset 404 khi phục vụ dưới `/so-on-gdct1/` — hành động: URL tương đối, JS tính base, test đúng subpath.
4. **Số liệu landing lệch dữ liệu** — dấu hiệu: số câu/level trong HTML khác `data/answers.js` — hành động: script đối chiếu trong `verify.sh`.
5. **Ảnh chụp nặng làm LCP vượt budget** — dấu hiệu: hero > 200KB hoặc LCP > 2.5s — hành động: WebP/AVIF, width/height, ưu tiên tải, fallback.

## Cần quyết

- `[CẦN QUYẾT] Q1` — Cho phép push/deploy GitHub Pages sau khi M4 xanh? — đề xuất: chỉ deploy khi bạn duyệt — chặn: `T-DEPLOY-01`.

## Cách biết là xong

- Mọi task trong `TASKS.md` ở `done-verified` (trừ `T-DEPLOY-01` nếu chưa được duyệt).
- Bảng truy vết route → task và DoD 11.3 → task không còn ô trống.
- `verify.sh` exit 0; axe 0 serious/critical; Lighthouse mobile median đạt 5.2.2; README chạy từ clone sạch.

## Bảng truy vết (7.2)

### a) Route → task

| Route | Task |
|---|---|
| `/` (landing) | T-LAND-01, T-LAND-02, T-LAND-03, T-A11Y-01, T-PERF-01, T-SEO-01 |
| `/app/` | T-BASE-01, T-PWA-01 |
| `/app/#/{today,study,done,library,check,stats,settings,exam-setup}` | T-BASE-01 |
| `/#/...` (legacy) | T-REDIR-01 |
| `/404.html` | T-SEO-01 |
| `/sitemap.xml`, `/robots.txt` | T-SEO-01 |

### b) Definition of Done (11.3) → task

| Mục DoD | Task / ghi chú |
|---|---|
| Brief đủ trang/mục | T-LAND-01..03, T-BASE-01 |
| G0 research | Đạt tại plan: `.memory/RESEARCH.md` (3 nguồn MDN) |
| Không placeholder `[[...]]` | N/A — nội dung lấy từ README/dữ liệu thật, không dùng placeholder |
| Không TODO/console.log | T-QA-01 |
| Tiếng Việt đúng dấu/font | T-LAND-01, T-A11Y-01, T-QA-01 |
| Responsive 320→1440 | T-LAND-01..03, T-QA-01 |
| Keyboard + focus | T-A11Y-01 |
| axe 0 serious/critical + contrast | T-A11Y-01 |
| Lighthouse lab 5.2.2 | T-PERF-01 |
| SEO: title/description/canonical/OG/sitemap/robots | T-SEO-01 |
| 404 + error state + mất mạng | T-SEO-01 (404), T-PWA-01 (offline) |
| Không secret; `.env` | T-QA-01 (quét `git grep`; repo không dùng env) |
| P0/P1 mở | Không có; 7 câu “Cần kiểm tra” là backlog dữ liệu, ghi ở `PROJECT_STATE.md` |
| README chạy từ clone sạch | T-DOC-01 |
| Test luồng chính, không skip mới | T-QA-01 (smoke + keyboard; repo chưa có test framework) |
| Cross-browser 0.6 | T-QA-01: Chromium + Firefox; WebKit/iOS nếu có thiết bị, thiếu thì ghi `blocked`, không tuyên bố pass |
| `.memory/*` + visual ledger cập nhật | T-QA-01, T-DOC-01 |
| Commit sạch, message rõ | T-DOC-01, T-DEPLOY-01 |

---

# PHASE 2 — UI rework “Phiếu thi & bút đỏ” (2026-10-25)

## Brief

```yaml
project:
  name: "Sổ Ôn GDCT1 — UI rework"
  type: product + marketing
  mode: brownfield
  locale: vi
  goal: "Làm landing và app đọc như một phiếu ôn bị chấm bằng bút đỏ, vẫn giữ nguyên dữ liệu và hành vi."
  audience: "Sinh viên ôn GDCT1 trên điện thoại, hạn 12.11.2026"
  pages: ["/", "/app/#/today|study|done|library|check|stats|settings|exam-setup", "/404.html"]
  brand:
    colors: "giấy #F4F1EA, mực #141A18, đỏ #C0392B, xanh #1F5C4A, hổ phách #8A6414"
    fonts: "Newsreader 400 + Space Grotesk (landing 4 woff2); app giữ bộ font hiện có"
  integrations: ["none"]
  deploy: github-pages
  constraints:
    - "không đổi route, localStorage so-on-gdct1.v1, id câu, đáp án, hành vi"
    - "không thêm dependency/build/analytics"
    - "giữ CTA 'Mở sổ ôn ngay' → ./app/#/today, .skip-link, .hero, #hoi-dap cho QA"
```

## Quyết định thiết kế

- `design_revision 02`, hướng đã duyệt; chi tiết F-UI và refinement ở `.memory/UI_REVIEW.md`.
- Landing: form strip + hero có **bảng 100 ô đáp án** (10×10, vạch chia 50) + rail 20 ngày; ảnh app thật chuyển về mục “Trong sổ”.
- App: panel vuông, header phiếu, nhãn ≥11px, số tabular, đỏ chỉ dùng cho hành động/sửa bài.
- Motion `subtle`; landing không animation tự chạy; reduced-motion tắt toàn bộ.
- Ảnh app + OG + 404 + SW cache `gdct1-v5` là một phần của task, không phải việc phụ.

## Task & thứ tự

`T-UI-01` → `T-UI-02` → `T-UI-03` → `T-UI-04` → `T-UI-05` → `T-UI-06` → `T-UI-07`.

| Task | Nội dung | Gate |
|---|---|---|
| T-UI-01 | Audit + before shots + UI_REVIEW | verify baseline xanh, 13 ảnh before |
| T-UI-02 | Landing | 5 viewport, 1 h1, CTA, FAQ, contrast, HTML valid |
| T-UI-03 | Shell/Today/Study | 8 route render, keyboard, no overflow |
| T-UI-04 | 5 route còn lại + overlay | 390/1280, no overflow, contrast |
| T-UI-05 | Assets, OG, 404, SW v5 | offline + cache migration, ảnh ≤ budget |
| T-UI-06 | QA + docs + after shots | `verify.sh` xanh, LHCI budget, before/after |
| T-UI-07 | Deploy + live smoke | live 200, SW v5, redirect, LHCI |

**Ngoài phạm vi:** đổi nội dung đáp án, thêm tính năng, dark mode, analytics, backend, framework.

**Rủi ro:** mất tương phản khi tăng mật độ đỏ; QA script phụ thuộc markup cũ; ảnh/OG lệch; SW phục vụ CSS cũ; layout 320px với bảng 10 cột. Giảm thiểu: giữ selector QA, đo contrast, chụp 5 viewport, bump cache + test offline.

**Trạng thái 2026-10-25:** T-UI-01..07 done-verified. `verify.sh` exit 0; LHCI local 3 run Perf 0.99, LCP median 1,955 ms; LHCI live 3 run Perf 1.0, LCP median 1,207 ms; SW `gdct1-v5` migration + offline pass. Đã push `main` @ `c4ae353`; live https://kimducanh27-cpu.github.io/so-on-gdct1/. Rollback `git revert c4ae353` + push; `landing-page` giữ `b3f89a1`.
