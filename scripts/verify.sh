#!/usr/bin/env bash
# Fail-closed QA gate for the landing + app. Run from a clean clone: bash scripts/verify.sh
set -uo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT" || exit 1

PORT="${QA_PORT:-8123}"
BASE="http://127.0.0.1:${PORT}/so-on-gdct1/"
QA_OUT="${QA_OUT:-${TMPDIR:-/tmp}/gdct1-qa}"
mkdir -p "$QA_OUT"

HTML_VALIDATE_PKG="html-validate@9.7.1"
PA11Y_CI_PKG="pa11y-ci@5.0.0"
LINKINATOR_PKG="linkinator@8.1.0"

FAILURES=0
SERVER_PID=""
pass() { echo "PASS $*"; }
fail() { FAILURES=$((FAILURES + 1)); echo "FAIL $*"; }
cleanup() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "FAIL thiếu lệnh bắt buộc: $1"
    exit 1
  fi
}
for command in node curl git npx; do need "$command"; done

echo "== 1. Syntax JS =="
syntax_failed=0
while IFS= read -r -d '' file; do
  if ! node --check "$file" >/dev/null 2>&1; then
    fail "node --check $file"
    syntax_failed=1
  fi
done < <(find . -type f \( -name '*.js' -o -name '*.mjs' \) \
  -not -path './node_modules/*' -not -path './.git/*' -not -path './.lighthouseci/*' -print0)
[ "$syntax_failed" -eq 0 ] && pass "node --check toàn bộ JS/MJS"

echo "== 2. JSON =="
json_failed=0
for file in app/manifest.webmanifest lighthouserc.json .htmlvalidate.json .pa11yci; do
  if ! node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' "$file" >/dev/null 2>&1; then
    fail "JSON $file"
    json_failed=1
  fi
done
[ "$json_failed" -eq 0 ] && pass "JSON hợp lệ"

echo "== 3. HTML + dữ liệu + contrast =="
if npx --yes "$HTML_VALIDATE_PKG" index.html 404.html app/index.html >"$QA_OUT/htmlvalidate.log" 2>&1; then
  pass "html-validate 0 error"
else
  fail "html-validate"
  tail -30 "$QA_OUT/htmlvalidate.log"
fi
if node scripts/check-data.mjs >"$QA_OUT/data.log" 2>&1; then
  pass "check-data"
  tail -1 "$QA_OUT/data.log"
else
  fail "check-data"
  tail -40 "$QA_OUT/data.log"
fi
if node scripts/check-contrast.mjs >"$QA_OUT/contrast.log" 2>&1; then
  pass "contrast"
  tail -1 "$QA_OUT/contrast.log"
else
  fail "contrast"
  tail -30 "$QA_OUT/contrast.log"
fi

echo "== 4. Secret + pattern cấm =="
secret_status=0
git grep --untracked -I -n -E 'BEGIN (RSA|OPENSSH|EC|DSA|PGP) PRIVATE KEY|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}' -- . >"$QA_OUT/secrets.txt" 2>/dev/null || secret_status=$?
if [ "$secret_status" -eq 0 ]; then
  fail "secret scan"
  head -20 "$QA_OUT/secrets.txt"
elif [ "$secret_status" -eq 1 ]; then
  pass "secret scan"
else
  fail "secret scan lỗi (git grep exit $secret_status)"
fi

git ls-files --cached --others --exclude-standard >"$QA_OUT/files.txt" 2>/dev/null
files_status=$?
secret_files=$(grep -Ei '(^|/)(\.env|id_rsa|id_ed25519|.*\.(pem|key|p12|pfx))$' "$QA_OUT/files.txt" || true)
if [ "$files_status" -ne 0 ]; then
  fail "không liệt kê được file để quét khóa"
elif [ -n "$secret_files" ]; then
  fail "file khóa/bí mật: $secret_files"
else
  pass "không có file khóa/bí mật"
fi

