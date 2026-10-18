// 离线兜底：网络正常时取最新，断网或链接失效时回落本地缓存
// 【重要】每次改版必须同步升级 CACHE 版本号，否则手机上会一直看到旧页面
var CACHE = 'pg-v2';
var ASSETS = ['./index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).catch(function () {})
  );
});

// 激活时清掉所有旧版本缓存，保证用户拿到的是最新版
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }
      return caches.match(req).then(function (c) {
        return c || caches.match('./index.html');
      });
    }).catch(function () {
      return caches.match(req).then(function (c) {
        return c || caches.match('./index.html');
      });
    })
  );
});
