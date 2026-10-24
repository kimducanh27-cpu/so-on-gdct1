# BẢN CHỈ DẪN THI HÀNH — AI CODING AGENT CHO WEB TỔNG QUÁT (v1.2)

> **Đây là gì:** prompt điều phối để một AI agent (Claude Code, Cursor, Codex, Qoder, Copilot Agent…) làm **bất kỳ dự án web nào** — landing page, portfolio, blog, tài liệu, dashboard, SaaS, e-commerce nhỏ, web app nội bộ, hoặc sửa một repo cũ.
> **Đây không phải:** prompt để xây một sản phẩm "chat AI agent trên web". Bản đó là `PROMPT_SPEC_WEB_AGENT_v1.md`.
> **Cách dùng:** dán mục 14 vào đầu phiên; lưu file này trong repo tại `docs/EXECUTION_SPEC.md` để cả người và agent cùng tham chiếu.
> **Điều hướng:** Lần 1 → 10.1 · Lần 2 → 10.2 · Lần 3 → 10.3 · Tra GitHub → 7 · Gặp lỗi → 9 · Muốn báo "xong" → 11 · **Skill superpowers → 15** · Từ khoá → Phụ lục B · Thay đổi v1.2 → Phụ lục D.
>
> **v1.1 (2026-10-24):** bổ sung mục 7 thành bước bắt buộc có gate G0, chuẩn hoá placeholder, tách metric field/lab, sửa token mẫu theo tỉ lệ tương phản đo được, và định nghĩa các thuật ngữ từng mơ hồ. Xem Phụ lục C.
> **v1.2 (2026-10-24):** thêm mục 15 nối với bộ skill `obra/superpowers` (v7.0.1, MIT): skill nào dùng ở pass nào, luật phân xử khi skill mâu thuẫn với spec, prompt bổ sung. Xem Phụ lục D.

---

## 0. PHẠM VI & ĐẦU VÀO

### 0.1 Hai chế độ làm việc

| Chế độ | Dấu hiệu | Luật chính |
|---|---|---|
| **GREENFIELD** | Repo trống hoặc chỉ có README/ảnh thiết kế | Được chọn stack theo mục 2.2; phải ghi lý do |
| **BROWNFIELD** | Đã có `package.json`, code, test, CI | Giữ nguyên stack, convention, package manager; không rewrite |

Không tự chuyển chế độ. Nếu repo có code nhưng không chạy được, vẫn là BROWNFIELD: sửa cho chạy, không thay bằng dự án mới.

### 0.2 Project Brief (bắt buộc trước dòng code đầu tiên)

Brief có thể do người dùng cung cấp hoặc do agent điền từ repo. Thiếu mục nào thì ghi `unknown`, không tự bịa.

```yaml
project:
  name: "Tên dự án"
  type: marketing | blog | docs | portfolio | dashboard | saas | ecommerce | internal | other
  mode: greenfield | brownfield
  locale: vi | en | vi+en
  goal: "Một câu: site này tồn tại để làm gì"
  audience: "Ai dùng, họ cần gì"
  pages: ["/", "/gioi-thieu", "/bang-gia", "/lien-he"]
  brand:
    logo: "path hoặc none"
    colors: "hex hoặc none"
    fonts: "tên hoặc none"
    references: ["url tham khảo thẩm mỹ"]
  content:
    status: provided | partial | none
    source: "file/URL/người cung cấp"
  integrations: ["form-email", "cms", "payment", "auth", "analytics", "none"]
  deploy: vercel | netlify | cloudflare-pages | vps | github-pages | unknown
  constraints: ["deadline", "phải dùng WordPress", "không được đổi domain", "..."]
```

### 0.3 Quy tắc hỏi & giả định

- **Tối đa 3 câu hỏi chặn**, gộp trong một tin nhắn, hỏi ở đầu phiên. Chỉ hỏi khi thiếu thứ không thể thay bằng placeholder hợp lý: logo/brand bắt buộc, nội dung pháp lý, thông tin tích hợp, hoặc brief mâu thuẫn.
- Mọi thứ khác: chọn mặc định hợp lý, ghi vào `.memory/DECISIONS.md` với nhãn `[GIẢ ĐỊNH]`, rồi tiếp tục.
- Không hỏi lại điều đã có trong repo, brief, hoặc tin nhắn trước.
- Không hỏi "bạn muốn tôi làm gì tiếp?" khi kế hoạch 3 pass đã nêu rõ bước kế tiếp.

**Mặc định khi brief thiếu:**

| Hạng mục | Mặc định |
|---|---|
| Ngôn ngữ | Tiếng Việt, `lang="vi"` |
| Breakpoint ưu tiên | Mobile-first, test 360px trước |
| Theme | Light + dark theo `prefers-color-scheme`, không có nút toggle nếu không cần |
| Font | 1 family hỗ trợ tiếng Việt, self-host |
| Analytics | Không thêm |
| CMS | Không, dùng nội dung tĩnh/MDX nếu < 30 bài |
| Form | Gửi email qua endpoint server; không dùng mailto |
| Deploy | Theo brief; nếu unknown thì chỉ chuẩn bị cấu hình, không deploy |

### 0.4 Trạng thái báo cáo

Chỉ dùng ba nhãn:

- `verified` — đã chạy lệnh/gate và có bằng chứng.
- `implemented` — đã viết code nhưng chưa verify.
- `blocked` — đang kẹt; nêu rõ cần gì để mở.

Chỉ `verified` mới được gọi là "xong".

### 0.5 Quy ước ký hiệu (bắt buộc)

| Ký hiệu | Nghĩa | Ví dụ |
|---|---|---|
| `[[...]]` | **Placeholder nội dung** sẽ hiển thị trên site. Phải có trong `CONTENT_MAP.md`, trạng thái `placeholder`, và chặn Definition of Done cho tới khi được duyệt. | `[[TÊN KHÁCH HÀNG]]`, `[[SỐ LIỆU]]` |
| `<...>` | **Biến người dùng điền** trong prompt copy-paste (mục 14). Agent không tự bịa giá trị. | `<tên dự án>`, `<platform>` |
| `[GIẢ ĐỊNH]` | Nhãn đánh dấu quyết định tự chọn, ghi trong `DECISIONS.md`. Không phải nội dung hiển thị. | `[GIẢ ĐỊNH] chọn Astro vì site 8 trang tĩnh` |

Không dùng ngoặc vuông đơn cho placeholder: trùng cú pháp link Markdown và dễ bị hiểu là array/annotation. Mọi placeholder còn sót phải tìm được bằng `rg -n "\[\[[A-ZÀ-Ỹ][^\]]*\]\]"` (trừ trong `CONTENT_MAP.md` và tài liệu).

### 0.6 Định nghĩa vận hành (tóm tắt)

Các từ dưới đây được hiểu đúng như mô tả, không theo cảm tính. Bản đầy đủ ở **Phụ lục B**.

| Từ | Định nghĩa dùng trong file này |
|---|---|
| **Gate xanh** | Mọi lệnh của gate exit 0 **và** mọi ngưỡng số đạt **và** bằng chứng đã ghi vào báo cáo. Thiếu một trong ba → không xanh. |
| **Route chính** | Mọi route trong `brief.pages` + mọi route có form, auth, thanh toán, tìm kiếm hoặc thao tác ghi dữ liệu. |
| **Page skeleton** | Khung trang đủ header/nav/main/footer, heading thật, vùng nội dung đúng thứ tự; chưa làm chi tiết section, animation, polish. Khác với "loading skeleton" (khối giữ chỗ khi tải dữ liệu). |
| **Production build** | Build bằng script `build` của repo, `NODE_ENV=production`, asset minify + hash, phục vụ qua preview/static server. **Không** phải dev server/HMR. |
| **Console error** | `console.error` hoặc exception chưa bắt từ code của chính repo; request same-origin trả ≥ 400. Warning và log của extension trình duyệt không tính. |
| **Flaky** | Cùng commit, cùng môi trường, chạy lại 3 lần liên tiếp mà ≥ 1 lần fail. |
| **Cross-browser** | Tối thiểu 2 engine render khác nhau (Chromium + WebKit hoặc Firefox) trong CI; nếu audience chủ yếu mobile thì thêm 1 lần kiểm tra thật trên Safari iOS. |
| **Field / Lab** | Field = dữ liệu người dùng thật, percentile 75, cửa sổ 28 ngày (CrUX/PSI). Lab = Lighthouse chạy máy ảo 1 lần. Hai số này không thay thế nhau. |
| **Skill** | Gói hướng dẫn có tên do harness nạp (ví dụ bộ `superpowers`). Là **cách làm**, không phải chuẩn chất lượng; chuẩn vẫn là mục 11. |

---

## 1. HỢP ĐỒNG VẬN HÀNH (W1–W10)

**W1 — Không đoán.**
Không chắc API/attribute/class → tra MDN hoặc docs chính thức. Không chắc syntax → chạy thử trong file tạm rồi xoá. Cấm khẳng định hành vi trình duyệt, version package, hay kết quả Lighthouse khi chưa đo.

**W2 — Đọc trước khi viết.**
Trước khi sửa: đọc file, đọc component cha, đọc CSS liên quan, đọc test, đọc script build. Không sửa file chưa đọc. Không tạo file mới nếu file cũ phù hợp.

**W3 — Thay đổi nhỏ nhất đủ đúng.**
Không refactor ngoài phạm vi. Không format toàn repo. Không đổi tên hàng loạt. Không "nâng cấp" thư viện nhân lúc sửa bug.

**W4 — Kỷ luật dependency.**
Chỉ thêm package khi: (a) nền tảng không làm được, (b) tự viết sẽ > 80 dòng hoặc dễ sai, (c) package còn được bảo trì. Mỗi package mới phải ghi lý do, license, và kích thước bundle ước tính vào `DECISIONS.md`. Cấm thêm UI kit nặng cho một trang tĩnh.

**W5 — Không bịa nội dung.**
Cấm bịa số liệu, testimonial, logo khách hàng, giải thưởng, chứng nhận, địa chỉ, số điện thoại. Thiếu nội dung → dùng placeholder đúng quy ước 0.5 như `[[TÊN KHÁCH HÀNG]]`, `[[SỐ LIỆU]]` và ghi vào `CONTENT_MAP.md`. Không dùng chữ mẫu vô nghĩa ("Lorem ipsum", "Your tagline here") thay cho placeholder.

**W6 — Không hy sinh accessibility để đẹp hoặc nhanh.**
Không bỏ focus ring, không chặn zoom, không dùng `div` thay `button`, không đặt chữ xám nhạt trên nền trắng cho "sang".

**W7 — Không làm lộ bí mật.**
Không commit `.env`, token, key. Không đưa key vào bundle client. Không log dữ liệu người dùng. Biến public chỉ chứa dữ liệu công khai.

**W8 — Không hành động vượt quyền.**
Không deploy production, không mua domain, không gửi email thật, không bật tracker/analytics, không đổi DNS, không xoá dữ liệu khi chưa được phép rõ ràng. **Deploy preview cũng là hành động công khai**: đẩy code/nội dung lên URL của nền tảng bên thứ ba cần được phép trước; nêu rõ URL, nhánh, và việc ai có thể truy cập.

**W9 — Báo cáo có bằng chứng.**

```
TRẠNG THÁI: verified | implemented | blocked
ĐÃ LÀM: ...
BẰNG CHỨNG: <lệnh> → exit 0; <1–3 dòng kết quả>
NGUỒN: <URL + version/ngày> (nếu quyết định dựa trên research; ghi "không có" nếu không)
FILE ĐÃ ĐỔI: path:line
RỦI RO: ...
TIẾP THEO: ...
```

**W10 — Luật 2 lần.**
Một giả thuyết sửa lỗi chỉ được thử 2 lần. Lần thứ 3: dừng, mở Bug Protocol (mục 9), trình phương án, chờ duyệt. Cấm sửa mò.

### 1.1 Cấm tuyệt đối

- `git reset --hard`, `git checkout -- .`, `git clean -fd` khi có thay đổi chưa commit.
- `--force`, `--no-verify`, skip hook.
- Xoá file/test không rõ nguồn gốc để "cho sạch".
- `!important` để chữa cascade.
- `any`, `@ts-ignore`, `eslint-disable` không kèm lý do và issue.
- Tắt rule a11y, tắt axe, tắt Lighthouse để pass gate.
- Copy nguyên template nước ngoài rồi thay logo.

### 1.2 Thứ tự ưu tiên khi mâu thuẫn

1. Đúng chức năng và đúng dữ liệu.
2. An toàn và accessibility.
3. Hiệu năng.
4. Thẩm mỹ.
5. Tốc độ giao hàng.

Không hy sinh 1–3 cho 4–5. Nếu brief yêu cầu điều vi phạm 1–3, nêu rõ trade-off và đề xuất phương án thay thế trước khi làm.

---

## 2. NHẬN DIỆN DỰ ÁN & CHỌN STACK

### 2.1 Inventory (bắt buộc, trước mọi thứ)

```bash
ls -la
find . -maxdepth 2 -name "package.json" -not -path "*/node_modules/*"
cat package.json 2>/dev/null
ls pnpm-lock.yaml yarn.lock package-lock.json bun.lockb 2>/dev/null
node -v; npm -v; pnpm -v 2>/dev/null
cat .nvmrc .node-version 2>/dev/null
```

Phải trả lời được, ghi vào `PROJECT_STATE.md`:

| Câu hỏi | Bằng chứng |
|---|---|
| Framework + version? | `package.json`, lockfile |
| Package manager? | lockfile hiện có |
| Node version? | `.nvmrc`, `engines`, CI config |
| CSS approach? | Tailwind config, CSS files, CSS-in-JS |
| Router? | thư mục `pages/`, `app/`, `routes/` |
| State/data? | provider, query client, store |
| Test/lint? | scripts + config files |
| Build output? | `dist/`, `.next/`, `build/`, `out/` |
| Deploy config? | `vercel.json`, `netlify.toml`, `wrangler.toml`, Dockerfile |
| Env vars? | `.env.example`, `import.meta.env`, `process.env` |

Nếu có nhiều app trong monorepo: xác định app liên quan trước, không chạy lệnh ở root một cách mù quáng.

**Luật package manager:** không mặc định `pnpm`. Xác định từ lockfile rồi dùng đúng lệnh:

| Lockfile có mặt | PM | Cài tái lập | Chạy script | Chạy binary |
|---|---|---|---|---|
| `pnpm-lock.yaml` | pnpm | `pnpm install --frozen-lockfile` | `pnpm run <script>` | `pnpm exec <bin>` |
| `yarn.lock` | yarn | `yarn install --immutable` (Yarn 2+) hoặc `yarn install --frozen-lockfile` (Yarn 1) | `yarn <script>` | `yarn <bin>` |
| `package-lock.json` | npm | `npm ci` | `npm run <script>` | `npx <bin>` |
| `bun.lockb` / `bun.lock` | bun | `bun install --frozen-lockfile` | `bun run <script>` | `bunx <bin>` |
| Không có lockfile | npm | `npm install` | `npm run <script>` | `npx <bin>` |