RUNTIME_FILES=(index.html 404.html assets/landing.js assets/landing.css assets/motion.js sw.js app/index.html app/assets/app.js app/assets/app.css app/assets/motion.js app/sw.js assets/vendor/gsap.min.js assets/vendor/ScrollTrigger.min.js app/assets/vendor/gsap.min.js)
forbidden_status=0
grep -nE 'TODO|FIXME|debugger|console\.(log|debug)|lorem ipsum' "${RUNTIME_FILES[@]}" >"$QA_OUT/forbidden.txt" 2>/dev/null || forbidden_status=$?
if [ "$forbidden_status" -eq 0 ]; then
  fail "pattern cấm trong file chạy"
  head -20 "$QA_OUT/forbidden.txt"
elif [ "$forbidden_status" -eq 1 ]; then
  pass "không TODO/console.log/debugger trong file chạy"
else
  fail "grep pattern cấm lỗi (exit $forbidden_status)"
fi

conflict_status=0
grep -RInE '^(<<<<<<<|=======|>>>>>>>)' index.html 404.html assets app sw.js >"$QA_OUT/conflicts.txt" 2>/dev/null || conflict_status=$?
if [ "$conflict_status" -eq 0 ]; then
  fail "conflict marker"
  head -20 "$QA_OUT/conflicts.txt"
elif [ "$conflict_status" -eq 1 ]; then
  pass "không conflict marker"
else
  fail "grep conflict marker lỗi (exit $conflict_status)"
fi

echo "== 5. Server test =="
if curl -s -o /dev/null "$BASE" 2>/dev/null; then
  echo "FAIL cổng $PORT đang bận — dừng server khác rồi chạy lại"
  exit 1
fi
PORT="$PORT" node scripts/serve.mjs >"$QA_OUT/server.log" 2>&1 &
SERVER_PID=$!
ready=0
for _ in $(seq 1 50); do
  if curl -fsS "$BASE" >/dev/null 2>&1; then ready=1; break; fi
  sleep 0.2
done
if [ "$ready" -ne 1 ]; then
  fail "server test không lên cổng $PORT"
  cat "$QA_OUT/server.log"
  exit 1
fi
pass "server test $BASE"

echo "== 6. HTTP 200/404 =="
check_http() {
  local path="$1" expected="$2" label="$3"
  local code
  code=$(curl -s -o "$QA_OUT/http-body" -w '%{http_code}' "${BASE}${path}")
  if [ "$code" = "$expected" ]; then
    pass "$label ($code)"
  else
    fail "$label (nhận $code, cần $expected)"
  fi
}
check_http "" 200 "landing"
check_http "app/" 200 "app"
check_http "404.html" 200 "trang 404 tĩnh"
check_http "robots.txt" 200 "robots"
check_http "sitemap.xml" 200 "sitemap"
check_http "sw.js" 200 "root SW kill-switch"
check_http "app/sw.js" 200 "app SW"
check_http "app/manifest.webmanifest" 200 "manifest"
check_http "app/assets/app.js" 200 "app JS"
check_http "app/data/questions.js" 200 "questions"
check_http "app/data/answers.js" 200 "answers"
check_http "assets/landing.css" 200 "landing CSS"
check_http "assets/landing.js" 200 "landing JS"
check_http "assets/motion.js" 200 "landing motion"
check_http "assets/vendor/gsap.min.js" 200 "GSAP vendor"
check_http "assets/vendor/ScrollTrigger.min.js" 200 "ScrollTrigger vendor"
check_http "app/assets/motion.js" 200 "app motion"
check_http "app/assets/vendor/gsap.min.js" 200 "GSAP vendor app"
check_http "assets/og-cover.png" 200 "OG cover"
check_http "assets/landing/today-390.webp" 200 "ảnh Hôm nay"
check_http "assets/landing/today-1280.webp" 200 "ảnh Hôm nay desktop"
check_http "assets/fonts/newsreader-latin.woff2" 200 "font Newsreader latin"
check_http "assets/fonts/newsreader-vietnamese.woff2" 200 "font Newsreader vietnamese"
check_http "assets/fonts/space-latin.woff2" 200 "font Space latin"
check_http "assets/fonts/space-vietnamese.woff2" 200 "font Space vietnamese"

