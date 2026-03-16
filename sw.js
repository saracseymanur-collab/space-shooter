const CACHE = 'space-shooter-v2';
const ASSETS = ['./index.html', './manifest.json', './ASSETS/spaceship.png', './ASSETS/enemy1.png', './ASSETS/enemy2.png', './ASSETS/enemy3.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
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
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
