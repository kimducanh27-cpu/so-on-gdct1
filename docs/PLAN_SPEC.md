# BẢN CHỈ DẪN LẬP KẾ HOẠCH — AI CODING AGENT CHO WEB (v1.1)

> **Đây là gì:** bản chỉ dẫn để agent **lập kế hoạch trước khi viết code** cho một dự án web: phân rã, sắp thứ tự, đặt mốc, quản lý rủi ro, xử lý thay đổi, và trình kế hoạch cho người duyệt.
> **Đây không phải:** bản thay thế `PROMPT_SPEC_WEB_DEV_AGENT_v1.md` (v1.1). Bản đó quy định **chất lượng và cách thi hành**; bản này quy định **thứ tự, phạm vi và bằng chứng của kế hoạch**. Hai bản dùng cùng một bộ thuật ngữ.
> **Cách dùng:** dán mục 11.1 vào đầu phiên (Plan Mode). Lưu tại `docs/PLAN_SPEC.md`, cạnh `docs/EXECUTION_SPEC.md`.
> **Điều hướng:** Lần đầu → 2 · Xác định quy mô → 1.2 · Viết task → 3.3 · Sắp thứ tự → 4 · Mốc → 5 · Gate kế hoạch → 7 · Scope đổi → 8 · Trình người → 10 · Prompt → 11 · **Superpowers → 14** · Từ khoá mới → Phụ lục B · Đối chiếu spec → Phụ lục A · Thay đổi v1.1 → Phụ lục D.

**Quan hệ phiên bản:** bản này khoá theo `PROMPT_SPEC_WEB_DEV_AGENT_v1.md` v1.1 (2026-10-24) và tương thích v1.2 — phần dùng skill **lúc thi hành** nằm ở mục 15 của bản thi hành; mục 14 ở đây chỉ nói lúc lập kế hoạch. Khi bản thi hành lên version mới, kiểm tra lại Phụ lục A trước khi dùng.

**v1.1 (2026-10-24):** thêm mục 14 nối với bộ skill `obra/superpowers` (v7.0.1, MIT), tách rõ 3 tầng đơn vị việc (route → `T-*` → step), sửa các điểm mơ hồ về mã hiệu, trần task, ngân sách khảo sát và nơi lưu quyết định. Xem Phụ lục D.

---

## 0. QUAN HỆ VỚI BẢN THI HÀNH

### 0.1 Phân vai — câu hỏi nào thuộc bản nào

| Câu hỏi | Bản trả lời |
|---|---|
| Làm cái gì trước, cái gì sau? | **Bản plan** (mục 3–5) |
| Task này thế nào là xong? | **Bản plan** (3.3) + bản thi hành (11.3) |
| Có được cắt bớt không? Cắt cái gì? | **Bản plan** (8.4) |
| Chất lượng đạt mức nào? | **Bản thi hành** (4–6) |
| Chạy lệnh gì để chứng minh? | **Bản thi hành** (11.1) |
| Cấu trúc code, token, a11y, bảo mật? | **Bản thi hành** (3–5) |
| Được hỏi mấy câu, ứng xử khi thiếu thông tin? | **Bản thi hành** (0.3) + bản plan (1.4) |
| Tra GitHub ở đâu, bao nhiêu bằng chứng? | **Bản thi hành** (7) |
| Dùng skill nào của bộ `superpowers` ở bước nào? | **Bản plan** (14) |

**Luật xung đột:** mâu thuẫn về **chất lượng** → bản thi hành thắng. Mâu thuẫn về **thứ tự và phạm vi** → bản plan thắng. Không tự chọn bên có lợi cho việc làm nhanh hơn.

### 0.2 Vòng đời một dự án

```
Brief (0.2 spec)
   ↓
INTAKE + P0–P1 (khảo sát + research)      ← gate PG1
   ↓
P2–P5 (phân rã, thứ tự, định cỡ, rủi ro)
   ↓
P6 + one-pager                            ← gate PG2, PG3
   ↓
THI HÀNH theo PASS 1 → 2 → 3 (mục 10 spec), mỗi pass có gate G0–G9
   ↓
Bằng chứng (11 spec)  ──→ cập nhật .memory/ + .plan/TASKS.md
   ↓
Re-plan khi có trigger (8.3) ──┐
   ↑___________________________┘
```

Kế hoạch không phải bản viết một lần rồi bỏ. Nó là artifact sống, cập nhật ở **mỗi** ranh giới pass và mỗi lần scope đổi.

Nếu môi trường có bộ skill `superpowers` (mục 14): chèn `brainstorming` trước P0 khi brief mơ hồ, `writing-plans` sau PG2, `executing-plans`/`subagent-driven-development` ở bước thi hành. Các gate PG0–PG3 và G0–G9 **không đổi**.

### 0.3 Khi nào bắt buộc lập plan — ngưỡng định lượng

| Điều kiện | Plan |
|---|---|
| Task chạm ≥ 3 file, hoặc ≥ 2 route | Bắt buộc |
| Có ≥ 1 quyết định kiến trúc chưa có trong `DECISIONS.md` | Bắt buộc |
| Có dependency mới, migration dữ liệu, auth/payment | Bắt buộc |
| Brownfield: chưa chạy được baseline (lint/test/build) | Bắt buộc (plan gồm cả bước làm cho repo chạy) |
| Sửa 1 file, 1 mục tiêu, có test sẵn | Không cần — vào thẳng, ghi 1 dòng lý do |
| Sửa text/màu/khoảng cách, không đổi cấu trúc | Không cần |
| Bug P0 đang cháy | Không cần plan đầy đủ — làm 9.5 spec trước, plan sau |

Không có ngoại lệ "khẩn cấp": việc gấp chỉ được rút gọn plan (mục 1.3), không được bỏ plan.

### 0.4 Ký hiệu & nhãn riêng

Kế thừa nguyên 0.5 của bản thi hành: `[[...]]` (placeholder nội dung), `<...>` (biến người dùng điền), `[GIẢ ĐỊNH]`.

| Ký hiệu | Nghĩa | Ví dụ |
|---|---|---|
| `T-<AREA>-<2 chữ số>` | ID task. AREA = 2–6 ký tự viết hoa, không dấu. Đây là đơn vị **1 PR**, không phải từng bước nhỏ bên trong | `T-HOME-03`, `T-AUTH-01` |
| `SP-<số>` | Spike (khảo sát có giới hạn, đầu ra là quyết định). Không dùng `S-` vì trùng tên size S | `SP-02` |
| `PG0–PG3` | Plan Gate (mục 7) | `PG2` |
| `M0–M5` | Mốc chính (mục 5). Biến thể: `M0.5` (baseline brownfield xanh), `M1-hotfix` (ổn định sự cố), `M-parity` (bản mới khớp bản cũ) | `M1` |
| `C1–C3` | Mức thay đổi phạm vi (mục 8.1) | `C2` |
| `U1–U3` | Độ bất định của task (3.3) | `U3` |
| `[CẦN QUYẾT]` | Chặn tiến độ, cần người trả lời; khác `[GIẢ ĐỊNH]` (agent tự chọn và đi tiếp) | `[CẦN QUYẾT] dùng domain cũ hay mới?` |
| `→` | Phụ thuộc cứng: task bên trái phải xong trước | `T-DS-01 → T-HOME-03` |

Không dùng `[...]` đơn cho bất kỳ nhãn nào (trùng cú pháp link Markdown và array).

### 0.5 Định nghĩa mới (chỉ những từ bản plan dùng)

| Từ | Định nghĩa dùng trong file này |
|---|---|
| **Plan** | Tập artifact trong `.plan/` mô tả **ý định**: làm gì, thứ tự nào, xong khi nào, rủi ro gì. Không phải danh sách việc đã làm. |
| **Slice** | Một phần việc cắt theo chiều dọc: chạm đủ tầng để tạo ra hành vi quan sát được (route → component → style → test), không phải "làm hết HTML". |
| **Task (`T-*`)** | Một slice đủ nhỏ để làm trong **1 PR**, có một mục tiêu, có DoD kiểm chứng được bằng lệnh. Không phải đơn vị nhỏ nhất bên trong — xem **Step**. |
| **Step** | Một hành động có kết quả kiểm tra được bên trong task (viết test fail → chạy → code tối thiểu → chạy pass → commit). Trong bản này step chỉ xuất hiện khi mở rộng qua `writing-plans` (14.4); `TASKS.md` không liệt kê step. |
| **Spike (`SP-*`)** | Việc khảo sát có giới hạn, đầu ra là **quyết định** ghi vào `DECISIONS.md`, không phải code production. |
| **Milestone (mốc)** | Trạng thái **demo được**, gắn với bằng chứng, không gắn với ngày. |
| **Dependency cứng** | Task sau **không thể** đúng nếu task trước chưa xong (schema, token, route, auth). |
| **Dependency mềm** | Làm song song được, chỉ ảnh hưởng thứ tự review/merge. |
| **Đường găng** | Chuỗi task nối bằng dependency cứng dài nhất tính theo **số task**, không theo thời gian. |
| **Size (XS–XL)** | Kích thước task theo số file/route phải chạm và số test phải viết (3.3), không phải số giờ. |
| **Buffer** | Số điểm kiểm tra chèn thêm trên đường găng (4.3), không phải "thêm 2 ngày". |
| **DoR** | Definition of Ready — điều kiện để một task được phép bắt đầu (mục 13). |
| **Plan ảo** | Plan trông đầy đủ nhưng không kiểm chứng được: không DoD, không bằng chứng, không route nào ánh xạ tới (7.4). |
| **Wave** | Với XL: một đợt gồm nhiều mốc, mỗi wave có plan riêng ≤ 30 task (3.7). |

### 0.6 Bảy luật bất biến của bản plan

1. **Không code trước plan** khi đã chạm ngưỡng 0.3. Ngoại lệ duy nhất: P0.
2. **Không ước lượng thời gian.** Không viết "2 ngày", "khoảng 1 tuần". Chỉ dùng size, số task, và mốc gắn với bằng chứng. Nếu người dùng đưa deadline cứng, ghi nó thành **ràng buộc** trong brief, không suy ra cam kết từ nó.
3. **Một task một mục tiêu.** Task có hai mục tiêu là hai task.
4. **Mọi task phải kiểm chứng được bằng lệnh hoặc bằng chứng nhìn thấy.** Không có "đã cải thiện", "mượt hơn", "ổn rồi".
5. **Research trước khi chốt stack/dependency** (7 spec), không chốt rồi research để hợp thức hoá.
6. **Plan là nguồn sự thật về thứ tự; `.memory/` là nguồn sự thật về sự thật đã xảy ra.** Lệch thì sửa theo hướng: `.memory/` đúng về hiện trạng, `.plan/` được cập nhật lại.
7. **Mọi thay đổi phạm vi phải xuất hiện trong plan trước khi xuất hiện trong code** (mục 8).

---

## 1. ĐẦU VÀO (INTAKE)

### 1.1 Checklist đầu vào

Điền đủ trước khi phân rã. Cột "Thiếu thì sao" là hành vi bắt buộc, không phải gợi ý.