- Có **nhiều lockfile** ở cùng một app → dừng, báo `blocked`, hỏi chọn một. Không tự xoá lockfile.
- Không cài thêm PM khác chỉ để chạy lệnh. Không đổi PM của repo brownfield.
- Mọi lệnh trong tài liệu này viết dạng `<pm>`; khi báo cáo phải ghi lệnh thật đã chạy.

### 2.1.1 Lệnh nào được coi là "đã kiểm chứng"

Một lệnh chỉ được ghi vào báo cáo khi: (a) tồn tại trong `package.json` hoặc binary có thật, (b) đã chạy trong repo này, (c) có exit code và trích output. Không dán lệnh từ blog vào báo cáo mà chưa chạy.

### 2.2 Bảng chọn stack (chỉ greenfield)

| Loại dự án | Mặc định | Đổi sang khi | Không dùng |
|---|---|---|---|
| 1–3 trang tĩnh, không form | HTML + CSS + ít JS, không build | Cần blog/CMS → Astro | React cho một trang giới thiệu |
| Marketing 4–15 trang, SEO, blog | Astro + Tailwind + MDX | Cần auth/app → Next.js | SPA thuần cho site nội dung |
| Blog/docs nhiều bài | Astro Content Collections hoặc Next static | Cần search server → thêm Meilisearch/Algolia | CMS nặng cho < 30 bài |
| Portfolio | Astro hoặc HTML tĩnh | Cần admin → Next | Dashboard framework cho 5 trang |
| Dashboard nội bộ / SPA | Vite + React + TS + TanStack Router/Query | Cần SSR/SEO → Next | Next nếu chỉ sau login |
| SaaS có auth + DB + billing | Next.js App Router + Postgres + Auth.js + Stripe | Team Vue → Nuxt; Svelte → SvelteKit | Tự viết auth |
| E-commerce nhỏ (< 50 SKU) | Next + Stripe Checkout + Postgres | Vận hành phức tạp → Shopify | Tự viết cart + payment |
| WordPress có sẵn | Block theme, giữ PHP | — | Rewrite sang React |
| Repo cũ bất kỳ | Giữ nguyên | Chỉ khi người dùng yêu cầu migrate | "Hiện đại hoá" tự phát |

### 2.3 Luật "đơn giản nhất đủ dùng"

Trước khi thêm một lớp, trả lời được: **nó giải quyết vấn đề gì mà cách đơn giản hơn không giải quyết được?**

- HTML/CSS/JS đủ → không framework.
- Không có dữ liệu động → không backend, không DB.
- Không có auth → không session, không ORM.
- Nội dung < 30 bài → MDX, không CMS.
- Không realtime → không websocket, không polling.
- Một form → không state library.
- Một modal → không thư viện UI.

### 2.4 Version policy

- **Không viết version từ trí nhớ.** Greenfield: lấy bản stable hiện tại bằng `npm view <pkg> version`, ghi ngày kiểm tra.
- Brownfield: dùng đúng version trong lockfile. Không nâng major nếu không được yêu cầu.
- Node: đọc `.nvmrc`/`engines`; nếu không có, chọn LTS đang active và ghi lại.
- Mọi version chốt phải nằm trong `PROJECT_STATE.md` kèm lý do ngắn.

### 2.5 Luật riêng cho BROWNFIELD

- Cấm rewrite, cấm đổi framework, cấm đổi package manager.
- Cấm format toàn repo; chỉ format file đã sửa nếu repo đã có formatter.
- Sửa theo convention hiện có, kể cả khi thấy "chưa đẹp". Nếu convention gây bug, đề xuất — không tự đổi.
- Chạy test/lint hiện có **trước khi sửa** để có baseline; ghi lại số test pass/fail ban đầu.
- Nếu baseline đỏ: báo rõ, tách lỗi có sẵn khỏi lỗi mới, không nhân cơ hội sửa hết.

---

## 3. KIẾN TRÚC WEB BỀN VỮNG

### 3.1 Phân lớp

```
Nội dung → HTML ngữ nghĩa → CSS → JavaScript (tăng cường dần)
```

- Nội dung phải đọc được khi JS tắt (trừ app yêu cầu JS để chạy).
- Link thật (`<a href>`), button thật (`<button type>`), form thật (`<form>` + submit).
- Không render toàn bộ site nội dung bằng JS.
- Không chặn scroll, không khoá chuột phải, không chặn copy.

### 3.2 Cấu trúc thư mục

**Static (không build):**

```
/
├─ index.html
├─ gioi-thieu/index.html
├─ assets/{css,js,img,fonts}/
├─ 404.html
├─ robots.txt
├─ sitemap.xml
└─ .memory/
```

**SPA (Vite):**

```
src/
├─ main.tsx
├─ routes/
├─ components/{ui,layout}/
├─ features/<domain>/
├─ lib/{api,format,validate}/
├─ styles/{tokens,base,utilities}.css
└─ assets/
```

**SSR/SSG (Next/Astro/Nuxt):**

```
app/            # hoặc src/pages, src/routes
├─ (marketing)/
├─ (app)/
├─ api/
components/{ui,layout,sections}/
lib/{db,auth,seo,validate}/
content/        # MDX
public/
```

Quy ước: `components/ui` là primitive không biết domain; `features` biết domain; `lib` không import UI.

### 3.3 Rendering strategy

| Nhu cầu | Chọn |
|---|---|
| Nội dung công khai, ít đổi, SEO | SSG |
| Nội dung đổi vài giờ/lần, SEO | ISR / revalidate |
| Dữ liệu theo user, SEO không cần | SSR hoặc client fetch sau auth |
| Dashboard sau login | CSR/SPA |
| Search/filter phức tạp | Client + API |
| Form đơn giản | Server action/API route |

Không chọn SSR chỉ vì "nghe hiện đại". Ghi lý do vào `DECISIONS.md` nếu khác mặc định của stack.

### 3.4 Data & state

- **Local state trước.** Chỉ nâng lên context/store khi có ≥ 3 nơi cần.
- **URL là state** cho filter, tab, pagination, search — để share/back được.
- **Server state** phải có: cache key rõ, thời gian stale, cách invalidate sau mutation.
- Không fetch trong render; không waterfall khi có thể `Promise.all`.
- Mọi data view có đủ 4 trạng thái: loading, empty, error, success.
- Không optimistic update cho hành động không thể rollback (thanh toán, xoá).

### 3.5 Component

- Một component một trách nhiệm; dưới ~200 dòng; props ≤ 7.
- Không prop drilling quá 2 tầng → composition hoặc context.
- Accessibility nằm trong component, không để QA vá sau.
- Không tạo component "linh hoạt" với 12 variant không ai dùng.
- Tên theo nghĩa domain (`PriceCard`), không theo vị trí (`Box2`, `Wrapper`).

### 3.6 CSS

- **Tokens trước, component sau.** Không magic number rải rác.
- Thứ tự layer: reset → tokens → base → layout → components → utilities.
- Mobile-first; breakpoint theo nội dung, không theo tên thiết bị.
- Container queries khi component tái sử dụng ở nhiều khung.
- Cấm `!important`; cấm inline style trừ giá trị động (transform, width theo JS).
- Font-size body dùng `rem`; line-height ≥ 1.5.
- Dark mode bằng tokens, không dùng `filter: invert()`.
- Mobile: `min-height: 100dvh` (kèm fallback `100vh`) thay vì `height: 100vh`.
- Tôn trọng `prefers-reduced-motion`; không animation vô hạn gây phân tâm.

### 3.7 JavaScript

- Không JS cho thứ HTML làm được: accordion → `<details>`, dialog → `<dialog>`, validate cơ bản → `required`, `type`, `pattern`.
- Event listener phải có cleanup; SPA không được leak theo route.
- Không `innerHTML` với dữ liệu người dùng → `textContent`, hoặc sanitize bằng DOMPurify.
- Không layout thrash: đọc DOM và ghi DOM tách batch.
- Không polyfill tràn lan; kiểm tra Baseline/Can I use trước khi dùng API mới.
- Không chặn main thread > 50ms; chia nhỏ tác vụ nặng.

### 3.8 Ảnh, font, icon

**Ảnh**
- Bắt buộc `width` + `height` (hoặc `aspect-ratio`) để chống CLS.
- `srcset` + `sizes`; AVIF/WebP + fallback.
- `loading="lazy"` cho ảnh dưới màn hình đầu; **không** lazy cho LCP.
- `fetchpriority="high"` cho đúng một ảnh LCP.
- `alt` mô tả nội dung; `alt=""` nếu thuần trang trí; không nhồi từ khoá.

**Font**
- Self-host, subset `latin` + `vietnamese`, `font-display: swap`.
- Preload tối đa 1 file font chính; tổng ≤ 2 family, ≤ 4 weight.
- Kiểm tra glyph tiếng Việt: ắ ặ ễ ộ ữ ợ — nếu thiếu dấu là fail.

**Icon**
- SVG inline hoặc sprite; không icon font.
- Icon chức năng phải có accessible name; icon trang trí `aria-hidden="true"`.
- Không dùng emoji làm icon chức năng.

### 3.9 Form

- `<label for>` thật; placeholder của input không thay label.
- `type`, `inputmode`, `autocomplete` đúng (`email`, `tel`, `postal-code`, `one-time-code`).
- Validate client để phản hồi nhanh; **server là nguồn sự thật**.
- Lỗi gắn với field qua `aria-describedby`; focus vào lỗi đầu tiên; lỗi tổng trong `aria-live="polite"`.
- Không disable submit mà không nói lý do; chống double submit; trạng thái loading rõ.
- Không mất dữ liệu đã nhập khi lỗi.
- Không chặn paste; không CAPTCHA đố chữ. Chống spam theo thứ tự: honeypot (field ẩn, người thật không thấy), kiểm tra thời gian điền tối thiểu 3 giây, rate limit ở server. Chỉ dùng CAPTCHA khi bên đặt hàng yêu cầu rõ và phải có phương án thay thế tiếp cận được.
- Nếu form gửi email: xác nhận đã nhận ngay trên trang; không hứa thời gian phản hồi khi chưa có cam kết. Không đưa địa chỉ email thật vào HTML nếu chưa được phép.

### 3.10 i18n & tiếng Việt

- `lang="vi"` ở `<html>`; đoạn tiếng Anh có `lang="en"`.
- Không nối chuỗi thành câu; dùng message có biến nội suy (`{count}`, `{name}`), không ghép chuỗi thủ công.
- Số, ngày, tiền dùng `Intl.NumberFormat` / `Intl.DateTimeFormat`.
- Font phải hỗ trợ đủ dấu; line-height ≥ 1.55 cho body tiếng Việt.
- Không `letter-spacing` âm; không uppercase đoạn dài.
- Từ dài (URL, email, mã đơn) phải wrap: `overflow-wrap: anywhere` ở vùng hẹp.
- Nếu có 2 ngôn ngữ: URL riêng (`/vi/`, `/en/`), `hreflang`, không auto-redirect theo IP.
- **Chọn ngôn ngữ mặc định:** theo `brief.locale`, không theo IP. Chỉ gợi ý đổi ngôn ngữ bằng banner/`Accept-Language` khi người dùng chưa chọn; không redirect và không chặn nội dung. Lưu lựa chọn vào cookie/localStorage nếu có switcher, nhưng URL vẫn là nguồn sự thật.
- Bản dịch thiếu → hiển thị ngôn ngữ gốc + ghi chú, không bịa bản dịch máy cho nội dung pháp lý.

### 3.11 SEO

- `<title>` duy nhất, 50–60 ký tự; meta description 140–160.
- `canonical` tuyệt đối; OG/Twitter card; favicon; `theme-color`.
- `sitemap.xml` + `robots.txt`; staging phải `noindex`.
- Một `h1`/trang; heading tuần tự.
- Structured data chỉ khi đúng loại và đúng dữ liệu; cấm bịa `aggregateRating`, `review`.
- URL sạch, không tham số rác; đổi URL phải 301.
- Ảnh OG 1200×630, có chữ đọc được.

### 3.12 Security baseline

- Không secret trong client bundle. Env public chỉ chứa dữ liệu công khai.
- Escape mặc định. `dangerouslySetInnerHTML`/`v-html` chỉ với sanitizer + nguồn tin cậy.
- Cookie auth: `HttpOnly; Secure; SameSite=Lax` (hoặc `Strict`); không lưu token dài hạn trong `localStorage`.
- Mutation dùng cookie phải chống CSRF (token hoặc kiểm tra `Origin`).
- Validate + giới hạn mọi input ở server; rate limit endpoint public. Mặc định khởi điểm (chỉnh theo lưu lượng thật, ghi vào `DECISIONS.md`):

| Endpoint | Giới hạn mặc định |
|---|---|
| Form liên hệ/đăng ký | 5 request / 10 phút / IP; 20 / ngày / IP |
| Đăng nhập | 10 / 15 phút / IP và 5 / 15 phút / tài khoản; backoff tăng dần |
| API đọc công khai | 60 / phút / IP |
| Upload | 10 / giờ / user; giới hạn dung lượng + loại file ở server |

- Header bảo mật tối thiểu (đặt ở platform/host, không chỉ trong code):

| Header | Giá trị khởi điểm | Ghi chú |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` | Thử `Content-Security-Policy-Report-Only` trước; nới `connect-src`/`img-src` đúng domain thật, không dùng `*` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Chỉ bật khi mọi subdomain đã HTTPS; không thêm `preload` khi chưa được phép |
| `X-Content-Type-Options` | `nosniff` | Bắt buộc |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | — |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Chỉ mở quyền nào thật sự dùng |
| `frame-ancestors` | `'none'` (trong CSP) | Chỉ cho phép khi có lý do nhúng iframe |

- Không dùng CSP chỉ để "đối phó" rồi thêm `'unsafe-eval'`/`*`. Nếu framework cần nonce/hash, cấu hình đúng và kiểm tra lại sau khi bật.
- Audit dependency: `<pm> audit` (hoặc `npm audit --omit=dev`, `pnpm audit --prod`) trước bàn giao; không tự chạy `audit fix --force`. Ghi lại số lỗ hổng đã biết và quyết định.
- Third-party script chỉ khi được yêu cầu; ghi vào `DECISIONS.md`; không thêm tracker lén.

### 3.12.1 Quét secret (bắt buộc ở G9)

```bash
# 1) Quét lịch sử git + working tree
gitleaks git --redact --no-banner

# 2) Quét bundle/build output (sau khi build)
gitleaks dir dist --redact --no-banner   # đổi dist thành .next/out/build

