/* Sổ Ôn GDCT1 — app motion. GSAP 3.15 core, subtle, route/question gated. */
(function () {
  'use strict';

  var gsap = window.gsap;
  var app = document.getElementById('app');
  if (!gsap || !app) return;

  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var ctx = null;
  var lastRoute = null;
  var lastQid = null;
  var lastFeedback = null;
  var barWidths = [];

  function sec(name, fallback) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var ms = parseFloat(raw);
    return isFinite(ms) ? ms / 1000 : fallback;
  }
  var T = {
    160: sec('--mo-160', 0.16),
    180: sec('--mo-180', 0.18),
    200: sec('--mo-200', 0.2),
    220: sec('--mo-220', 0.22),
    320: sec('--mo-320', 0.32)
  };

  function reduced() { return !!(reduce && reduce.matches); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function textOf(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120); }

  var motion = {
    beforeRender: function () {
      barWidths = [];
      each(document.querySelectorAll('.bar i, .track i'), function (el) {
        barWidths.push(el.offsetWidth);
      });
      if (ctx) { ctx.revert(); ctx = null; }
    },

    enter: function (route, qid) {
      if (reduced()) return;
      var routeChanged = route !== lastRoute;
      var qChanged = qid !== lastQid;
      lastRoute = route;
      lastQid = qid;

      var view = app.querySelector('.view');
      var question = app.querySelector('.q-wrap');
      var feedback = app.querySelector('.feedback');
      var bars = app.querySelectorAll('.bar i, .track i');
      var cells = routeChanged && route === 'stats' ? app.querySelectorAll('.cal-cell') : [];
      var rows = [];
      if (routeChanged && (route === 'library' || route === 'check')) {
        rows = Array.prototype.slice.call(
          app.querySelectorAll(route === 'library' ? '.lib-row' : '.check-row'), 0, 10
        );
      }
      var feedbackKey = feedback && route === 'study' ? qid + '|' + textOf(feedback) : null;
      var feedbackNew = !!feedbackKey && feedbackKey !== lastFeedback;
      if (feedbackNew) lastFeedback = feedbackKey;

      ctx = gsap.context(function () {
        if (view && routeChanged) {
          gsap.set(view, { clearProps: 'transform' });
          gsap.fromTo(view, { opacity: 0 }, { opacity: 1, duration: T[180], ease: 'power2.out' });
        }
        if (question && route === 'study' && qChanged) {
          gsap.fromTo(question, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: T[180], ease: 'power2.out' });
        }
        if (feedbackNew) {
          gsap.fromTo(feedback, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: T[220], ease: 'power2.out' });
          var mark = feedback.querySelector('.fb-head svg path');
          if (mark) {
            try {
              var len = mark.getTotalLength();
              gsap.fromTo(mark,
                { strokeDasharray: len, strokeDashoffset: len },
                { strokeDashoffset: 0, duration: T[220], ease: 'power1.out' }
              );
            } catch (err) {
              /* keep the mark fully drawn */
            }
          }
        }
        each(bars, function (el, i) {
          var finalWidth = el.offsetWidth;
          if (!finalWidth) return;
          var prev = routeChanged ? 0 : barWidths[i];
          if (prev == null || Math.abs(prev - finalWidth) < 1) return;
          gsap.fromTo(el,
            { scaleX: Math.max(0, Math.min(1, prev / finalWidth)), transformOrigin: 'left center' },
            { scaleX: 1, duration: T[320], ease: 'power2.out' }
          );
        });
        if (cells.length) {
          gsap.fromTo(cells, { opacity: 0 }, {
            opacity: 1,
            duration: T[180],
            stagger: { each: 0.008, amount: 0.15 },
            ease: 'power1.out'
          });
        }
        if (rows.length) {
          gsap.fromTo(rows, { opacity: 0, y: 4 }, {
            opacity: 1,
            y: 0,
            duration: T[200],
            stagger: 0.025,
            ease: 'power2.out'
          });
        }
      }, app);
    },

    sheetOpen: function (overlay, sheet) {
      if (reduced()) return;
      if (overlay) gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: T[160], ease: 'power1.out' });
      if (sheet) gsap.fromTo(sheet, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: T[200], ease: 'power2.out' });
    },

    toast: function (el) {
      if (!el || reduced()) return;
      gsap.fromTo(el, { y: 6 }, { y: 0, duration: T[160], ease: 'power2.out' });
    },

    clear: function () {
      if (ctx) { ctx.revert(); ctx = null; }
      var nodes = '#app, #app *, #overlay, #overlay *, #toast';
      gsap.killTweensOf(nodes);
      gsap.set(nodes, { clearProps: 'opacity,transform' });
    }
  };

  window.GDCTMotion = motion;

  if (reduce && reduce.addEventListener) {
    reduce.addEventListener('change', function (event) {
      if (event.matches) {
        lastRoute = null;
        lastQid = null;
        lastFeedback = null;
        motion.clear();
      }
    });
  }
})();