| # | Hạng mục | Lấy từ | Thiếu thì sao |
|---|---|---|---|
| 1 | Tên, loại dự án, chế độ (greenfield/brownfield) | brief 0.2 spec | Hỏi hoặc suy ra từ repo rồi ghi `[GIẢ ĐỊNH]` |
| 2 | Mục tiêu một câu + đối tượng | brief | Hỏi (câu chặn) |
| 3 | Danh sách route/trang | brief | Suy từ repo; greenfield thì đề xuất tối thiểu 5 route và ghi `[GIẢ ĐỊNH]` |
| 4 | Nội dung: đã có / một phần / chưa | brief | `placeholder [[...]]` + ghi vào `CONTENT_MAP.md` (8.4 spec) |
| 5 | Brand: logo, màu, font | brief | Dùng token trung tính 4.2 spec + `[GIẢ ĐỊNH]` |
| 6 | Integration: form, CMS, auth, payment, analytics | brief | Mặc định **không thêm** (0.3 spec) |
| 7 | Nền tảng deploy | brief | `unknown` → chỉ chuẩn bị cấu hình, không deploy |
| 8 | Ràng buộc cứng (deadline, domain, stack bắt buộc) | brief | Ghi `unknown`; không tự tạo ràng buộc |
| 9 | Hiện trạng repo: package manager, script, baseline test | 2.1 spec | Bắt buộc chạy thử; không đoán |
| 10 | Ai duyệt (người quyết định) | hội thoại | Mặc định: người dùng hiện tại |
| 11 | Môi trường đích (browser/thiết bị chính) | brief / analytics | Mobile-first 360px (0.3 spec) |
| 12 | Ngôn ngữ & thị trường | brief | `vi`, `lang="vi"` (0.3 spec) |

**Luật:** hạng mục 1–4, 9 không được để `unknown` khi bắt đầu P2. Thiếu thì phải là câu hỏi chặn hoặc giả định có ghi chú, không được lấp lửng.

### 1.2 Phân loại quy mô

Đếm bằng số đo được, không bằng cảm giác.

| Quy mô | Điều kiện (thoả **một** dòng là đủ) | Plan tối thiểu |
|---|---|---|
| **S** | ≤ 5 route, 0 integration, không auth/DB, 1 người | `PLAN.md` ≤ 1 trang + `TASKS.md` ≤ 12 dòng |
| **M** | 6–15 route **hoặc** 1 integration (form/CMS/analytics) **hoặc** brownfield có test | + `RISKS.md`, + `QUESTIONS.md` |
| **L** | 16–40 route **hoặc** auth/DB/payment **hoặc** ≥ 2 người làm song song | + ADR trong `DECISIONS.md`, + bảng truy vết (7.2) |
| **XL** | > 40 route **hoặc** multi-tenant **hoặc** migration dữ liệu lớn **hoặc** đổi nền tảng | Chia **wave**; mỗi wave ≤ 30 task, có plan riêng; chỉ wave 1 được chi tiết hoá |

Nếu một dự án vừa S vừa có auth (điều kiện L), lấy mức cao nhất.

### 1.3 Độ sâu plan theo quy mô

| Quy mô | Ngân sách khảo sát (số lần gọi tool) | Số vòng hỏi người | Ai duyệt plan |
|---|---|---|---|
| S | ≤ 10 | 0–1 (gộp) | Agent tự duyệt, ghi `[GIẢ ĐỊNH]` |
| M | ≤ 25 | ≤ 1 (tối đa 3 câu) | Người xem one-pager; không phản hồi sau 1 lượt → tiếp tục với `[GIẢ ĐỊNH]` đã ghi, không chờ |
| L | ≤ 60 | ≤ 2 | Người duyệt **bắt buộc** trước PASS 2 |
| XL | ≤ 60 mỗi wave | ≤ 2 mỗi wave | Người duyệt từng wave |

Vượt ngân sách khảo sát mà chưa đủ dữ kiện → dừng, trình danh sách thiếu, không "khảo sát thêm cho chắc".

**"1 lượt gọi tool"** = một lần gọi bất kỳ công cụ nào (đọc file, chạy lệnh, search, fetch). Đọc 10 file = 10 lượt. Chạy `ls` rồi `cat` cùng một file = 2 lượt. Đếm thật, không ước lượng.

### 1.4 Câu hỏi chặn vs giả định

Kế thừa 0.3 của bản thi hành, siết thêm cho giai đoạn plan:

- Tối đa **5 câu** cho toàn bộ giai đoạn plan (không phải 3 câu mỗi lượt). Gộp một tin nhắn.
- Mỗi câu phải kèm **default đề xuất** và **hệ quả nếu chọn sai**:

```
[CẦN QUYẾT] Dùng domain cũ hay domain mới?
- Đề xuất: giữ domain cũ (không mất SEO, không cần đổi DNS)
- Nếu sai: phải redirect 301 toàn bộ + cập nhật canonical + sitemap (C2)
```

- Câu nào **không chặn** việc bắt đầu → không hỏi, ghi `[GIẢ ĐỊNH]`, đi tiếp.
- Không hỏi thứ đã có trong repo, brief, hoặc tin nhắn trước (0.3 spec).
- Câu trả lời làm đổi ≥ 3 task → phải re-plan (8.3), không vá tại chỗ.
- **Quan hệ với 0.3 của bản thi hành:** 5 câu là tổng cho **cả giai đoạn plan**; khi đã vào thi hành thì quay lại đúng 0.3 của bản thi hành (tối đa 3 câu/lượt). Không cộng dồn hai con số.

### 1.5 Điều kiện từ chối lập plan

Nêu rõ và dừng, thay vì viết plan sẽ phải vứt:

| Tình huống | Phản hồi |
|---|---|
| Brief mâu thuẫn nghiêm trọng (ví dụ: "tĩnh hoàn toàn" + "có giỏ hàng") | Nêu mâu thuẫn, đề xuất 2 cách hiểu, chờ chọn |
| Yêu cầu vi phạm 1.2 của bản thi hành (chức năng/an toàn/a11y) | Nêu trade-off + phương án thay thế trước khi plan |
| Không có quyền truy cập repo/asset cần thiết | Plan phần làm được + danh sách `blocked` |
| Yêu cầu copy nguyên một site/theme có bản quyền | Từ chối phần copy; đề xuất hướng tương đương |

---

## 2. QUY TRÌNH 7 BƯỚC (P0–P6)

### 2.0 Tổng quan

| Bước | Đầu vào | Đầu ra | Gate |
|---|---|---|---|
| **P0** Khảo sát | Repo, brief | Inventory + baseline (số pass/fail/skip) | — |
| **P1** Research | 3 câu hỏi (7.1 spec) | `.memory/RESEARCH.md` đủ ngưỡng 7.6 | **PG1** |
| **P2** Phân rã | Inventory + brief + research | Danh sách task có ID, size, U | — |
| **P3** Thứ tự | Danh sách task | Đồ thị phụ thuộc + đường găng | — |
| **P4** Định cỡ | Đồ thị | Bảng size, số task, phát hiện task quá lớn | — |
| **P5** Rủi ro | Tất cả trên | `RISKS.md` + giả định có hạn xác minh | — |
| **P6** Viết & duyệt | Toàn bộ | `.plan/*` + one-pager | **PG2, PG3** |

Không được nhảy cóc: P2 trước P1 nghĩa là phân rã trên giả định chưa kiểm chứng.

### 2.1 P0 — Khảo sát (không sửa gì)

1. Đọc inventory theo 2.1 spec: lockfile → package manager, script, framework, version.
2. Chạy baseline **trước khi sửa**: lint, typecheck, test, build. Ghi số pass/fail/skip. Đây là mốc để phát hiện regression (11.2 spec).
3. Đọc `.memory/` nếu có: `PROJECT_STATE.md`, `DECISIONS.md`, `RESEARCH.md`.
4. Liệt kê route hiện có (nếu brownfield) và so với `brief.pages`.
5. Ghi phát hiện vào `PLAN.md` mục "Hiện trạng".

**Cấm:** sửa file, cài package, format, đổi config trong P0. Khảo sát xong mới được đụng.

### 2.2 P1 — Research (bắt buộc theo mục 7 spec)

- Viết 3 câu hỏi theo 7.1 **trước** khi search.
- Thực hiện theo 7.3 (query matrix), đọc repo mẫu theo 7.4–7.5.
- Ghi bằng chứng theo 7.6; đạt ngưỡng G0 (greenfield ≥ 3 mục, brownfield feature ≥ 2, bug ≥ 1, sửa text/CSS = 0 kèm lý do).
- **Luật Plan:** không task nào được chứa API/property/option **chưa xác minh**. Nếu chưa chắc → tạo spike `SP-xx`, không viết task "dùng X để làm Y".

Research ở đây phục vụ **quyết định trong plan**, không phải để trang trí tài liệu.

### 2.3 P2 — Phân rã

- Cắt theo **slice dọc** (3.1), không theo tầng.
- Mỗi route trong `brief.pages` phải xuất hiện ở ≥ 1 task (bảng truy vết 7.2).
- Mỗi mục Definition of Done (11.3 spec) phải ánh xạ tới ≥ 1 task, hoặc đánh dấu `N/A` kèm lý do.
- Chưa sắp thứ tự ở bước này — chỉ liệt kê. Sắp thứ tự là P3.

### 2.4 P3 — Thứ tự & phụ thuộc

- Vẽ danh sách phụ thuộc cứng dạng `A → B` (mục 4).
- Xác định đường găng theo **số task**, không theo thời gian.
- Đánh dấu task nào chạy song song được (4.4).
- Chèn checkpoint cho mỗi 3 task U2/U3 trên đường găng (4.3).

### 2.5 P4 — Định cỡ & độ bất định

- Gán size XS–XL và U1–U3 cho từng task (3.3).
- Task XL → **bắt buộc tách**, không được tồn tại trong `TASKS.md`.
- Đếm tổng task; so trần theo quy mô (3.7). Vượt → gộp hoặc cắt theo 8.4, không tăng trần.

### 2.6 P5 — Rủi ro & giả định

- Mỗi rủi ro một dòng: dấu hiệu sớm (quan sát được) + hành động khi xảy ra + task bị ảnh hưởng.
- Mỗi giả định một dòng: nội dung, cách xác minh, hạn xác minh (theo mốc nào).
- Rủi ro không có dấu hiệu sớm là rủi ro chưa hiểu → viết lại.

### 2.7 P6 — Viết artifact & duyệt

- Tạo `.plan/PLAN.md`, `TASKS.md`, `RISKS.md`, `QUESTIONS.md` theo mục 6.
- Cập nhật `.memory/DECISIONS.md` cho mọi `[GIẢ ĐỊNH]` (8.2 spec).
- Viết one-pager theo 10.1, tối đa 1 màn hình điện thoại.
- Chạy checklist PG2, PG3 (mục 7). Chưa đạt → chưa được vào PASS 1.

---

## 3. PHÂN RÃ CÔNG VIỆC

### 3.1 Đơn vị slice

Một task đạt chuẩn khi thoả **cả 5**:

1. Chạm được hành vi quan sát: một route, một component có trạng thái, một luồng form, một endpoint.
2. Vừa **1 PR**; nếu phải mô tả bằng "và" ở mục tiêu → tách.
3. Có **DoD bằng lệnh hoặc bằng chứng nhìn thấy** (test, curl, screenshot, axe, Lighthouse).
4. Không phụ thuộc vào task chưa tồn tại (nếu có, phải khai báo ở `→`).
5. Có size ≤ L và U xác định.