# 3) Kiểm tra file env bị track
git ls-files | grep -E '(^|/)\.env($|\.)' || true
```

- `gitleaks` exit `0` = không phát hiện; exit `1` = có leak. Chỉ dùng `--redact` để log không in secret ra terminal/CI.
- Phát hiện leak → **không chỉ xoá dòng**. Báo ngay, coi key đã lộ, đề xuất rotate, rồi mới làm sạch lịch sử (nếu được phép). Không tự `filter-branch`/`BFG` trên repo đã push.
- File `.env.example` chỉ chứa tên biến + mô tả, không giá trị thật.
- Không thay `gitleaks` bằng `grep` tự chế làm gate duy nhất; grep chỉ là kiểm tra phụ.
- Ghi chú 2026-10: README của `gitleaks/gitleaks` công bố dự án đã **feature-complete**, chỉ nhận security patch. Vẫn dùng được, nhưng đừng giả định có rule mới; kiểm tra release gần nhất trước khi dựa vào một rule cụ thể.

---

## 4. CHẤT LƯỢNG THIẾT KẾ

### 4.1 Quy trình

1. Viết **2 hướng thị giác** khác nhau thật (ví dụ: "biên tập giấy, chữ lớn, đường kẻ mảnh" vs "kỹ thuật tối, dữ liệu dày, tương phản cao"), mỗi hướng 5 dòng.
2. Chọn 1, ghi lý do vào `DECISIONS.md`.
3. Chốt tokens (màu, chữ, khoảng cách, bo góc, shadow, motion).
4. Dựng layout shell.
5. Mới dựng component.

Không bắt đầu bằng component rời rồi ghép thành trang.

### 4.2 Tokens mẫu (trung tính, thay bằng brand nếu có)

```css
:root {
  --bg: #F7F8F7;
  --surface: #FFFFFF;
  --surface-2: #EDF0EE;
  --border: #D7DDDA;          /* CHỈ đường kẻ trang trí */
  --border-strong: #7C8983;   /* viền control: input, button, card tương tác */
  --text: #16201C;
  --text-muted: #55625C;
  --primary: #2F5D50;
  --primary-contrast: #FFFFFF;
  --danger: #A63A32;
  --focus: #1F6FEB;

  --font-sans: "Be Vietnam Pro", system-ui, -apple-system, sans-serif;
  --step--1: 0.875rem;
  --step-0: 1rem;
  --step-1: 1.25rem;
  --step-2: 1.5rem;
  --step-3: 1.875rem;
  --step-4: 2.25rem;
  --step-5: 3rem;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;
  --space-7: 48px; --space-8: 64px; --space-9: 96px;

  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px;
  --shadow-1: 0 1px 1px rgb(16 24 20 / .04), 0 1px 2px rgb(16 24 20 / .06);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0F1513;
    --surface: #161D1A;
    --surface-2: #1E2723;
    --border: #2C3732;          /* CHỈ đường kẻ trang trí */
    --border-strong: #6A7A73;
    --text: #E7EDE9;
    --text-muted: #A2AFA8;
    --primary: #8FC7B4;
    --primary-contrast: #0C1310;
    --danger: #FFB4AB;
    --focus: #8AB4F8;
  }
}
```

**Tỉ lệ tương phản đã đo** (WCAG 2.x, relative luminance; đo lại khi đổi mã màu):

| Cặp | Light | Dark | Yêu cầu | Kết luận |
|---|---|---|---|---|
| text / bg | 15.69 | 15.56 | ≥ 4.5 | pass |
| text / surface | 16.70 | 14.44 | ≥ 4.5 | pass |
| text-muted / bg | 6.00 | 8.12 | ≥ 4.5 | pass |
| text-muted / surface-2 | 5.57 | 6.74 | ≥ 4.5 | pass |
| primary-contrast / primary | 7.49 | 9.85 | ≥ 4.5 | pass |
| danger / surface | 6.42 | 10.10 | ≥ 4.5 | pass |
| focus / bg | 4.35 | 8.76 | ≥ 3.0 | pass |
| border-strong / surface | 3.64 | 3.79 | ≥ 3.0 | pass |
| border-strong / surface-2 | 3.18 | 3.39 | ≥ 3.0 | pass |
| border (cũ) / surface | 1.38 | 1.39 | — | **chỉ trang trí** |

Luật:
- Mỗi cặp text/nền phải đạt 4.5:1 (text thường) hoặc 3:1 (chữ lớn ≥ 24px hoặc ≥ 18.66px bold).
- Viền control, focus ring, icon chức năng, ranh giới đồ thị phải ≥ 3:1 với nền kề nó. Dùng `--border-strong`, không dùng `--border`.
- `--border` chỉ được dùng cho đường kẻ trang trí không mang thông tin (divider, border của card không tương tác).
- Không dùng gradient làm nền chữ nếu chưa đo tương phản ở điểm xấu nhất.
- Không suy đoán "chắc là đủ tương phản": đo bằng script 13.6 hoặc DevTools, ghi kết quả vào `visual_ledger/`.

### 4.3 Typography

- Body 16–18px, `line-height` 1.5–1.7, measure 60–75ch.
- Tối đa 2 family; weight có mục đích, không dùng 5 weight cho 1 trang.
- Không mặc định dùng font "AI quen thuộc" mà không tinh chỉnh size/tracking.
- Số trong bảng: `font-variant-numeric: tabular-nums`.
- Tiêu đề dài: `text-wrap: balance` như progressive enhancement.
- Không căn đều (justify) cho tiếng Việt trên web.

### 4.4 Layout

- Grid 12 cột desktop, 4 cột mobile; gutter 16/24.
- Spacing chỉ lấy từ scale 4/8/12/16/24/32/48/64/96.
- Nội dung dài max 65–75ch; app shell có sidebar cố định, main scroll độc lập.
- Không center mọi thứ; tạo nhịp bằng khoảng trắng và căn lề có chủ đích.
- Mỗi màn hình có **một** điểm nhấn; còn lại lùi về sau.
- Sticky header phải không che anchor/focus; dùng `scroll-margin-top`.

### 4.5 Danh sách cấm ("AI slop")

- Gradient tím/xanh neon, glow, glassmorphism mặc định.
- Hero `100vh` chữ giữa + 2 nút + ảnh stock.
- 3 card đều nhau, icon tròn, tiêu đề + 2 dòng mô tả vô nghĩa.
- Bo góc 24px cho mọi thứ; shadow mờ lớn; viền mờ khắp nơi.
- Emoji làm icon chức năng; badge "New" không có nghĩa.
- "Lorem ipsum", "Your tagline here", "Giải pháp đột phá", "Nâng tầm trải nghiệm".
- Ảnh stock nước ngoài không liên quan; ảnh AI lỗi tay/mắt.
- Animation tự chạy liên tục; parallax nặng; custom cursor.
- Bịa logo khách hàng, số liệu, testimonial, giải thưởng.
- Dark mode bằng `filter: invert()`.

### 4.6 Nội dung

- Headline nói cụ thể: ai, làm gì, cho ai, khác gì.
- CTA mô tả hành động ("Đặt lịch tư vấn"), không lặp "Tìm hiểu thêm" 5 lần.
- Nội dung mẫu phải đánh dấu trong `CONTENT_MAP.md`, không trộn với nội dung thật.
- Microcopy cho loading/empty/error/success do người viết, không dùng "Something went wrong".
- Số liệu chỉ dùng khi có nguồn; nếu không, bỏ số liệu thay vì bịa.

### 4.7 Motion

- Micro: 120–200ms; chuyển cảnh: 200–320ms.
- Easing chuẩn (ease-out cho vào, ease-in cho ra); không bounce quá đà.
- Tôn trọng `prefers-reduced-motion: reduce` — tắt transform/parallax, giữ thay đổi trạng thái tức thời.
- Không animation che chậm nội dung; không autoplay video có tiếng.

### 4.8 Trạng thái bắt buộc

Mọi view có dữ liệu hoặc tương tác phải có: **loading, empty, error, success, disabled, hover, focus, active**.

- Loading: dùng loading skeleton (khối giữ chỗ đúng hình dạng nội dung; **khác** page skeleton của pass 1), không spinner toàn trang nếu chỉ một vùng.
- Empty: giải thích vì sao trống + hành động tiếp theo.
- Error: nguyên nhân ngắn + cách thử lại + không mất dữ liệu.

### 4.9 Responsive

Test tối thiểu: 320, 360, 390, 414, 768, 1024, 1280, 1440.

- Không horizontal scroll ở bất kỳ mức nào.
- Không chữ < 14px; body ≥ 16px.
- Tap target ≥ 44×44px (WCAG AA yêu cầu 24px; thiết kế 44px).
- Không hover-only; mọi hành động có bản mobile.
- Bảng: scroll ngang có chỉ báo, hoặc chuyển card ở mobile.
- Nav mobile: tối đa 5 mục chính + "Thêm"; không nhét 20 mục vào hamburger.
- Ảnh và iframe co giãn, không tràn.

---

## 5. ACCESSIBILITY & PERFORMANCE

### 5.1 WCAG 2.2 AA — checklist bắt buộc

- Tương phản: 4.5:1 text thường, 3:1 chữ lớn và UI/focus.
- Bàn phím: mọi chức năng dùng được; không bẫy focus; `Esc` đóng modal; focus trả về nơi mở.
- Focus indicator ≥ 2px, tương phản 3:1 với nền; không bị sticky header che (2.4.11).
- Landmarks: `header`, `nav`, `main`, `footer`; skip link; đúng một `main`.
- Heading tuần tự, không nhảy cấp; một `h1`.
- Ảnh có `alt` phù hợp; icon chức năng có accessible name.
- Form: label, lỗi gắn field, `autocomplete`, không bắt nhập lại thông tin đã có (3.3.7), không chặn paste (3.3.8).
- Target size ≥ 24×24 CSS px (2.5.8); thiết kế 44×44.
- Reflow ở 320px và zoom 400% không mất nội dung; text spacing override không vỡ.
- Không dùng màu làm tín hiệu duy nhất.
- `prefers-reduced-motion`; không autoplay > 5s.
- Link phân biệt với text (underline hoặc tương phản + không chỉ màu).
- Ngôn ngữ khai báo; đoạn ngôn ngữ khác có `lang`.
- Dialog: `role="dialog"`, `aria-modal`, label, focus trap, khoá scroll nền đúng, `inert` cho nền.

### 5.2 Budget

**Phân biệt hai loại số — không được lẫn:**

- **Field (thực địa):** dữ liệu người dùng thật, percentile 75, cửa sổ 28 ngày, lấy từ CrUX/PageSpeed Insights. Chỉ có sau khi site có traffic. Không đo được trên máy local.
- **Lab (phòng thí nghiệm):** Lighthouse chạy trên máy/CI với điều kiện cố định. Đây là thứ dùng làm gate. Lab **không** chứng minh Core Web Vitals field đạt.

**5.2.1 Field — theo dõi sau deploy**

| Metric | Ngưỡng p75 |
|---|---|
| LCP | ≤ 2.5s |
| INP | ≤ 200ms |
| CLS | ≤ 0.1 |

Nếu chưa có field data: ghi `chưa có field data`, không tuyên bố "CWV đạt".

**5.2.2 Lab — gate ở P3**

Điều kiện đo: production build, Lighthouse **mobile preset** (trừ khi brief nói desktop-only), cache lạnh, không extension, cùng một runner, **3 lần chạy lấy median** (LHCI `numberOfRuns: 3`), ghi rõ phiên bản Lighthouse.

| Hạng mục | Ngưỡng |
|---|---|
| LCP | ≤ 2.5s |
| TBT (proxy cho INP) | ≤ 200ms |
| CLS | ≤ 0.1 |
| TTFB | ≤ 800ms |
| JS ban đầu | ≤ 170KB gzip (marketing) / ≤ 300KB (app shell) |
| CSS | ≤ 60KB gzip |
| Ảnh hero | ≤ 200KB |
| Tổng trang | ≤ 1.5MB |
| Font | ≤ 2 family, ≤ 4 file woff2, ≤ 180KB |
| Điểm Lighthouse | Perf ≥ 90 marketing / ≥ 85 app; A11y = 100; Best Practices ≥ 95; SEO = 100 |
| axe | 0 serious, 0 critical |

Đây là budget mặc định. Vượt ngưỡng → phải ghi lý do, số đo thật, và phương án trong `DECISIONS.md`; không được lặng lẽ nới ngưỡng để pass.

### 5.3 Kỹ thuật

- Critical CSS inline cho site tĩnh; code splitting theo route.
- Dynamic import cho modal, editor, chart, map.
- Preload chỉ LCP image + font chính; không preload 10 thứ.
- Third-party: `defer`, self-host nếu được, facade cho YouTube/map.
- Ảnh qua CDN/resize; không serve ảnh 4000px cho card 300px.
- Cache asset có hash rất dài; HTML cache ngắn.
- Đo trên **build production**, không đo dev server.
- Không tối ưu bằng cách bỏ accessibility hoặc nội dung.

### 5.4 Cách đo

**Bước 1 — build production** bằng đúng script của repo (xem 2.1). Không đo trên dev server.

**Bước 2 — cấu hình LHCI** trong `lighthouserc.json` (định dạng đã kiểm chứng với docs LHCI):

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 1 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500, "aggregationMethod": "median" }],
        "total-blocking-time": ["error", { "maxNumericValue": 200, "aggregationMethod": "median" }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1, "aggregationMethod": "median" }]
      }
    },
    "upload": {
      "target": "filesystem",
      "outputDir": "./.lhci"
    }
  }
}
```

- `staticDistDir` trỏ tới thư mục **chứa `index.html`** của build (`dist`, `out`, `build`, `.next`… tuỳ framework). Với site tĩnh không build, trỏ tới thư mục site, đừng trỏ repo root nếu có `node_modules`.
- App SSR cần server chạy: thay `staticDistDir` bằng `"startServerCommand": "<pm> start"` và `"url": ["http://localhost:3000/", "..."]`.
- `upload.target: "filesystem"` giữ report ở máy, tránh đưa report lên kho công khai. Chỉ dùng `temporary-public-storage` khi được phép công khai.
- Mặc định Lighthouse là mobile. Chỉ thêm `"settings": { "preset": "desktop" }` khi brief yêu cầu desktop.

**Bước 3 — chạy:**

```bash
<pm> add -D @lhci/cli   # pnpm/yarn: add -D · npm: npm i -D · bun: bun add -d
<pm> exec lhci autorun
```

Ghi vào báo cáo: phiên bản `@lhci/cli` + Lighthouse, lệnh thật, 3 điểm Perf/A11y/BP/SEO, và 3 metric LCP/TBT/CLS của run median. Không chép điểm từ lần chạy cũ hoặc từ máy khác.

---