not_found_code=$(curl -s -o "$QA_OUT/404-body.html" -w '%{http_code}' "${BASE}khong-ton-tai")
if [ "$not_found_code" = "404" ] && grep -q 'Trang này không có trong sổ' "$QA_OUT/404-body.html"; then
  pass "route lạ trả 404 + trang 404 tùy biến"
else
  fail "route lạ (nhận $not_found_code, thiếu nội dung 404)"
fi

echo "== 7. Link nội bộ =="
if npx --yes "$LINKINATOR_PKG" "$BASE" --recurse \
  --skip "^https?://(?!127\\.0\\.0\\.1:${PORT}/so-on-gdct1/)" \
  --verbosity error >"$QA_OUT/linkinator.log" 2>&1; then
  pass "linkinator internal 0 link chết"
  tail -2 "$QA_OUT/linkinator.log"
else
  fail "linkinator internal"
  tail -30 "$QA_OUT/linkinator.log"
fi

echo "== 8. pa11y WCAG2AA =="
sed "s|127.0.0.1:8123|127.0.0.1:${PORT}|g" .pa11yci >"$QA_OUT/pa11yci.json"
if npx --yes "$PA11Y_CI_PKG" --config "$QA_OUT/pa11yci.json" >"$QA_OUT/pa11y.log" 2>&1; then
  pass "pa11y landing + 404"
  tail -4 "$QA_OUT/pa11y.log"
else
  fail "pa11y"
  tail -40 "$QA_OUT/pa11y.log"
fi

echo "== 9. Browser gate =="
if QA_BASE="$BASE" QA_SHOTS="$QA_OUT/shots" node scripts/browser-audit.mjs >"$QA_OUT/chromium.log" 2>&1; then
  pass "Chromium: layout 5 viewport, console, keyboard, FAQ, reduced motion, 0 third-party"
  tail -2 "$QA_OUT/chromium.log"
else
  fail "Chromium audit"
  grep -E '^FAIL|ERROR' "$QA_OUT/chromium.log" | head -30
fi
if QA_BASE="$BASE" QA_SHOTS="$QA_OUT/shots" node scripts/motion-audit.mjs >"$QA_OUT/motion.log" 2>&1; then
  pass "Motion: CSS hero/lazy GSAP, reveal, reduce, no-JS, app gating/bars/sheet"
  tail -2 "$QA_OUT/motion.log"
else
  fail "Motion audit"
  grep -E '^FAIL|ERROR' "$QA_OUT/motion.log" | head -30
fi
if QA_BASE="$BASE" QA_SHOTS="$QA_OUT/shots" node scripts/firefox-smoke.mjs >"$QA_OUT/firefox.log" 2>&1; then
  pass "Firefox: layout 5 viewport, console, 8 route app"
  tail -2 "$QA_OUT/firefox.log"
else
  fail "Firefox smoke"
  grep -E '^FAIL|ERROR' "$QA_OUT/firefox.log" | head -30
fi
if QA_BASE="$BASE" node scripts/firefox-keyboard.mjs >"$QA_OUT/firefox-keyboard.log" 2>&1; then
  pass "Firefox: keyboard/focus/FAQ (Marionette)"
  tail -2 "$QA_OUT/firefox-keyboard.log"
else
  fail "Firefox keyboard"
  grep -E '^FAIL|ERROR' "$QA_OUT/firefox-keyboard.log" | head -30
fi
echo "BLOCKED WebKit/iOS: không có runtime hoặc thiết bị trong môi trường này (không tính là pass)"

echo "== Tổng kết =="
echo "Log: $QA_OUT"
if [ "$FAILURES" -ne 0 ]; then
  echo "VERIFY FAILED — $FAILURES gate lỗi"
  exit 1
fi
echo "VERIFY PASS — tất cả gate bắt buộc đạt"
