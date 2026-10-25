/* Sổ Ôn GDCT1 — landing scroll/micro motion. GSAP loads after `load`, never blocks LCP. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var conn = navigator.connection || {};
  var gsap = null;
  var ScrollTrigger = null;
  var mm = null;
  var booting = false;
  var initialized = false;

  function tokenSec(name) {
    var raw = getComputedStyle(root).getPropertyValue(name).trim();
    var ms = parseFloat(raw);
    return isFinite(ms) ? ms / 1000 : 0.32;
  }
  var T = {
    160: tokenSec('--mo-160'),
    320: tokenSec('--mo-320')
  };

  function clearReveals() {
    if (mm) { mm.revert(); mm = null; }
    if (ScrollTrigger) {
      ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    }
    if (gsap) {
      gsap.set('[data-reveal]', { clearProps: 'all' });
    }
  }

  function init() {
    gsap = window.gsap;
    ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger || initialized) return;
    initialized = true;
    gsap.registerPlugin(ScrollTrigger);

    var revealEls = gsap.utils.toArray('[data-reveal]');
    var vh = window.innerHeight || 800;
    revealEls.forEach(function (el) {
      if (el.getBoundingClientRect().top > vh) {
        gsap.set(el, { y: 10, opacity: 0 });
      }
    });

    if (revealEls.length) {
      ScrollTrigger.batch(revealEls, {
        start: 'top 85%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: T[320],
            stagger: 0.06,
            ease: 'power2.out',
            overwrite: true
          });
        }
      });
      document.addEventListener('focusin', function (event) {
        var target = event.target;
        var el = target && target.closest ? target.closest('[data-reveal]') : null;
        if (el && parseFloat(getComputedStyle(el).opacity) < 0.99) {
          gsap.to(el, { opacity: 1, y: 0, duration: T[160], overwrite: true });
        }
      });
    }

    mm = gsap.matchMedia();
    mm.add('(min-width: 761px) and (pointer: fine)', function () {
      var bar = document.querySelector('.margin-progress i');
      if (bar) {
        gsap.to(bar, {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { start: 0, end: 'max', scrub: 0.2 }
        });
      }
      var shots = gsap.utils.toArray('.preview-frame img');
      if (shots.length) {
        gsap.to(shots, {
          y: -8,
          ease: 'none',
          scrollTrigger: { trigger: '#trong-so', start: 'top bottom', end: 'bottom top', scrub: 0.4 }
        });
      }
    });

    function refresh() {
      ScrollTrigger.refresh();
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refresh);
    }
    gsap.utils.toArray('.preview-frame img').forEach(function (img) {
      if (!img.complete) img.addEventListener('load', refresh, { once: true });
    });
    refresh();
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Không tải được ' + src)); };
      document.head.appendChild(script);
    });
  }

  function boot() {
    if (booting || initialized) return;
    if ((reduce && reduce.matches) || conn.saveData) return;
    booting = true;
    loadScript('./assets/vendor/gsap.min.js')
      .then(function () { return loadScript('./assets/vendor/ScrollTrigger.min.js'); })
      .then(init)
      .catch(function () { booting = false; });
  }

  if (reduce && reduce.addEventListener) {
    reduce.addEventListener('change', function (event) {
      if (event.matches) clearReveals();
      else boot();
    });
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot, { once: true });
})();
