/* Sổ Ôn GDCT1 — static offline study app */
(function () {
  'use strict';

  var Q = window.GDCT_QUESTIONS || [];
  var ANSWERS = window.GDCT_ANSWERS || {};
  var LETTERS = ['A', 'B', 'C', 'D'];
  var DEADLINE = '2026-11-12';
  var DEFAULT_START = '2026-10-24';
  var KEY = 'so-on-gdct1.v1';
  var TZ = 'Asia/Ho_Chi_Minh';
  var WD = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

  /* ---------------- utils ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function today() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
  }
  function toDate(s) {
    var p = String(s).split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2], 12));
  }
  function addDays(s, n) {
    var d = toDate(s);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function diffDays(a, b) { return Math.round((toDate(b) - toDate(a)) / 86400000); }
  function fmtLong(s) {
    var d = toDate(s);
    return WD[d.getUTCDay()] + ', ' + d.getUTCDate() + ' tháng ' + (d.getUTCMonth() + 1) + ', ' + d.getUTCFullYear();
  }
  function fmtShort(s) {
    var d = toDate(s);
    return String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0');
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function icon(paths) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }
  function arrow() { return icon('<path d="M4.5 12h15M13.5 6l6 6-6 6"/>'); }
  function checkIcon() { return icon('<path d="M4 12.5 9 17l11-11"/>'); }
  function crossIcon() { return icon('<path d="M6 6l12 12M18 6 6 18"/>'); }
  function searchIcon() { return icon('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>'); }
  function backIcon() { return icon('<path d="M15 5l-7 7 7 7"/>'); }
  function flagIcon() { return icon('<path d="M6 21V4m0 0h11l-2 4 2 4H6"/>'); }
  function downloadIcon() { return icon('<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"/>'); }
  function uploadIcon() { return icon('<path d="M12 21V9m0 0 4 4m-4-4-4 4M4 3h16"/>'); }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function arr(n) { return Array.from({ length: n }, function (_, i) { return i; }); }

  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  /* ---------------- state ---------------- */
  function defaults() {
    return {
      v: 1,
      startDate: null,
      createdAt: new Date().toISOString(),
      settings: { goal: 15, sessionSize: 12, remA: '08:30', remB: '21:00', remOn: true, notif: false },
      prog: {},
      flags: [],
      logs: {},
      overrides: {},
      chapters: {},
      plan: null
    };
  }

  var state = load();
  var S = { study: null, done: null, installEvent: null, filter: 'all', query: '', checkFilter: 'all', sheetReturn: null };

  function load() {
    var d = defaults();
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return d;
      var p = JSON.parse(raw);
      if (!p || typeof p !== 'object') return d;
      return {
        v: 1,
        startDate: p.startDate || null,
        createdAt: p.createdAt || d.createdAt,
        settings: Object.assign(d.settings, p.settings || {}),
        prog: p.prog || {},
        flags: Array.isArray(p.flags) ? p.flags : [],
        logs: p.logs || {},
        overrides: p.overrides || {},
        chapters: p.chapters || {},
        plan: p.plan || null
      };
    } catch (e) { return d; }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function initStart() {
    if (!state.startDate) {
      var t = today();
      state.startDate = t <= DEFAULT_START ? DEFAULT_START : (t <= DEADLINE ? t : DEADLINE);
      save();
    }
  }
  initStart();

  function daysTotal() { return Math.max(1, Math.min(20, diffDays(state.startDate, DEADLINE) + 1)); }
  function learningDays() { return Math.max(1, daysTotal() - 2); }
  function dayIndex() { return clamp(diffDays(state.startDate, today()) + 1, 1, daysTotal()); }
  function daysLeft() { return Math.max(0, diffDays(today(), DEADLINE)); }

  function ensurePlan() {
    if (state.plan && state.plan.v === 3 && state.plan.start === state.startDate && state.plan.total === Q.length) return;
    var order = Q.slice();
    var day = {};
    var total = order.length;
    var ld = learningDays();
    // Dồn phần học mới vào ~9 câu/ngày, chừa thời gian dài cho ôn tập ngắt quãng
    var span = Math.min(ld, Math.max(1, Math.ceil(total / 9)));
    order.forEach(function (q, i) {
      day[q.id] = Math.min(span, Math.floor(i * span / total) + 1);
    });
    state.plan = { v: 3, start: state.startDate, total: total, day: day };
    save();
  }
  ensurePlan();

  function dayOf(q) { return (state.plan && state.plan.day[q.id]) || 1; }
  function chapterOf(q) { return state.chapters[q.id] || q.chapter || 'Chưa phân loại'; }

  /* ---------------- answers ---------------- */
  function effectiveAnswer(id) {
    var o = state.overrides[id];
    if (o && typeof o.correctIndex === 'number') {
      return { correctIndex: o.correctIndex, explanation: o.explanation || null, level: 'user', source: 'Bạn đã xác nhận', url: '' };
    }
    var a = ANSWERS[id];
    if (a && typeof a.correctIndex === 'number') {
      return {
        correctIndex: a.correctIndex,
        explanation: a.explanation || null,
        level: a.level || 'reference',
        source: a.source || 'Đáp án tham khảo',
        url: a.url || ''
      };
    }
    return null;
  }
  function keyCount() {
    return Q.filter(function (q) { return effectiveAnswer(q.id); }).length;
  }
  function answerLevelLabel(a) {
    if (!a) return 'Chưa có đáp án';
    if (a.level === 'user') return 'Bạn xác nhận';
    if (a.level === 'verified') return 'Đã kiểm chứng';
    return 'Đáp án tham khảo';
  }

  /* ---------------- SRS ---------------- */
  function newProg() {
    return { state: 'new', ease: 2.5, interval: 0, due: today(), reps: 0, lapses: 0, correct: 0, wrong: 0, lastSeen: null, lastResult: null };
  }
  function grade(id, quality) {
    var p = state.prog[id] ? Object.assign({}, state.prog[id]) : newProg();
    var good = quality >= 3;
    if (good) {
      p.correct++;
      p.reps++;
      if (p.reps === 1) p.interval = 1;
      else if (p.reps === 2) p.interval = 3;
      else p.interval = Math.max(p.interval + 1, Math.round(p.interval * p.ease));
      p.ease = Math.min(2.8, p.ease + 0.04);
      p.state = 'review';
    } else {
      p.wrong++;
      p.lapses++;
      p.reps = 0;
      p.interval = 1;
      p.ease = Math.max(1.3, p.ease - 0.2);
      p.state = 'learning';
    }
    p.due = addDays(today(), p.interval);
    p.lastSeen = today();
    p.lastResult = good ? 'good' : 'bad';
    state.prog[id] = p;
    logAnswer(good);
    save();
  }

  function logAnswer(good) {
    var t = today();
    var log = state.logs[t];
    if (!log) {
      log = { answered: 0, correct: 0, self: 0, goal: dailyGoalAtStart(), goalMet: false, seconds: 0 };
      state.logs[t] = log;
    }
    log.answered++;
    if (good) log.correct++;
    log.goalMet = log.answered >= log.goal;
    save();
  }

  function dailyGoalAtStart() {
    var due = Q.filter(isDue).length;
    var fresh = Q.filter(function (q) { return !state.prog[q.id] && dayOf(q) <= dayIndex(); }).length;
    var planned = due + Math.min(fresh, 25);
    return clamp(Math.min(state.settings.goal, planned || 1), 1, 25);
  }

  function isDue(q) {
    var p = state.prog[q.id];
    return !!(p && p.state !== 'new' && p.due <= today());
  }

  function isWrong(q) {
    var p = state.prog[q.id];
    return !!(p && p.lastResult === 'bad');
  }
  function isFlagged(q) { return state.flags.indexOf(q.id) !== -1; }

  function streakInfo() {
    var met = {};
    Object.keys(state.logs).forEach(function (d) { if (state.logs[d].goalMet) met[d] = 1; });
    var t = today();
    var cur = 0;
    var cursor = met[t] ? t : addDays(t, -1);
    while (met[cursor]) { cur++; cursor = addDays(cursor, -1); }
    var dates = Object.keys(met).sort();
    var longest = 0, run = 0, prev = null;
    dates.forEach(function (d) {
      if (prev && diffDays(prev, d) === 1) run++; else run = 1;
      if (run > longest) longest = run;
      prev = d;
    });
    return { current: cur, longest: longest, dates: met };
  }

  /* ---------------- queue ---------------- */
  function remainingLearningDays() {
    var d = dayIndex();
    return d > learningDays() ? 1 : Math.max(1, learningDays() - d + 1);
  }

  function byPriority(a, b) {
    function score(q) {
      var p = state.prog[q.id] || {};
      var s = 0;
      if (isFlagged(q)) s += 60;
      if (p.lastResult === 'bad') s += 40;
      if (p.due) s += clamp(diffDays(p.due, today()), 0, 20) * 3;
      return s;
    }
    return score(b) - score(a);
  }

  function mixChapters(list) {
    var chapters = {};
    list.forEach(function (q) {
      var c = chapterOf(q);
      (chapters[c] = chapters[c] || []).push(q);
    });
    var keys = Object.keys(chapters);
    if (keys.length < 2) return list;
    var out = [];
    var last = null;
    while (out.length < list.length) {
      var avail = keys.filter(function (k) { return chapters[k].length && k !== last; });
      if (!avail.length) avail = keys.filter(function (k) { return chapters[k].length; });
      var pick = avail[Math.floor(Math.random() * avail.length)];
      out.push(chapters[pick].shift());
      last = pick;
    }
    return out;
  }

  function todayQueue() {
    var freshAll = Q.filter(function (q) { return !state.prog[q.id] && dayOf(q) <= dayIndex(); }).sort(function (a, b) { return dayOf(a) - dayOf(b); });
    var due = Q.filter(isDue).sort(byPriority);
    var finalPhase = dayIndex() > learningDays();

    if (finalPhase) {
      var weak = Q.filter(function (q) { return isFlagged(q) || isWrong(q) || isDue(q); }).sort(byPriority);
      return mixChapters(weak).slice(0, 25);
    }

    var duePart = due.slice(0, 25);
    var freshRoom = Math.min(freshAll.length, 15, 25 - duePart.length);
    var freshPart = freshAll.slice(0, Math.max(0, freshRoom));
    return mixChapters(duePart.concat(freshPart));
  }

  function splitSessions(ids) {
    if (ids.length <= state.settings.sessionSize + 3) return [ids];
    var half = Math.ceil(ids.length / 2);
    return [ids.slice(0, half), ids.slice(half)];
  }

  /* ---------------- router ---------------- */
  var TABS = [
    { route: 'today', label: 'Hôm nay', icon: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10' },
    { route: 'library', label: 'Ôn tập', icon: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H19v16H5.5A1.5 1.5 0 0 1 4 18.5zM8 4v16' },
    { route: 'stats', label: 'Sổ', icon: 'M4 19V9m5 10V5m5 14v-7m5 7V8' },
    { route: 'settings', label: 'Cài đặt', icon: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-6l-.3 2.6c-.6.2-1.2.6-1.7 1l-2.4-1-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.4-1c.5.5 1.1.8 1.7 1l.3 2.6h6l.3-2.6c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.4z' }
  ];

  function currentRoute() {
    var h = (location.hash || '#/today').replace(/^#\/?/, '');
    var parts = h.split('?');
    var r = parts[0] || 'today';
    if (['today', 'library', 'check', 'stats', 'settings', 'study', 'done', 'exam', 'exam-setup'].indexOf(r) === -1) r = 'today';
    return r;
  }

  function nav(route) {
    location.hash = '#/' + route;
    window.scrollTo(0, 0);
  }

  function renderNav(route) {
    var active = ['study', 'done', 'exam', 'exam-setup'].indexOf(route) !== -1 ? 'today' : route;
    $$('.tabbar a').forEach(function (a) {
      var on = a.getAttribute('data-route') === active;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $$('.nav-desktop a').forEach(function (a) {
      var on = a.getAttribute('data-route') === active;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var info = streakInfo();
    var pill = $('#streakPill');
    if (pill) pill.innerHTML = '<span class="mark">◆</span> Chuỗi <b>' + info.current + '</b> ngày';
  }

  /* ---------------- views ---------------- */
  function viewToday() {
    var t = today();
    var di = dayIndex();
    var total = daysTotal();
    var dl = daysLeft();
    var queue = todayQueue();
    var sessions = splitSessions(queue);
    var progSeen = Q.filter(function (q) { return state.prog[q.id]; }).length;
    var dueCount = Q.filter(isDue).length;
    var freshCount = Q.filter(function (q) { return !state.prog[q.id] && dayOf(q) <= di; }).length;
    var wrong = Q.filter(isWrong).length;
    var flagged = Q.filter(isFlagged).length;
    var noKey = Q.length - keyCount();
    var log = state.logs[t];
    var goal = log ? log.goal : dailyGoalAtStart();
    var doneToday = log ? log.answered : 0;
    var met = log ? log.goalMet : false;
    var streak = streakInfo();
    var finalPhase = di > learningDays();
    var pastDeadline = t > DEADLINE;

    var heroTitle;
    if (pastDeadline) heroTitle = 'Đã hết <em>hạn ôn</em>';
    else if (finalPhase) heroTitle = 'Về đích <em>ngày ' + di + '</em>';
    else heroTitle = 'Ngày <em>' + String(di).padStart(2, '0') + '</em> / ' + total;

    var lede;
    if (pastDeadline) {
      lede = 'Kỳ ôn theo kế hoạch đã kết thúc. Bạn vẫn có thể mở sổ để ôn lại câu sai, câu đánh dấu hoặc thi thử.';
    } else if (finalPhase) {
      lede = 'Hai ngày cuối chỉ ôn câu sai, câu đánh dấu và làm một đề tổng hợp. Còn ' + dl + ' ngày tới 12.11.';
    } else if (!queue.length) {
      lede = 'Hôm nay bạn đã xử lý hết câu đến hạn và câu mới. Có thể ôn tự do hoặc thi thử để giữ nhịp.';
    } else {
      lede = 'Còn ' + dl + ' ngày tới 12.11. Hôm nay có ' + sessions.length + ' phiên, ' + freshCount + ' câu mới chờ và ' + dueCount + ' câu đến hạn ôn.';
    }

    var html = '<div class="view">';
    html += '<section class="hero">';
    html += '<p class="eyebrow">' + esc(fmtLong(t)) + '</p>';
    html += '<h1 class="display">' + heroTitle + '</h1>';
    html += '<p class="lede">' + lede + '</p>';
    html += '<div class="hero-meta">';
    html += '<span>Đã ôn <b>' + progSeen + '/' + Q.length + '</b> câu</span>';
    html += '<span>Còn <b>' + dl + '</b> ngày</span>';
    html += '<span>Mục tiêu hôm nay <b>' + Math.min(goal, 25) + '</b> câu</span>';
    html += '</div>';
    html += '<div class="hero-actions">';
    if (sessions.length && sessions[0].length) {
      html += '<button class="btn btn-primary" data-act="start-today" data-session="0">Bắt đầu phiên 1' + arrow() + '</button>';
    } else {
      html += '<button class="btn btn-primary" data-act="start-free">Ôn tự do' + arrow() + '</button>';
    }
    html += '<button class="btn" data-act="exam-setup">Thi thử</button>';
    html += '</div>';
    html += '<div class="hero-mark" aria-hidden="true">' + total + '<br>NGÀY<br>GDCT1</div>';
    html += '</section>';

    if (t <= DEADLINE && !met && reminderDue()) {
      html += '<div class="notice accent mt-20">Đã qua giờ nhắc <b>' + esc(reminderDue()) + '</b> mà mục tiêu hôm nay chưa đạt. Làm một phiên ngắn trước khi đóng sổ.</div>';
    }

    html += '<div class="grid-main"><div class="col-main">';

    html += '<div class="panel">';
    html += '<div class="plan-day"><span>' + esc(fmtLong(t)) + '</span><span><b>' + doneToday + '</b> / ' + Math.min(goal, 25) + ' câu hôm nay</span></div>';
    html += '<div class="plan">';
    if (!sessions.length || !sessions[0].length) {
      html += '<div class="plan-card is-done"><span class="sess">Hoàn tất</span><div><h3>Hôm nay không còn câu trong kế hoạch</h3><p>Ôn tự do 10 câu ngẫu nhiên hoặc làm đề thi thử.</p></div><span class="go">' + checkIcon() + '</span></div>';
    } else {
      sessions.forEach(function (ids, idx) {
        var newN = ids.filter(function (id) { return !state.prog[id]; }).length;
        var dueN = ids.filter(function (id) { return state.prog[id]; }).length;
        var finished = idx === 0 && met && log && log.answered >= ids.length;
        html += '<button class="plan-card' + (finished ? ' is-done' : '') + '" data-act="start-today" data-session="' + idx + '">';
        html += '<span class="sess">Phiên ' + (idx + 1) + '/' + sessions.length + '</span>';
        html += '<span><h3>' + (idx === 0 ? 'Phiên học chính' : 'Phiên củng cố') + '</h3><p>' + ids.length + ' câu · ' + newN + ' mới · ' + dueN + ' ôn lại</p></span>';
        html += '<span class="go" aria-hidden="true">' + arrow() + '</span>';
        html += '</button>';
      });
    }
    html += '</div>';

    if (finalPhase) {
      html += '<div class="notice mt-14">Chặng cuối: ưu tiên câu sai, câu đánh dấu và đề tổng hợp. Không thêm câu mới.</div>';
    }

    html += '<div class="section-head"><div><div class="kicker">Lối tắt</div><h2>Chỗ cần chú ý</h2></div></div>';
    html += '<div class="quick-grid">';
    html += '<button class="quick" data-act="start-mode" data-mode="wrong"><span class="q-k">Câu sai</span><span class="q-v">' + wrong + '</span><span class="q-d">Luyện lại ngay</span></button>';
    html += '<button class="quick" data-act="start-mode" data-mode="flagged"><span class="q-k">Đánh dấu</span><span class="q-v">' + flagged + '</span><span class="q-d">Xem lại sau</span></button>';
    html += '<button class="quick" data-act="go-check"><span class="q-k">Chưa có đáp án</span><span class="q-v">' + noKey + '</span><span class="q-d">Tra và xác nhận</span></button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="rail">';
    html += '<div class="panel"><div class="panel-head"><h3>Tiến độ tổng</h3><span class="count">' + pct(progSeen, Q.length) + '%</span></div>';
    html += '<div class="progress-block"><div class="progress-top"><div class="big">' + progSeen + '<small>/' + Q.length + '</small></div></div>';
    html += '<div class="bar"><i style="width:' + pct(progSeen, Q.length) + '%"></i></div>';
    html += '<div class="bar-meta"><span>Đã chạm</span><span>Còn ' + (Q.length - progSeen) + ' câu chưa học</span></div></div></div>';
    html += '<div class="panel"><div class="panel-head"><h3>Lịch ' + total + ' ngày</h3><span class="count">24.10 → 12.11</span></div>';
    html += calendarHTML(false);
    html += '<div class="cal-legend"><span><i class="l-done"></i>Đạt mục tiêu</span><span><i class="l-today"></i>Hôm nay</span><span><i class="l-final"></i>Chặng cuối</span></div></div>';
    html += '<div class="panel"><div class="panel-head"><h3>Chuỗi học</h3><span class="count">Kỷ lục ' + streak.longest + '</span></div>';
    html += '<div class="streak-block"><div class="streak-num">' + streak.current + '</div><div class="streak-meta"><b>ngày liên tiếp</b><span>' + (met ? 'Hôm nay đã đạt mục tiêu.' : 'Đạt ' + Math.min(goal, 25) + ' câu để giữ chuỗi.') + '</span>';
    html += '<div class="streak-dots" aria-hidden="true">' + arr(7).map(function (i) { return '<i class="' + (streak.dates[addDays(t, -6 + i)] ? 'on' : '') + '"></i>'; }).join('') + '</div>';
    html += '</div></div></div>';
    html += '</div></div>';
    html += '</div>';
    return html;
  }

  function reminderDue() {
    if (!state.settings.remOn) return null;
    var now = new Date();
    var hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (hm >= state.settings.remB) return state.settings.remB;
    if (hm >= state.settings.remA) return state.settings.remA;
    return null;
  }

  function calendarHTML(compact) {
    var total = daysTotal();
    var di = dayIndex();
    var t = today();
    var ld = learningDays();
    var out = '<div class="cal" role="list" aria-label="Lịch ôn ' + total + ' ngày">';
    for (var i = 1; i <= total; i++) {
      var d = addDays(state.startDate, i - 1);
      var cls = 'cal-cell';
      var title = fmtLong(d);
      if (d < t) cls += state.logs[d] && state.logs[d].goalMet ? ' is-done' : (d < state.startDate ? '' : ' is-missed');
      if (d === t) cls += ' is-today';
      if (i > ld) cls += ' is-final';
      var label = fmtShort(d);
      out += '<div role="listitem" class="' + cls + '" title="' + esc(title) + '"><span class="n">' + label + '</span><span class="sr-only">' + esc(title) + '</span></div>';
    }
    out += '</div>';
    return out;
  }

  /* ---------------- study ---------------- */
  function startStudy(ids, opts) {
    ids = ids.filter(function (id) { return Q.some(function (q) { return q.id === id; }); });
    if (!ids.length) { toast('Không có câu nào trong nhóm này.'); return; }
    S.study = {
      ids: ids,
      i: 0,
      picks: {},
      locked: {},
      flags: {},
      mode: (opts && opts.mode) || 'today',
      exam: !!(opts && opts.exam),
      sessionNo: (opts && opts.sessionNo) || 1,
      startedAt: Date.now(),
      correct: 0,
      answered: 0,
      selfRemembered: 0,
      selfForgot: 0
    };
    nav('study');
  }

  function qById(id) { return Q.find(function (q) { return q.id === id; }); }

  function viewStudy() {
    if (!S.study) { return '<div class="view"><div class="empty"><b>Chưa có phiên học</b>Quay về trang hôm nay để bắt đầu.</div></div>'; }
    var st = S.study;
    var q = qById(st.ids[st.i]);
    if (!q) { st.i = 0; q = qById(st.ids[0]); }
    var ans = effectiveAnswer(q.id);
    var picked = st.picks[q.id];
    var locked = st.exam ? false : !!st.locked[q.id];
    var selfPending = !st.exam && locked && !ans && st.picks[q.id] != null && !st.selfDone;
    var isLast = st.i === st.ids.length - 1;
    var correctIdx = ans ? ans.correctIndex : null;
    var modeLabel = st.exam ? 'Thi thử' : (st.mode === 'wrong' ? 'Câu sai' : st.mode === 'flagged' ? 'Đánh dấu' : st.mode === 'chapter' ? 'Theo nhóm' : 'Hôm nay');

    var html = '<div class="view view-study"><div class="study-top">';
    html += '<div class="study-meta"><div class="left"><button class="tool" data-act="exit-study" aria-label="Thoát phiên">' + backIcon() + '</button>';
    html += '<span class="mode">' + modeLabel + '</span><span class="qid">' + (st.i + 1) + ' / ' + st.ids.length + '</span></div>';
    html += '<div class="study-tools">';
    if (st.exam) html += '<span class="exam-timer" id="examTimer">00:00</span>';
    html += '<button class="tool ' + (isFlagged(q) ? 'is-on' : '') + '" data-act="toggle-flag" data-id="' + esc(q.id) + '" aria-label="Đánh dấu câu này" aria-pressed="' + (isFlagged(q) ? 'true' : 'false') + '">' + flagIcon() + '</button>';
    html += '<button class="tool" data-act="open-lookup" data-id="' + esc(q.id) + '" aria-label="Tra đáp án">' + searchIcon() + '</button>';
    html += '</div></div>';
    var doneN = st.i;
    html += '<div class="bar" aria-hidden="true"><i style="width:' + pct(doneN, st.ids.length) + '%"></i></div>';
    html += '</div>';

    html += '<div class="q-wrap" data-qid="' + esc(q.id) + '">';
    html += '<div class="q-chapter"><span class="badge">' + esc(chapterOf(q)) + '</span>';
    if (q.needsReview) html += '<span class="badge badge-warn">Cần kiểm tra</span>';
    html += '<span class="badge">' + esc(q.id.toUpperCase()) + '</span></div>';
    html += '<h1 class="q-text' + (q.question.length > 110 ? ' long' : '') + '">' + esc(q.question) + '</h1>';

    html += '<div class="opts" role="group" aria-label="Bốn phương án">';
    q.options.forEach(function (op, i) {
      var cls = 'opt';
      var tag = '';
      if (st.exam) {
        if (picked === i) cls += ' is-selected';
      } else if (locked) {
        if (i === picked) cls += ' is-selected';
        if (ans) {
          if (i === correctIdx) cls += ' is-correct';
          else if (i === picked) cls += ' is-wrong';
        }
        if (i === correctIdx) tag = '<span class="tag">Đáp án</span>';
        else if (i === picked && ans && i !== correctIdx) tag = '<span class="tag">Bạn chọn</span>';
      }
      html += '<button class="' + cls + '" data-act="pick" data-i="' + i + '" ' + ((locked || st.exam && false) ? 'disabled' : '') + ' aria-pressed="' + (picked === i ? 'true' : 'false') + '">';
      html += '<span class="key">' + LETTERS[i] + '</span><span class="txt">' + esc(op) + '</span>' + tag + '</button>';
    });
    html += '</div>';

    if (!st.exam && locked) {
      if (ans) {
        var good = picked === correctIdx;
        html += '<div class="feedback ' + (good ? 'good' : 'bad') + '"><div class="fb-head">' + (good ? 'Chính xác' : 'Chưa đúng') + ' · ' + esc(answerLevelLabel(ans)) + '</div>';
        html += '<p class="fb-answer">Đáp án: <b>' + LETTERS[correctIdx] + '. ' + esc(q.options[correctIdx]) + '</b></p>';
        if (picked != null && !good) html += '<p class="fb-note">Bạn chọn ' + LETTERS[picked] + '.</p>';
        if (ans.explanation) html += '<p class="mt-8">' + esc(ans.explanation) + '</p>';
        if (ans.level !== 'user') html += '<p class="fb-note">' + (ans.source ? esc(ans.source) + '. ' : '') + 'Nếu thấy sai, bạn có thể sửa đáp án bằng nút bên dưới.</p>';
        html += '<div class="tag-list mt-8"><button class="link-btn" data-act="open-lookup" data-id="' + esc(q.id) + '">Xem / sửa đáp án</button>';
        if (ans.url) html += '<a class="link-btn" href="' + esc(ans.url) + '" target="_blank" rel="noopener noreferrer">Nguồn tham khảo</a>';
        html += '</div></div>';
      } else {
        html += '<div class="feedback"><div class="fb-head">Chưa có đáp án cho câu này</div>';
        html += '<p>Bạn đã chọn <b>' + (picked != null ? LETTERS[picked] + '. ' + esc(q.options[picked]).replace(/\.\s*$/, '') : '—') + '</b>. Hãy tự đánh giá mức ghi nhớ; hệ thống dùng đánh giá đó để tính lịch ôn.</p>';
        html += '<p class="fb-note">Không hiển thị Đúng/Sai khi chưa có đáp án. Bạn có thể tra đáp án bằng nút bên dưới.</p>';
        html += '<div class="study-actions"><div class="self-assess"><div class="sa-label">Bạn thấy mình thế nào?</div><div class="sa-btns">';
        html += '<button class="sa-btn remember" data-act="self" data-good="1">' + checkIcon() + ' Nhớ</button>';
        html += '<button class="sa-btn forgot" data-act="self" data-good="0">' + crossIcon() + ' Chưa nhớ</button>';
        html += '</div></div>';
        html += '<button class="btn btn-sm" data-act="open-lookup" data-id="' + esc(q.id) + '">' + searchIcon() + 'Tra đáp án trên web</button>';
        html += '</div></div>';
      }
    }

    if (st.exam) {
      html += '<p class="fine mt-20">Thi thử: đáp án chỉ hiện sau khi nộp bài. Bạn có thể quay lại câu trước bằng phím ←.</p>';
    }

    html += '</div>';

    html += '<div class="study-cta">';
    var nextDisabled = !st.exam && !locked ? 'disabled' : '';
    var nextLabel = isLast ? (st.exam ? 'Nộp bài' : 'Xem kết quả') : 'Câu tiếp';
    html += '<div class="study-foot"><span class="kbd-hint"><kbd>1</kbd>–<kbd>4</kbd> chọn · <kbd>Enter</kbd> tiếp · <kbd>Esc</kbd> thoát</span><span class="kbd-hint">' + (st.exam ? 'Thi thử' : 'Tự chấm khi chưa có đáp án') + '</span></div>';
    html += '<button class="btn btn-primary btn-block" data-act="next" ' + nextDisabled + '>' + nextLabel + arrow() + '</button>';
    html += '</div></div>';
    return html;
  }

  function finishStudy() {
    var st = S.study;
    var answers = [];
    st.ids.forEach(function (id) {
      if (st.picks[id] != null) answers.push(id);
    });
    if (st.exam) {
      submitExam();
      return;
    }
    var seconds = Math.round((Date.now() - st.startedAt) / 1000);
    var t = today();
    if (state.logs[t]) { state.logs[t].seconds = (state.logs[t].seconds || 0) + seconds; }
    var wrongIds = [];
    st.ids.forEach(function (id) {
      var a = effectiveAnswer(id);
      if (a && st.picks[id] != null && st.picks[id] !== a.correctIndex) wrongIds.push(id);
    });
    S.done = { kind: 'session', ids: st.ids, picks: Object.assign({}, st.picks), wrong: wrongIds, seconds: seconds, exam: false };
    S.study = null;
    save();
    nav('done');
  }

  function submitExam() {
    var st = S.study;
    var correct = 0, keyed = 0, answered = 0;
    st.ids.forEach(function (id) {
      var a = effectiveAnswer(id);
      if (st.picks[id] != null) {
        answered++;
        if (a) {
          keyed++;
          var good = st.picks[id] === a.correctIndex;
          if (good) correct++;
          grade(id, good ? 4 : 1);
        } else {
          st.selfRemembered++;
        }
      }
    });
    var seconds = Math.round((Date.now() - st.startedAt) / 1000);
    S.done = { kind: 'exam', ids: st.ids, picks: Object.assign({}, st.picks), correct: correct, keyed: keyed, answered: answered, seconds: seconds, exam: true };
    S.study = null;
    nav('done');
  }

  function viewDone() {
    if (!S.done) return '<div class="view"><div class="empty"><b>Chưa có kết quả</b>Bắt đầu một phiên học để xem tổng kết.</div></div>';
    var d = S.done;
    var html = '<div class="view">';
    var keyed = d.ids.filter(function (id) { return effectiveAnswer(id) && d.picks[id] != null; });
    var correct = keyed.filter(function (id) { return d.picks[id] === effectiveAnswer(id).correctIndex; }).length;
    var ratio = keyed.length ? Math.round(correct / keyed.length * 100) : null;
    html += '<div class="results-hero"><div class="label">' + (d.exam ? 'Kết quả thi thử' : 'Tổng kết phiên') + '</div>';
    html += '<div class="score">' + (d.exam ? (ratio == null ? '—' : ratio) : d.ids.length) + (d.exam && ratio != null ? '<small>%</small>' : '<small> câu</small>') + '</div>';
    html += '<p class="small mt-8">' + keyed.length + ' câu có đáp án · ' + correct + ' câu đúng · ' + fmtTime(d.seconds) + '</p></div>';
    if (!keyed.length) {
      html += '<div class="notice mt-14">Chưa có câu nào trong phiên được gán đáp án, nên không tính điểm. Bạn có thể tự đánh giá và dùng kết quả này để chọn câu cần ôn lại.</div>';
    } else if (keyed.length < d.ids.length) {
      html += '<div class="notice mt-14">' + (d.ids.length - keyed.length) + ' câu chưa có đáp án nên không được tính vào điểm. Hãy kiểm đáp án để các lần sau chấm chính xác.</div>';
    }
    if (d.exam) {
      html += '<div class="panel mt-20"><div class="panel-head"><h3>Chi tiết</h3><span class="count">' + d.answered + '/' + d.ids.length + ' câu đã trả lời</span></div>';
      d.ids.slice(0, 200).forEach(function (id) {
        var q = qById(id);
        var a = effectiveAnswer(id);
        var pick = d.picks[id];
        var ok = a && pick === a.correctIndex;
        html += '<div class="result-row ' + (ok ? 'ok' : (a && pick != null ? 'no' : '')) + '"><span class="mark">' + (ok ? '✓' : (a && pick != null ? '✕' : '·')) + '</span><span><div class="rq">' + esc(q.question) + '</div>';
        html += '<div class="ra">' + (pick != null ? 'Bạn chọn ' + LETTERS[pick] : 'Bỏ trống') + (a ? ' · Đáp án ' + LETTERS[a.correctIndex] : ' · Chưa có đáp án') + '</div></span></div>';
      });
      html += '</div>';
    } else {
      var wrong = d.ids.filter(function (id) {
        var a = effectiveAnswer(id);
        return a && d.picks[id] != null && d.picks[id] !== a.correctIndex;
      });
      var selfNo = d.ids.filter(function (id) { return !effectiveAnswer(id) && d.picks[id] != null; });
      if (wrong.length) {
        html += '<div class="panel mt-20"><div class="panel-head"><h3>Cần ôn lại</h3><span class="count">' + wrong.length + ' câu</span></div>';
        wrong.forEach(function (id) {
          var q = qById(id);
          html += '<div class="result-row no"><span class="mark">✕</span><span><div class="rq">' + esc(q.question) + '</div><div class="ra">Đáp án ' + LETTERS[effectiveAnswer(id).correctIndex] + '</div></span></div>';
        });
        html += '</div>';
      }
      if (selfNo.length) {
        html += '<div class="panel mt-14"><div class="panel-head"><h3>Tự chấm</h3><span class="count">' + selfNo.length + ' câu chưa có đáp án</span></div><p class="small">Những câu này đã được ghi nhận theo mức tự đánh giá của bạn. Tra đáp án để lần sau chấm chính xác hơn.</p><div class="tag-list mt-8"><button class="link-btn" data-act="go-check">Đi tới kiểm đáp án</button></div></div>';
      }
    }
    html += '<div class="hero-actions"><button class="btn btn-primary" data-act="back-today">Về trang hôm nay' + arrow() + '</button><button class="btn" data-act="start-free">Ôn thêm 10 câu</button></div>';
    html += '</div>';
    return html;
  }

  function fmtTime(s) {
    var m = Math.floor(s / 60), ss = s % 60;
    return m + ' phút ' + String(ss).padStart(2, '0') + ' giây';
  }

  /* ---------------- library ---------------- */
  function viewLibrary() {
    var chapters = {};
    Q.forEach(function (q) { chapters[chapterOf(q)] = 1; });
    var chapterList = Object.keys(chapters);
    var list = Q.filter(function (q) {
      if (S.query) {
        var hay = (q.question + ' ' + q.options.join(' ') + ' ' + q.id + ' ' + chapterOf(q)).toLowerCase();
        if (hay.indexOf(S.query.toLowerCase()) === -1) return false;
      }
      if (S.filter === 'new') return !state.prog[q.id];
      if (S.filter === 'due') return isDue(q);
      if (S.filter === 'wrong') return isWrong(q);
      if (S.filter === 'flagged') return isFlagged(q);
      if (S.filter === 'nokey') return !effectiveAnswer(q.id);
      if (S.filter === 'review') return q.needsReview;
      return true;
    });

    var html = '<div class="view">';
    html += '<section style="padding-top:40px"><p class="eyebrow">Toàn bộ ngân hàng câu hỏi</p><h1 class="display" style="font-size:clamp(38px,8vw,64px);margin-top:12px">Ôn <em>theo câu</em></h1>';
    html += '<p class="lede mt-8">' + Q.length + ' câu · ' + keyCount() + ' câu đã có đáp án · ' + chapterList.length + ' nhóm. Chọn một câu để xem chi tiết hoặc luyện riêng.</p></section>';
    html += '<div class="toolbar"><label class="search">' + searchIcon() + '<input id="libSearch" type="search" placeholder="Tìm theo nội dung, phương án, mã câu…" value="' + esc(S.query) + '" aria-label="Tìm câu hỏi"></label>';
    html += '<button class="btn btn-sm" data-act="exam-setup">Thi thử</button></div>';
    html += '<div class="chips" role="group" aria-label="Lọc câu hỏi">';
    [['all', 'Tất cả', Q.length], ['new', 'Chưa học', Q.filter(function (q) { return !state.prog[q.id]; }).length], ['due', 'Đến hạn', Q.filter(isDue).length], ['wrong', 'Câu sai', Q.filter(isWrong).length], ['flagged', 'Đánh dấu', Q.filter(isFlagged).length], ['nokey', 'Chưa có đáp án', Q.length - keyCount()], ['review', 'Cần kiểm tra', Q.filter(function (q) { return q.needsReview; }).length]].forEach(function (f) {
      html += '<button class="chip" data-act="filter" data-filter="' + f[0] + '" aria-pressed="' + (S.filter === f[0]) + '">' + f[1] + ' <span class="mono">' + f[2] + '</span></button>';
    });
    html += '</div>';
    html += '<div class="lib" id="libList">';
    if (!list.length) html += '<div class="empty"><b>Không có câu phù hợp</b>Thử từ khoá khác hoặc bỏ bộ lọc.</div>';
    list.slice(0, 120).forEach(function (q) {
      var a = effectiveAnswer(q.id);
      var p = state.prog[q.id];
      html += '<button class="lib-row" data-act="open-question" data-id="' + esc(q.id) + '">';
      html += '<span class="lib-num">' + esc(q.id.replace('gdct1-', '')) + '</span>';
      html += '<span><span class="lib-q">' + esc(q.question) + '</span><span class="lib-sub">';
      html += '<span>' + esc(chapterOf(q)) + '</span>';
      html += a ? '<span class="badge badge-ok">' + esc(answerLevelLabel(a)) + '</span>' : '<span class="badge badge-warn">Chưa có đáp án</span>';
      if (isWrong(q)) html += '<span class="badge badge-accent">Câu sai</span>';
      if (q.needsReview) html += '<span class="badge badge-warn">Cần kiểm tra</span>';
      if (isFlagged(q)) html += '<span class="badge">Đánh dấu</span>';
      html += '</span></span>';
      html += '<span class="lib-right"><span class="dot-state ' + (p ? 's-' + p.state : 's-new') + '"></span><span>' + (p ? (p.state === 'review' ? 'ôn lại' : p.state === 'learning' ? 'đang học' : 'mới') : 'mới') + '</span></span>';
      html += '</button>';
    });
    if (list.length > 120) html += '<p class="fine mt-14">Đang hiện 120/' + list.length + ' câu. Dùng tìm kiếm để thu hẹp.</p>';
    html += '</div></div>';
    return html;
  }

  function viewCheck() {
    var total = Q.length;
    var user = Q.filter(function (q) { return state.overrides[q.id]; }).length;
    var keyed = keyCount();
    var noKey = total - keyed;
    var verified = Q.filter(function (q) { var a = effectiveAnswer(q.id); return a && a.level === 'verified'; }).length;
    var reviewN = Q.filter(function (q) { return q.needsReview; }).length;
    var filters = [['all', 'Tất cả', total], ['reference', 'Có đáp án', keyed - user], ['review', 'Cần kiểm tra', reviewN], ['user', 'Bạn xác nhận', user], ['none', 'Chưa có', noKey]];
    var list = Q.filter(function (q) {
      var a = effectiveAnswer(q.id);
      if (S.checkFilter === 'review') return q.needsReview;
      if (S.checkFilter === 'none') return !a;
      if (S.checkFilter === 'user') return a && a.level === 'user';
      if (S.checkFilter === 'reference') return a && a.level !== 'user';
      return true;
    });

    var html = '<div class="view">';
    html += '<section style="padding-top:40px"><p class="eyebrow">Bán tự động · bạn là người chốt</p><h1 class="display" style="font-size:clamp(38px,8vw,64px);margin-top:12px">Kiểm <em>đáp án</em></h1>';
    html += '<p class="lede mt-8">Mỗi câu có sẵn liên kết tra cứu. Chọn đáp án bạn đã đối chiếu và lưu; ứng dụng không tự suy luận và không coi phương án đã chọn trong ảnh là đáp án.</p></section>';
    html += '<div class="panel mt-20"><div class="check-hero" style="margin:0"><div><div class="small">Đã có đáp án</div><div class="big">' + keyed + '<span class="small"> / ' + total + '</span></div></div><div class="small">' + verified + ' câu đối chiếu giáo trình<br>' + (keyed - user - verified) + ' câu tham khảo · ' + user + ' câu bạn xác nhận</div></div>';
    html += '<div class="bar mt-14"><i style="width:' + pct(keyed, total) + '%"></i></div>';
    html += '<div class="bulk-actions"><label class="btn btn-sm" style="cursor:pointer">' + uploadIcon() + 'Nhập CSV / JSON<input type="file" id="keyFile" accept=".csv,.json,application/json,text/csv" class="sr-only"></label>';
    html += '<button class="btn btn-sm" data-act="download-sample">' + downloadIcon() + 'Tải mẫu CSV</button>';
    html += '<button class="btn btn-sm" data-act="export-answers">' + downloadIcon() + 'Xuất đáp án</button></div>';
    html += '<p class="fine mt-8">Định dạng CSV: <span class="mono">id,correctIndex,explanation</span> — correctIndex là 0–3 hoặc A–D. ID giữ nguyên khi cập nhật.</p></div>';

    html += '<div class="chips mt-14" role="group" aria-label="Lọc đáp án">';
    filters.forEach(function (f) {
      html += '<button class="chip" data-act="cfilter" data-filter="' + f[0] + '" aria-pressed="' + (S.checkFilter === f[0]) + '">' + f[1] + ' <span class="mono">' + f[2] + '</span></button>';
    });
    html += '</div>';

    html += '<div class="mt-14">';
    if (!list.length) html += '<div class="empty"><b>Không còn câu trong nhóm này</b>Chuyển bộ lọc hoặc bắt đầu một phiên ôn.</div>';
    list.slice(0, 80).forEach(function (q) {
      var a = effectiveAnswer(q.id);
      html += '<div class="check-row" data-q="' + esc(q.id) + '">';
      html += '<div class="cr-top"><span class="lib-num">' + esc(q.id.replace('gdct1-', '')) + '</span><div class="cr-q">' + esc(q.question) + '</div></div>';
      html += '<div class="cr-opts">';
      q.options.forEach(function (op, i) {
        html += '<div class="cr-opt"><b>' + LETTERS[i] + '</b><span>' + esc(op) + (a && a.correctIndex === i ? ' <span class="badge badge-ok">đáp án</span>' : '') + '</span></div>';
      });
      html += '</div><div class="cr-actions">';
      html += a ? '<span class="badge ' + (a.level === 'user' ? 'badge-ink' : 'badge-warn') + '">' + esc(answerLevelLabel(a)) + '</span>' : '<span class="badge badge-accent">Chưa có đáp án</span>';
      if (q.needsReview) html += '<span class="badge badge-warn">Cần kiểm tra</span>';
      html += '<button class="link-btn" data-act="open-lookup" data-id="' + esc(q.id) + '">Tra / gán đáp án</button>';
      html += '<a class="link-btn" href="' + googleURL(q) + '" target="_blank" rel="noopener noreferrer">Mở Google</a>';
      html += '</div></div>';
    });
    if (list.length > 80) html += '<p class="fine mt-14">Đang hiện 80/' + list.length + ' câu.</p>';
    html += '</div></div>';
    return html;
  }

  function viewStats() {
    var seen = Q.filter(function (q) { return state.prog[q.id]; }).length;
    var mastered = Q.filter(function (q) { var p = state.prog[q.id]; return p && p.interval >= 7; }).length;
    var keyedAnswers = 0, correctAnswers = 0, selfAnswers = 0;
    Q.forEach(function (q) {
      var p = state.prog[q.id];
      if (!p) return;
      keyedAnswers += p.correct + p.wrong;
      correctAnswers += p.correct;
    });
    Object.keys(state.logs).forEach(function (d) { selfAnswers += state.logs[d].self || 0; });
    var acc = keyedAnswers ? Math.round(correctAnswers / keyedAnswers * 100) : null;
    var streak = streakInfo();
    var wrong = Q.filter(isWrong).sort(byPriority);
    var flagged = Q.filter(isFlagged);
    var chapters = {};
    Q.forEach(function (q) { var c = chapterOf(q); chapters[c] = chapters[c] || { total: 0, seen: 0 }; chapters[c].total++; if (state.prog[q.id]) chapters[c].seen++; });
    var chapterKeys = Object.keys(chapters).sort(function (a, b) { return chapters[b].total - chapters[a].total; });

    var html = '<div class="view">';
    html += '<section style="padding-top:40px"><p class="eyebrow">Sổ theo dõi</p><h1 class="display" style="font-size:clamp(38px,8vw,64px);margin-top:12px">Nhìn <em>lại</em></h1>';
    html += '<p class="lede mt-8">Chuỗi ' + streak.current + ' ngày, kỷ lục ' + streak.longest + '. ' + (acc == null ? 'Chưa đủ dữ liệu để tính độ chính xác.' : 'Độ chính xác trên các câu có đáp án: ' + acc + '%.') + '</p></section>';
    html += '<div class="stat-grid mt-20">';
    html += '<div class="stat"><div class="v">' + streak.current + '</div><div class="k">Chuỗi hiện tại</div><div class="d">kỷ lục ' + streak.longest + '</div></div>';
    html += '<div class="stat"><div class="v">' + seen + '</div><div class="k">Câu đã chạm</div><div class="d">trên ' + Q.length + '</div></div>';
    html += '<div class="stat"><div class="v">' + (acc == null ? '—' : acc + '%') + '</div><div class="k">Chính xác</div><div class="d">' + keyedAnswers + ' lượt có đáp án</div></div>';
    html += '<div class="stat"><div class="v">' + mastered + '</div><div class="k">Đã giãn cách</div><div class="d">khoảng ôn ≥ 7 ngày</div></div>';
    html += '</div>';

    html += '<div class="grid-main"><div class="col-main">';
    html += '<div class="panel"><div class="panel-head"><h3>Lịch ' + daysTotal() + ' ngày</h3><span class="count">' + seen + '/' + Q.length + ' câu</span></div>' + calendarHTML(false);
    html += '<div class="cal-legend"><span><i class="l-done"></i>Đạt mục tiêu</span><span><i class="l-today"></i>Hôm nay</span><span><i class="l-final"></i>Chặng cuối</span></div></div>';

    if (chapterKeys.length > 1) {
      html += '<div class="panel mt-14"><div class="panel-head"><h3>Theo nhóm</h3><span class="count">' + chapterKeys.length + ' nhóm</span></div><div class="bars">';
      chapterKeys.forEach(function (c) {
        html += '<div class="bar-row"><div class="br-top"><b>' + esc(c) + '</b><span>' + chapters[c].seen + '/' + chapters[c].total + '</span></div><div class="track"><i style="width:' + pct(chapters[c].seen, chapters[c].total) + '%"></i></div></div>';
      });
      html += '</div></div>';
    }

    if (wrong.length) {
      html += '<div class="panel mt-14"><div class="panel-head"><h3>Câu sai gần nhất</h3><span class="count">' + wrong.length + '</span></div>';
      wrong.slice(0, 8).forEach(function (q) {
        html += '<button class="lib-row" style="padding-left:0;padding-right:0" data-act="open-question" data-id="' + esc(q.id) + '"><span class="lib-num">' + esc(q.id.replace('gdct1-', '')) + '</span><span class="lib-q">' + esc(q.question) + '</span><span class="lib-right">→</span></button>';
      });
      html += '<div class="tag-list mt-14"><button class="btn btn-sm" data-act="start-mode" data-mode="wrong">Luyện câu sai</button></div></div>';
    }
    html += '</div>';

    html += '<div class="rail">';
    html += '<div class="panel"><div class="panel-head"><h3>Độ phủ đáp án</h3><span class="count">' + pct(keyCount(), Q.length) + '%</span></div>';
    html += '<div class="progress-block"><div class="progress-top"><div class="big">' + keyCount() + '<small>/' + Q.length + '</small></div></div><div class="bar green"><i style="width:' + pct(keyCount(), Q.length) + '%"></i></div>';
    html += '<p class="small mt-8">' + (Q.length - keyCount()) + ' câu chưa có đáp án. Chấm điểm chỉ áp dụng cho câu đã có đáp án.</p><button class="btn btn-sm mt-14" data-act="go-check">Kiểm đáp án</button></div></div>';

    html += '<div class="panel"><div class="panel-head"><h3>Đánh dấu</h3><span class="count">' + flagged.length + '</span></div>';
    if (!flagged.length) html += '<p class="small">Chưa đánh dấu câu nào. Dùng nút cờ trong phiên học để giữ câu cần xem lại.</p>';
    else {
      flagged.slice(0, 6).forEach(function (q) {
        html += '<button class="lib-row" style="padding-left:0;padding-right:0" data-act="open-question" data-id="' + esc(q.id) + '"><span class="lib-num">' + esc(q.id.replace('gdct1-', '')) + '</span><span class="lib-q">' + esc(q.question) + '</span><span class="lib-right">→</span></button>';
      });
      html += '<button class="btn btn-sm mt-14" data-act="start-mode" data-mode="flagged">Luyện câu đánh dấu</button>';
    }
    html += '</div></div></div></div>';
    return html;
  }

  function viewSettings() {
    var notifOK = ('Notification' in window) && Notification.permission === 'granted';
    var html = '<div class="view">';
    html += '<section style="padding-top:40px"><p class="eyebrow">Cấu hình</p><h1 class="display" style="font-size:clamp(38px,8vw,64px);margin-top:12px">Cài <em>đặt</em></h1>';
    html += '<p class="lede mt-8">Thời hạn 12.11.2026. Bắt đầu ' + fmtShort(state.startDate) + ', tổng ' + daysTotal() + ' ngày, chặng cuối 2 ngày.</p></section>';

    html += '<div class="grid-main"><div class="col-main">';

    html += '<div class="panel"><div class="panel-head"><h3>Nhịp học</h3></div>';
    html += '<div class="row"><div><div class="r-label">Mục tiêu mỗi ngày</div><div class="r-sub">Số câu tối thiểu để tính chuỗi. Mặc định 15.</div></div><select class="mini" id="setGoal">';
    [8, 10, 12, 15, 18, 20, 25].forEach(function (n) { html += '<option value="' + n + '"' + (state.settings.goal === n ? ' selected' : '') + '>' + n + ' câu</option>'; });
    html += '</select></div>';
    html += '<div class="row"><div><div class="r-label">Câu mỗi phiên</div><div class="r-sub">Tối đa 25; phiên dài sẽ được chia đôi.</div></div><select class="mini" id="setSize">';
    [8, 10, 12, 15].forEach(function (n) { html += '<option value="' + n + '"' + (state.settings.sessionSize === n ? ' selected' : '') + '>' + n + ' câu</option>'; });
    html += '</select></div>';
    html += '<div class="row"><div><div class="r-label">Email / tài khoản</div><div class="r-sub">Không có. Mọi dữ liệu nằm trên máy này.</div></div><span class="r-value">cục bộ</span></div>';
    html += '</div>';

    html += '<div class="panel mt-14"><div class="panel-head"><h3>Nhắc học</h3></div>';
    html += '<div class="row"><div><div class="r-label">Bật nhắc trong app</div><div class="r-sub">Hiện băng nhắc khi đã qua giờ mà chưa đạt mục tiêu.</div></div><button class="switch" id="setRemOn" role="switch" aria-checked="' + (state.settings.remOn ? 'true' : 'false') + '" aria-label="Bật nhắc học"></button></div>';
    html += '<div class="row"><div><div class="r-label">Giờ nhắc sáng</div></div><input class="time-input" type="time" id="setRemA" value="' + esc(state.settings.remA) + '"></div>';
    html += '<div class="row"><div><div class="r-label">Giờ nhắc tối</div></div><input class="time-input" type="time" id="setRemB" value="' + esc(state.settings.remB) + '"></div>';
    html += '<div class="row"><div><div class="r-label">Thông báo hệ thống</div><div class="r-sub">Chỉ hoạt động khi app còn mở (hoặc service worker còn sống). Không phải push khi app đã đóng.</div></div><button class="btn btn-sm" data-act="notify">' + (notifOK ? 'Đã bật' : 'Bật thông báo') + '</button></div>';
    html += '<div class="row"><div><div class="r-label">Thêm vào lịch</div><div class="r-sub">Xuất .ics cho ' + daysTotal() + ' ngày, 2 nhắc mỗi ngày.</div></div><button class="btn btn-sm" data-act="ics">' + downloadIcon() + 'Tải .ics</button></div>';
    html += '<div class="notice mt-14">Giới hạn: trình duyệt không cho web tĩnh đánh thức khi app đã đóng hoàn toàn. Muốn push thật cần backend/OneSignal — ngoài phạm vi bản này. File .ics là cách nhắc chắc chắn nhất.</div>';
    html += '</div>';

    html += '<div class="panel mt-14"><div class="panel-head"><h3>Đáp án</h3><span class="count">' + keyCount() + '/' + Q.length + '</span></div>';
    html += '<p class="small">Đáp án hiện có là <b>tham khảo</b> hoặc do bạn xác nhận. Không có đáp án nào được lấy từ phương án đã chọn trong ảnh. Hãy tra chéo ít nhất hai nguồn trước khi chốt.</p>';
    html += '<div class="bulk-actions"><label class="btn btn-sm" style="cursor:pointer">' + uploadIcon() + 'Nhập CSV / JSON<input type="file" id="keyFile2" accept=".csv,.json,application/json,text/csv" class="sr-only"></label>';
    html += '<button class="btn btn-sm" data-act="download-sample">' + downloadIcon() + 'CSV mẫu</button>';
    html += '<button class="btn btn-sm" data-act="export-answers">' + downloadIcon() + 'Xuất đáp án</button></div>';
    html += '</div>';

    html += '<div class="panel mt-14"><div class="panel-head"><h3>Dữ liệu</h3></div>';
    html += '<div class="row"><div><div class="r-label">Sao lưu tiến độ</div><div class="r-sub">JSON gồm lịch sử, chuỗi, cài đặt và đáp án bạn đã chốt.</div></div><button class="btn btn-sm" data-act="export-data">' + downloadIcon() + 'Xuất</button></div>';
    html += '<div class="row"><div><div class="r-label">Khôi phục</div><div class="r-sub">Nhập file đã xuất. Dữ liệu hiện tại sẽ được thay thế sau khi xác nhận.</div></div><label class="btn btn-sm" style="cursor:pointer">' + uploadIcon() + 'Nhập<input type="file" id="importFile" accept=".json,application/json" class="sr-only"></label></div>';
    html += '<div class="row"><div><div class="r-label">Xoá tiến độ</div><div class="r-sub">Giữ nguyên câu hỏi và đáp án đã nhập. Không thể hoàn tác.</div></div><button class="btn btn-sm btn-danger" data-act="reset">Đặt lại</button></div>';
    html += '</div>';

    html += '<div class="panel mt-14"><div class="panel-head"><h3>Ứng dụng</h3></div>';
    html += '<div class="row"><div><div class="r-label">Cài lên màn hình chính</div><div class="r-sub">Chạy offline sau lần tải đầu. Trên iOS: Chia sẻ → Thêm vào Màn hình chính.</div></div><button class="btn btn-sm" data-act="install">Cài đặt</button></div>';
    html += '<div class="row"><div><div class="r-label">Phiên bản</div><div class="r-sub">Tĩnh, không backend, không tracking.</div></div><span class="r-value">1.0</span></div>';
    html += '</div></div>';

    html += '<div class="rail">';
    html += '<div class="panel"><div class="panel-head"><h3>Nguồn dữ liệu</h3></div>';
    html += '<div class="kv"><span>Câu hỏi</span><b>' + Q.length + '</b></div>';
    html += '<div class="kv"><span>Ảnh gốc</span><b>70</b></div>';
    html += '<div class="kv"><span>Cần kiểm tra</span><b>' + Q.filter(function (q) { return q.needsReview; }).length + '</b></div>';
    html += '<div class="kv"><span>Đáp án</span><b>' + keyCount() + '</b></div>';
    html += '<p class="fine mt-14">Nội dung chép từ ảnh Google Form do bạn cung cấp. Ảnh không được nhúng vào app; mỗi câu lưu tên ảnh nguồn để tra ngược.</p>';
    html += '</div>';
    html += '<div class="panel"><div class="panel-head"><h3>Phím tắt</h3></div><div class="kv"><span>Chọn đáp án</span><b>1–4 / A–D</b></div><div class="kv"><span>Câu tiếp</span><b>Enter</b></div><div class="kv"><span>Lùi câu</span><b>←</b></div><div class="kv"><span>Thoát phiên</span><b>Esc</b></div></div>';
    html += '</div></div></div>';
    return html;
  }

  function viewExamSetup() {
    var html = '<div class="view">';
    html += '<section style="padding-top:40px"><p class="eyebrow">Đề tổng hợp ngẫu nhiên</p><h1 class="display" style="font-size:clamp(38px,8vw,64px);margin-top:12px">Thi <em>thử</em></h1>';
    html += '<p class="lede mt-8">Câu hỏi được trộn ngẫu nhiên. Đáp án chỉ hiện sau khi nộp. Nếu đề có câu chưa gán đáp án, phần đó không được tính điểm.</p></section>';
    html += '<div class="panel mt-20"><div class="panel-head"><h3>Chọn độ dài</h3><span class="count">' + Q.length + ' câu trong ngân hàng</span></div>';
    html += '<div class="plan"><button class="plan-card" data-act="start-exam" data-n="20"><span class="sess">20 câu</span><span><h3>Đề ngắn</h3><p>Khoảng 15–20 phút · đủ để giữ nhịp</p></span><span class="go">' + arrow() + '</span></button>';
    html += '<button class="plan-card" data-act="start-exam" data-n="40"><span class="sess">40 câu</span><span><h3>Đề vừa</h3><p>Mô phỏng một buổi thi thật</p></span><span class="go">' + arrow() + '</span></button>';
    html += '<button class="plan-card" data-act="start-exam" data-n="0"><span class="sess">Tất cả</span><span><h3>Toàn bộ ' + Q.length + ' câu</h3><p>Kiểm tra diện rộng trước ngày 12.11</p></span><span class="go">' + arrow() + '</span></button></div>';
    html += '<div class="notice mt-14">' + keyCount() + '/' + Q.length + ' câu đã có đáp án. Càng nhiều câu được chốt, điểm thi thử càng có ý nghĩa.</div></div></div>';
    return html;
  }

  /* ---------------- sheet ---------------- */
  function googleURL(q) {
    return 'https://www.google.com/search?q=' + encodeURIComponent('"' + q.question + '" "đáp án"');
  }

  function openSheet(html) {
    closeSheet();
    S.sheetReturn = document.activeElement;
    var ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'overlay';
    ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(ov);
    document.body.classList.add('locked');
    var sheet = $('.sheet', ov);
    var focusables = sheet.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusables.length) focusables[0].focus();
    ov.addEventListener('click', function (e) { if (e.target === ov) closeSheet(); });
  }
  function closeSheet() {
    var ov = $('#overlay');
    if (!ov) return;
    ov.remove();
    document.body.classList.remove('locked');
    if (S.sheetReturn && S.sheetReturn.focus) S.sheetReturn.focus();
    S.sheetReturn = null;
  }

  function openQuestionSheet(id) {
    var q = qById(id);
    var a = effectiveAnswer(id);
    var p = state.prog[id];
    var opts = q.options.map(function (op, i) {
      return '<div class="cr-opt" style="padding:5px 0"><b>' + LETTERS[i] + '</b><span>' + esc(op) + (a && a.correctIndex === i ? ' <span class="badge badge-ok">đáp án</span>' : '') + '</span></div>';
    }).join('');
    var html = '<div class="sheet-head"><div><h2>' + esc(q.id.toUpperCase()) + '</h2><p>' + esc(chapterOf(q)) + ' · ' + (p ? (p.state === 'review' ? 'đã ôn ' + p.correct + ' lần đúng' : 'đang học') : 'chưa học') + '</p></div><button class="tool" data-act="close-sheet" aria-label="Đóng">' + crossIcon() + '</button></div>';
    html += '<h3 class="q-text" style="font-size:24px;margin-bottom:14px">' + esc(q.question) + '</h3>';
    html += '<div class="opts">' + opts + '</div>';
    html += '<div class="mt-14">' + (a ? '<span class="badge ' + (a.level === 'user' ? 'badge-ink' : 'badge-warn') + '">' + esc(answerLevelLabel(a)) + '</span>' : '<span class="badge badge-accent">Chưa có đáp án</span>') + (q.needsReview ? ' <span class="badge badge-warn">Cần kiểm tra</span>' : '') + '</div>';
    if (a && a.explanation) html += '<p class="small mt-8">' + esc(a.explanation) + '</p>';
    html += '<p class="fine mt-8">Ảnh nguồn: ' + esc(q.sourceImage || '—') + '</p>';
    html += '<div class="sheet-foot"><button class="btn btn-primary" data-act="study-one" data-id="' + esc(id) + '">Học câu này</button>';
    html += '<button class="btn" data-act="open-lookup" data-id="' + esc(id) + '">Tra / gán đáp án</button>';
    html += '<button class="btn btn-ghost" data-act="toggle-flag" data-id="' + esc(id) + '">' + (isFlagged(q) ? 'Bỏ đánh dấu' : 'Đánh dấu') + '</button></div>';
    openSheet(html);
  }

  function openLookupSheet(id) {
    var q = qById(id);
    var a = effectiveAnswer(id);
    var opts = q.options.map(function (op, i) {
      return '<button class="opt ' + (a && a.correctIndex === i ? 'is-selected' : '') + '" data-act="set-answer-temp" data-id="' + esc(id) + '" data-i="' + i + '"><span class="key">' + LETTERS[i] + '</span><span class="txt">' + esc(op) + '</span></button>';
    }).join('');
    var html = '<div class="sheet-head"><div><h2>Tra & gán đáp án</h2><p>' + esc(q.id.toUpperCase()) + ' · ' + esc(chapterOf(q)) + '</p></div><button class="tool" data-act="close-sheet" aria-label="Đóng">' + crossIcon() + '</button></div>';
    html += '<p class="small" style="line-height:1.55">' + esc(q.question) + '</p>';
    html += '<div class="notice mt-14">Đối chiếu câu hỏi với ít nhất hai nguồn. Không dùng phương án đã chọn trong ảnh làm đáp án. Bạn là người chốt cuối.</div>';
    html += '<div class="tag-list mt-14"><a class="btn btn-sm" href="' + googleURL(q) + '" target="_blank" rel="noopener noreferrer">' + searchIcon() + 'Google: câu hỏi + đáp án</a>';
    html += '<a class="btn btn-sm" href="https://www.google.com/search?q=' + encodeURIComponent('"' + q.question + '" site:studocu.vn OR site:scribd.com OR site:quizlet.com') + '" target="_blank" rel="noopener noreferrer">Tài liệu tham khảo</a>';
    html += '<button class="btn btn-sm" data-act="copy-q" data-id="' + esc(id) + '">Sao chép câu hỏi</button></div>';
    html += '<div class="opts" id="lookupOpts" data-id="' + esc(id) + '">' + opts + '</div>';
    html += '<div class="field"><label for="lookupNote">Giải thích / nguồn (tuỳ chọn)</label><textarea id="lookupNote" placeholder="Ví dụ: Giáo trình Triết học Mác – Lênin, chương 3; hoặc dán URL nguồn…">' + esc(a && a.explanation ? a.explanation : '') + '</textarea></div>';
    html += '<p class="fine mt-8">Đáp án lưu vào máy. Nếu bạn xác nhận, ứng dụng sẽ dùng đáp án này để chấm và lên lịch ôn.</p>';
    html += '<div class="sheet-foot"><button class="btn btn-primary" data-act="save-answer" data-id="' + esc(id) + '">Lưu đáp án</button>';
    if (state.overrides[id]) html += '<button class="btn" data-act="clear-answer" data-id="' + esc(id) + '">Bỏ xác nhận</button>';
    html += '<button class="btn btn-ghost" data-act="close-sheet">Đóng</button></div>';
    openSheet(html);
    S.lookupPick = a ? a.correctIndex : null;
  }

  function openExitSheet() {
    var st = S.study;
    var html = '<div class="sheet-head"><div><h2>Thoát phiên?</h2><p>Tiến độ từng câu đã trả lời vẫn được lưu.</p></div><button class="tool" data-act="close-sheet" aria-label="Đóng">' + crossIcon() + '</button></div>';
    html += '<p class="small">Bạn đang ở câu ' + (st ? st.i + 1 : 1) + '. Có thể quay lại sau từ trang hôm nay.</p>';
    html += '<div class="sheet-foot"><button class="btn btn-primary" data-act="confirm-exit">Thoát và lưu</button><button class="btn" data-act="close-sheet">Ở lại</button></div>';
    openSheet(html);
  }

  function openExamSubmitSheet() {
    var st = S.study;
    var answered = Object.keys(st.picks).length;
    var html = '<div class="sheet-head"><div><h2>Nộp bài?</h2><p>Đã trả lời ' + answered + '/' + st.ids.length + ' câu.</p></div><button class="tool" data-act="close-sheet" aria-label="Đóng">' + crossIcon() + '</button></div>';
    html += '<p class="small">Câu bỏ trống sẽ được tính là chưa trả lời. Đáp án chỉ hiện sau khi nộp.</p>';
    html += '<div class="sheet-foot"><button class="btn btn-primary" data-act="confirm-submit">Nộp bài</button><button class="btn" data-act="close-sheet">Làm tiếp</button></div>';
    openSheet(html);
  }

  /* ---------------- actions ---------------- */
  function startToday(sessionIdx) {
    var q = todayQueue();
    var sessions = splitSessions(q);
    var ids = (sessions[sessionIdx] || []).map(function (item) { return item.id; });
    if (!ids.length) { toast('Hôm nay không còn câu nào trong kế hoạch.'); return; }
    startStudy(ids, { mode: 'today', sessionNo: sessionIdx + 1 });
  }

  function startMode(mode) {
    var ids = [];
    if (mode === 'wrong') ids = Q.filter(isWrong).sort(byPriority).map(function (q) { return q.id; }).slice(0, 25);
    if (mode === 'flagged') ids = Q.filter(isFlagged).map(function (q) { return q.id; }).slice(0, 25);
    if (mode === 'due') ids = Q.filter(isDue).map(function (q) { return q.id; }).slice(0, 25);
    if (mode === 'free') ids = Q.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 10).map(function (q) { return q.id; });
    if (mode === 'chapter') ids = Q.filter(function (q) { return chapterOf(q) === S.chapter; }).map(function (q) { return q.id; }).slice(0, 25);
    if (!ids.length) { toast(mode === 'wrong' ? 'Chưa có câu sai nào.' : mode === 'flagged' ? 'Chưa đánh dấu câu nào.' : 'Không có câu phù hợp.'); return; }
    startStudy(ids, { mode: mode });
  }

  function startExam(n) {
    var pool = Q.slice();
    pool.sort(function () { return Math.random() - 0.5; });
    var ids = n > 0 ? pool.slice(0, Math.min(n, pool.length)) : pool;
    startStudy(ids.map(function (q) { return q.id; }), { mode: 'exam', exam: true });
  }

  function pickOption(i) {
    var st = S.study;
    if (!st) return;
    var q = qById(st.ids[st.i]);
    if (!q) return;
    if (st.exam) {
      st.picks[q.id] = i;
      render();
      return;
    }
    if (st.locked[q.id]) return;
    st.picks[q.id] = i;
    st.locked[q.id] = true;
    st.answered++;
    st.selfDone = false;
    var a = effectiveAnswer(q.id);
    if (a) {
      var good = i === a.correctIndex;
      if (good) st.correct++;
      grade(q.id, good ? 4 : 1);
      st.selfDone = true;
    } else {
      // chờ người học tự đánh giá
    }
    save();
    render();
    // Đưa phần phản hồi / tự đánh giá vào tầm nhìn, tránh bị CTA cố định che khuất.
    requestAnimationFrame(function () {
      var el = document.querySelector('.feedback') || document.querySelector('.self-assess');
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  function selfAssess(good) {
    var st = S.study;
    if (!st) return;
    var q = qById(st.ids[st.i]);
    if (!q) return;
    if (st.selfDone) return;
    st.selfDone = true;
    if (good) { st.selfRemembered++; st.correct++; } else { st.selfForgot++; }
    var t = today();
    if (state.logs[t]) state.logs[t].self = (state.logs[t].self || 0) + 1;
    grade(q.id, good ? 4 : 1);
    render();
  }

  function nextCard() {
    var st = S.study;
    if (!st) return;
    var q = qById(st.ids[st.i]);
    if (!st.exam && q && !st.locked[q.id]) { toast('Chọn một đáp án trước.'); return; }
    if (!st.exam && q && !effectiveAnswer(q.id) && !st.selfDone && st.picks[q.id] != null) { toast('Chọn “Nhớ” hoặc “Chưa nhớ”.'); return; }
    if (st.i >= st.ids.length - 1) {
      if (st.exam) openExamSubmitSheet();
      else finishStudy();
      return;
    }
    st.i++;
    st.selfDone = false;
    render();
    window.scrollTo(0, 0);
  }

  /* ---------------- imports / exports ---------------- */
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 600);
  }

  function exportData() {
    var payload = { app: 'so-on-gdct1', version: 1, exportedAt: new Date().toISOString(), state: state };
    download('so-on-gdct1-backup-' + today() + '.json', JSON.stringify(payload, null, 2), 'application/json');
    toast('Đã xuất bản sao lưu.');
  }

  function exportAnswers() {
    var rows = [['id', 'correctIndex', 'explanation']];
    Q.forEach(function (q) {
      var a = effectiveAnswer(q.id);
      if (a) rows.push([q.id, a.correctIndex, (a.explanation || '').replace(/"/g, '""')]);
    });
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    download('gdct1-dap-an-' + today() + '.csv', '\ufeff' + csv, 'text/csv;charset=utf-8');
  }

  function sampleCSV() {
    var csv = 'id,correctIndex,explanation\n"gdct1-001",2,"Nguồn: giáo trình; ghi chú ngắn"\n"gdct1-002",0,""\n';
    download('gdct1-mau-dap-an.csv', '\ufeff' + csv, 'text/csv;charset=utf-8');
  }

  function parseCSV(text) {
    text = text.replace(/^\ufeff/, '');
    var rows = [];
    var row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else {
        if (c === '"') q = true;
        else if (c === ',') { row.push(cell); cell = ''; }
        else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
        else if (c !== '\r') cell += c;
      }
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return c.trim(); }); });
  }

  function idxFrom(v) {
    v = String(v == null ? '' : v).trim();
    if (/^[A-Da-d]$/.test(v)) return 'ABCD'.indexOf(v.toUpperCase());
    var n = parseInt(v, 10);
    if (n >= 1 && n <= 4) return n - 1;
    if (n >= 0 && n <= 3 && String(n) === v) return n;
    return -1;
  }

  function importAnswerText(text, name) {
    var items = [];
    try {
      if (/\.json$/i.test(name) || /^\s*[\[{]/.test(text)) {
        var data = JSON.parse(text);
        var arr = Array.isArray(data) ? data : (data.answers || data.items || []);
        arr.forEach(function (it) {
          items.push({ id: it.id, correctIndex: idxFrom(it.correctIndex != null ? it.correctIndex : it.answer), explanation: it.explanation || '' });
        });
      } else {
        var rows = parseCSV(text);
        var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
        var iId = head.indexOf('id'), iAns = head.indexOf('correctindex'), iExp = head.indexOf('explanation');
        if (iAns === -1) iAns = head.indexOf('answer');
        if (iId === -1) { toast('File CSV thiếu cột id.'); return; }
        rows.slice(1).forEach(function (r) {
          items.push({ id: (r[iId] || '').trim(), correctIndex: idxFrom(r[iAns]), explanation: iExp > -1 ? (r[iExp] || '') : '' });
        });
      }
    } catch (e) { toast('Không đọc được file. Kiểm tra định dạng CSV/JSON.'); return; }

    var ok = 0, bad = 0;
    items.forEach(function (it) {
      if (!it.id || !qById(it.id) || it.correctIndex < 0 || it.correctIndex > 3) { bad++; return; }
      state.overrides[it.id] = { correctIndex: it.correctIndex, explanation: it.explanation || '', confirmedAt: new Date().toISOString() };
      ok++;
    });
    save();
    render();
    toast('Đã nhập ' + ok + ' đáp án' + (bad ? ', bỏ qua ' + bad + ' dòng lỗi.' : '.'));
  }

  function importBackup(text) {
    try {
      var data = JSON.parse(text);
      if (!data.state || !data.state.prog) throw new Error('bad');
      if (!confirm('Thay thế toàn bộ tiến độ hiện tại bằng bản sao lưu này?')) return;
      state = data.state;
      state.settings = Object.assign(defaults().settings, state.settings || {});
      state.overrides = state.overrides || {};
      state.chapters = state.chapters || {};
      state.flags = state.flags || [];
      state.logs = state.logs || {};
      state.prog = state.prog || {};
      save();
      ensurePlan();
      render();
      toast('Đã khôi phục bản sao lưu.');
    } catch (e) { toast('File sao lưu không hợp lệ.'); }
  }

  function buildICS() {
    function pad(n) { return String(n).padStart(2, '0'); }
    function dt(d) { return d.replace(/-/g, '') + 'T'; }
    function escICS(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
    var out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//So On GDCT1//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    out.push('BEGIN:VTIMEZONE', 'TZID:Asia/Ho_Chi_Minh', 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:+0700', 'TZOFFSETTO:+0700', 'TZNAME:ICT', 'END:STANDARD', 'END:VTIMEZONE');
    var stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    for (var i = 0; i < daysTotal(); i++) {
      var d = addDays(state.startDate, i);
      [['08:30', 'Phiên sáng'], ['21:00', 'Phiên tối']].forEach(function (slot, k) {
        var time = k === 0 ? state.settings.remA : state.settings.remB;
        var h = time.slice(0, 2), m = time.slice(3, 5);
        var start = dt(d) + h + m + '00';
        var endH = pad((parseInt(h, 10) + 1) % 24);
        var end = dt(d) + endH + m + '00';
        out.push('BEGIN:VEVENT', 'UID:gdct1-' + d + '-' + k + '@so-on-gdct1', 'DTSTAMP:' + stamp, 'DTSTART;TZID=Asia/Ho_Chi_Minh:' + start, 'DTEND;TZID=Asia/Ho_Chi_Minh:' + end, 'SUMMARY:' + escICS('Ôn GDCT1 — ' + slot[1]), 'DESCRIPTION:' + escICS('Mở Sổ Ôn GDCT1, hoàn thành ' + slot[1].toLowerCase() + ' trước 12.11.2026.'), 'BEGIN:VALARM', 'TRIGGER:-PT10M', 'ACTION:DISPLAY', 'DESCRIPTION:' + escICS('Sắp tới giờ ' + slot[1].toLowerCase() + ' — Sổ Ôn GDCT1'), 'END:VALARM', 'END:VEVENT');
      });
    }
    out.push('END:VCALENDAR');
    return out.join('\r\n');
  }

  /* ---------------- notifications ---------------- */
  var remTimers = [];
  function scheduleReminders() {
    remTimers.forEach(clearTimeout);
    remTimers = [];
    if (!state.settings.remOn) return;
    var now = new Date();
    [state.settings.remA, state.settings.remB].forEach(function (hm, idx) {
      var parts = hm.split(':');
      var t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(parts[0], 10), parseInt(parts[1], 10), 0);
      if (t <= now) t.setDate(t.getDate() + 1);
      var ms = t - now;
      if (ms < 0 || ms > 86400000) return;
      remTimers.push(setTimeout(function () {
        var log = state.logs[today()];
        if (!log || !log.goalMet) notify('Sổ Ôn GDCT1', 'Đã ' + hm + ' — mục tiêu hôm nay chưa xong.');
        scheduleReminders();
      }, ms));
    });
  }

  function notify(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      toast(body);
      return;
    }
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function (reg) {
        if (reg.showNotification) reg.showNotification(title, { body: body, tag: 'gdct1-reminder', icon: 'icons/icon-192.png' });
        else new Notification(title, { body: body });
      }).catch(function () {
        try { new Notification(title, { body: body }); } catch (e) { toast(body); }
      });
    } else {
      try { new Notification(title, { body: body }); } catch (e) { toast(body); }
    }
  }

  /* ---------------- render ---------------- */
  function render() {
    var route = currentRoute();
    var app = $('#app');
    if (!app) return;
    if (route === 'study') app.innerHTML = viewStudy();
    else if (route === 'done') app.innerHTML = viewDone();
    else if (route === 'library') app.innerHTML = viewLibrary();
    else if (route === 'check') app.innerHTML = viewCheck();
    else if (route === 'stats') app.innerHTML = viewStats();
    else if (route === 'settings') app.innerHTML = viewSettings();
    else if (route === 'exam-setup') app.innerHTML = viewExamSetup();
    else app.innerHTML = viewToday();
    renderNav(route);
    afterRender(route);
  }

  function afterRender(route) {
    if (route === 'library') {
      var inp = $('#libSearch');
      if (inp) {
        inp.addEventListener('input', function () {
          S.query = inp.value;
          clearTimeout(afterRender._t);
          afterRender._t = setTimeout(function () {
            render();
            var i2 = $('#libSearch');
            if (i2) { i2.focus(); i2.setSelectionRange(i2.value.length, i2.value.length); }
          }, 220);
        });
      }
    }
    if (route === 'settings') {
      var g = $('#setGoal'); if (g) g.onchange = function () { state.settings.goal = +g.value; save(); render(); toast('Đã lưu mục tiêu ngày.'); };
      var sz = $('#setSize'); if (sz) sz.onchange = function () { state.settings.sessionSize = +sz.value; save(); render(); toast('Đã lưu số câu mỗi phiên.'); };
      var ro = $('#setRemOn'); if (ro) ro.onclick = function () { state.settings.remOn = !state.settings.remOn; save(); render(); scheduleReminders(); };
      var ra = $('#setRemA'); if (ra) ra.onchange = function () { state.settings.remA = ra.value || '08:30'; save(); scheduleReminders(); toast('Giờ nhắc sáng: ' + state.settings.remA); };
      var rb = $('#setRemB'); if (rb) rb.onchange = function () { state.settings.remB = rb.value || '21:00'; save(); scheduleReminders(); toast('Giờ nhắc tối: ' + state.settings.remB); };
      bindFile('#keyFile2');
      $('#importFile').onchange = function (e) {
        var f = e.target.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () { importBackup(r.result); };
        r.readAsText(f);
      };
    }
    if (route === 'check') bindFile('#keyFile');
    if (route === 'study' && S.study && S.study.exam) {
      var el = $('#examTimer');
      if (el) {
        var started = S.study.startedAt;
        var tick = function () {
          var s = Math.floor((Date.now() - started) / 1000);
          var m = Math.floor(s / 60);
          var ss = s % 60;
          var node = $('#examTimer');
          if (node) node.textContent = String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
        };
        tick();
        clearInterval(afterRender._timer);
        afterRender._timer = setInterval(tick, 1000);
      }
    }
  }

  function bindFile(sel) {
    var el = $(sel);
    if (!el) return;
    el.onchange = function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () { importAnswerText(r.result, f.name); };
      r.readAsText(f);
      e.target.value = '';
    };
  }

  /* ---------------- events ---------------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');
    var id = el.getAttribute('data-id');

    switch (act) {
      case 'start-today': startToday(+el.getAttribute('data-session')); break;
      case 'start-mode': startMode(el.getAttribute('data-mode')); break;
      case 'start-free': startMode('free'); break;
      case 'exam-setup': nav('exam-setup'); break;
      case 'start-exam': startExam(+el.getAttribute('data-n')); break;
      case 'go-check': S.checkFilter = 'none'; nav('check'); break;
      case 'pick': pickOption(+el.getAttribute('data-i')); break;
      case 'self': selfAssess(el.getAttribute('data-good') === '1'); break;
      case 'next': nextCard(); break;
      case 'prev': if (S.study && S.study.i > 0) { S.study.i--; S.study.selfDone = false; render(); } break;
      case 'exit-study': openExitSheet(); break;
      case 'confirm-exit': closeSheet(); S.study = null; nav('today'); break;
      case 'confirm-submit': closeSheet(); submitExam(); break;
      case 'toggle-flag': {
        if (!id) { if (S.study) { var qq = qById(S.study.ids[S.study.i]); if (qq) id = qq.id; } }
        if (!id) break;
        var i = state.flags.indexOf(id);
        if (i === -1) state.flags.push(id); else state.flags.splice(i, 1);
        save(); render(); toast(i === -1 ? 'Đã đánh dấu câu này.' : 'Đã bỏ đánh dấu.');
        break;
      }
      case 'open-question': openQuestionSheet(id); break;
      case 'open-lookup': openLookupSheet(id); break;
      case 'study-one': closeSheet(); startStudy([id], { mode: 'single' }); break;
      case 'close-sheet': closeSheet(); break;
      case 'filter': S.filter = el.getAttribute('data-filter'); render(); break;
      case 'cfilter': S.checkFilter = el.getAttribute('data-filter'); render(); break;
      case 'set-answer-temp': {
        S.lookupPick = +el.getAttribute('data-i');
        $$('#lookupOpts .opt').forEach(function (o) { o.classList.remove('is-selected'); });
        el.classList.add('is-selected');
        break;
      }
      case 'save-answer': {
        if (S.lookupPick == null) { toast('Chọn một phương án trước khi lưu.'); break; }
        var note = $('#lookupNote') ? $('#lookupNote').value.trim() : '';
        state.overrides[id] = { correctIndex: S.lookupPick, explanation: note, confirmedAt: new Date().toISOString() };
        save(); closeSheet(); render(); toast('Đã lưu đáp án cho ' + id.toUpperCase() + '.');
        break;
      }
      case 'clear-answer': {
        delete state.overrides[id];
        save(); closeSheet(); render(); toast('Đã bỏ đáp án bạn xác nhận.');
        break;
      }
      case 'copy-q': {
        var qq2 = qById(id);
        if (qq2) copyText(qq2.question + '\n' + qq2.options.map(function (o, k) { return LETTERS[k] + '. ' + o; }).join('\n')).then(function () { toast('Đã sao chép câu hỏi.'); });
        break;
      }
      case 'download-sample': sampleCSV(); break;
      case 'export-answers': exportAnswers(); break;
      case 'export-data': exportData(); break;
      case 'ics': download('gdct1-lich-on-' + today() + '.ics', buildICS(), 'text/calendar;charset=utf-8'); toast('Đã xuất lịch .ics.'); break;
      case 'notify': {
        if (!('Notification' in window)) { toast('Trình duyệt này không hỗ trợ thông báo.'); break; }
        Notification.requestPermission().then(function (p) {
          state.settings.notif = p === 'granted';
          save(); render();
          toast(p === 'granted' ? 'Đã bật thông báo khi app đang mở.' : 'Bạn chưa cấp quyền thông báo.');
        });
        break;
      }
      case 'install': {
        if (S.installEvent) { S.installEvent.prompt(); S.installEvent = null; }
        else toast('Dùng menu trình duyệt → “Thêm vào màn hình chính”.');
        break;
      }
      case 'reset': {
        if (confirm('Xoá toàn bộ tiến độ, chuỗi và lịch sử học? Đáp án bạn đã nhập vẫn được giữ.')) {
          state.prog = {}; state.logs = {}; state.flags = []; state.plan = null;
          ensurePlan(); save(); render(); toast('Đã đặt lại tiến độ.');
        }
        break;
      }
      case 'back-today': nav('today'); break;
    }
  });

  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    var overlay = $('#overlay');
    if (overlay) {
      if (e.key === 'Escape') { e.preventDefault(); closeSheet(); }
      return;
    }
    if (currentRoute() !== 'study' || !S.study) return;
    var k = e.key;
    if (/^[1-4]$/.test(k)) { e.preventDefault(); pickOption(+k - 1); }
    else if (/^[a-dA-D]$/.test(k)) { e.preventDefault(); pickOption('abcd'.indexOf(k.toLowerCase())); }
    else if (k === 'Enter') { e.preventDefault(); nextCard(); }
    else if (k === 'ArrowLeft') { e.preventDefault(); if (S.study.i > 0) { S.study.i--; S.study.selfDone = false; render(); } }
    else if (k === 'ArrowRight') { e.preventDefault(); nextCard(); }
    else if (k === 'Escape') { e.preventDefault(); openExitSheet(); }
  });

  window.addEventListener('hashchange', function () {
    render();
    window.scrollTo(0, 0);
  });

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    S.installEvent = e;
  });

  /* ---------------- boot ---------------- */
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  render();
  scheduleReminders();

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) scheduleReminders();
  });
})();