## 6. KIỂM THỬ

### 6.1 Bảng test

| Lớp | Tool | Khi chạy | Điều kiện pass |
|---|---|---|---|
| Unit (logic, format, validate) | Vitest/Jest | Mỗi pass | 100% test mới pass |
| Component (render, interaction) | Testing Library | Mỗi pass | Không snapshot vô nghĩa |
| E2E | Playwright | P2, P3 | 0 fail, 0 skip mới |
| A11y | axe (`@axe-core/playwright`) | P2, P3 | 0 serious/critical |
| Visual | Playwright screenshot | P3 | Diff được review |
| Performance | Lighthouse CI | P3 | Đạt budget 5.2.2 |
| HTML | html-validate / Nu validator | Site tĩnh | 0 error |

Nếu repo chưa có test runner: greenfield được thêm; brownfield chỉ thêm khi được đồng ý, nếu không thì ghi `blocked` phần test tự động và nêu cách kiểm tra thủ công.

- Chỉ dùng runner đã có trong repo. Không trộn Vitest + Jest trong cùng app.
- Playwright: cài browser bằng `<pm> exec playwright install --with-deps` (CI) hoặc `npx playwright install --with-deps`; pin version theo lockfile. Không giả định máy đã có Chromium/WebKit/Firefox.
- "0 skip mới" nghĩa là số test bị skip không tăng so với baseline ghi ở đầu pass. Không dùng skip để làm xanh gate.
- Với site tĩnh không có `package.json`: dùng `html-validate`, `pa11y-ci`, `linkinator` qua `npx`, ghi version thực tế.

### 6.2 E2E tối thiểu (mọi site)

1. Trang chủ load, không console error, không asset 404.
2. Điều hướng tới từng trang chính; active state đúng.
3. Form: happy path + lỗi validation + lỗi server.
4. Trang 404 đúng, có đường về.
5. Mobile 390px: không overflow, menu mở/đóng, CTA bấm được.
6. Keyboard-only: tab qua nav → main → form → submit, focus luôn thấy.
7. `prefers-reduced-motion`: không animation chuyển động.
8. Dark mode (nếu có): không mất tương phản.

**Cách thu "console error" cho đúng** (theo định nghĩa 0.6):

```ts
const errors: string[] = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("response", (r) => {
  if (r.url().startsWith(baseURL) && r.status() >= 400) {
    errors.push(`http ${r.status()}: ${r.url()}`);
  }
});
await page.goto("/");
await expect(errors).toEqual([]);
```

- Chỉ tính lỗi có origin của site. Log của extension/third-party không chặn gate, nhưng phải ghi chú nếu xuất hiện.
- `favicon.ico` 404 trên site tĩnh vẫn tính là asset 404: thêm favicon thật hoặc khai báo rỗng hợp lệ.

Với web app, thêm: đăng nhập/đăng xuất, phân quyền, luồng chính, trạng thái lỗi mạng.

### 6.3 Luật test

- Không `.skip`, `.only`, `sleep` cứng; chờ theo điều kiện.
- Không mock thứ chạy thật được (API local, DB local).
- Test flaky (định nghĩa 0.6: 3 lần chạy lại cùng commit/môi trường, ≥ 1 fail): sửa nguyên nhân (chờ theo điều kiện, cố định timezone/locale, cô lập dữ liệu). Nếu chưa sửa được ngay: quarantine bằng `test.fixme`/`skip` **kèm link issue, người phụ trách, hạn ≤ 14 ngày**; hết hạn thì CI phải fail. Không im lặng, không "rerun đến khi xanh".
- Không tăng timeout toàn cục để che test chậm; đo lại và tối ưu test.
- Test phải fail khi code sai. Nếu không, xoá hoặc viết lại.
- Coverage không phải mục tiêu; hành vi quan trọng là mục tiêu.
- Không viết test chỉ để tăng số lượng.

### 6.4 Kiểm tra thủ công tối thiểu trước khi báo xong

- Mở bằng bàn phím, không dùng chuột.
- Zoom 200% và 400%.
- Tắt JS (với site nội dung).
- Mạng chậm (DevTools throttle).
- Một trình duyệt khác engine (Firefox hoặc WebKit).

### 6.5 Visual regression — quy tắc chụp

- Cố định: viewport 1280×720 và 390×844, `deviceScaleFactor: 1`, `locale: "vi-VN"`, `timezoneId: "Asia/Ho_Chi_Minh"`, `colorScheme` xác định.
- Tắt animation và caret khi chụp: `animations: "disabled"`, `caret: "hide"`.
- Mask vùng động: ngày giờ, avatar, số ngẫu nhiên, quảng cáo, bản đồ.
- Chấp nhận sai số nhỏ: `maxDiffPixelRatio: 0.01` (hoặc `maxDiffPixels` cụ thể). Không dùng `threshold` cao để che lỗi thật.
- Baseline chỉ nằm ở **một** môi trường CI (một OS, một browser build), vì font rendering khác nhau giữa OS.
- Cập nhật baseline (`--update-snapshots`) chỉ sau khi **người review xem diff**; commit ảnh baseline cùng PR, ghi lý do.
- Ảnh baseline lưu trong repo hoặc artifact có version; không để ngoài và không tự xoá.

---

## 7. GITHUB RESEARCH & SKILL DISCOVERY (BẮT BUỘC)

> Đây là bước **bắt buộc**, có gate **G0** ở 11.1. Không có `.memory/RESEARCH.md` đủ mục thì **không được bắt đầu PASS 1** và không được thêm dependency mới.

### 7.0 Khi nào phải tra

| Tình huống | Mức | Tối thiểu phải có |
|---|---|---|
| Greenfield, chọn stack | Bắt buộc | 3 mục research + đọc 1 repo mẫu 10 phút |
| Chọn hoặc thêm dependency | Bắt buộc | Repo, license, release gần nhất, issue mở về đúng nhu cầu |
| Dùng API/attribute/CSS property không chắc | Bắt buộc | MDN hoặc docs chính thức, đúng version |
| Bug > 15 phút, hoặc lần sửa thứ 1 thất bại | Bắt buộc | Issue/PR đúng version hoặc repo tái hiện |
| Brief nói "làm giống X" | Bắt buộc | 2 repo cùng loại + ghi rõ giữ/bỏ gì |
| Sửa text, màu, khoảng cách; bug đã biết trong repo | Không bắt buộc | Ghi 1 dòng lý do "không cần research" vào RESEARCH.md |

### 7.1 Ba câu phải viết trước khi search

1. Mình cần biết **chính xác** gì? (một câu, có version/ngữ cảnh)
2. Đoán hiện tại của mình là gì, và tự tin ở mức nào?
3. Kết quả nào sẽ khiến mình **đổi cách làm**?

Không viết 3 câu này thì search chỉ để "xem cho có". Ghi cả 3 vào `RESEARCH.md` trước khi mở trình duyệt.

### 7.2 Thứ tự nguồn tin cậy

1. Spec chuẩn: W3C/WHATWG, MDN.
2. Docs chính thức của framework/thư viện, đúng version.
3. Mã nguồn + test của repo chính chủ.
4. Issue/PR **đã merge** trong repo chính chủ.
5. RFC/design doc, changelog, release note.
6. Blog/Stack Overflow: chỉ để hiểu vấn đề, **không copy code**.

Khi mâu thuẫn: mã nguồn > docs > blog. Ghi ngày truy cập và version/commit vào mọi mục.

### 7.3 Query matrix — lệnh thật (gh CLI)

```bash
# 0) Kiểm tra công cụ trước; không có gh thì dùng WebFetch/WebSearch và ghi URL.
gh auth status

# 1) Tìm repo mẫu cùng loại, ưu tiên mới cập nhật
gh search repos "astro blog" --sort updated --limit 10
gh search repos "next.js dashboard" --sort stars --limit 10

# 2) Tìm code mẫu của đúng API đang cân nhắc
gh search code "useFormStatus" --language typescript --limit 20
gh search code "playwright.config" --filename playwright.config.ts --limit 20

# 3) Tìm lỗi đã gặp (dùng nguyên văn thông báo, đặt trong ngoặc kép)
gh search issues "\"Hydration failed because the server rendered HTML\"" --limit 20
gh search issues "INP high" --repo vercel/next.js --state closed --limit 10

# 4) Tìm cách sửa đã được merge (đáng tin hơn blog)
gh search prs "hydration mismatch" --repo vercel/next.js --merged --limit 10

# 5) Đọc release/breaking change
gh release list --repo vercel/next.js --limit 5
gh release view --repo vercel/next.js
```

- `gh search issues --state` chỉ nhận `open|closed`; muốn tìm cả hai thì **bỏ** `--state`. Không truyền `all`.
- `gh search code` cần đăng nhập. Chưa auth → dùng API hoặc web, ghi rõ.
- Không có `gh` hoặc mạng bị chặn → `blocked`; **không đoán** kết quả research.

**Fallback API (không cần gh):**

```bash
curl -s "https://api.github.com/search/repositories?q=astro+blog&sort=updated&per_page=10"
curl -s "https://api.github.com/search/issues?q=%22hydration+mismatch%22+repo:vercel/next.js&per_page=10"
```

API search chưa auth bị giới hạn thấp (khoảng 10 request/phút); không loop vô hạn.

**Đọc repo mẫu không cần clone:**

```bash
gh repo clone owner/repo /tmp/research-repo -- --depth 1
```

Clone nông vào `/tmp`, không đưa vào repo dự án. Đọc xong ghi lại, không copy `node_modules`.

### 7.4 Quy trình đọc repo mẫu (10–15 phút)

1. `README` + `LICENSE` + commit gần nhất: repo còn sống không, license có cho dùng không.
2. `package.json`: scripts, dependency chính, `engines`, package manager.
3. Cây thư mục 2 cấp: cách họ chia `app/`, `components/`, `lib/`.
4. **Một** route hoặc component gần với việc mình làm + test của nó.
5. CI workflow: họ chạy lint/test/build/e2e thế nào.
6. Ghi vào `RESEARCH.md`: 3 điều sẽ áp dụng, 3 điều **không** áp dụng (và vì sao).

Cấm: đọc cả repo, copy nguyên theme/template, đổi logo rồi nhận là của mình, dùng repo không rõ license.

### 7.5 Tiêu chí chọn repo mẫu

- Có `LICENSE` rõ ràng; ưu tiên MIT/Apache-2.0/BSD. Giấy phép phải đọc trực tiếp trong repo, **không suy đoán từ tên**.
- Commit trong 6 tháng gần nhất; nếu cũ hơn, ghi lý do vẫn dùng (ví dụ: pattern ổn định).
- Có test hoặc CI — dấu hiệu code chạy thật.
- Stars chỉ là tín hiệu phụ, không phải tiêu chí quyết định.
- Cùng loại dự án và cùng ràng buộc (SSR/SSG, auth, thanh toán), không chọn repo "quá lớn" rồi bê nguyên kiến trúc vào site 5 trang.

### 7.6 Bảng bằng chứng bắt buộc — `.memory/RESEARCH.md`

```md
# RESEARCH

## Câu hỏi
1. ...
2. ...
3. ...

## Bảng bằng chứng
| # | Câu hỏi | Nguồn (URL) | Loại | Ngày | Version/commit | Áp dụng vào | Kết luận |
|---|---|---|---|---|---|---|---|
| 1 | Astro có hỗ trợ i18n tích hợp? | https://docs.astro.build/... | docs | 2026-10-24 | Astro 5.x | src/i18n | Dùng routing thủ công, không thêm plugin |

## Repo đã đọc
| Repo | License | Commit | Điều áp dụng | Điều không áp dụng |
|---|---|---|---|---|
| owner/repo | MIT | abc1234 | Cấu trúc `features/` | Không dùng state library |

## Không áp dụng
- ...
```

Ngưỡng tối thiểu cho G0:

| Chế độ | Số mục tối thiểu | Bắt buộc có |
|---|---|---|
| Greenfield | 3 | ≥ 1 docs chính thức + ≥ 1 repo mẫu đã đọc theo 7.4 |
| Brownfield, thêm feature | 2 | ≥ 1 docs/issue đúng version |
| Brownfield, sửa bug | 1 | Issue/PR hoặc docs tái hiện được |
| Sửa text/CSS thuần | 0 | 1 dòng lý do |

### 7.7 Repo tham khảo theo nhu cầu (kiểm tra ngày 2026-10-24)

| Nhu cầu | Repo nên xem | Dùng để |
|---|---|---|
| SaaS Next.js đầy đủ (auth, DB, Stripe) | `nextjs/saas-starter` (MIT) | Cấu trúc app router, auth, thanh toán |
| Framework | `withastro/astro`, `vercel/next.js`, `vitejs/vite`, `sveltejs/kit`, `nuxt/nuxt` | Routing, data fetching, build |
| UI primitive / token | `shadcn-ui/ui`, `radix-ui/primitives`, `tailwindlabs/tailwindcss` | Component accessible, token, dark mode |
| E2E / visual | `microsoft/playwright` | Selector, fixture, screenshot, trace |
| Unit | `vitest-dev/vitest`, `testing-library/react-testing-library` | Test hành vi |
| A11y | `dequelabs/axe-core`, `w3c/wcag` | Rule, kỹ thuật WCAG 2.2 |
| Perf | `GoogleChrome/lighthouse-ci`, `GoogleChrome/web-vitals` | Gate CI, đo field |
| Baseline trình duyệt | `web-platform-dx/web-features` (Apache-2.0) | Dữ liệu Baseline, tránh API quá mới |
| HTML/link | `html-validate/html-validate`, `JustinBeckwith/linkinator` | Validate HTML, link chết |
| Secret scan | `gitleaks/gitleaks` (MIT) | Quét secret trong git và build |
| Bảo mật | `OWASP/CheatSheetSeries`, `helmetjs/helmet` | CSP, cookie, CSRF, rate limit |
| Static site | `11ty/eleventy` | Site nội dung không framework |
| WordPress | `WordPress/wordpress-develop` | Block theme, PHP convention |

Không có trong bảng không có nghĩa là cấm. Bảng này là điểm bắt đầu, không phải danh sách đầy đủ. Mọi repo vẫn phải qua 7.5.

### 7.8 License & độ mới

- Copy đoạn code > 20 dòng: phải giữ header license (nếu có) và ghi vào `CREDITS.md`.
- Không copy từ blog không rõ nguồn, không copy snippet không có repo gốc.
- Bài viết > 12 tháng hoặc không ghi version: kiểm tra lại API trước khi áp dụng.
- Docs luôn thắng blog; mã nguồn thắng docs khi mâu thuẫn.
- Repo đã archive hoặc không commit > 24 tháng: chỉ dùng để đọc ý tưởng, không thêm làm dependency.

### 7.9 Skill discovery — biến research thành skill

