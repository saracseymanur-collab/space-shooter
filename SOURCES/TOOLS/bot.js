// Zorluk ölçüm botu — kullanım: oyunu yerelde sun, sayfada bu dosyayı <script> ile yükle,
// sonra konsolda: measure([1,2,3,4,5], 16)  → bölüm başına ortalama can kaybı (lives=99 ile tüm bölüm oynanır)
// İnsan benzeri bot: her `react` karede bir karar verir, `miss` olasılıkla o kararda tehlikeleri görmez,
// bir kararda en fazla bir şerit kayar (tek swipe). Dönen: bölüm başına hasar sayısı ve sebepleri.
window.requestAnimationFrame = () => 0;
Object.keys(FIRST_SEEN).forEach(k => seenIntro[k] = 1); // sayfa açıkken yüklenince de açıklama kartları dondurmasın
try { localStorage.setItem('ss_seen', JSON.stringify(Object.fromEntries(Object.keys(FIRST_SEEN).map(k => [k, 1])))); } catch (e) {}
const _origDamage = damagePlayer;
let HITS = [];
damagePlayer = function (cause) { if (!player.dead && player.shieldTimer <= 0 && !(player.invuln > 0)) HITS.push(cause); return _origDamage(cause); };

function laneDanger(l, horizon, blind) { // isabet edecek mermi/kaya/lazer: kesin kaçış önceliği
  const lx = LANE_CENTERS[l]; let d = 0;
  // büyük, ekranı kaplayan uyarılar (lazer, süpürme) "dalgınlıkta" bile görülür; dalgınlık sadece mermi/kaya kaçırmak
  for (const L of lasers) if (L.lane === l) d += 1e6;
  if (typeof bolts !== 'undefined') for (const B of bolts) if (B.lane === l && B.t > 0) d += 1e6;
  if (typeof ccWallLanes !== 'undefined' && ccWallLanes().includes(l)) d += 1e6; // L15 güvenlik duvarı
  if (typeof ccWallLanes !== 'undefined' && boss && boss.zone === 3 && boss.cState === 'wall' && boss.nextSafe >= 0 && l === boss.safe) d += 2e5; // yakında yanacak // L12 şimşek: parlayan bulut görülür
  for (const e of enemies) if (e.sweeper && (e.sState === 'warn' || e.sState === 'sweep') && Math.min(e.from, e.to) <= l && l <= Math.max(e.from, e.to)) {
    if (e.sState === 'warn' && horizon < 20) continue; // uyarı sırasında içinden geçmek güvenli (geçiş kontrolü kısa ufukla çağrılır)
    d += e.sState === 'sweep' ? 1e6 : 2e5; // süpürülecek iki şerit
  }
  if (boss && boss.zone === 1 && boss.lane === l) { // Dev Dalış: işaret/kilit/dalış şeridi
    if (boss.rState === 'dive' || (boss.rState === 'dmark' && boss.rT < (boss.rT0 || 20) * 0.45)) d += 1e6; // dolumun son kısmı = eski kilit
    else if (boss.rState === 'dmark' && horizon >= 20) d += 2e5;
  }
  if (typeof tunnelSegs !== 'undefined' && tunnelSpd > 0) { // L8: bu şerit ufukta duvar mı
    for (let k = 0; k <= horizon; k += 4) { const g = tunnelAt(player.y - tunnelSpd * k); if (g && !g.open.includes(l)) { d += 1e5 / (1 + k); break; } }
  }
  if (typeof drills !== 'undefined' && drillSpd > 0) for (const q of drills) { // L8: matkap oyuncunun hizasına geldiğinde bu şeride uzanmış mı
    const t = (player.y - q.y) / drillSpd; if (t < -10 || t > horizon) continue;
    let len = 0; for (const k of [t - 8, t, t + 8]) len = Math.max(len, drillLen(q, k));
    if (q.side === 0 ? lx - 16 < len + 16 : lx + 16 > W - len - 16) d += 1e5 / (1 + Math.max(0, t));
  }
  if (typeof drifters !== 'undefined') for (const q of drifters) { // L9: patlayıcı şeridi
    if (q.type !== 'mine' || q.lane !== l || q.y > player.y + 40) continue;
    const t = (player.y - q.y) / (convoySpd || 3); if (t <= horizon * 2) d += 1e5 / (1 + Math.max(0, t));
  }
  if (typeof severOn !== 'undefined' && currentLevel === 19 && severOn() && !severReach(l)) d += 1e6; // L19: açık perdenin öbür yanı
  if (typeof ringRows !== 'undefined') for (const r of ringRows) { // L17 enkaz halkası: boşluğun varacağı şerit (sabit hızla kaydığı için öngörülebilir)
    if (r.hit || r.end === l) continue;
    const t = (player.y - r.y) / r.spd; if (t <= horizon * 2.5) d += 1e5 / (1 + Math.max(0, t));
  }
  if (typeof nebMines !== 'undefined') for (const q of nebMines) { // L11: sadece radarda görülmüş mayınları bilir (hilesiz)
    if (!q.known || q.lane !== l || q.y > player.y + 40) continue;
    const t = (player.y - q.y) / q.spd; if (t <= horizon * 2) d += 1e5 / (1 + Math.max(0, t));
  }
  if (boss && boss.zone === 2 && boss.lane === l && (boss.tState === 'mark' || boss.tState === 'dive' || boss.tState === 'strike')) d += 1e6; // L10: matkap dalışı
  if (blind) return d;
  for (const b of eBullets) { const vy = b.vy || 4; if (vy <= 0) continue; const t = (player.y - b.y) / vy; if (t < -8 || t > horizon) continue;
    const xAt = b.x + (b.vx || 0) * Math.max(0, t); if (Math.abs(xAt - lx) < (b.big ? 44 : 34)) d += 1e5 / (1 + Math.max(0, t)); }
  for (const a of asteroids) { const t = (player.y - a.y) / (a.speed || 2); if (t < -14 || t > horizon) continue;
    if (a.dig && a.type === 'normal') continue; // L8: kırılır kaya vurulur, kaçılmaz
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
  if (typeof bolts !== 'undefined') for (const B of bolts) if (B.lane === l && B.t > 0 && B.t > B.warn - t1 && B.t < B.warn + B.fire - t0) return true;
  if (typeof ccWallLanes !== 'undefined' && ccWallLanes().includes(l)) return true;
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
  if (boss && boss.zone === 3 && typeof coreGapLane !== 'undefined') { if (coreOpenFor(l)) v += 400; else if (!boss.twoRings && Math.round(boss.gap1 ?? 1) === l) v += 150; else if (boss.twoRings && Math.round(((boss.gap1 ?? 1) + (boss.gap2 ?? 1)) / 2) === l) v += 150; } // L15: boşluk(lar)ın baktığı şerit
  else if (boss && Math.abs(boss.x - LANE_CENTERS[l]) < 80) v += boss.shielded === false ? 400 : 60; // açık boss = öncelik (insan gibi)
  for (const p of powerups) if (nearestLane(p.x) === l) v += 25;
  if (typeof streamLane !== 'undefined' && currentLevel === 14 && l === streamLane) v += 120; // L14: akışta kal
  if (typeof bombDrops !== 'undefined') for (const q of bombDrops) if (nearestLane(q.x) === l) v += 300; // L10: bomba topla
  if (typeof haulers !== 'undefined') for (const h of haulers) if (!h.leaving && h.lane === l) v += 800; // L9: yük gemisinin şeridine git
  { // L8: en yakın sıradaki kırılır kayanın şeridine git
    let near = null; for (const a of asteroids) if (a.dig && a.y < player.y - 30 && (!near || a.y > near.y)) near = a;
    if (near) for (const a of asteroids) if (a.dig && a.type === 'normal' && Math.abs(a.y - near.y) < 20 && nearestLane(a.x) === l) v += 1000;
  }
  // L7: sıradaki tarama yaklaşırken o anda gölgesi üstünde olacak kayanın şeridine git
  if (typeof stealthScans !== 'undefined' && stealthScans.length) {
    const c = stealthScans.find(s => !s.done);
    if (c && c.t < 90) for (const a of asteroids) { const y = a.y + a.speed * c.t;
      if (a.amb && nearestLane(a.x) === l && y < player.y - 40 && player.y - y < SHADOW_LEN) v += 1000; }
  }
  return v;
}
function runLevel(level, prof, maxFrames = 9000) { // insanlar gibi tek kararda iki şerit de kayabilir
  startLevel(level); briefing = false; countdown = 0; introCard = null; lives = 99; HITS = [];
  let f = 0, next = 0, traps = 0, wasTrapped = false;
  while (f < maxFrames && state === 'play') {
    introCard = null; briefing = false;
    const tr = trapped(); if (tr && !wasTrapped) traps++; wasTrapped = tr;
    if (f >= next) {
      const rk = typeof riftScaleCur !== 'undefined' && currentLevel === 16 ? riftScaleCur : 1; // L16: zaman hızlanınca insan tepkisi kare olarak uzar
      next = f + Math.round((prof.react + Math.floor(Math.random() * prof.react * 0.5)) * rk);
      const blind = Math.random() < prof.miss, cur = player.targetLane;
      let best = cur, bestS = -1e12;
      for (const l of [0, 1, 2]) {
        let s = laneValue(l) - laneDanger(l, prof.horizon, blind) - (l !== cur ? 5 : 0);
        if (Math.abs(l - cur) === 2) s -= laneDanger(1, 10, blind) + 10;
        if (s > bestS) { bestS = s; best = l; }
      }
      player.targetLane = best;
      if (typeof titanCoreOpen !== 'undefined' && titanCoreOpen() && titanAligned()) useTitanBomb(); // L10: hizadayken ve çekirdek açıkken bomba
      if (typeof coreOpenFor !== 'undefined' && currentLevel === 15 && boss && coreOpenFor(playerLaneNow())) useTitanBomb(); // L15: boşluk bakarken bomba
      if (typeof gates !== 'undefined' && currentLevel === 15 && !boss) { // L15: kapı kapalıyken atıl (tepki gecikmeli)
        const g = gates.filter(g => !g.passed && g.y > player.y - DASH_RANGE + 20 && g.y > HUD_H).sort((a, b) => b.y - a.y)[0];
        if (g && !gateOn(g)) { const c = g.t % (g.on + g.off); if (g.off - (c - g.on) > 13) coreDash(); }
      }
      if (typeof drifters !== 'undefined' && convoySpd > 0) { // L9: şeritte mermiye ilk değecek şey kapsül / patlayıcıysa ateşi kes
        const low = arr => arr.filter(q => nearestLane(q.x) === best && q.y < player.y && q.y > 60).reduce((m, q) => Math.max(m, q.y), -1e9);
        if ((low(drifters) > low(enemies)) !== fireHold) toggleFire();
      }
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
  // pro = kullanıcıya en yakın (2026-11-04 kalibrasyon: kullanıcı "kolay" dediği sürümde pro 0–0.7 can kaybediyordu).
  // Kısa ufuk önemli: iyi oyuncu son ana kadar ateş edip son anda kaçar; uzun ufuk boş şeritte bekletip düşmanları kaçırır.
  pro:    { react: 10, miss: 0,    horizon: 35 },
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