### 3.2 ID & đặt tên

- `T-<AREA>-<2 chữ số>`: `T-HOME-01`, `T-AUTH-03`. AREA theo route hoặc miền: `HOME`, `PRICE`, `BLOG`, `AUTH`, `DASH`, `FORM`, `SEO`, `A11Y`, `PERF`, `CI`, `DEPLOY`.
- Tiêu đề task = **động từ + kết quả**, không phải chủ đề: "Dựng hero với ảnh LCP ưu tiên" chứ không "Hero".
- Không đánh số lại ID sau khi đã commit — ID là tham chiếu trong commit message và `BUGS.md`.

### 3.3 Task template

Mỗi task trong `TASKS.md` là một khối (hoặc một dòng bảng nếu size XS):

```yaml
- id: T-HOME-03
  title: "Dựng hero với ảnh LCP ưu tiên, không CLS"
  goal: "Hero hiển thị đúng ở 360px và 1280px, LCP element là ảnh hero"
  size: M            # XS | S | M | L (XL không được tồn tại)
  uncertainty: U2    # U1 đã có tiền lệ | U2 cần research ngắn | U3 cần spike
  spec: [4.1, 4.8, 5.3]        # mục trong bản thi hành chi phối task này
  files: ["src/pages/index.astro", "src/components/Hero.astro", "src/styles/hero.css"]
  depends_on: [T-DS-01, T-LAYOUT-01]
  dor: "token + layout shell đã xanh (điều kiện 13)"
  dod:
    - "Ảnh hero có width/height, fetchpriority=high, không phải background-image"
    - "Không CLS khi tải chậm (test 6.2 spec)"
    - "axe 0 critical trên route /"
  evidence:
    - "<pm> run build → exit 0"
    - "<pm> run test:e2e -- hero.spec.ts → 2 passed"
    - "screenshot 360/1280 trong .memory/visual_ledger/"
  risk: ["ảnh gốc 4MB → phải nén trước khi dùng"]
```

Bảng rút gọn dùng khi size XS/S:

| ID | Task | Size | U | Phụ thuộc | DoD (1 dòng) |
|---|---|---|---|---|---|
| T-SEO-01 | Thêm metadata + OG cho mọi route | S | U1 | T-LAYOUT-01 | `curl` thấy title/description/canonical/og:* trên 5 route |

**Quy tắc size:**

| Size | Dấu hiệu | Cho phép |
|---|---|---|
| XS | 1 file, không test mới, không dependency | Gộp chung dòng bảng |
| S | 2–5 file, 1 test hoặc 1 kiểm tra tay | Một khối ngắn |
| M | 1 route/feature trọn vẹn + test | Một khối đầy đủ |
| L | Nhiều route hoặc 1 integration; **tách được** | Phải tách trước khi vào PASS |
| XL | Không mô tả nổi trong 1 PR | **Cấm** — tách hoặc chuyển thành wave |

**Quy tắc độ bất định:**

| U | Nghĩa | Hành động |
|---|---|---|
| U1 | Đã có tiền lệ trong repo hoặc đã làm nhiều lần | Vào thẳng |
| U2 | Biết hướng, cần đọc docs đúng version | Research ngắn (7 spec) trước khi code |
| U3 | Chưa biết có khả thi không | **Spike trước**; không nằm trên đường găng khi chưa có kết luận |

### 3.4 Ví dụ đạt / không đạt

| Task viết ra | Đánh giá | Vì sao |
|---|---|---|
| "Làm trang chủ" | Không đạt | Không DoD, không phạm vi, không kiểm chứng |
| "Dựng hero + pricing + FAQ" | Không đạt | 3 mục tiêu trong 1 task |
| "Sửa lỗi form" | Không đạt | Không tái hiện được, không mức P |
| "Thêm validate email phía server cho form liên hệ, trả 422 kèm message tiếng Việt" | Đạt | Một mục tiêu, kiểm chứng được bằng curl/test |
| "Tối ưu performance" | Không đạt | Không ngưỡng, không metric |
| "Giảm LCP route / từ 3.1s xuống ≤ 2.5s (lab, mobile preset)" | Đạt | Có số đo trước/sau, có ngưỡng 5.2.2 spec |

### 3.5 Spike

- ID `SP-<số>`, mục tiêu là **trả lời một câu hỏi**, giới hạn theo **số lần thử** (≤ 5 lần thử, mỗi lần một lệnh hoặc một thí nghiệm), không theo giờ.
- Đầu ra bắt buộc: một mục trong `DECISIONS.md` (chọn gì, loại gì, vì sao) + 1 dòng kết luận trong `RESEARCH.md`.
- **Cấm** đưa code spike vào production path. Spike xong thì xoá nhánh/file thử hoặc tách thành task chính thức.
- Spike không xong trong giới hạn → ghi `blocked` + 2 phương án, không kéo dài âm thầm.

### 3.6 Việc nền (foundation)

Các task nền phải xong trước khi làm route đầu tiên, nhưng không được chiếm quá 1/4 tổng task:

| Nền | Task điển hình | Gate tương ứng |
|---|---|---|
| Repo chạy được | install, build, lint, typecheck, test trống | G1–G5 |
| Token & layout shell | token 4.2 spec, container, header/footer | PASS 1 |
| Route map & 404 | route cho mọi trang brief, 404 | PASS 1 |
| CI tối thiểu | workflow chạy lint+test+build | G2–G5 |
| Deploy skeleton | preview deploy được (khi được phép) | M1 |

Nếu nền chiếm > 25% task, nghĩa là đang làm quá nhiều hạ tầng cho một site nhỏ — cắt theo 2.3 spec ("đơn giản nhất đủ dùng").

### 3.7 Trần số task

| Quy mô | Trần task | Vượt thì |
|---|---|---|
| S | 12 | Gộp task XS, cắt theo 8.4 |
| M | 30 | Gộp, hoặc tách thành 2 mốc |
| L | 45 | Chia wave |
| XL | 30/wave | Wave mới, plan riêng |

Vì sao wave (30) nhỏ hơn L (45): mỗi wave phải được duyệt và bàn giao riêng, nên phải gọn hơn một plan L duy nhất. Trần là để chống "plan 200 dòng không ai đọc"; vượt trần mà không cắt được → vấn đề là phạm vi, không phải cách viết plan.

---

## 4. THỨ TỰ & PHỤ THUỘC

### 4.1 Walking skeleton trước

Thứ tự mặc định, không thương lượng:

1. Repo chạy được (install/build/lint/test).
2. Token + layout shell + route map + 404.
3. **Deploy được một bản rỗng** (M1) — kể cả khi nội dung còn placeholder.
4. Từng route hoàn chỉnh theo thứ tự ưu tiên trong brief.
5. Form/luồng dữ liệu.
6. Hardening (a11y, perf, SEO, security).
7. Bàn giao.

Lý do phải deploy sớm: mọi vấn đề về môi trường, base path, biến môi trường, redirect sẽ lộ ra ở bước 3, không phải ở bước 7.

### 4.2 Phụ thuộc điển hình

| Task sau | Phụ thuộc cứng vào | Vì sao |
|---|---|---|
| Component bất kỳ | Token + layout shell | Tránh hard-code màu/spacing rồi phải sửa lại |
| Form | Schema validate + endpoint | Không validate hai nơi lệch nhau |
| Dashboard | Auth + mô hình dữ liệu | Không dựng UI trên dữ liệu giả rồi làm lại |
| SEO/metadata | Route map chốt | Canonical/sitemap sai nếu route còn đổi |
| Sitemap | Toàn bộ route cuối | Sinh sớm sẽ thiếu/thừa |
| Hình ảnh OG | Nội dung tiêu đề chốt | Sinh lại 2 lần là lãng phí |
| i18n | Nội dung đã chốt | Dịch trước khi chốt nội dung = dịch lại |
| E2E | Luồng chính chạy được thủ công | Test sẽ flaky nếu UI còn đổi cấu trúc |
| Lighthouse gate | Build production + route đủ | Đo trên dev server là vô nghĩa (0.6 spec) |
| Analytics | Quyết định consent/pháp lý | Bật trước khi có consent là vi phạm |

### 4.3 Đường găng & buffer

- Đường găng = chuỗi `→` dài nhất tính bằng **số task**.
- Cứ **3 task U2/U3 nối tiếp nhau trên đường găng** → chèn 1 checkpoint: một mốc nhỏ có demo + bằng chứng, để phát hiện lệch sớm.
- Task U3 **không** được nằm trên đường găng trước khi spike tương ứng xong.
- Buffer không phải "thêm thời gian" mà là "thêm checkpoint" và "giảm phạm vi" (8.4).

### 4.4 Song song hoá

| An toàn để song song | Không an toàn |
|---|---|
| Hai route khác thư mục, không dùng chung file | Cùng một file (kể cả `package.json`, `tailwind.config`, `i18n/*.json`) |
| Viết test cho route đã xong | Sửa token trong khi làm component |
| Viết nội dung/microcopy cho section đã có khung | Hai người cùng sửa schema/migration |
| Nghiên cứu (research) song song với code UI | Cài dependency trong khi người khác đang build |

**Luật đa agent:** mỗi agent một vùng ghi (thư mục hoặc bộ file) không giao nhau; thoả thuận contract (props, route, kiểu dữ liệu) **trước** khi chạy song song; không agent nào được đổi `package.json` khi agent khác đang chạy.

### 4.5 Điểm dừng cứng (phải chờ người)

| Tình huống | Vì sao dừng |
|---|---|
| Cần quyết định thương hiệu/nội dung pháp lý | Không thể thay bằng placeholder hợp lý |
| Cần quyền deploy production / mua dịch vụ / đổi DNS | W8 spec |
| Research bác bỏ giả định nền (đổi stack, đổi mô hình dữ liệu) | C3 (8.1) |
| P0 xảy ra giữa lúc làm | 9.5 spec |
| Task fail 2 lần | W10 + 9.3 spec |
| Phạm vi tăng > 20% số task | 8.2 |

Ngoài 6 điểm trên, agent được tự quyết và ghi `[GIẢ ĐỊNH]`.

---

## 5. MỐC (MILESTONES)

### 5.1 Bảng mốc

| Mốc | Điều kiện vào | Demo được gì | Gate spec |
|---|---|---|---|
| **M0 — Plan xong** | Intake đủ, PG1 đạt | One-pager + `.plan/*` | PG2, PG3 |
| **M1 — Skeleton chạy & deploy được** | M0 | Site rỗng deploy được: header/nav/footer, mọi route 200, 404 đúng | PASS 1 exit |
| **M2 — Luồng chính hoàn chỉnh** | M1 | Người dùng đi hết luồng chính (xem → form/đăng nhập → xác nhận) | G2–G6 |
| **M3 — Đạt chuẩn chất lượng** | M2 | axe 0 serious/critical, Lighthouse đạt 5.2.2, responsive 320→1440 | G7, G8 |
| **M4 — Sẵn sàng phát hành** | M3 | G9 xanh, README chạy từ clone sạch, rollback có hướng dẫn | PASS 3 exit |
| **M5 — Bàn giao** | M4 | Người nhận tự chạy được, tự deploy được, biết chỗ sửa nội dung | 11.3 spec |