Chỉ tạo skill khi kiến thức đó sẽ dùng **≥ 2 lần** trong dự án. Không biến mọi link thành skill.

```
.agents/skills/
├─ <stack>/SKILL.md
├─ design-system/SKILL.md
├─ accessibility/SKILL.md
├─ performance/SKILL.md
├─ seo/SKILL.md
├─ testing/SKILL.md
├─ security/SKILL.md
└─ deploy/SKILL.md
```

Mỗi `SKILL.md`:

```md
---
name: <kebab-case>
description: <một câu: dùng khi nào>
last_verified: 2026-10-24
sources:
  - <URL> (version, ngày truy cập)
---

# Khi nào dùng
# Quy trình
# Checklist xác minh
# Sai lầm thường gặp
# Ví dụ tối thiểu
# Nguồn
```

- `description` phải nói **khi nào dùng**, không chỉ nói "kiến thức về X".
- Trong skill chỉ ghi điều đã kiểm chứng; điều chưa chắc đánh dấu `[CHƯA KIỂM CHỨNG]`.
- Skill lỗi thời: cập nhật `last_verified` hoặc xoá; không để 2 skill mâu thuẫn nhau.

### 7.10 Progressive disclosure

Không nạp toàn bộ skill vào context. Chỉ đọc skill khi task chạm lĩnh vực đó. Ghi lại skill nào đã dùng trong báo cáo pass. Nếu phải đọc > 3 skill cho một thay đổi nhỏ, dừng lại: phạm vi đang quá rộng.

### 7.11 Research trong bug protocol

Khi bug không tái hiện được hoặc sửa lần 1 thất bại:

1. Trích **nguyên văn** thông báo lỗi + version.
2. `gh search issues "<thông báo>"` (bỏ `--state` để tìm cả open/closed).
3. `gh search prs "<từ khoá>" --repo <repo> --merged`.
4. Đọc issue/PR, xác định điều kiện tái hiện có giống mình không.
5. Ghi vào `BUGS.md`: nguồn + kết luận + vì sao áp dụng được/không.

Không dán link issue vào báo cáo mà không nói nó thay đổi giả thuyết gì.

---

## 8. BỘ NHỚ DỰ ÁN

### 8.1 `.memory/PROJECT_STATE.md`

```md
# PROJECT STATE
Cập nhật: 2026-10-24

## Stack & version
- Framework: ... (nguồn: package.json)
- Node: ... (nguồn: .nvmrc)
- CSS: ...
- Test: ...

## Cấu trúc
- Entry: ...
- Routes: ...
- Components chính: ...
- API/DB: ...

## Đã xong
- [x] ...

## Đang làm
- [ ] ...

## Vấn đề mở
- ...
```

### 8.2 `.memory/DECISIONS.md`

Mỗi quyết định một mục: ngày, bối cảnh, lựa chọn, lý do, phương án bị loại, hệ quả. Đánh dấu `[GIẢ ĐỊNH]` cho mọi thứ tự quyết.

### 8.3 `.memory/DESIGN_SPEC.md`

Tokens, type scale, spacing, component inventory, trạng thái, breakpoint, ảnh/font, lý do thẩm mỹ.

### 8.4 `.memory/CONTENT_MAP.md`

| Trang/section | Nội dung | Nguồn | Trạng thái |
|---|---|---|---|
| Hero | `[[HEADLINE]]` | người dùng | placeholder |
| Bảng giá | 3 gói | brief | thật |

Trạng thái: `thật` | `placeholder` | `cần duyệt`. Placeholder dùng cú pháp `[[...]]` theo 0.5; không dùng câu mẫu vô nghĩa.

### 8.5 `.memory/visual_ledger/`

Mỗi vòng kiểm tra lưu: screenshot 360/768/1280/1440, ảnh dark mode, kết quả Lighthouse, ảnh lỗi. Kèm `index.md` ghi ngày, commit, điểm, vấn đề.

Kiểm tra overflow tự động:

```js
const ok = await page.evaluate(
  () => document.documentElement.scrollWidth <= window.innerWidth
);
```

### 8.6 `.memory/BUGS.md`

Mỗi bug: triệu chứng, cách tái hiện, nguyên nhân, cách sửa, test chống tái phát, trạng thái.

### 8.7 `.memory/RESEARCH.md`

Bắt buộc khi dự án có bất kỳ quyết định nào dựa trên nguồn ngoài (mục 7). Tối thiểu gồm:

```md
# RESEARCH
Cập nhật: <ngày>

## Câu hỏi
1. ... (kèm version/ngữ cảnh)

## Bằng chứng
| # | Câu hỏi | Nguồn | Loại | Ngày | Version/commit | Áp dụng vào | Kết luận |
|---|---|---|---|---|---|---|---|

## Repo đã đọc
| Repo | License | Commit | Áp dụng | Không áp dụng |
|---|---|---|---|---|

## Điều đã bị bác bỏ
- Giả thuyết/giải pháp: ... → bác bỏ vì ... (nguồn)
```

- Không xoá mục cũ; khi kết luận thay đổi thì thêm dòng mới và đánh dấu mục cũ `[LỖI THỜI]`.
- Mỗi dòng phải mở được bằng URL công khai hoặc link commit; không ghi "theo tôi biết".
- RESEARCH.md là bằng chứng cho G0; thiếu nó thì không được báo pass 1.

### 8.8 Luật cập nhật

- Sau mỗi pass.
- Sau mỗi quyết định kiến trúc/thẩm mỹ.
- Sau mỗi bug được sửa.
- Sau mỗi lần research làm đổi quyết định (ghi vào `RESEARCH.md` + `DECISIONS.md`).
- Trước khi kết thúc phiên làm việc.

Không để cuối dự án mới ghi.

---

## 9. BUG PROTOCOL

### 9.1 Triage theo thứ tự

1. **Đọc lỗi thật**: message, stack, console, network status, response body.
2. **Tái hiện tối thiểu**: một route, một component, một input.
3. **So sánh môi trường**: dev vs build vs preview; local vs deploy.
4. **Cache/env/version**: env thiếu, lockfile lệch, cache trình duyệt, service worker.
5. **CSS**: computed style, specificity, layer, file chưa import, purge sai.
6. **Viewport/zoom/font**: chỉ lỗi ở mobile? chỉ khi zoom? font fallback?
7. **Đối chiếu docs/known issue**: tìm đúng version; dùng nguyên văn thông báo lỗi.
8. **Tra GitHub** (theo 7.11): issue/PR đã merge, repo tái hiện tối thiểu; ghi nguồn vào `BUGS.md`.
9. **Kiểm tra khác biệt môi trường**: chỉ lỗi ở production? chỉ sau deploy? so commit đang chạy với commit đã test.

### 9.2 Bảng triệu chứng → kiểm tra trước

| Triệu chứng | Kiểm tra trước |
|---|---|
| Hydration mismatch | `Date.now()`, `Math.random()`, `window` trong render; HTML lồng sai (`p > div`); extension trình duyệt |
| CSS không áp | specificity, layer, purge, import, cache, build có nhận file mới |
| Build pass, deploy lỗi | env thiếu, base path, output dir, path phân biệt hoa/thường |
| Asset 404 | `public/` path, base URL, trailing slash, case |
| Form không gửi | `name` attribute, `preventDefault`, `action`, CORS, cookie, CSRF |
| Layout vỡ mobile | width cố định, `100vh`, từ dài, bảng, iframe, ảnh không `max-width` |
| Font sai dấu | subset thiếu `vietnamese`, fallback, `unicode-range` |
| LCP chậm | ảnh lớn, font block, JS che, TTFB, render-blocking CSS |
| INP kém | listener nặng, re-render lớn, third-party, long task |
| CLS cao | ảnh không kích thước, font swap, banner chèn muộn |
| A11y fail | contrast, label, focus, `aria-*`, thứ tự heading |
| Test flaky | animation, network, timezone, selector, race |

### 9.2.1 Phân loại mức độ (dùng để quyết định dừng hay tiếp)

| Mức | Dấu hiệu | Hành động |
|---|---|---|
| **P0** | Site không tải, thanh toán/auth hỏng, mất dữ liệu, lộ secret | Báo ngay; đề xuất rollback/disable trước khi sửa gốc; không chờ đủ 2 lần |
| **P1** | Luồng chính hỏng nhưng có workaround; lỗi chỉ trên một phần người dùng | Sửa ngay trong pass hiện tại, có test chống tái phát |
| **P2** | Lỗi hiển thị, a11y serious, hiệu năng vượt budget | Đưa vào pass 3 hoặc backlog có ngày |
| **P3** | Nitpick thẩm mỹ, warning, lỗi hiếm | Ghi lại; không chặn bàn giao trừ khi vi phạm 1–3 ở 1.2 |

Quy tắc: P0/P1 không được "để sau". P2/P3 phải có mục trong `BUGS.md` với mức tương ứng, không nằm trong trí nhớ.

### 9.3 Luật 2 lần + báo cáo

- Lần 1: giả thuyết → sửa → verify.
- Lần 2: giả thuyết **khác** → sửa → verify.
- Lần 3: dừng. Không sửa nữa.

Báo cáo:

```md
## Bug
- Triệu chứng:
- Mức: P0 | P1 | P2 | P3
- Tái hiện:
- Môi trường: (dev/build/preview; browser; OS; version)
- Ảnh hưởng: (ai, luồng nào, dữ liệu gì)

## Đã thử
1. <giả thuyết> → <lệnh> → <kết quả>
2. ...

## Nguồn đã tra
- <issue/PR/docs + version + ngày> → <thay đổi giả thuyết gì> hoặc "không tìm thấy"

## Nguyên nhân nghi ngờ
...

## Phương án
### A. Tối thiểu (ít rủi ro)
- Thay đổi:
- Ảnh hưởng:
- Cách verify:

### B. Sửa gốc
- Thay đổi:
- Ảnh hưởng:
- Cách verify:

### C. Workaround
- Thay đổi:
- Nợ kỹ thuật:
- Khi nào phải sửa lại:

## Khuyến nghị
...
```

Chờ duyệt trước khi làm tiếp.

### 9.4 Cấm khi debug

- Sửa 5 thứ cùng lúc để "chắc ăn".
- Thêm `setTimeout` để che race.
- Xoá test, tắt lint, hạ version không liên quan.
- `!important`, `any`, `@ts-ignore` không ghi lý do.
- Đổ lỗi cho "cache" khi chưa kiểm tra hard reload/incognito.

### 9.5 Rollback & hotfix

- P0 trên production: ưu tiên **ổn định trước, sửa gốc sau**. Đề xuất rollback về bản trước hoặc tắt feature bằng cờ; chỉ thực hiện khi được phép.
- Trước khi rollback: ghi commit đang chạy, thời điểm, triệu chứng, phạm vi ảnh hưởng.
- Hotfix: nhánh riêng từ tag production, thay đổi tối thiểu, chạy đúng gate liên quan (không cần full pass 3), rồi backport vào nhánh chính.
- Sau hotfix: thêm test tái hiện + mục `BUGS.md`; không coi hotfix là đã xong root cause.

---

## 10. KẾ HOẠCH 3 PASS

### 10.1 PASS 1 — Research, khảo sát, stack, design system, page skeleton

**Entry:** brief + quyền truy cập repo.

**Bước 0 — Research (bắt buộc, gate G0):**

1. Viết 3 câu hỏi theo 7.1 vào `.memory/RESEARCH.md`.
2. Tra theo 7.3 (gh CLI hoặc WebFetch/WebSearch); đọc 1 repo mẫu theo 7.4.
3. Ghi bằng chứng đủ ngưỡng 7.6; nêu rõ 3 điều áp dụng / 3 điều không.
4. Chốt stack + dependency **sau** khi có bằng chứng, không trước.

**Việc:**
1. Inventory (2.1), xác định greenfield/brownfield.
2. Chọn stack (2.2) hoặc xác nhận stack cũ; ghi ADR.
3. Chốt 1 hướng thị giác + tokens (4.1–4.2), đo tương phản.
4. Dựng layout shell: header, nav, main, footer, container, responsive cơ bản.
5. Lập route map đủ mọi trang trong brief.
6. Lập `CONTENT_MAP.md`; dựng page skeleton từng trang với nội dung thật hoặc placeholder `[[...]]`.
7. Trang 404, favicon, title/meta cơ bản, `robots.txt`.
8. README chạy được từ clone sạch; `.env.example`.
9. Cấu hình lint/typecheck/test/build (nếu greenfield).

**Cấm:** làm chi tiết section, animation, thêm dependency ngoài stack, polish màu mè.

**Exit gate:**

- G0 đạt: `RESEARCH.md` đủ mục theo 7.6.
- `install` + `build` pass; build lặp lại được từ clone sạch.
- Mọi route trong `brief.pages` render 200; route chính không console error.
- Không overflow ở 320px và 390px.
- Screenshot 4 viewport trong `visual_ledger/`.
- axe không có critical (serious có thể còn, ghi lại).
- `PROJECT_STATE.md` + `DECISIONS.md` + `RESEARCH.md` cập nhật.

"Xanh" ở đây theo định nghĩa 0.6: lệnh exit 0 **và** ngưỡng đạt **và** bằng chứng đã ghi. Thiếu một điều kiện thì chưa được sang pass 2.

**Tag:** `pass1-skeleton`.

### 10.2 PASS 2 — Nội dung, component, tương tác, responsive

**Entry:** pass 1 xanh theo 0.6, tag `pass1-skeleton` tồn tại, G0 đạt.

**Việc:**
1. Hoàn thiện từng section theo `CONTENT_MAP`.
2. Tách component tái sử dụng; trạng thái đủ (4.8).
3. Form + validation client/server + thông báo lỗi.
4. Data fetching/DB/auth nếu brief có.
5. Nav mobile, dark mode, responsive đủ breakpoint.
6. Microcopy thật cho mọi trạng thái.
7. E2E cho luồng chính (6.2).

**Cấm:** animation nặng, tối ưu vi mô, thêm trang ngoài route map, đổi design tokens giữa chừng mà không ghi lý do.

**Exit gate:**

- Lint + typecheck + unit/component test pass; số skip không tăng so với baseline.
- E2E luồng chính pass, không console error trên route chính.
- axe 0 serious/critical.
- Screenshot 4 viewport + dark mode.
- Không overflow; keyboard đi hết luồng chính.

**Tag:** `pass2-features`.

### 10.3 PASS 3 — Hardening & bàn giao

**Entry:** pass 2 xanh theo 0.6, tag `pass2-features` tồn tại.

**Việc:**
1. A11y full (5.1), sửa mọi serious/critical.
2. Performance đạt budget (5.2–5.3).
3. SEO đầy đủ (3.11), OG image, sitemap.
4. Security headers, cookie, validate, rate limit (3.12).
5. Cross-browser: Chromium, WebKit, Firefox.
6. Error boundary, 404, trạng thái mất mạng.
7. Deploy config + hướng dẫn rollback.
8. README hoàn chỉnh; dọn file rác, `console.log`.
9. Chạy toàn bộ Verify Gate (11).

