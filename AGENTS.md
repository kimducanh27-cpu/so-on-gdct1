# AGENTS.md

## Trước khi làm

- Đọc `docs/EXECUTION_SPEC.md` (bản thi hành v1.2) và `docs/PLAN_SPEC.md` (bản plan v1.1).
- **Trước khi làm task mới: đọc `.plan/TASKS.md`, kiểm DoR mục 13.**
- Đọc `.memory/PROJECT_STATE.md`, `DECISIONS.md`, `RESEARCH.md`, `CONTENT_MAP.md`.
- Xác định package manager từ lockfile: repo **không có**; không tự thêm.
- Baseline hiện tại: `node --check` 4 file JS, JSON manifest, đếm dữ liệu; không có lint/typecheck/test/build.
- Không sửa file chưa đọc; không refactor ngoài task.

## Lệnh

```bash
# Serve giữ base path giống GitHub Pages (từ thư mục cha)
python3 -m http.server 8123   # hoặc: python -m http.server 8123
# mở http://localhost:8123/87880a30/  (base thật khi deploy: /so-on-gdct1/)

# Sau T-QA-01
bash scripts/verify.sh

# Kiểm nhanh dữ liệu
node -e "global.window={};require('./app/data/questions.js');require('./app/data/answers.js');console.log(window.GDCT_QUESTIONS.length,Object.keys(window.GDCT_ANSWERS).length)"
```

Không có `dev`, `build`, `test`, `lint` script. Không bịa lệnh.

## Skill (chỉ khi môi trường có superpowers)

- Trước khi đánh dấu xong: `verification-before-completion`; chuẩn vẫn là mục 11 + 11.3.
- Bug > 15 phút hoặc sau 2 lần sửa: `systematic-debugging`.
- Code mới/sửa hành vi: `test-driven-development` nếu có harness; landing tĩnh thì dùng smoke/a11y gate.
- Không merge/push/deploy/xoá nhánh theo skill khi chưa được phép (W8).

## Luật

- Giữ site tĩnh; không thêm dependency runtime/build. Dev tool mới phải có mục trong `RESEARCH.md` + `DECISIONS.md`.
- Cấu trúc URL: landing `/`, app `/app/`; giữ redirect `/#/...` → `/app/#/...`.
- Không đổi id câu (`gdct1-001…100`), không đổi khóa `so-on-gdct1.v1`, không sửa nội dung đáp án.
- Không sửa `sw.js`/manifest mà không test migration theo `T-PWA-01`.
- Placeholder nội dung dùng `[[...]]` + `CONTENT_MAP.md`; hiện không có placeholder.
- Không push/deploy khi chưa được duyệt (Q1).
- Không báo “xong” khi thiếu bằng chứng (11.4).
- Bug quá 2 lần → dừng, trình phương án.