### 5.2 Luật mốc

- Mốc gắn với **bằng chứng**, không gắn với ngày. Không viết "M2: 15/11".
- Mỗi mốc phải có **một câu demo**: "Mở URL, bấm X, thấy Y".
- Không mốc nào được gộp hai trạng thái (ví dụ "vừa skeleton vừa có form").
- Mốc trượt → ghi lý do vào `PLAN.md`, không đổi định nghĩa mốc cho khớp thực tế.

### 5.3 Mốc cho brownfield và bug

| Tình huống | Mốc thay thế |
|---|---|
| Brownfield thêm feature | M0 → **M0.5**: baseline chạy xanh (lint/test/build) trước khi thêm bất cứ gì → M2 → M3 |
| Bug P0 | **M1-hotfix**: rollback/disable xong, site ổn định → M1.5: có test tái hiện → M4 |
| Migration | M0 → **M-parity**: bản mới khớp bản cũ trên N route mẫu → M3 → M4 |

### 5.4 Điều kiện tuyên bố mốc đạt

Chỉ được nói "đạt Mx" khi có đủ: (a) lệnh/kiểm tra đã chạy, exit code, (b) một dòng kết quả, (c) file/bằng chứng lưu trong `.memory/` hoặc `.plan/`. Thiếu một trong ba → `implemented`, không phải đạt mốc (0.4 spec).

---

## 6. ARTIFACT KẾ HOẠCH

### 6.1 Cây file

```
.plan/
  PLAN.md        # mục tiêu, phạm vi, thứ tự, mốc, hiện trạng
  TASKS.md       # danh sách task + trạng thái
  RISKS.md       # rủi ro, giả định, dấu hiệu sớm
  QUESTIONS.md   # [CẦN QUYẾT] đang chờ, đã trả lời
.memory/
  PROJECT_STATE.md   # sự thật hiện tại (8.1 spec)
  DECISIONS.md       # ADR + [GIẢ ĐỊNH] (8.2 spec)
  RESEARCH.md        # bằng chứng research (8.7 spec)
  CONTENT_MAP.md     # nội dung + trạng thái (8.4 spec)
  BUGS.md            # bug + mức P (8.6 spec)
  visual_ledger/     # ảnh chụp (8.5 spec)
```

Không tạo thêm file kế hoạch ngoài 4 file trong `.plan/`. Ngoại lệ duy nhất: bản mở rộng cấp step `docs/superpowers/plans/YYYY-MM-DD-<feature>.md` khi dùng `writing-plans` (14.4). Cần chỗ cho nội dung khác → dùng mục trong `PLAN.md`.

`AGENTS.md` của repo (mẫu 13.1 trong bản thi hành) phải trỏ **cả hai** bản: `docs/EXECUTION_SPEC.md` và `docs/PLAN_SPEC.md`, và thêm một dòng: "Trước khi làm task mới: đọc `.plan/TASKS.md`, kiểm DoR mục 13."

### 6.2 `.plan/PLAN.md`

```md
# PLAN — <tên dự án>

## Mục tiêu
<một câu, lấy từ brief.goal>

## Quy mô & chế độ
S | M | L | XL · greenfield | brownfield · plan v<N> · cập nhật <ngày>

## Hiện trạng (P0)
- Package manager: <pnpm|npm|yarn|bun> (theo <lockfile>)
- Baseline: lint <pass/fail> · test <n> pass / <n> fail / <n> skip · build <exit>
- Route hiện có: <n> · Route trong brief: <n> · Thiếu: <danh sách>

## Trong phạm vi
- <route/luồng/hạng mục>

## Ngoài phạm vi (không làm lần này)
- <hạng mục + lý do>

## Thứ tự & mốc
M0 → M1 → M2 → M3 → M4 → M5  (chi tiết ở mục Milestones)

## Đường găng
T-... → T-... → T-...

## Rủi ro lớn nhất
1. <rủi ro> — dấu hiệu: <quan sát được> — hành động: <...>

## Cần quyết
- [CẦN QUYẾT] <câu hỏi> — đề xuất: <...> — chặn: <task/mốc>

## Cách biết là xong
- Mọi task trong TASKS.md ở trạng thái done-verified
- 11.3 spec đạt (bảng truy vết 7.2 không còn ô trống)
```

### 6.3 `.plan/TASKS.md`

Trạng thái chỉ có 4 giá trị, không dùng "gần xong":

| Trạng thái | Nghĩa | Điều kiện vào |
|---|---|---|
| `todo` | Chưa bắt đầu, đã đủ DoR | — |
| `doing` | Đang làm, chỉ **1** task ở trạng thái này mỗi agent | Đã có nhánh/commit đầu |
| `blocked` | Đang kẹt | Có dòng lý do + `[CẦN QUYẾT]`/bug ID |
| `done-verified` | Xong thật | Có bằng chứng (0.4 spec `verified`) |

Bảng:

| ID | Task | Size | U | Phụ thuộc | Trạng thái | Bằng chứng |
|---|---|---|---|---|---|---|
| T-DS-01 | Chốt token + đo tương phản | S | U1 | — | done-verified | `python3 scripts/contrast.py` → 8/8 pass |
| T-HOME-01 | Dựng layout shell | M | U1 | T-DS-01 | doing | — |

Quy tắc: `doing` quá 1 task cùng lúc = đang làm song song không kiểm soát, trừ khi đã khai báo theo 4.4.

### 6.4 Quyết định — dùng `.memory/DECISIONS.md`

Dùng đúng 8.2 của bản thi hành — **không** tạo file quyết định thứ hai. Trong giai đoạn plan, mỗi mục cần thêm 1 dòng: "ảnh hưởng task nào".

```md
## 2026-10-24 — Chọn Astro thay vì Next.js
Bối cảnh: 8 trang tĩnh, không auth, cần SEO tốt.
Chọn: Astro. Loại: Next.js (thừa runtime), Eleventy (thiếu island).
Lý do: 0 JS mặc định; build ra HTML tĩnh; đã có bằng chứng RESEARCH.md #1.
Hệ quả: không dùng được server actions; form cần endpoint ngoài.
Ảnh hưởng: T-BUILD-01, T-FORM-01, T-DEPLOY-01.  [GIẢ ĐỊNH]
```

### 6.5 `.plan/RISKS.md`

| # | Rủi ro / giả định | Xác suất | Tác động | Dấu hiệu sớm (quan sát được) | Hành động | Task bị ảnh hưởng |
|---|---|---|---|---|---|---|
| R1 | Ảnh gốc quá nặng, không đạt LCP | Cao | M3 trượt | Ảnh > 300KB sau nén | Yêu cầu bộ ảnh đã optimize; nếu không, dùng placeholder + ghi `[CẦN QUYẾT]` | T-HOME-03 |
| R2 | Chưa có nội dung thật | Chắc chắn | DoD không đóng được | `CONTENT_MAP` còn `placeholder` | Dùng `[[...]]`, chặn M4 | T-CONTENT-01 |

Quy tắc: mỗi dòng phải có **dấu hiệu sớm quan sát được**. "Có thể chậm" không phải dấu hiệu.

### 6.6 `.plan/QUESTIONS.md`

```md
# QUESTIONS

## Đang chờ
| # | Câu hỏi | Đề xuất | Nếu sai thì | Chặn gì | Hỏi lúc |
|---|---|---|---|---|---|
| Q1 | Giữ domain cũ? | Giữ | Redirect 301 + canonical (C2) | T-DEPLOY-01 | 2026-10-24 |

## Đã trả lời
| # | Trả lời | Ngày | Ảnh hưởng |
|---|---|---|---|
```

Câu đã trả lời **không xoá** — chuyển xuống mục dưới, để không hỏi lại (0.3 spec).

### 6.7 `.plan/` ↔ `.memory/` — nguồn sự thật

| File | Trả lời câu hỏi | Ghi khi nào |
|---|---|---|
| `.plan/TASKS.md` | Sẽ làm gì, theo thứ tự nào | Khi plan và mỗi lần đổi trạng thái |
| `.plan/RISKS.md` | Cái gì có thể hỏng, nhận ra bằng gì | Khi plan, khi rủi ro xảy ra |
| `.memory/PROJECT_STATE.md` | Hiện tại đang ở đâu | Sau mỗi mốc |
| `.memory/DECISIONS.md` | Vì sao chọn thế | Mỗi quyết định, kể cả `[GIẢ ĐỊNH]` |
| `.memory/RESEARCH.md` | Dựa vào đâu | Trước khi chốt stack/dependency |
| `.memory/BUGS.md` | Cái gì đang hỏng | Mỗi bug P2/P3 trở lên |

Mâu thuẫn: `.memory/` thắng về **sự thật**, `.plan/` thắng về **ý định**. Không sửa `.memory/` để khớp plan.

### 6.8 Luật đồng bộ

- Cập nhật `.plan/TASKS.md` **trước** khi bắt đầu task mới (đổi sang `doing`).
- Cập nhật **ngay** khi task xong, kèm bằng chứng — không gộp cuối ngày.
- Cuối mỗi pass: đối chiếu `TASKS.md` với `git log`; task nào không có commit tương ứng thì không được `done-verified`.
- Plan lệch thực tế > 20% số task → re-plan (8.3), không "âm thầm chỉnh".

---

## 7. PLAN GATE (PG0–PG3)

### 7.1 Bảng gate

| Gate | Câu hỏi kiểm tra | Bằng chứng | Fail thì |
|---|---|---|---|
| **PG0 — Intake đủ** | Brief đủ 12 hạng mục 1.1? Mọi `unknown` đã có `[GIẢ ĐỊNH]` hoặc `[CẦN QUYẾT]`? | `PLAN.md` mục Hiện trạng + `QUESTIONS.md` | Quay lại 1.1; không phân rã tiếp |
| **PG1 — Research đủ** | `.memory/RESEARCH.md` đạt ngưỡng 7.6? Mọi quyết định stack/dependency có nguồn? | File + URL + ngày + version | Không được chốt stack; làm tiếp P1 |
| **PG2 — Plan kiểm chứng được** | Mỗi task có DoD + bằng chứng? Mọi route brief có task? Mọi mục 11.3 spec được ánh xạ? | Bảng truy vết 7.2 | Viết lại task thiếu; không vào PASS 1 |
| **PG3 — Sẵn sàng thi hành** | Không còn task XL? Không còn U3 trên đường găng trước spike? Phụ thuộc đã có task? One-pager đã gửi, và với L/XL đã có xác nhận? | `TASKS.md` + one-pager + xác nhận (nếu L/XL) | Chờ duyệt hoặc tách task |

Thứ tự bắt buộc: PG0 → PG1 → PG2 → PG3. Không đánh dấu PG3 khi PG1 chưa đạt.

### 7.2 Bảng truy vết (bắt buộc với M/L/XL)

Hai bảng, cả hai phải không còn ô trống:

**a) Route → task**

| Route trong brief | Task |
|---|---|
| `/` | T-HOME-01, T-HOME-02, T-HOME-03 |
| `/bang-gia` | T-PRICE-01 |
| `/lien-he` | T-FORM-01, T-FORM-02 |