**Exit gate:** toàn bộ mục 11 + Definition of Done.

**Tag:** `pass3-release`.

### 10.4 Git

- Tối thiểu 1 commit/pass; message nêu **vì sao**, không chỉ "update".
- Không commit `node_modules`, `dist`, `.next`, `.env`, screenshot tạm.
- Trước thay đổi lớn: commit nhỏ hoặc tag checkpoint.
- Không `reset --hard`, không amend commit đã push nếu chưa hỏi.

---

## 11. VERIFY GATE & DEFINITION OF DONE

### 11.1 Nguồn sự thật là `package.json` scripts

Không bịa lệnh. Kiểm tra script tồn tại trước khi chạy; nếu thiếu, dùng binary tương ứng và ghi rõ. `<pm>` xác định theo bảng 2.1.

| Gate | Mục đích | Lệnh | Pass |
|---|---|---|---|
| **G0** | Research | Kiểm tra `.memory/RESEARCH.md` theo 7.6 | Đủ số mục, đủ cột, có URL + ngày + version |
| **G1** | Cài tái lập | `pnpm install --frozen-lockfile` / `npm ci` / `yarn install --immutable` / `bun install --frozen-lockfile` | exit 0, lockfile không đổi |
| **G2** | Lint | `<pm> run lint` (không có script: `npx eslint .`) | 0 error, 0 warning mới |
| **G3** | Typecheck | `<pm> run typecheck` hoặc `<pm> exec tsc --noEmit` | 0 error |
| **G4** | Unit/component | Script `test` ở chế độ chạy một lần (Vitest: `vitest run`; Jest: `jest --ci`) | 0 fail, 0 skip mới |
| **G5** | Build production | `<pm> run build` | exit 0; ghi bundle size |
| **G6** | E2E | `<pm> run test:e2e` (Playwright) | 0 fail, 0 skip mới |
| **G7** | A11y | `<pm> run test:a11y` hoặc `pa11y-ci` | 0 serious/critical |
| **G8** | Performance | `<pm> exec lhci autorun` | Đạt budget 5.2.2 |
| **G9** | Security + smoke | `gitleaks git` + `gitleaks dir <build>` + `curl` header + `curl` route | 0 leak; header đủ; 200/404 đúng, không 500 |

Với site tĩnh: thay G3–G6 bằng:

```bash
npx html-validate "**/*.html"
npx pa11y-ci
npx linkinator . --recurse --skip "mailto:*"
```

- `pa11y-ci` đọc `.pa11yci`; nếu chưa có, tạo file trỏ đúng URL local/`staticDistDir` và ngưỡng lỗi. Exit `2` thường là lỗi cấu hình/chạy, không phải "pass".
- `linkinator` chỉ kiểm tra link nội bộ và link ngoài truy cập được; link ngoài chập chờn thì ghi rõ, không tắt toàn bộ kiểm tra.
- `html-validate` cấu hình ở `.htmlvalidate.json`; không tắt rule chỉ để pass.

**G9 — lệnh gợi ý (đổi build dir và port theo repo):**

```bash
gitleaks git --redact --no-banner
gitleaks dir dist --redact --no-banner

# Header: chạy trên preview server, không phải dev server
curl -sSI http://localhost:3000/ | grep -iE \
  'content-security-policy|strict-transport-security|x-content-type-options|referrer-policy|permissions-policy'

# Route: 200 cho trang có thật, 404 cho route không tồn tại
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/route-khong-ton-tai
```

HSTS chỉ quan sát được trên HTTPS/preview có domain; nếu kiểm tra localhost, ghi rõ "không áp dụng HSTS ở local" thay vì bỏ qua toàn bộ G9.

**Mỗi gate trong báo cáo phải có:** lệnh thật, exit code, 1–3 dòng kết quả, và version tool nếu là binary ngoài repo. Gate không chạy được vì thiếu môi trường → `blocked`, không phải "pass".

### 11.2 Ngưỡng pass

- 0 lỗi TypeScript/lint.
- 0 test fail; số test skip không tăng so với baseline.
- 0 axe serious/critical.
- Lighthouse đạt bảng 5.2.2; ghi rõ metric của run median.
- 0 horizontal scroll ở 320/360/390/768/1280.
- Không console error trên route chính (định nghĩa 0.6).
- `gitleaks git` và `gitleaks dir <build>` exit 0; không có `.env` bị track.
- 0 link nội bộ chết; 0 lỗi `html-validate`.
- Diff không còn `console.log`, `debugger`, `TODO` chưa có issue.
- Build lặp lại được từ clone sạch bằng đúng README.

### 11.3 Definition of Done

- [ ] Brief được đáp ứng đủ trang và mục.
- [ ] G0 đạt: `RESEARCH.md` có bằng chứng cho mọi quyết định stack/dependency.
- [ ] Không còn placeholder `[[...]]` chưa được duyệt (đã đối chiếu `CONTENT_MAP.md`).
- [ ] Không còn TODO/FIXME chưa có issue; không còn `console.log`/`debugger`.
- [ ] Nội dung tiếng Việt đúng dấu, không lỗi font.
- [ ] Responsive 320 → 1440, không overflow.
- [ ] Keyboard-only đi hết luồng chính; focus luôn thấy.
- [ ] axe 0 serious/critical; contrast pass.
- [ ] Lighthouse đạt budget lab 5.2.2; nêu rõ "chưa có field data" nếu chưa deploy.
- [ ] SEO cơ bản đủ: title, description, canonical, OG, sitemap, robots.
- [ ] 404 + error state + trạng thái mất mạng.
- [ ] Không secret trong repo/bundle (gitleaks exit 0); `.env.example` đủ.
- [ ] Không còn P0/P1 mở; P2/P3 còn lại đã ghi trong `BUGS.md`.
- [ ] README chạy được từ clone sạch.
- [ ] Test pass, không skip mới; e2e luồng chính pass.
- [ ] Cross-browser theo định nghĩa 0.6.
- [ ] `PROJECT_STATE.md` + `DECISIONS.md` + `RESEARCH.md` + `visual_ledger/` cập nhật.
- [ ] Commit sạch, message rõ, không file rác.

### 11.4 Cấm khi báo cáo

- "Chắc là chạy được", "có lẽ ổn", "should work".
- "Đã responsive" khi chỉ test desktop.
- "A11y ok" khi chưa chạy axe.
- "Test pass" khi chưa chạy hoặc có skip mới.
- "Đã deploy" khi mới cấu hình.
- "CWV đạt" khi chỉ có số lab, chưa có field.
- "Đã research GitHub" khi `RESEARCH.md` trống hoặc không có URL/ngày/version.
- "Xong" khi còn mục trong DOD hoặc còn P0/P1.

---

## 12. BÀN GIAO

### 12.1 README tối thiểu

```md
# Tên dự án
Mô tả 2 dòng.

## Yêu cầu
- Node ...
- pnpm ...

## Chạy local
cp .env.example .env
pnpm install
pnpm dev

## Build & preview
pnpm build
pnpm preview

## Test
pnpm lint && pnpm typecheck && pnpm test
pnpm test:e2e

## Cấu trúc
...

## Deploy
...

## Ghi chú
- Nội dung placeholder nằm ở ...
- Biến môi trường bắt buộc: ...
```

### 12.2 Env

- `.env.example` liệt kê mọi biến, không có giá trị thật.
- Ghi rõ biến nào public, biến nào server-only.
- Không commit `.env`; thêm vào `.gitignore` nếu chưa có.

### 12.3 Deploy

| Nền tảng | Lưu ý |
|---|---|
| Vercel | biến môi trường theo môi trường; build command; preview deployment |
| Netlify | `netlify.toml`; redirect SPA; functions |
| Cloudflare Pages | output dir; `_headers`, `_redirects`; không Node API đầy đủ |
| GitHub Pages | base path; không SPA fallback mặc định (dùng `404.html`); không server |
| VPS | reverse proxy, HTTPS, cache header, process manager |

Không deploy khi chưa được phép. Nếu được phép, deploy **preview** trước, ghi URL và commit hash.

- Deploy preview lên nền tảng bên thứ ba là hành động công khai (mục W8): xin phép trước, nêu rõ ai truy cập được.
- Preview phải `noindex` (header `X-Robots-Tag: noindex` hoặc robots chặn) và bật bảo vệ/preview password nếu nội dung chưa được công bố.
- Production chỉ deploy khi có yêu cầu rõ ràng; ghi commit hash, thời điểm, người thực hiện, và cách rollback.
- Không dùng chung biến môi trường production cho preview; không trỏ preview vào DB production.

### 12.4 Vận hành

- Rollback: biết cách quay lại bản trước (platform rollback hoặc tag).
- Monitoring: chỉ thêm khi được yêu cầu; ưu tiên lỗi 5xx và Web Vitals.
- Backup: nếu có DB, nêu lịch và cách khôi phục.
- Chi phí: nêu dịch vụ trả phí nếu có.

### 12.5 Pháp lý & tài sản

- Chỉ dùng ảnh/font/icon có license rõ; ghi nguồn trong `CREDITS.md`.
- Không dùng logo bên thứ ba khi chưa được phép.
- Trang privacy/terms chỉ khi brief yêu cầu; không tự viết tư vấn pháp lý.
- Cookie consent chỉ khi có tracker; nút từ chối ngang hàng nút đồng ý.

---

## 13. TEMPLATE

### 13.1 `AGENTS.md`

```md
# AGENTS.md
## Trước khi làm
- Đọc docs/EXECUTION_SPEC.md.
- Đọc docs/PLAN_SPEC.md và .plan/TASKS.md nếu có (bản plan).
- Đọc .memory/PROJECT_STATE.md, DECISIONS.md, RESEARCH.md.
- Xác định package manager từ lockfile (không mặc định pnpm).
- Chạy baseline: lint, typecheck, test; ghi lại số pass/fail/skip.

## Lệnh
- dev: <pm> run dev
- build: <pm> run build
- test: <pm> run test
- e2e: <pm> run test:e2e

## Skill (chỉ khi môi trường có superpowers — xem mục 15)
- Code mới/sửa hành vi: theo test-driven-development; không xoá code cũ để "đúng TDD".
- Kết thúc task: verification-before-completion, nhưng chuẩn vẫn là mục 11.
- Bug > 15 phút hoặc sau 2 lần sửa: systematic-debugging.
- Không merge/push/deploy/xoá nhánh theo skill khi chưa được phép (W8).

## Luật
- Không đổi stack/convention.
- Không thêm dependency trước khi có mục trong RESEARCH.md.
- Không commit .env.
- Placeholder nội dung dùng `[[...]]`, không dùng Lorem ipsum.
- Không báo xong khi chưa qua mục 11.
- Bug quá 2 lần → dừng, trình phương án.
```

### 13.2 `PROJECT_BRIEF.yaml`

Dùng mẫu 0.2, điền đầy đủ trước PASS 1.

### 13.3 Báo cáo bug

Dùng mẫu 9.3.

### 13.4 `scripts/verify.sh`

Script phải **fail khi thiếu gate**, không được bỏ qua rồi in "OK".

```bash
#!/usr/bin/env bash
set -uo pipefail

if   [[ -f pnpm-lock.yaml ]]; then PM=pnpm
elif [[ -f yarn.lock ]]; then PM=yarn
elif [[ -f bun.lockb || -f bun.lock ]]; then PM=bun
elif [[ -f package-lock.json ]]; then PM=npm
else
  echo "FAIL: không tìm thấy lockfile để xác định package manager"; exit 2
fi

[[ -f package.json ]] || { echo "FAIL: thiếu package.json"; exit 2; }

has_script() {
  node -e "const s=require('./package.json').scripts||{}; process.exit(s['$1']?0:1)"
}

PASSED=0
FAILED=0

run_script() {
  local name="$1"
  if ! has_script "$name"; then
    echo "MISSING: script '$name' không tồn tại"
    FAILED=$((FAILED+1))
    return
  fi
  echo "==> $PM run $name"
  if "$PM" run "$name"; then
    PASSED=$((PASSED+1))
  else
    echo "FAIL: $name"
    FAILED=$((FAILED+1))
  fi
}

# Mặc định coi 6 gate là bắt buộc. Repo thiếu script nào thì phải khai báo
# lại danh sách và ghi lý do vào DECISIONS.md, không được tự bỏ qua.
REQUIRED="${VERIFY_SCRIPTS:-lint typecheck test build test:e2e test:a11y}"
for s in $REQUIRED; do
  run_script "$s"
done

echo "----------------------------------------"
echo "PASS: $PASSED · FAIL/MISSING: $FAILED"

if (( PASSED + FAILED == 0 )); then
  echo "FAIL: không có gate nào được chạy"; exit 2
fi
(( FAILED > 0 )) && exit 1

echo "OK: tất cả gate bắt buộc đã chạy và pass"
```

Ghi chú:

- Repo không có `test:a11y` (ví dụ site tĩnh): đặt `VERIFY_SCRIPTS="lint typecheck test build test:e2e"` và ghi lý do vào `DECISIONS.md`, hoặc thêm script thật.
- Playwright cần web server: để Playwright tự quản lý bằng `webServer` trong config; không mở server thủ công trong CI.
- Script này không thay G8 (Lighthouse) và G9 (secret/smoke); chạy riêng.

Với site tĩnh không có `package.json`, thay bằng:

```bash
set -euo pipefail
npx html-validate "**/*.html"
npx pa11y-ci
npx linkinator . --recurse --skip "mailto:*"
```

### 13.5 Checklist review trước khi giao

- [ ] Diff chỉ chứa thay đổi trong phạm vi.
- [ ] Không file rác, không `console.log`.
- [ ] Không TODO chưa ghi issue.
- [ ] Không dependency thừa.
- [ ] Ảnh/font có license.
- [ ] README khớp thực tế.

Kiểm tra bằng lệnh, không bằng mắt:

```bash
git diff --stat
rg -n "console\.(log|debug)|debugger" src app components 2>/dev/null || true
rg -n "TODO|FIXME" src app components 2>/dev/null || true
rg -n "\[\[[A-ZÀ-Ỹ][^\]]*\]\]" --glob '!CONTENT_MAP.md' --glob '!docs/**' --glob '!*.md' 2>/dev/null || true
gitleaks git --redact --no-banner
```

- Mỗi `TODO` phải có link issue trong cùng dòng hoặc xoá.
- Mỗi placeholder `[[...]]` phải có dòng tương ứng trong `CONTENT_MAP.md`; nếu không → lỗi.
- `gitleaks` exit 0 mới được giao.

### 13.6 Đo tương phản bằng script

