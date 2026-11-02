const CACHE = 'space-shooter-v4';
const ASSETS = ['./index.html', './manifest.json', './ASSETS/spaceship.png', './ASSETS/enemy1.png', './ASSETS/enemy2.png', './ASSETS/enemy3.png', './ASSETS/boss.png', './icon-192.png', './icon-512.png', './ASSETS/cards/deep-space.jpg', './ASSETS/cards/asteroid-belt.jpg', './ASSETS/cards/nebula.jpg', './ASSETS/cards/black-hole.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }) // HTTP önbelleğini atla, her açılışta güncel sürüm
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