**b) Definition of Done (11.3 spec) → task**

| Mục DoD | Task / ghi chú |
|---|---|
| Responsive 320→1440 | T-RESP-01 |
| axe 0 serious/critical | T-A11Y-01, T-A11Y-02 |
| Lighthouse đạt 5.2.2 | T-PERF-01, T-PERF-02 |
| README chạy từ clone sạch | T-DOC-01 |
| Sitemap/robots | T-SEO-02 |
| Không có form trong brief | `N/A` — brief không có form, không phải bỏ sót |

Ô trống = plan thiếu. `N/A` phải có lý do cụ thể, không được để trống.

### 7.3 Ai duyệt

| Quy mô | Người duyệt | Agent được tự duyệt khi |
|---|---|---|
| S | Không bắt buộc | Luôn được, nếu ghi đủ `[GIẢ ĐỊNH]` |
| M | Xem one-pager | Người không phản hồi sau 1 lượt và không có `[CẦN QUYẾT]` nào |
| L/XL | Bắt buộc | Không được tự duyệt |
| Bất kỳ | Bắt buộc nếu có C3 hoặc P0 | Không |

### 7.4 Sáu dấu hiệu "plan ảo"

| Dấu hiệu | Cách phát hiện | Sửa |
|---|---|---|
| Không có DoD | Task toàn động từ, không có lệnh kiểm chứng | Viết lại theo 3.3 |
| Không route nào ánh xạ | Bảng truy vết 7.2a trống | Bổ sung task theo brief.pages |
| Toàn task U3 | Không có task U1 nào | Spike trước, hạ U |
| Chỉ có task nền | > 25% task là setup/CI | Cắt hạ tầng, vào route sớm |
| Không có mốc demo được | Mốc chỉ là "xong pass 2" | Viết câu demo (5.2) |
| Không cập nhật sau khi làm | `TASKS.md` đứng yên, `git log` chạy | 6.8 |

---

## 8. CHANGE CONTROL

### 8.1 Phân loại thay đổi

| Mức | Định nghĩa | Ví dụ | Hành động |
|---|---|---|---|
| **C1** | Trong phạm vi đã duyệt: thêm/sửa task, đổi thứ tự nội bộ | Tách T-HOME-02 thành 2 task | Cập nhật `TASKS.md`, không cần duyệt |
| **C2** | Đổi phạm vi nhỏ: thêm route/section, đổi thư viện UI, thêm integration nhẹ | Thêm trang `/tuyen-dung` | One-pager delta + duyệt (hoặc `[GIẢ ĐỊNH]` nếu vắng, ghi chi phí) |
| **C3** | Đổi nền: stack, mô hình dữ liệu, cấu trúc URL, thương hiệu, nền tảng deploy | Đổi Astro → Next.js | **Dừng**, trình 2 phương án + hệ quả, chờ duyệt |

### 8.2 Quy trình 5 bước khi scope đổi

1. **Ghi lại** yêu cầu mới nguyên văn vào `QUESTIONS.md` hoặc `DECISIONS.md` (không diễn giải lại theo hướng dễ làm).
2. **Phân loại** C1/C2/C3 (8.1).
3. **Đánh giá ảnh hưởng**: task nào thêm/xoá/đổi; route nào; gate nào bị ảnh hưởng; có phải research lại không.
4. **Cập nhật plan trước**, code sau: `TASKS.md` + `PLAN.md` (mục Trong/Ngoài phạm vi) + one-pager nếu C2/C3.
5. **Xác nhận** (nếu C2/C3) rồi mới bắt đầu.

### 8.3 Sáu trigger re-plan (định lượng)

| Trigger | Ngưỡng | Việc phải làm |
|---|---|---|
| Task fail gate liên tiếp | 2 task | Dừng, xem lại cách phân rã; có thể task đang gộp 2 mục tiêu |
| Giả định trong RISKS xảy ra | 1 | Cập nhật plan + phương án; nếu ảnh hưởng mốc → báo người |
| Research bác bỏ quyết định đã ghi | ≥ 1 mục `DECISIONS.md` | Viết lại quyết định + task liên quan; nếu đổi nền → C3 |
| Phát hiện yêu cầu ẩn | Yêu cầu cần > 1 task mới | Thêm vào plan trước khi làm; báo người nếu > 20% |
| Phạm vi tăng | > 20% số task | Re-plan, trình lại one-pager |
| Mốc trượt 2 lần | 2 mốc | Xem lại thứ tự/đường găng, không "cố thêm" |

### 8.4 Thứ tự cắt scope khi bị chặn

Cắt từ trên xuống, dừng ở mức vẫn giữ được nhóm ưu tiên 1–3 (chức năng, an toàn, a11y) ở mục 1.2 của bản thi hành:

| Thứ tự | Cắt được | Ghi chú |
|---|---|---|
| 1 | Animation/motion phụ, hiệu ứng hover cầu kỳ | Không ảnh hưởng chức năng |
| 2 | Trang phụ ngoài route chính | Blog, tuyển dụng, FAQ mở rộng |
| 3 | Dark mode | Nếu brief không bắt buộc |
| 4 | Ngôn ngữ thứ hai | Giữ ngôn ngữ chính đúng trước |
| 5 | CMS → nội dung tĩnh/MDX | Khi số bài < 30 |
| 6 | Search/filter nâng cao | Giữ danh sách + phân trang cơ bản |

**Không được cắt, dù bị chặn:** a11y mức 5.1, responsive 320px, security 3.12, 404/error state, metadata/SEO cơ bản, README chạy được, test luồng chính.

### 8.5 Cấm trong change control

- Mở rộng phạm vi "nhân lúc đang sửa" mà không ghi (vi phạm W3).
- Đổi thứ tự task để né phần khó, không ghi lý do.
- Thêm dependency chưa có mục trong `RESEARCH.md` (W4 + 7.6).
- Sửa định nghĩa DoD/mốc cho khớp với việc đã làm.

---

## 9. PLAYBOOK THEO TÌNH HUỐNG

### 9.1 Site mới nhỏ (S) — marketing/portfolio/landing

**Plan tối thiểu:** 1 trang `PLAN.md`, 8–12 task.

1. Token + layout shell (T-DS, T-LAYOUT).
2. Route map + 404 + metadata cơ bản.
3. Deploy skeleton (M1).
4. Từng section/trang với nội dung thật hoặc `[[...]]`.
5. Form (nếu có) + trạng thái đủ (4.8 spec).
6. A11y + Lighthouse + OG/sitemap (M3).
7. README + rollback (M4).

**Bẫy:** dành quá nhiều task cho hạ tầng; làm hero trước khi có layout shell; bỏ qua 404 và metadata vì "site nhỏ"; dùng ảnh stock nặng.

### 9.2 Web app / dashboard / SaaS (L)

**Plan tối thiểu:** `PLAN.md` + `TASKS.md` + `RISKS.md` + ADR; bảng truy vết bắt buộc.

1. Repo + auth (nếu brief có) — chốt mô hình dữ liệu **trước** UI.
2. Layout shell + route bảo vệ + trạng thái rỗng/đang tải/lỗi (4.8 spec).
3. Một luồng dọc hoàn chỉnh (ví dụ: tạo → xem → sửa → xoá) trước khi làm luồng thứ hai.
4. Phân quyền + validate server + rate limit (3.12 spec).
5. E2E luồng chính (6.2 spec).
6. Hardening + M3.

**Bẫy:** làm 10 màn hình cùng lúc; dựng UI trên dữ liệu giả; bỏ qua trạng thái lỗi; auth làm sau cùng; không có luồng dọc nào chạy được đến M2.

### 9.3 Brownfield — thêm feature

**Plan tối thiểu:** khảo sát kỹ hơn plan (P0 chiếm phần lớn), 1 trang `PLAN.md`.

1. **M0.5:** làm baseline xanh trước (lint/test/build) — nếu repo đang đỏ, đó là task đầu tiên.
2. Đọc convention hiện có: cấu trúc thư mục, cách fetch, cách đặt tên, CSS method (2.5 spec).
3. Xác định điểm chèn tối thiểu; liệt kê file sẽ đụng.
4. Test cho hành vi hiện tại của vùng sắp sửa (chống regression) — trước khi đổi.
5. Feature + test mới.
6. Không refactor ngoài phạm vi (W3).

**Bẫy:** mang convention từ dự án khác vào; "dọn luôn" file xung quanh; đổi version thư viện nhân lúc thêm feature; không có test chống regression.

### 9.4 Bug / incident

Theo 9.1–9.5 của bản thi hành. Plan chỉ giữ phần khác biệt:

1. Phân mức P (9.2.1 spec). P0 → rollback/disable trước (9.5), plan sau.
2. Tái hiện bằng test (nếu tái hiện được) — đây là task đầu tiên.
3. Research mục 7.11 spec nếu bug > 15 phút.
4. Sửa tối thiểu → verify → test chống tái phát.
5. Ghi vào `BUGS.md` nếu chưa đóng hẳn.

**Cấm:** sửa nhiều chỗ "cho chắc"; nâng cấp dependency để "hết lỗi"; tắt test/a11y để pass.

### 9.5 Migration / refactor

1. Chốt tiêu chí parity (route nào, hành vi nào phải giống) — bằng bảng.
2. Dựng bản mới song song, không sửa bản cũ.
3. So sánh trên N route mẫu (N ≥ 5 hoặc 20% tổng route).
4. Chuyển redirect, canonical, sitemap.
5. Giữ khả năng rollback đến khi parity đạt + 1 tuần ổn định (hoặc theo thỏa thuận).

**Bẫy:** refactor + thêm feature cùng lúc; mất SEO do đổi URL không redirect; xoá bản cũ quá sớm.

---

## 10. TRÌNH BÀY PLAN CHO NGƯỜI

### 10.1 One-pager

Tối đa 1 màn hình điện thoại, đúng 7 khối, không thêm:

```md
# <Tên dự án> — kế hoạch

**Mục tiêu:** <một câu>

**Làm:** <3–5 gạch đầu dòng, mỗi dòng 1 route/luồng/hạng mục>

**Không làm lần này:** <2–4 gạch + lý do ngắn>

**Thứ tự:** M1 skeleton deploy được → M2 luồng chính → M3 chất lượng → M4 phát hành

**Rủi ro lớn nhất:** <≤ 3, mỗi cái 1 dòng kèm cách xử lý>

**Cần bạn quyết:** <≤ 3 câu, mỗi câu kèm đề xuất>

**Xong khi:** <3–5 bằng chứng kiểm chứng được>
```

### 10.2 Luật viết

- Không deadline, không "khoảng X ngày". Nếu người dùng hỏi thời gian: nêu **số task + độ bất định + rủi ro**, và nói rõ không cam kết thời lượng.
- Nêu bất định bằng số: "3 task U3 cần spike trước".
- Mỗi câu hỏi phải kèm đề xuất và hệ quả nếu chọn sai (1.4).
- Tối đa 3 câu hỏi trong one-pager, gộp một lần.
- Không dùng từ tự khen: "tối ưu", "hiện đại", "chuyên nghiệp" mà không có số đo.

### 10.3 Ví dụ one-pager điền sẵn