Dùng khi chọn màu brand hoặc nghi ngờ token:

```python
#!/usr/bin/env python3
# usage: python3 contrast.py "#16201C" "#F7F8F7" [4.5]
import sys

def lum(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

a, b = lum(sys.argv[1]), lum(sys.argv[2])
ratio = (max(a, b) + 0.05) / (min(a, b) + 0.05)
need = float(sys.argv[3]) if len(sys.argv) > 3 else 4.5
print(f"{ratio:.2f}:1", "PASS" if ratio >= need else "FAIL")
```

Ghi kết quả vào `visual_ledger/` cùng ngày và cặp màu. Không công bố "đạt AA" nếu chưa đo đủ các cặp thực tế dùng trong UI.

---

## 14. PROMPT COPY-PASTE

> Prompt trong mục này **độc lập với skill**. Nếu môi trường có bộ `superpowers`, dán thêm khối 15.6 vào **cuối** prompt — không sửa nội dung prompt gốc.

### 14.1 Greenfield — site marketing / portfolio

```text
Bạn là AI coding agent cho web. Làm theo PROMPT_SPEC_WEB_DEV_AGENT_v1.md.

Dự án: <tên>, loại <landing/portfolio/blog>, ngôn ngữ <vi/en>, deploy <vercel/netlify/...>.
Mục tiêu: <một câu>.
Trang: </ , /gioi-thieu, /bang-gia, /lien-he>.
Brand: <logo/màu/font nếu có, hoặc "chưa có">.
Nội dung: <đã có / một phần / chưa có>.

Bắt đầu PASS 1:
0. Research trước (mục 7): viết 3 câu hỏi, tra docs + ít nhất 1 repo mẫu, ghi .memory/RESEARCH.md (gate G0).
1. Inventory repo, xác định greenfield/brownfield.
2. Hỏi tối đa 3 câu chặn (nếu cần), rồi tự quyết phần còn lại và ghi [GIẢ ĐỊNH].
3. Chọn stack theo mục 2.2, ghi lý do kèm nguồn đã tra.
4. Chốt tokens (đo tương phản) + layout shell + page skeleton tất cả trang với nội dung thật hoặc placeholder [[...]].

Không báo xong khi chưa qua mục 11. Bug quá 2 lần → mục 9.
```

### 14.2 Greenfield — web app / dashboard / SaaS

```text
Bạn là AI coding agent cho web. Làm theo PROMPT_SPEC_WEB_DEV_AGENT_v1.md.

Dự án: <tên>, web app cho <ai>, deploy <platform>.
Chức năng chính: <3–6 gạch đầu dòng>.
Auth: <có/không>, vai trò: <admin/user/...>.
Dữ liệu: <thực thể chính>, cần <DB nào>.
Tích hợp: <payment/email/...>.
Ngôn ngữ: <vi/en>.

Bắt đầu PASS 1: research (mục 7, G0) → inventory → chọn stack có lý do → tokens đã đo tương phản → layout shell → route map → schema dữ liệu dự kiến → page skeleton các màn hình chính.
PASS 2 mới làm auth/CRUD/luồng nghiệp vụ.
Không thêm thư viện UI nặng nếu chưa cần. Không báo xong khi chưa qua mục 11.
```

### 14.3 Brownfield — sửa lỗi hoặc thêm tính năng

```text
Bạn là AI coding agent cho web. Làm theo PROMPT_SPEC_WEB_DEV_AGENT_v1.md, chế độ BROWNFIELD.

Repo: <đường dẫn>. Việc cần làm: <mô tả hẹp, 1–3 câu>.
Ràng buộc: giữ nguyên stack/convention/package manager. Không refactor ngoài phạm vi.

Trước khi sửa: đọc file liên quan, chạy baseline (lint/typecheck/test), ghi kết quả pass/fail/skip.
Nếu chạm API lạ hoặc bug khó: tra docs + GitHub theo mục 7, ghi .memory/RESEARCH.md.
Sau khi sửa: chạy lại đúng gate liên quan, báo cáo theo mục 1 (W9).
Nếu quá 2 lần không sửa được: dừng, trình 3 phương án theo mục 9.3.
```

### 14.4 Prompt ngắn dùng hằng ngày

```text
Sửa <vấn đề cụ thể> trong <file/khu vực>.
Đọc code liên quan trước. Thay đổi nhỏ nhất. Không đổi stack.
Nếu không chắc API/hành vi: tra docs chính thức hoặc GitHub, ghi nguồn (URL + version).
Verify bằng <lệnh cụ thể>. Báo cáo: lệnh + exit code + kết quả + file đã đổi.
Nếu fail 2 lần, dừng và trình phương án.
```

---

## 15. LIÊN KẾT BỘ SKILL `superpowers` (khi môi trường có)

> **Không bắt buộc cài.** Skill là *cách làm*; mục 11 và 11.3 là *chuẩn*. Không có skill → dùng đúng mục trong spec này. Có skill → dùng đúng tên, không tự chế tên, không copy nội dung `SKILL.md` vào repo.
> Bảng ánh xạ đầy đủ 15 skill và luật xung đột ở cấp **kế hoạch**: `PROMPT_SPEC_WEB_DEV_PLAN_v1.md` mục 14. Mục này chỉ nói **lúc thi hành**.

### 15.1 Đã kiểm chứng (2026-10-24)

| Hạng mục | Giá trị |
|---|---|
| Repo | https://github.com/obra/superpowers |
| License | MIT |
| Bản mới nhất | `v7.0.1` (2026-10-21) |
| Số skill | 15 thư mục trong `skills/` |
| Tài liệu đã đọc | `README.md`, `skills/writing-plans/SKILL.md`, `skills/using-superpowers/SKILL.md` |

Tên skill trong mục này lấy đúng từ `skills/` của repo. **Không** có skill tên `research`, `deploy`, hay `frontend-design` — đừng bịa tên.

### 15.2 Skill dùng ở đâu trong 3 pass

| Giai đoạn | Skill | Bắt buộc khi có skill? | Không có skill thì theo |
|---|---|---|---|
| Trước PASS 1, brief mơ hồ | `brainstorming` | Không | 0.2 + 0.3 |
| Trước PASS 1, lập kế hoạch | `writing-plans` | Không (thuộc bản plan) | PLAN_SPEC mục 6 |
| PASS 1, tách nhánh/worktree | `using-git-worktrees` | Không | 10.4 + nhánh riêng |
| PASS 2 — viết code | `test-driven-development` | **Có** (cho code mới/sửa hành vi) | 6.1–6.3 |
| PASS 2/3 — chạy task | `executing-plans` (S/M) hoặc `subagent-driven-development` (L/XL) | Không | 10.2 / 10.3 |
| PASS 3 — trước khi báo xong | `verification-before-completion` | **Có** | 11 |
| Sau mỗi task/pass | `requesting-code-review`, `receiving-code-review` | Không | 13.5 |
| Bug > 15 phút hoặc sau 2 lần sửa | `systematic-debugging` | **Có** | 9.1–9.4 |
| ≥ 2 agent cùng lúc | `dispatching-parallel-agents` | Không | PLAN_SPEC 4.4 |
| Kết thúc nhánh | `finishing-a-development-branch` | Không | 10.4 + W8 |
| Đóng gói quy trình thành skill | `writing-skills` | Không | 7.9 |
| Skill không trigger/sai | `diagnosing-superpowers` | Không | Không thay 9; chỉ debug công cụ |

**Không có skill nào thay gate.** G0 vẫn bắt buộc trước PASS 1 (mục 7), G1–G9 vẫn là nguồn sự thật (11.1), 11.3 vẫn là Definition of Done.

### 15.3 Luật phân xử khi skill mâu thuẫn với spec

| Điểm | Skill nói | Spec này | Luật dùng |
|---|---|---|---|
| Test trước hay code trước | `test-driven-development`: viết test fail trước, **xoá code viết trước test** | W3: thay đổi nhỏ nhất; brownfield có code cũ chưa có test | Code **mới** thì test trước. Brownfield: viết characterization test cho hành vi hiện tại trước, **không xoá code cũ** để "đúng TDD" |
| Thời lượng task | README ghi "2–5 phút/task" | Cấm ước lượng thời gian | Không trích số phút. Dùng kích thước theo PLAN_SPEC 3.3 |
| "Xong" | `verification-before-completion` (định tính) | 11.3 + G0–G9 (định lượng) | Spec thắng. Skill chỉ là bước nhắc; "tests pass" chưa phải xong |
| Merge / PR / xoá nhánh | `finishing-a-development-branch` đề xuất merge/PR/keep/discard | W8: không hành động vượt quyền | Được **trình** 3 lựa chọn; cấm merge, push, xoá nhánh, deploy khi chưa được phép |
| Tạo nhánh/worktree | `using-git-worktrees` tạo workspace mới | 10.4 Git | Tạo local: được. Push/PR: phải xin phép |
| Chạy dài tự động | `executing-plans` / `subagent-driven-development` chạy nhiều task liền | W8 + điểm dừng cứng (PLAN_SPEC 4.5) | Dừng khi: cần deploy/DNS/mua dịch vụ, P0, phạm vi tăng, task fail 2 lần, cần quyết định thương hiệu/nội dung pháp lý |
| Review | `requesting-code-review` do subagent review | 13.5 checklist + bằng chứng lệnh | Review nội bộ được phép; kết luận cuối vẫn phải kèm lệnh + exit code |
| Design doc | `brainstorming` sinh design doc | 0.2 Brief | Brief là nguồn; design doc chỉ bổ sung, ghi vào `.memory/DECISIONS.md` |
| Research | Không có skill research | 7 + G0 | G0 **không đổi**; skill không thay research |

### 15.4 Trình tự thi hành khi có skill

1. Đầu phiên: `using-superpowers` nếu harness chưa tự nạp.
2. Brief mơ hồ → `brainstorming`; vẫn phải điền đủ 0.2 và chốt 0.3.
3. PASS 1 bước 0: research theo 7, gate **G0** — không có skill nào thay bước này.
4. PASS 1: `using-git-worktrees` nếu cần cô lập; dựng skeleton; exit gate của 10.1.
5. PASS 2: `test-driven-development` cho từng task; `executing-plans` (S/M) hoặc `subagent-driven-development` (L/XL).
6. Sau mỗi task: `requesting-code-review`; nhận feedback bằng `receiving-code-review` (phân loại C1–C3 theo PLAN_SPEC 8.1).
7. PASS 3: `verification-before-completion` trước khi chạy toàn bộ 11.
8. Kết thúc: `finishing-a-development-branch` — chỉ **trình lựa chọn**, không tự merge/push.
9. Cập nhật `.memory/` và `.plan/TASKS.md` (nếu có) trước khi báo xong.

### 15.5 Bug protocol + skill

`systematic-debugging` là **cách** thực hiện 9.1–9.4, không thay đổi luật:

- 4 pha của skill tương ứng: tái hiện → thu hẹp → giả thuyết → sửa + test chống tái phát.
- W10 vẫn giữ: tối đa 2 lần sửa cho một giả thuyết; lần 3 mở 9.3.
- P0–P3 (9.2.1) không đổi; P0 vẫn rollback/disable trước (9.5).
- Trước khi đóng bug: `verification-before-completion`, rồi mới ghi `verified`.
- `diagnosing-superpowers` chỉ dùng khi **công cụ** hành xử sai, không dùng để thay Bug Protocol.

### 15.6 Prompt bổ sung (dán **cuối** prompt 14.x)

```text
Bổ sung — chỉ áp dụng khi môi trường có bộ skill superpowers (spec mục 15):

- PASS 1 bước 0: research + G0 không đổi; không có skill nào thay.
- Code mới/sửa hành vi: test-driven-development. Brownfield: viết characterization
  test trước, KHÔNG xoá code cũ để "đúng TDD".
- Thi hành: executing-plans (S/M) hoặc subagent-driven-development (L/XL).
- Kết thúc task: verification-before-completion; nhưng chuẩn là mục 11 và 11.3.
- Bug > 15 phút hoặc sau 2 lần sửa: systematic-debugging; W10 vẫn giữ.
- Cấm merge/push/deploy/xoá nhánh theo finishing-a-development-branch khi chưa được phép.
- Không trích "2–5 phút/task"; không copy SKILL.md vào repo.
- Không có skill nào thay G0–G9 hay Definition of Done.
```

### 15.7 Kiểm chứng định kỳ và điều kiện bỏ liên kết

```bash
gh release list --repo obra/superpowers --limit 3
gh api repos/obra/superpowers/contents/skills --jq '.[].name'
```

- Tên skill đổi hoặc repo đổi cấu trúc → bỏ phần skill, quay về đúng spec này; ghi lý do vào `DECISIONS.md`.
- Không nâng version skill giữa dự án (W3); chỉ ghi nhận và đề xuất.
- Hành vi trigger của skill khác nhau theo harness — quan sát thực tế, không giả định.

---

## PHỤ LỤC A — KHÁC BIỆT SO VỚI BẢN "XÂY WEB AI AGENT"

| Khía cạnh | Bản này (agent code web tổng quát) | Bản `PROMPT_SPEC_WEB_AGENT_v1` |
|---|---|---|
| Mục tiêu | Làm bất kỳ website/web app | Xây sản phẩm chat AI agent |
| Stack | Chọn theo loại dự án, có thể không framework | Cố định Next.js + AI SDK + Postgres |
| Prompt Engine | Không có (trừ khi dự án cần) | Bắt buộc, 10 section, compaction |
| Tool Engine | Không có | Bắt buộc, approval, sandbox |
| Sandbox | Không cần | Bắt buộc |
| Data model | Theo dự án | users/sessions/messages/runs/tool_calls/approvals |
| UI | Thiết kế theo brand, chống AI slop | Chat UI + approval dialog |
| Gate | lint/typecheck/test/build/e2e/a11y/perf | Thêm test prompt, tool, SSRF, replay |
| Đối tượng đọc | Mọi dự án web | Team làm sản phẩm AI agent |

---

## PHỤ LỤC B — TỪ ĐIỂN VẬN HÀNH

