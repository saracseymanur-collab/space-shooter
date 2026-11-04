const CACHE = 'space-shooter-v14';
const ASSETS = ['./index.html', './manifest.json', './ASSETS/spaceship.png', './ASSETS/enemy1.png', './ASSETS/enemy2.png', './ASSETS/enemy3.png', './ASSETS/boss.png', './ASSETS/shields/boss-shield.png', './icon-192.png', './icon-512.png', './ASSETS/cards/deep-space.jpg', './ASSETS/cards/asteroid-belt.jpg', './ASSETS/cards/nebula.jpg', './ASSETS/cards/black-hole.jpg', './ASSETS/backgrounds/deep-space.jpg', './ASSETS/powerups/shield.png', './ASSETS/powerups/triple-shot.png', './ASSETS/powerups/double-shot.png', './ASSETS/powerups/bomb.png', './ASSETS/shots/enemy-shot.png', './ASSETS/backgrounds/asteroid-belt.jpg', './ASSETS/backgrounds/nebula.jpg', './ASSETS/backgrounds/black-hole.jpg', './ASSETS/rocks/rock-small-1.png', './ASSETS/rocks/rock-small-2.png', './ASSETS/rocks/rock-small-3.png', './ASSETS/rocks/rock-medium-1.png', './ASSETS/rocks/rock-medium-2.png', './ASSETS/rocks/rock-medium-3.png', './ASSETS/rocks/rock-large-1.png', './ASSETS/rocks/rock-large-2.png', './ASSETS/rocks/rock-large-3.png'];

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
  const req = e.request;
  if (req.method !== 'GET') return;
  const isPage = req.mode === 'navigate' || /\.(html|json)$/.test(new URL(req.url).pathname) || new URL(req.url).pathname.endsWith('/');
  if (isPage) {
    // Oyun dosyası: önce ağ (her açılışta güncel sürüm), olmazsa önbellek. Hatalı cevap önbelleğe yazılmaz.
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(res => {
          if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(req, clone)); return res; }
          return caches.match(req).then(hit => hit || res);
        })
        .catch(() => caches.match(req))
    );
    return;
  }
  // Resim/ses gibi dosyalar: önce önbellek (hızlı, ağ hatasından etkilenmez), yoksa ağdan al ve sadece başarılıysa kaydet.
  // Dosya değişince sw.js'deki CACHE sürümü artırılır → eski önbellek silinir.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(req, clone)); }
      return res;
    }))
  );
});