```md
# Website công ty ABC — kế hoạch

**Mục tiêu:** Trang giới thiệu 8 trang, khách tự gửi yêu cầu báo giá.

**Làm:** trang chủ, giới thiệu, dịch vụ (4 trang), bảng giá, liên hệ (form)
**Không làm:** blog, đa ngôn ngữ, đăng nhập khách hàng (chưa có nhu cầu)

**Thứ tự:** M1 skeleton deploy được (tuần này) → M2 form + nội dung → M3 a11y/Lighthouse → M4 phát hành

**Rủi ro:** (1) chưa có ảnh thật → dùng placeholder, chặn phát hành; (2) nội dung dịch vụ chưa chốt → `CONTENT_MAP` đang 60%

**Cần bạn quyết:** (1) giữ domain cũ? đề xuất giữ; (2) form gửi về email nào? đề xuất info@…

**Xong khi:** 8 route 200, form gửi thành công + có email nhận, axe 0 serious/critical, Lighthouse mobile ≥ 0.9, README chạy từ clone sạch.
```

### 10.4 Khi nào xin duyệt

| Tình huống | Cách |
|---|---|
| M0 xong (plan lần đầu) | Gửi one-pager, xin xác nhận phạm vi |
| C2/C3 | Gửi delta: thêm gì, bỏ gì, ảnh hưởng mốc nào |
| Trước deploy production | W8 spec — xin phép rõ ràng |
| M5 bàn giao | Báo cáo bằng chứng, không xin duyệt |
| Trong lúc làm, C1 | Không cần báo từng task |

---

## 11. PROMPT COPY-PASTE

### 11.1 Prompt Plan Mode (dán đầu phiên)

```
Bạn là agent lập kế hoạch cho dự án web. Chưa viết code.

Đọc và tuân thủ:
1. docs/PLAN_SPEC.md (bản plan này).
2. docs/EXECUTION_SPEC.md = PROMPT_SPEC_WEB_DEV_AGENT_v1.md v1.1.
Khi hai bản mâu thuẫn: chất lượng theo bản 2, thứ tự theo bản 1.

Dự án: <tên>
Chế độ: <greenfield | brownfield>
Brief: <dán brief 0.2, hoặc "suy ra từ repo">

Làm theo thứ tự, dừng đúng chỗ:
P0 — Khảo sát: đọc repo, xác định package manager theo lockfile, chạy baseline
     (lint/typecheck/test/build) và ghi số pass/fail/skip. Không sửa file.
P1 — Research: viết 3 câu hỏi (7.1), tra theo 7.3, ghi .memory/RESEARCH.md
     đủ ngưỡng 7.6. Chưa chốt stack khi chưa có bằng chứng.
P2 — Phân rã thành task theo slice dọc, template 3.3. Không task XL.
P3 — Sắp thứ tự, khai báo phụ thuộc cứng, xác định đường găng.
P4 — Gán size XS–XL và U1–U3. Tách mọi task L.
P5 — Ghi .plan/RISKS.md: rủi ro, dấu hiệu sớm, hành động.
P6 — Ghi .plan/PLAN.md, .plan/TASKS.md, .plan/QUESTIONS.md; cập nhật
     .memory/DECISIONS.md cho mọi [GIẢ ĐỊNH]; viết one-pager theo 10.1.

Trước khi báo xong: tự kiểm PG0–PG3 (mục 7) và bảng truy vết 7.2
(route → task, 11.3 → task). Ô trống thì chưa xong.

Trả lời cuối cùng gồm: one-pager + đường găng + rủi ro lớn nhất + câu hỏi
chặn (nếu có) + những gì bạn giả định. Không viết code.
```

### 11.2 Prompt re-plan

```
Có thay đổi: <mô tả>

Làm theo mục 8 của PLAN_SPEC:
1. Ghi nguyên văn yêu cầu vào .plan/QUESTIONS.md.
2. Phân loại C1/C2/C3.
3. Liệt kê ảnh hưởng: task thêm/xoá/đổi, route, gate, research lại?
4. Cập nhật .plan/TASKS.md + PLAN.md TRƯỚC khi sửa code.
5. Nếu C2/C3: trình delta (thêm gì, bỏ gì, mốc nào ảnh hưởng) và chờ duyệt.

Không âm thầm mở rộng phạm vi. Không sửa định nghĩa DoD/mốc cho khớp việc đã làm.
```

### 11.3 Prompt phản biện plan

```
Đọc .plan/* và docs/EXECUTION_SPEC.md. Chỉ trích, không khen.

Tìm: (a) task không có DoD kiểm chứng được; (b) route trong brief không có task;
(c) mục 11.3 không được ánh xạ; (d) task XL còn tồn tại; (e) U3 nằm trên
đường găng chưa có spike; (f) phụ thuộc cứng bị vi phạm thứ tự;
(g) mốc không có câu demo; (h) giả định không có cách xác minh;
(i) rủi ro không có dấu hiệu sớm.

Mỗi phát hiện: mục nào, vì sao sai, sửa thế nào. Xếp theo mức chặn.
```

### 11.4 Prompt plan nhanh (S)

```
Dự án nhỏ (S). Đọc PLAN_SPEC mục 9.1.
Cho tôi: 10 task tối đa, mỗi task 1 dòng (ID, mục tiêu, DoD 1 dòng), thứ tự,
mốc M1 deploy được, 2 rủi ro, 1 câu hỏi chặn nếu thật cần.
Không viết code. Không ước lượng thời gian.
```

---

## 12. CHỐNG MẪU (ANTI-PATTERNS)

| Anti-pattern | Dấu hiệu | Sửa |
|---|---|---|
| Plan theo tầng | "Làm hết HTML → hết CSS → hết JS" | Cắt theo slice dọc (3.1) |
| Plan không DoD | Toàn động từ, không lệnh kiểm chứng | Template 3.3 |
| Plan 200 task | Không ai đọc, không ai cập nhật | Trần 3.7, cắt 8.4 |
| Deadline bịa | "Khoảng 2 tuần" không có cơ sở | Bỏ; dùng số task + U + rủi ro (10.2) |
| Plan trước research | Stack chốt ở dòng 1, bằng chứng ở dòng 80 | P1 trước P2 (2.2) |
| Bỏ qua hiện trạng | Không chạy baseline, không biết repo đang đỏ | P0 bắt buộc (2.1) |
| Task "fix bug" chung chung | Không tái hiện, không mức P | 9.3 spec + P0–P3 |
| Task gộp | "Dựng hero và pricing và FAQ" | Tách theo 3.1 |
| Không có M1 deploy | Chỉ deploy ở cuối | 4.1 |
| "Tối ưu sau" | Không có task nào cho a11y/perf | Bảng truy vết 7.2b |
| Plan không cập nhật | `TASKS.md` đứng yên, commit vẫn chạy | 6.8 |
| Copy plan dự án khác | Task nhắc route/stack không tồn tại | Viết lại từ brief + inventory |
| Đoán version | "Next 15 chắc hỗ trợ" | 2.4 spec + research 7 |
| Nhiều agent cùng file | Merge conflict liên tục | 4.4, chia vùng ghi |
| Hai nguồn sự thật về thứ tự | `.plan/TASKS.md` và file plan của superpowers nói khác nhau | 14.4: `TASKS.md` thắng về thứ tự, file kia chỉ mở rộng step |
| Dùng skill thay gate | "Skill bảo xong" nhưng chưa chạy G2–G9 | 14.4: 11.3 của bản thi hành vẫn là chuẩn |
| Trích "2–5 phút/task" | Lấy con số của README superpowers làm cam kết | 14.4: không nêu thời lượng; dùng right-sizing của `SKILL.md` |

---

## 13. DEFINITION OF READY (DoR)

Một task chỉ được chuyển `todo → doing` khi:

- [ ] Có ID đúng 3.2, tiêu đề là động từ + kết quả.
- [ ] Có một mục tiêu duy nhất, không có "và".
- [ ] Size ≤ L; nếu L thì đã tách.
- [ ] Có U; nếu U3 thì đã có spike xong (hoặc task này chính là spike).
- [ ] Phụ thuộc cứng đã `done-verified`, hoặc không có.
- [ ] Có DoD ≥ 1 dòng kiểm chứng được bằng lệnh/bằng chứng nhìn thấy.
- [ ] Có danh sách file/vùng sẽ chạm (dự kiến).
- [ ] Có mục spec chi phối (4.x/5.x/6.x) để không tự đặt chuẩn riêng.
- [ ] Nếu cần dependency mới: đã có mục trong `RESEARCH.md` (W4).
- [ ] Nếu cần quyết định: đã có trong `DECISIONS.md`, kể cả `[GIẢ ĐỊNH]`.
- [ ] Không chạm vùng file của agent khác đang chạy (4.4).
- [ ] Biết task này thuộc mốc nào.
- [ ] Biết test nào sẽ bảo vệ hành vi này (mới hoặc có sẵn).
- [ ] Nếu brownfield: đã đọc convention của vùng sắp sửa (2.5 spec).
- [ ] Nếu dùng superpowers: đã có step plan với `**Parent:** T-xxx` và ≤ 5 step (14.4, 14.6).

Thiếu bất kỳ mục nào → task ở `blocked` với lý do, không phải `doing`.

---

## 14. LIÊN KẾT VỚI BỘ SKILL `superpowers`

> Mục này **không bắt buộc cài**. Nếu môi trường có `obra/superpowers`, dùng đúng tên skill và đúng thứ tự dưới đây; nếu không có, dùng cột "thay bằng" — quy trình của bản plan vẫn đứng một mình.

### 14.1 Đã kiểm chứng gì

| Hạng mục | Giá trị (kiểm ngày 2026-10-24) |
|---|---|
| Repo | https://github.com/obra/superpowers — "agentic skills framework & software development methodology" |
| License | MIT |
| Bản mới nhất | `v7.0.1`, phát hành 2026-10-21 |
| Số skill | 15 thư mục trong `skills/` |
| Tài liệu gốc | `README.md`, `skills/writing-plans/SKILL.md`, `skills/using-superpowers/SKILL.md` |

Danh sách skill đúng như trong repo (không tự đặt tên khác): `brainstorming`, `diagnosing-superpowers`, `dispatching-parallel-agents`, `executing-plans`, `finishing-a-development-branch`, `receiving-code-review`, `requesting-code-review`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `using-git-worktrees`, `using-superpowers`, `verification-before-completion`, `writing-plans`, `writing-skills`.

**Quy tắc:** chỉ tham chiếu skill theo tên + version. Không copy nội dung `SKILL.md` vào repo (dù MIT) vì sẽ trôi phiên bản và mâu thuẫn với bản plan này.

### 14.2 Ba mức tích hợp

| Mức | Dấu hiệu | Cách làm |
|---|---|---|
| **0 — Không có** | Không tìm thấy skill/plugin | Dùng cột "thay bằng" ở 14.3; không nhắc đến superpowers trong báo cáo |
| **1 — Có plugin/skill** | Harness tự nạp skill, hoặc gọi được `/superpowers:*` | Gọi skill đúng tên, theo thứ tự 14.5 |
| **2 — Có repo + muốn đóng gói** | Có `skills/` trong workspace | Dùng `writing-skills` để viết skill riêng cho quy trình này, theo format 7.9 của bản thi hành |

Kiểm tra nhanh (chỉ đọc, không cài):