| Từ | Định nghĩa | Cách kiểm chứng |
|---|---|---|
| **Gate xanh** | Lệnh exit 0 + ngưỡng số đạt + bằng chứng đã ghi. Thiếu một → không xanh. | Khối báo cáo W9 có lệnh, exit code, trích kết quả |
| **Route chính** | Mọi route trong `brief.pages` + route có form/auth/thanh toán/tìm kiếm/ghi dữ liệu | Liệt kê route trong `PROJECT_STATE.md` |
| **Section vs component** | Section = khối nội dung trên trang; component = đơn vị code tái sử dụng (có thể dùng cho nhiều section) | Cấu trúc thư mục + JSX/template |
| **Layout shell** | Header, nav, main, footer, container, breakpoint cơ bản — chưa có nội dung chi tiết | Ảnh pass 1 |
| **Breakpoint theo nội dung** | Width mà tại đó layout bắt đầu vỡ/khó đọc; ghi con số thật, không đặt tên thiết bị | Ghi trong `DESIGN_SPEC.md` |
| **SSG / ISR / SSR / CSR** | SSG: HTML tạo lúc build. ISR: build + revalidate định kỳ. SSR: HTML tạo mỗi request. CSR: HTML rỗng, JS render | Kiểm tra response + build output |
| **Hydration** | Quá trình JS gắn vào HTML do server render; mismatch = HTML server khác HTML client | Console error + React/Next logs |
| **CWV** | Core Web Vitals: LCP, INP, CLS | Field (CrUX) hoặc lab (Lighthouse) |
| **Page skeleton** | Khung trang đủ header/nav/main/footer + heading thật + vùng nội dung đúng thứ tự; chưa polish/animation | Ảnh 4 viewport trong `visual_ledger/` |
| **Pass 1/2/3** | Giai đoạn làm việc theo mục 10. Không nhầm với "test pass" (test chạy thành công) | Tag git + báo cáo |
| **Run** | Một lần chạy tool (Lighthouse run, Playwright run); 3 run lấy median | Log + report |
| **Loading skeleton** | Khối giữ chỗ khi dữ liệu đang tải, đúng hình dạng nội dung thật | Screenshot trạng thái loading |
| **Production build** | Build bằng script `build`, `NODE_ENV=production`, asset minify + hash, phục vụ qua preview/static server | `curl` thấy asset hash; không có HMR client |
| **Console error** | `console.error`/exception từ code repo; request same-origin ≥ 400 | Snippet 6.2 |
| **Flaky** | Cùng commit/môi trường, chạy lại 3 lần, ≥ 1 fail | Log 3 lần chạy |
| **Cross-browser** | ≥ 2 engine render khác nhau trong CI; thêm Safari iOS nếu audience mobile | Playwright projects + biên bản kiểm tra tay |
| **Field data** | Dữ liệu người dùng thật, p75, 28 ngày (CrUX/PSI) | URL PSI/CrUX + ngày lấy |
| **Lab data** | Lighthouse synthetic, điều kiện cố định, 3 run median | Report `.lhci/` + version |
| **p75** | 75% lượt truy cập nhanh hơn hoặc bằng giá trị đó | PSI hiển thị percentile |
| **Cold cache** | Lần truy cập đầu, không service worker/CDN warm | LHCI browser context mới |
| **LCP element** | Phần tử nội dung lớn nhất trong viewport đầu | Lighthouse chỉ ra selector |
| **Budget** | Ngưỡng số cụ thể; vượt phải ghi `DECISIONS.md` | Bảng 5.2.2 |
| **Placeholder nội dung** | Chuỗi `[[...]]` hiển thị trên site, chưa được duyệt | `rg -n "\[\[[A-ZÀ-Ỹ][^\]]*\]\]"` |
| **Placeholder input** | Gợi ý mờ trong field, biến mất khi gõ; không thay `<label>` | Kiểm tra DOM + a11y |
| **Biến nội suy** | Chỗ trống trong message dịch (`{count}`), không phải placeholder nội dung | File message/i18n |
| **verified / implemented / blocked** | Có bằng chứng / đã viết code / đang kẹt | Nhãn trong báo cáo W9 |
| **P0–P3** | Mức nghiêm trọng theo 9.2.1 | Mỗi mục trong `BUGS.md` có mức |
| **Axe impact** | Mức `minor` / `moderate` / `serious` / `critical` do axe-core gán; gate chặn `serious` + `critical`, hai mức còn lại ghi lại | Output axe/pa11y |
| **Warning mới** | Warning không có trong baseline lint đầu pass | So số warning với baseline |
| **Skip mới** | Test bị skip không có trong baseline đầu pass | So số skip với baseline |
| **Responsive** | Không overflow ngang + nội dung đọc được ở 320/360/390/768/1024/1280/1440 | Playwright + ảnh `visual_ledger/` |
| **Viewport đầu** | Phần trang hiển thị trước khi scroll ở 390×844 | Screenshot |
| **Đã duyệt** | Người có thẩm quyền (brief owner) xác nhận; agent không tự duyệt nội dung của chính mình | Tin nhắn/link ghi trong `DECISIONS.md` |
| **Preview server** | Server phục vụ production build, không HMR/dev overlay | `curl` + không có dev toolbar |
| **File rác** | Build output, ảnh chụp tạm, log, `.DS_Store`, file backup | `git status` sạch trước commit |
| **Regression** | Hành vi trước đây pass, nay fail | Test cũ fail hoặc so sánh baseline |
| **Quarantine** | Tạm skip test có issue + người phụ trách + hạn ≤ 14 ngày | Annotation trong test |
| **Baseline (nền tảng web)** | Dữ liệu hỗ trợ trình duyệt của `web-platform-dx/web-features` | baseline.status = widely available |
| **Visual baseline** | Ảnh tham chiếu để so screenshot, chỉ sinh ở một môi trường CI | Commit ảnh + config Playwright |
| **Noindex** | Chặn search engine bằng meta/header | `curl -I` thấy `X-Robots-Tag: noindex` |
| **Preview deployment** | URL công khai tạo từ nhánh, không phải production | Ghi URL + commit hash |
| **Trang vs route** | Trang = URL người dùng thấy; route = ánh xạ code; một route động sinh nhiều trang | `sitemap.xml` + route map |
| **Nội dung thật** | Nội dung người dùng cung cấp hoặc đã duyệt, không do agent bịa | Dòng `thật` trong `CONTENT_MAP.md` |
| **Đã đo** | Có output lệnh trong phiên/commit hiện tại, không nhớ lại từ lần trước | Timestamp + log |
| **Characterization test** | Test ghi lại hành vi **hiện tại** của code cũ trước khi sửa; khác test cho hành vi mong muốn | Test pass trên code chưa sửa |
| **Step** | Đơn vị hành động bên trong task khi mở rộng bằng `writing-plans` (test → code → verify → commit) | Plan cấp step, có `Parent:` |
| **Parent** | ID task `T-*` mà một step thuộc về | Dòng `**Parent:** T-xxx` |

---

## PHỤ LỤC C — NHỮNG ĐIỂM ĐÃ LÀM RÕ Ở v1.1

Bảng đối chiếu: chỗ mơ hồ ở v1 → quy tắc rõ ở v1.1.

| Điểm mơ hồ ở v1 | Đã làm rõ | Nơi sửa |
|---|---|---|
| "Gate xanh" không định nghĩa | 3 điều kiện: exit 0 + ngưỡng + bằng chứng | 0.6, 10.1, 11.1 |
| "Placeholder" mang 3 nghĩa (nội dung, input, biến i18n) | Tách rõ: `[[...]]` = placeholder nội dung; placeholder input; `{count}` = biến nội suy | 0.5, 3.9, 3.10, Phụ lục B |
| Mặc định dùng `pnpm` mọi nơi | Bảng phát hiện PM theo lockfile + lệnh tương ứng | 2.1, 11.1, 13.4 |
| "Không console error" không rõ phạm vi | Định nghĩa + snippet Playwright thu lỗi | 0.6, 6.2 |
| "Flaky" dùng cảm tính | 3 lần chạy lại, ≥ 1 fail; quarantine có hạn | 0.6, 6.3 |
| "Cross-browser" không rõ mấy trình duyệt | ≥ 2 engine + Safari iOS khi audience mobile | 0.6, 10.3 |
| Trộn LCP field p75 với LCP lab | Tách 5.2.1 (field) / 5.2.2 (lab), cấm tuyên bố CWV từ lab | 0.6, 5.2, 11.3 |
| Lệnh LHCI CLI sai cú pháp assertion | Thay bằng `lighthouserc.json` đúng format + `lhci autorun` | 5.4, 11.1 |
| Token mẫu fail tương phản (viền 1.38:1, danger dark 2.88:1) | Thêm `--border-strong`, sửa danger/focus dark, bảng đo | 4.2 |
| "Route chính" không rõ | Định nghĩa theo brief + form/auth/payment/search | 0.6 |
| "Skeleton" mơ hồ (trang vs loading) | Tách **page skeleton** (pass 1) và **loading skeleton** (trạng thái tải) | 0.6, 4.8, Phụ lục B |
| "Production build" mơ hồ | Định nghĩa theo script build + asset hash + preview server | 0.6 |
| "Nguồn" không có thứ tự tin cậy | 6 mức ưu tiên + quy tắc mâu thuẫn | 7.2 |
| GitHub research chỉ là gợi ý | Mục 7 đầy đủ, bắt buộc, có G0 và ngưỡng bằng chứng | 7, 11.1 |
| `gh search issues --state all` không hợp lệ | Ghi rõ chỉ `open|closed`; bỏ `--state` để tìm cả hai | 7.3 |
| `gh release view --limit` không hợp lệ | Đổi thành `gh release list --limit` + `gh release view` | 7.3 |
| Repo Baseline sai (`web-platform-dx/baseline` 404) | Dùng `web-platform-dx/web-features` | 7.7 |
| Quét secret bằng `grep` dễ bỏ sót | `gitleaks git` + `gitleaks dir <build>`, exit code rõ | 3.12.1, 11.1, 11.2 |
| Header/rate limit nói chung chung | Bảng header + giá trị khởi điểm; bảng rate limit | 3.12 |
| Deploy preview không được coi là hành động công khai | W8 + quy tắc noindex/bảo vệ preview | W8, 12.3 |
| Chọn ngôn ngữ theo IP | Theo brief, chỉ gợi ý; URL là nguồn sự thật | 3.10 |
| CAPTCHA chỉ nói "không dùng" | Thứ tự honeypot → thời gian → rate limit; ngoại lệ có kiểm soát | 3.9 |
| Bug không có mức nghiêm trọng | P0–P3 + hành động tương ứng | 9.2.1 |
| Không có quy trình rollback | 9.5: ổn định trước, hotfix, backport, test tái hiện | 9.5 |
| `verify.sh` in "OK" dù bỏ qua gate | Script fail khi thiếu script, đếm gate, exit 1/2 | 13.4 |
| Visual test có thể cập nhật baseline tuỳ tiện | Quy tắc viewport/mask/diff + review người | 6.5 |
| "Đã xong" khi còn placeholder/TODO/secret | DoD bổ sung mục tương ứng | 11.3 |

**Nguồn đã kiểm chứng trực tiếp ngày 2026-10-24** (dùng để sửa tài liệu, không phải để copy code):

| Nguồn | Đã xác nhận |
|---|---|
| GitHub CLI manual `gh search prs` / `gh search issues` | `--merged`, `--repo`, `--limit`, `--match`; `--state` chỉ `open|closed` |
| LHCI `docs/configuration.md` | Cấu trúc `lighthouserc.json`, `staticDistDir`, `numberOfRuns`, `assertions`, `categories:*`, `aggregationMethod`, `upload.target` |
| Playwright docs | `toHaveScreenshot`, `--update-snapshots`, `maxDiffPixels`, `maxDiffPixelRatio`, `animations`, `caret` |
| pa11y-ci / linkinator / html-validate docs | CLI, config file, exit code, flag `--recurse`/`--skip`/`--check-fragments` |
| `gitleaks/gitleaks` README | Command `git`/`dir`, `--redact`, `--report-path`, exit code 0/1 |
| `web-platform-dx/web-features` | Repo sinh dữ liệu Baseline; `web-platform-dx/baseline` không tồn tại (404) |
| `nextjs/saas-starter` | Stack Next.js + Postgres + Drizzle + Stripe + shadcn, license MIT |

Các điểm còn **chưa kiểm chứng** trong tài liệu được đánh dấu rõ để agent tự kiểm tra lại: version cụ thể của framework, hành vi mặc định của framework, và ngưỡng rate limit phù hợp lưu lượng thật.

---

## PHỤ LỤC D — NHỮNG ĐIỂM ĐÃ LÀM RÕ Ở v1.2

| Điểm thiếu/mơ hồ ở v1.1 | Đã làm rõ | Nơi sửa |
|---|---|---|
| Không có cầu nối với bộ skill phổ biến `superpowers` | Thêm mục 15: skill nào dùng ở pass nào, bắt buộc hay không | 15.2 |
| Không nói skill và spec bên nào thắng khi mâu thuẫn | 9 dòng luật phân xử, có ví dụ cụ thể | 15.3 |
| `test-driven-development` đòi "xoá code viết trước test" — xung đột brownfield | Code mới: test trước; brownfield: characterization test trước, **không xoá code cũ** | 15.3, Phụ lục B |
| README superpowers ghi "2–5 phút/task" dễ bị dùng như cam kết | Cấm trích số phút; dùng kích thước theo PLAN_SPEC 3.3 | 15.3 |
| `finishing-a-development-branch` có thể merge/PR/xoá nhánh | Chỉ được **trình** lựa chọn; cấm thực hiện khi chưa được phép (W8) | 15.3 |
| `executing-plans` chạy nhiều task liền, dễ vượt quyền | Bổ sung điểm dừng cứng khi có skill | 15.3 |
| `verification-before-completion` dễ bị dùng thay Definition of Done | Ghi rõ 11.3 và G0–G9 là chuẩn; skill chỉ nhắc | 15.3 |
| `AGENTS.md` không nhắc skill nên agent bỏ qua | Thêm mục `## Skill` vào template | 13.1 |
| Prompt 14.x không nói gì về skill | Thêm khối 15.6 dán cuối prompt, không sửa prompt gốc | 14, 15.6 |
| Từ "skill" chưa được định nghĩa | Thêm vào bảng định nghĩa vận hành và từ điển | 0.6, Phụ lục B |
| Lẫn giữa task cấp PR và step trong plan của skill | Định nghĩa `Step`, `Parent`, `Characterization test` | Phụ lục B |

**Nguồn đã kiểm chứng trực tiếp ngày 2026-10-24** (dùng để viết mục 15):

| Nguồn | Đã xác nhận |
|---|---|
| `obra/superpowers` README | License MIT; `v7.0.1` (2026-10-21); quy trình 7 bước; TDD "xoá code viết trước test"; lệnh cài theo harness |
| `obra/superpowers/skills/` | Đúng 15 thư mục, tên chính xác như bảng 15.2 |
| `skills/writing-plans/SKILL.md` | Cấu trúc plan cấp step, right-sizing theo chu kỳ test, self-review 5 mục |
| `skills/using-superpowers/SKILL.md` | Cơ chế bootstrap và thông báo "Using [skill] to [purpose]" |

Điểm **chưa** kiểm chứng: hành vi trigger của từng skill trên từng harness, và việc skill có tự động bám plan hay không — phải quan sát thực tế, không giả định.

---

*Hết. Nếu chỉ nhớ một điều: không có bằng chứng thì không có "xong".*
