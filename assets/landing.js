(function () {
  var hash = location.hash;
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (/^#\//.test(hash)) {
    location.replace(new URL('app/' + hash, location.href));
    return;
  }

  if (isStandalone) {
    location.replace(new URL('app/#/today', location.href));
  }
})();
