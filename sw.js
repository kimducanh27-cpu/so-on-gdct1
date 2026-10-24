/* Kill-switch for the legacy root-scope service worker. */
var LEGACY_CACHES = ['gdct1-v1', 'gdct1-v2', 'gdct1-v3'];

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.filter(function (key) {
      return LEGACY_CACHES.indexOf(key) !== -1;
    }).map(function (key) {
      return caches.delete(key);
    }));
    try { await self.clients.claim(); } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
  })());
});