```bash
# 1) Skill có trong workspace/harness không (đường dẫn thay đổi theo harness)
ls .claude/skills 2>/dev/null
ls .claude-plugin 2>/dev/null

# 2) Bản mới nhất + tên skill trên GitHub (nguồn sự thật khi nghi ngờ)
gh release list --repo obra/superpowers --limit 3
gh api repos/obra/superpowers/contents/skills --jq '.[].name'
```

Không tự cài plugin, không đổi cấu hình harness khi chưa được phép (W8 của bản thi hành).

Tham khảo (chỉ để biết, không chạy khi chưa được phép): Claude Code cài bằng `/plugin install superpowers@claude-plugins-official` hoặc từ marketplace `obra/superpowers-marketplace`; Cursor dùng `/add-plugin superpowers`. Mỗi harness có lệnh riêng — xem README của repo.

### 14.3 Ánh xạ skill → bước trong quy trình

| Skill | Dùng ở bước nào | Làm gì | Nếu không có thì thay bằng |
|---|---|---|---|
| `using-superpowers` | Đầu phiên | Bootstrap để agent biết có skill | Đọc 0.1 + 0.6 của bản này |
| `brainstorming` | Trước P0, khi brief mơ hồ | Hỏi để làm rõ ý định, chốt design doc | 1.1 checklist + 1.4 câu hỏi chặn |
| `writing-plans` | Sau **PG2**, trước khi thi hành | Mở mỗi `T-*` thành plan cấp step | Mục 6.2 + 6.3 |
| `using-git-worktrees` | Trước khi chạy song song | Tạo worktree nhánh riêng, baseline test sạch | 4.4 (chia vùng ghi) + nhánh riêng |
| `subagent-driven-development` | Thi hành L/XL | Mỗi task một subagent, review sau mỗi task | 4.4 + 6.3 |
| `executing-plans` | Thi hành S/M | Làm tuần tự trong một phiên, review cuối nhánh | PASS 1–3 (mục 10 bản thi hành) |
| `test-driven-development` | Mọi task code | RED-GREEN-REFACTOR | 6.1–6.3 bản thi hành |
| `systematic-debugging` | Bug > 15 phút | 4 pha tìm nguyên nhân gốc | 9.1–9.4 bản thi hành |
| `verification-before-completion` | Trước khi đánh `done-verified` | Kiểm lại bằng chứng, không tuyên bố suông | 5.4 + 11.3 bản thi hành |
| `requesting-code-review` | Sau mỗi `T-*` hoặc cuối pass | Review theo plan, báo lỗi theo mức | 13.5 bản thi hành |
| `receiving-code-review` | Khi nhận feedback | Xử lý feedback có phân loại | 9.3 + 8.1 (C1–C3) |
| `dispatching-parallel-agents` | ≥ 2 agent | Chia việc song song có kiểm soát | 4.4 |
| `finishing-a-development-branch` | M4/M5 | Quyết định merge/PR/giữ/xoá, dọn worktree | 12.x bản thi hành |
| `writing-skills` | Khi muốn đóng gói quy trình | Viết skill mới đúng chuẩn | 7.9 bản thi hành |
| `diagnosing-superpowers` | Khi skill không trigger/sai | Soi lại phiên, tìm nguyên nhân | Không thay Bug Protocol; chỉ để debug công cụ |

### 14.4 Xung đột và luật phân xử

Hai bộ tài liệu không hoàn toàn trùng nhau. Không được "chọn bên nào tiện":

| Điểm | `superpowers` | Bản plan | Luật dùng |
|---|---|---|---|
| Nơi lưu plan | `docs/superpowers/plans/YYYY-MM-DD-<feature>.md` | `.plan/` | **Cả hai**: `.plan/TASKS.md` là nguồn sự thật về thứ tự/trạng thái; file superpowers là bản mở rộng cấp step, mỗi Task phải ghi `**Parent:** T-xxx` |
| Đơn vị việc | Task = đơn vị nhỏ nhất có chu kỳ test riêng | `T-*` = 1 PR | `T-*` là task; Task của superpowers là **step** bên trong. Một `T-*` ≤ 5 step; vượt thì `T-*` quá lớn, tách theo 3.3 |
| Thời lượng | README mô tả "2–5 phút mỗi task" | Cấm ước lượng thời gian (luật 2 ở 0.6 bản này) | Không trích con số phút cho người dùng. Dùng tiêu chí right-sizing trong `SKILL.md`: "đơn vị nhỏ nhất có chu kỳ test riêng và đáng để reviewer chặn" |
| Code trong plan | Chỉ đưa code khi signature + test không quyết định được | Không đưa code chưa xác minh (W1) | Code chỉ khi đã verify; còn lại ghi signature + tên test + assertion |
| Gate "xong" | `verification-before-completion` (định tính) | G0–G9 + DoD 11.3 (định lượng) | G0–G9 và 11.3 là gate chính; skill chỉ là bước nhắc |
| Commit | Commit sau mỗi step | Tối thiểu 1 commit/pass | Commit nhỏ trong task được phép; vẫn phải ≥ 1 commit/pass, message nêu **vì sao** |
| Định nghĩa hoàn thành | Test pass | 11.3 + bằng chứng đã ghi | 11.3 thắng; test pass chưa đủ |
| Design doc | `brainstorming` sinh ra | Brief 0.2 | Brief là nguồn; design doc của skill chỉ bổ sung phần ý định, ghi vào `.plan/PLAN.md` |

Phía **thi hành** (pass nào dùng skill nào, luật phân xử với W1–W10 và 11.3) nằm ở mục 15 của bản thi hành — không lặp lại ở đây.

### 14.5 Trình tự chạy khi có superpowers

1. Đầu phiên: `using-superpowers` (nếu harness chưa tự nạp).
2. Brief mơ hồ → `brainstorming`, chốt ý định. Không dùng brainstorming thay cho 1.1/1.4: vẫn phải điền đủ intake.
3. P0–P5 của bản plan như bình thường.
4. **PG2 đạt** → `writing-plans`, mở từng `T-*` thành các step có test/verify/commit, lưu vào `docs/superpowers/plans/`. Việc mở rộng này **không** đổi thứ tự trong `TASKS.md`.
5. Cần cô lập/song song → `using-git-worktrees`.
6. Thi hành: L/XL → `subagent-driven-development`; S/M → `executing-plans`.
7. Trong mỗi task: `test-driven-development` → `verification-before-completion` → `requesting-code-review`.
8. Xong nhánh: `finishing-a-development-branch`, rồi cập nhật `.plan/TASKS.md` (trạng thái `done-verified`) và `.memory/`.

**Cấm:** dùng skill để bỏ qua gate (ví dụ chạy `executing-plans` khi PG2 chưa đạt); dùng "tests pass" của skill thay cho 11.3; để file superpowers tự đổi thứ tự task.

### 14.6 Mẫu mở rộng một `T-*` (khi dùng `writing-plans`)

```md
### Task 2: Dựng hero với ảnh LCP ưu tiên   ← step, không phải T-*

**Parent:** T-HOME-03
**Files:**
- Create: src/components/Hero.astro
- Modify: src/pages/index.astro
- Test: tests/e2e/hero.spec.ts

**Interfaces:**
- Consumes: token `--space-6`, `--font-display` (từ T-DS-01)
- Produces: `<Hero headline={string} image={ImageMeta} />`

- [ ] Step 1: viết test fail cho "ảnh hero là LCP element"
- [ ] Step 2: chạy, xác nhận fail
- [ ] Step 3: implement tối thiểu
- [ ] Step 4: chạy, xác nhận pass
- [ ] Step 5: commit
```

Bắt buộc: `**Parent:**` trỏ đúng ID trong `TASKS.md`; nếu step không thuộc `T-*` nào → plan thiếu task, quay lại P2.

### 14.7 Prompt Plan Mode + superpowers

```
Bạn là agent lập kế hoạch cho dự án web. Chưa viết code.

Đọc: docs/PLAN_SPEC.md (bản plan v1.1) và docs/EXECUTION_SPEC.md
(PROMPT_SPEC_WEB_DEV_AGENT_v1.md v1.1).

Nếu môi trường có bộ skill obra/superpowers (kiểm tra theo 14.2):
- Đầu phiên dùng using-superpowers.
- Brief mơ hồ → brainstorming (không thay 1.1/1.4).
- Chỉ sau khi PG2 đạt mới dùng writing-plans để mở T-* thành step,
  lưu ở docs/superpowers/plans/, mỗi Task ghi **Parent:** T-xxx.
- Thi hành: L/XL dùng subagent-driven-development; S/M dùng executing-plans.
- Mỗi task: test-driven-development → verification-before-completion
  → requesting-code-review.
Nếu không có superpowers: dùng template 6.2/6.3 và PASS 1–3 của bản thi hành.

Luật bất biến:
- .plan/TASKS.md quyết định thứ tự và trạng thái; file superpowers chỉ mở rộng step.
- Không trích "2–5 phút" hay bất kỳ con số thời gian nào cho người dùng.
- Gate chính là PG0–PG3 và G0–G9 + 11.3; "tests pass" chưa phải xong.
- Không copy SKILL.md vào repo; chỉ tham chiếu tên + version.

Làm P0–P6, xuất one-pager + .plan/*. Không viết code.
```

### 14.8 Kiểm chứng định kỳ và điều kiện bỏ liên kết

- Đầu dự án mới: chạy `gh release list --repo obra/superpowers --limit 3` và `gh api .../contents/skills`; nếu tên skill đổi → sửa bảng 14.3 trước khi dùng.
- Nếu repo đổi cấu trúc (không còn `skills/`, đổi license, hoặc skill bị bỏ) → hạ xuống mức 0, ghi lý do vào `DECISIONS.md`, không cố dùng tên cũ.
- Không tự ý nâng version giữa dự án (W3 của bản thi hành); chỉ ghi nhận và đề xuất.

---

## PHỤ LỤC A — MA TRẬN LIÊN KẾT

Bản plan **không lặp lại** nội dung bản thi hành; nó trỏ tới đúng mục. Bảng đối chiếu:

