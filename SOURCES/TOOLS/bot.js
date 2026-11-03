// Zorluk ölçüm botu — kullanım: oyunu yerelde sun, sayfada bu dosyayı <script> ile yükle,
// sonra konsolda: measure([1,2,3,4,5], 16)  → bölüm başına ortalama can kaybı (lives=99 ile tüm bölüm oynanır)
// İnsan benzeri bot: her `react` karede bir karar verir, `miss` olasılıkla o kararda tehlikeleri görmez,
// bir kararda en fazla bir şerit kayar (tek swipe). Dönen: bölüm başına hasar sayısı ve sebepleri.
window.requestAnimationFrame = () => 0;
try { localStorage.setItem('ss_seen', JSON.stringify(Object.fromEntries(Object.keys(FIRST_SEEN).map(k => [k, 1])))); } catch (e) {}
const _origDamage = damagePlayer;
let HITS = [];
damagePlayer = function (cause) { if (!player.dead && player.shieldTimer <= 0) HITS.push(cause); return _origDamage(cause); };

function laneDanger(l, horizon, blind) { // isabet edecek mermi/kaya/lazer: kesin kaçış önceliği
  const lx = LANE_CENTERS[l]; let d = 0;
  // büyük, ekranı kaplayan uyarılar (lazer, süpürme) "dalgınlıkta" bile görülür; dalgınlık sadece mermi/kaya kaçırmak
  for (const L of lasers) if (L.lane === l) d += 1e6;
  for (const e of enemies) if (e.sweeper && (e.sState === 'warn' || e.sState === 'sweep') && Math.min(e.from, e.to) <= l && l <= Math.max(e.from, e.to)) {
    if (e.sState === 'warn' && horizon < 20) continue; // uyarı sırasında içinden geçmek güvenli (geçiş kontrolü kısa ufukla çağrılır)
    d += e.sState === 'sweep' ? 1e6 : 2e5; // süpürülecek iki şerit
  }
  if (blind) return d;
  for (const b of eBullets) { const vy = b.vy || 4; if (vy <= 0) continue; const t = (player.y - b.y) / vy; if (t < -8 || t > horizon) continue;
    const xAt = b.x + (b.vx || 0) * Math.max(0, t); if (Math.abs(xAt - lx) < (b.big ? 44 : 34)) d += 1e5 / (1 + Math.max(0, t)); }
  for (const a of asteroids) { const t = (player.y - a.y) / (a.speed || 2); if (t < -14 || t > horizon) continue;
    const xAt = a.x + (a.vx || 0) * Math.max(0, t); // kaya parçaları çapraz kayar
    if (Math.abs(xAt - lx) < a.size * 0.9 + 26) d += 1e5 / (1 + Math.max(0, t)); }
  for (const e of enemies) if (e.rammer && (e.rState === 'aim' || e.rState === 'dash') && e.ramLane === l && e.y < player.y + 30)
    d += 1e5 / (1 + Math.max(0, (player.y - e.y) / 13 - (e.rState === 'aim' ? 0 : 0))); // dalacak kamikaze
  return d;
}
// Kapana kısılma: oyuncunun şeridi kısa sürede vurulacakken, zamanında ulaşılabilecek güvenli şerit yok mu?
// Komşu şerit ~10 karede, iki uzaktaki ~20 karede ulaşılır; yol üstündeki orta şerit geçiş anında güvenli olmalı.
function hitWithin(l, t0, t1) {
  const lx = LANE_CENTERS[l];
  for (const b of eBullets) { const vy = b.vy || 4; if (vy <= 0) continue; const t = (player.y - b.y) / vy; if (t < t0 || t > t1) continue;
    if (Math.abs(b.x + (b.vx || 0) * Math.max(0, t) - lx) < (b.big ? 44 : 30)) return true; }
  for (const a of asteroids) { const t = (player.y - a.y) / (a.speed || 2); if (t < t0 || t > t1) continue;
    if (Math.abs(a.x + (a.vx || 0) * Math.max(0, t) - lx) < a.size * 0.9 + 22) return true; }
  for (const L of lasers) if (L.lane === l && L.t > L.warn - t1) return true;
  return false;
}
function trapped() {
  const cur = playerLaneNow();
  if (!hitWithin(cur, 0, 18)) return false;               // şu an tehlike yok
  for (const l of [0, 1, 2]) {
    if (l === cur) continue;
    const d = Math.abs(l - cur), arrive = d * 10;
    if (d === 2 && hitWithin(1, 4, 14)) continue;         // geçerken ortada vurulur
    if (!hitWithin(l, arrive - 4, arrive + 30)) return false; // zamanında ulaşılabilir güvenli şerit var
  }
  return true;
}
function laneValue(l) {
  let v = 0;
  for (const e of enemies) {
    if (nearestLane(e.x) !== l) continue;
    v += 40 + Math.max(0, e.y) * 0.25 + e.hp * 10;     // aşağıdaki düşman daha acil
  }
  if (boss && Math.abs(boss.x - LANE_CENTERS[l]) < 80) v += 60;
  for (const p of powerups) if (nearestLane(p.x) === l) v += 25;
  return v;
}
function runLevel(level, prof, maxFrames = 9000) { // insanlar gibi tek kararda iki şerit de kayabilir
  startLevel(level); briefing = false; countdown = 0; introCard = null; lives = 99; HITS = [];
  let f = 0, next = 0, traps = 0, wasTrapped = false;
  while (f < maxFrames && state === 'play') {
    introCard = null; briefing = false;
    const tr = trapped(); if (tr && !wasTrapped) traps++; wasTrapped = tr;
    if (f >= next) {
      next = f + prof.react + Math.floor(Math.random() * prof.react * 0.5);
      const blind = Math.random() < prof.miss, cur = player.targetLane;
      let best = cur, bestS = -1e12;
      for (const l of [0, 1, 2]) {
        let s = laneValue(l) - laneDanger(l, prof.horizon, blind) - (l !== cur ? 5 : 0);
        if (Math.abs(l - cur) === 2) s -= laneDanger(1, 10, blind) + 10;
        if (s > bestS) { bestS = s; best = l; }
      }
      player.targetLane = best;
    }
    update(); f++;
  }
  const by = {}; HITS.forEach(c => by[c] = (by[c] || 0) + 1);
  return { level, hits: HITS.length, by, done: state === 'levelcomplete', secs: Math.round(f / 60), traps };
}
// casual ≈ rahat oyuncu, expert ≈ deneyimli (test eden kişi sektör 1'i "çok kolay" bulduğunda expert ≈0 hasar alıyordu)
window.PROFILES = {
  casual: { react: 18, miss: 0.08, horizon: 60 },
  expert: { react: 8,  miss: 0.01, horizon: 80 },
};
window.measure = function (levels, runs) {
  const out = {};
  for (const [name, prof] of Object.entries(PROFILES)) {
    out[name] = {};
    for (const lv of levels) {
      const rs = []; for (let i = 0; i < runs; i++) rs.push(runLevel(lv, prof));
      const causes = {}; rs.forEach(r => Object.entries(r.by).forEach(([k, n]) => causes[k] = (causes[k] || 0) + n));
      out[name][lv] = { traps: +(rs.reduce((a, r) => a + r.traps, 0) / runs).toFixed(2), avgHits: +(rs.reduce((a, r) => a + r.hits, 0) / runs).toFixed(2), maxHits: Math.max(...rs.map(r => r.hits)),
        loseRate3: rs.filter(r => r.hits >= 3).length / runs, done: rs.filter(r => r.done).length + '/' + runs, secs: rs[0].secs, causes };
    }
  }
  return out;
};
