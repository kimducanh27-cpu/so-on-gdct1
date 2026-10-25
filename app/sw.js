/* Sổ Ôn GDCT1 — offline app shell */
var CACHE = 'gdct1-v8';
var SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/app.css',
  'assets/app.js',
  'assets/motion.js',
  'assets/vendor/gsap.min.js',
  'data/questions.js',
  'data/answers.js',
  'icons/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'assets/fonts/mono-400-normal-latin.woff2',
  'assets/fonts/mono-400-normal-vietnamese.woff2',
  'assets/fonts/mono-500-normal-latin.woff2',
  'assets/fonts/mono-500-normal-vietnamese.woff2',
  'assets/fonts/mono-600-normal-latin.woff2',
  'assets/fonts/mono-600-normal-vietnamese.woff2',
  'assets/fonts/newsreader-300-italic-latin.woff2',
  'assets/fonts/newsreader-300-italic-vietnamese.woff2',
  'assets/fonts/newsreader-300-normal-latin.woff2',
  'assets/fonts/newsreader-300-normal-vietnamese.woff2',
  'assets/fonts/newsreader-400-italic-latin.woff2',
  'assets/fonts/newsreader-400-italic-vietnamese.woff2',
  'assets/fonts/newsreader-400-normal-latin.woff2',
  'assets/fonts/newsreader-400-normal-vietnamese.woff2',
  'assets/fonts/newsreader-500-normal-latin.woff2',
  'assets/fonts/newsreader-500-normal-vietnamese.woff2',
  'assets/fonts/space-400-normal-latin.woff2',
  'assets/fonts/space-400-normal-vietnamese.woff2',
  'assets/fonts/space-500-normal-latin.woff2',
  'assets/fonts/space-500-normal-vietnamese.woff2',
  'assets/fonts/space-600-normal-latin.woff2',
  'assets/fonts/space-600-normal-vietnamese.woff2',
  'assets/fonts/space-700-normal-latin.woff2',
  'assets/fonts/space-700-normal-vietnamese.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('gdct1-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('index.html').then(function (r) { return r || caches.match('./'); });
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var target = './#/today';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