| Mục trong `PROMPT_SPEC_WEB_DEV_AGENT_v1.md` (v1.1) | Dùng ở bước nào của plan | Ghi chú |
|---|---|---|
| 0.2 Project Brief | Intake 1.1, PG0 | Nguồn dữ liệu đầu vào chính |
| 0.3 Quy tắc hỏi & giả định | 1.4 | Plan siết còn 5 câu tổng |
| 0.4 Trạng thái báo cáo | 5.4, 6.3 | `done-verified` = `verified` |
| 0.5 Ký hiệu | 0.4 | Kế thừa nguyên |
| 0.6 Định nghĩa vận hành | 5.4, 7.1 | Gate xanh, production build, route chính |
| 1 W1–W10 | 0.6, 4.5, 8.5 | W3 (phạm vi), W4 (dependency), W8 (quyền), W10 (2 lần) |
| 1.2 Thứ tự ưu tiên | 8.4 | Quyết định cắt gì / không cắt gì |
| 2.1 Inventory | P0 (2.1) | Package manager theo lockfile |
| 2.2–2.3 Chọn stack / đơn giản nhất đủ dùng | P1, 3.6 | Chống over-engineering |
| 2.5 Luật brownfield | 9.3 | Giữ convention |
| 3.x Kiến trúc | 3.3 (`spec:` field) | Task tham chiếu mục cụ thể |
| 4.2 Tokens | 4.2, 3.6 | Task nền trước component |
| 4.8 Trạng thái bắt buộc | 3.3 (DoD), 7.2b | Không được quên trong task |
| 5.1 WCAG 2.2 AA | 8.4 | Không được cắt |
| 5.2.1 Field / 5.2.2 Lab | 3.4, 7.2b | Không trộn hai loại metric |
| 6.1–6.3 Test | 3.3 (evidence), 5.1 | E2E luồng chính ở M2 |
| 6.5 Visual regression | 5.1 (M3) | Baseline chụp ở một môi trường |
| 7.0–7.11 GitHub research | P1 (2.2) | Gate PG1 = G0 |
| 7.6 Ngưỡng bằng chứng | PG1 | Greenfield ≥ 3 mục… |
| 8.1–8.8 Bộ nhớ dự án | 6.1, 6.7 | `.memory/` là sự thật |
| 9.1–9.5 Bug protocol | 9.4, 4.5 | P0–P3, rollback |
| 10.1–10.3 Ba pass | 5.1, 0.2 | Mốc map sang pass |
| 10.4 Git | 6.8 | Đối chiếu commit với task |
| 11.1 G0–G9 | 5.1, 7.2b | Mỗi gate có task chịu trách nhiệm |
| 11.3 Definition of Done | 7.2b, 13 | Bảng truy vết bắt buộc |
| 11.4 Cấm khi báo cáo | 5.4, 10.2 | Không nói "xong" khi thiếu bằng chứng |
| 12 Bàn giao | M5; 9.1 bước 7 (bản plan) | README, rollback |
| 13.1–13.6 Template | 6.1, 11.1 | AGENTS.md trỏ cả hai spec |
| 14 Prompt | 11, 14.7 | Prompt plan bổ sung, không thay |
| *(ngoài spec)* `obra/superpowers` v7.0.1 | 14 toàn bộ | Bảng skill → bước ở 14.3; luật xung đột ở 14.4 |

---

## PHỤ LỤC B — TỪ ĐIỂN (chỉ từ mới)

Các từ đã định nghĩa ở 0.6 và Phụ lục B của bản thi hành giữ nguyên nghĩa. Dưới đây chỉ là từ bản plan thêm vào:

| Từ | Nghĩa | Kiểm chứng bằng |
|---|---|---|
| **Slice dọc** | Phần việc tạo ra hành vi quan sát được xuyên đủ tầng | Route/component chạy được + có test |
| **Spike** | Khảo sát có giới hạn, đầu ra là quyết định | Mục trong `DECISIONS.md` |
| **U1–U3** | Độ bất định của task | U3 phải có spike trước khi vào đường găng |
| **Size XS–XL** | Kích thước theo số file/route/test, không theo giờ | Task XL không được tồn tại |
| **Đường găng** | Chuỗi phụ thuộc cứng dài nhất theo số task | Danh sách `→` trong `PLAN.md` |
| **Checkpoint** | Điểm demo nhỏ chèn trên đường găng | Mốc nhỏ có bằng chứng |
| **Wave** | Đợt cho dự án XL, ≤ 30 task | Plan riêng mỗi wave |
| **Done-verified** | Trạng thái task đã có bằng chứng | `TASKS.md` + log |
| **C1/C2/C3** | Mức thay đổi phạm vi | Phân loại ghi trong `DECISIONS.md` |
| **Plan ảo** | Plan đầy đủ hình thức nhưng không kiểm chứng được | 6 dấu hiệu 7.4 |
| **Bảng truy vết** | Ánh xạ route→task và DoD→task | Ô trống = chưa xong |
| **DoR** | Điều kiện được bắt đầu task | Checklist mục 13 |
| **Ngân sách khảo sát** | Số lần gọi tool tối đa cho P0–P1 | Đếm theo quy mô 1.3 |
| **Step** | Một hành động có kết quả kiểm tra được bên trong `T-*` (test → code → verify → commit) | Chỉ tồn tại khi mở rộng qua `writing-plans`; mỗi step có `Parent:` |
| **Parent** | ID `T-*` mà một step thuộc về | Ghi `**Parent:** T-xxx` trong plan cấp step |
| **Skill** | Gói hướng dẫn có tên, được harness nạp theo tên; khác "kỹ năng chung" | Tên phải tồn tại trong repo skill (14.1) |

---

## PHỤ LỤC C — MẪU ĐIỀN NHANH

### C.1 — S: landing page 5 section, 1 trang

```
Mục tiêu: 1 trang giới thiệu dịch vụ, có form liên hệ.
Task (10):
T-DS-01 token + contrast (S, U1)
T-LAYOUT-01 shell + container + nav (M, U1)
T-HOME-01 hero + ảnh LCP (M, U1)
T-HOME-02 dịch vụ 3 khối (S, U1)
T-HOME-03 bằng chứng/khách hàng [[...]] (S, U1)
T-HOME-04 CTA + footer (XS, U1)
T-FORM-01 form + validate server + trạng thái (M, U2)
T-SEO-01 metadata + OG + sitemap + robots (S, U1)
T-A11Y-01 axe + keyboard + contrast (S, U1)
T-DEPLOY-01 preview deploy + README + rollback (S, U2)
Thứ tự: DS → LAYOUT → HOME-01 → (02,03,04 song song) → FORM → SEO → A11Y → DEPLOY
Mốc: M1 sau LAYOUT; M2 sau FORM; M3 sau A11Y; M4 sau DEPLOY
Rủi ro: ảnh thật chưa có (chặn M4); nội dung dịch vụ chưa chốt
```

### C.2 — M: site 8 trang + blog

```
Thêm so với S:
- T-BLOG-01 danh sách + phân trang, T-BLOG-02 chi tiết + MDX, T-BLOG-03 RSS
- T-I18N-01 nếu brief yêu cầu 2 ngôn ngữ (nếu không: ghi N/A)
- T-CONTENT-01 CONTENT_MAP + placeholder cho 8 trang
- T-PERF-01 ngân sách ảnh/font, T-PERF-02 LCP route chính
Trần 30 task. Bảng truy vết bắt buộc (8 route → task).
```

### C.3 — L: dashboard có auth

```
Task nền: repo + auth + schema + layout bảo vệ + trạng thái rỗng/tải/lỗi
Luồng dọc đầu tiên: tạo bản ghi → danh sách → chi tiết → sửa → xoá (5 task)
Sau đó mới: luồng 2, 3; filter; export
Bắt buộc: ADR cho mô hình dữ liệu + auth; E2E luồng chính; rate limit 3.12
Duyệt: one-pager trước PASS 2. Không tự duyệt vì L.
```

---

## PHỤ LỤC D — NHỮNG ĐIỂM ĐÃ LÀM RÕ Ở v1.1

| Điểm mơ hồ ở v1 | Đã làm rõ | Nơi sửa |
|---|---|---|
| `S-02` (spike) trùng tên với size **S** | Đổi thành `SP-<số>`; thêm ghi chú lý do | 0.4, 2.2, 3.5, Phụ lục B |
| ID task ghi `-<số>` ở 0.4 nhưng `-<2 số>` ở 3.2 | Thống nhất `T-<AREA>-<2 chữ số>` | 0.4, 3.2 |
| "Task" vừa là 1 PR vừa là đơn vị nhỏ nhất bên trong | Tách 3 tầng: route → `T-*` (1 PR) → step; step chỉ có khi mở rộng qua `writing-plans` | 0.5, 14.4, Phụ lục B |
| "Ngân sách khảo sát" không nói đếm gì | 1 lượt = 1 lần gọi tool, đọc 10 file = 10 lượt | 1.3 |
| 5 câu hỏi plan vs 3 câu/lượt của bản thi hành | 5 câu là tổng giai đoạn plan; vào thi hành quay lại 0.3 của spec, không cộng dồn | 1.4 |
| Trần task L (60) > XL/wave (40) — vô lý | Đặt L = 45, XL = 30/wave, kèm lý do wave phải nhỏ hơn | 3.7, Phụ lục B |
| "3 task U2/U3 liên tiếp" không rõ liên tiếp ở đâu | "nối tiếp nhau **trên đường găng**" | 4.3 |
| `M1′` dùng ký tự prime dễ lỗi font | Đổi thành `M1-hotfix`; khai báo biến thể mốc ở 0.4 | 0.4, 5.3 |
| Mục 6.4 tên là `.plan/DECISIONS.md` nhưng nội dung nói dùng `.memory/` | Đổi tiêu đề thành "Quyết định — dùng `.memory/DECISIONS.md`" | 6.4 |
| PG3 đòi "người đã xem one-pager" trong khi S/M được tự duyệt | PG3 chỉ đòi **đã gửi**; xác nhận chỉ bắt buộc với L/XL | 7.1, 7.3 |
| Dòng `…` trong bảng truy vết DoD | Thay bằng ví dụ cụ thể `N/A` có lý do | 7.2b |
| "giữ 1–3 của 1.2 spec" dễ nhầm với mục 1.2 của bản plan | Ghi rõ "nhóm ưu tiên 1–3 (chức năng, an toàn, a11y) ở mục 1.2 của bản thi hành" | 8.4 |
| Không có chỗ nói về bộ skill phổ biến `superpowers` | Thêm mục 14: tên skill, ánh xạ, 3 mức tích hợp, luật xung đột, prompt | 14 toàn bộ |
| Dễ có hai nguồn sự thật về thứ tự khi dùng superpowers | `.plan/TASKS.md` thắng về thứ tự; file `docs/superpowers/plans/*` chỉ mở rộng step và phải có `Parent:` | 6.1, 14.4, 14.6 |
| Nguy cơ lấy "2–5 phút/task" của superpowers làm cam kết thời gian | Cấm trích số phút; dùng tiêu chí right-sizing của `SKILL.md` | 14.4, 12 |
| "Tests pass" bị dùng thay Definition of Done | Ghi rõ 11.3 thắng; skill chỉ là bước nhắc | 14.4, 12, 13 |

**Nguồn đã kiểm chứng trực tiếp ngày 2026-10-24** (dùng để viết mục 14):

| Nguồn | Đã xác nhận |
|---|---|
| `obra/superpowers` README | License MIT; bản `v7.0.1` (2026-10-21); 7 bước workflow; lệnh cài theo từng harness |
| `obra/superpowers/skills/` | Đúng 15 thư mục skill, tên chính xác |
| `skills/writing-plans/SKILL.md` | Đường dẫn lưu plan; header bắt buộc; cấu trúc Task/Files/Interfaces/Step; self-review 5 mục; right-sizing theo chu kỳ test |
| `skills/using-superpowers/SKILL.md` | Cơ chế bootstrap và thông báo "Using [skill] to [purpose]" |

Điểm **chưa** kiểm chứng: hành vi của skill trên từng harness cụ thể, và việc skill có tự trigger đúng trong phiên hay không — agent phải quan sát thực tế, không giả định.

---

*Hết. Kế hoạch không phải lời hứa về thời gian — nó là tập bằng chứng về thứ tự. Không có DoD thì không có task, không có bằng chứng thì không có "xong".*
