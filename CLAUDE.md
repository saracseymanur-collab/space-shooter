# Space Shooter — proje notları (Claude için)

Mobil (iPhone) için tek dosyalık canvas oyunu. Kullanıcı Türkçe konuşur; yanıtlar Türkçe olmalı.

## Yayın / çalışma akışı
- Oyun: `index.html` (tüm kod), `sw.js` (service worker: sayfa network-first, resim/ses cache-first, hatalı cevap önbelleğe yazılmaz), `manifest.json`.
- Canlı: https://saracseymanur-collab.github.io/space-shooter/ (GitHub Pages, `main` dalı).
- Kullanıcı telefonda test eder: **"gönder" = commit + push**, sonra Pages güncellenene kadar `curl` ile kontrol et (~1-2 dk; 2026-11-04'te GitHub Pages çok yavaştı/takıldı — `api.github.com/repos/saracseymanur-collab/space-shooter/actions/runs` ile durum bakılabilir, push 500 verirse tekrar dene). Deploy "Timeout reached" ile düşerse GitHub o yayını bir süre "in progress" sanıp sonrakileri "Please cancel <sha> first" diye reddeder (2026-11-04 akşam) → bekle, sonra boş commit ile tekrar dene; iptal etmek için Actions/Pages sayfasından kullanıcı yapabilir (gh yok, token yok).
- Yeni asset eklenince `sw.js` içindeki `CACHE` sürümünü artır ve dosyayı `ASSETS` listesine ekle. **Var olan bir görseli değiştirirken dosya adını da değiştir** (ör. `-v2`): telefon eski dosyayı HTTP önbelleğinden alıp yeni önbelleğe yazabiliyor (2026-11-04 boss kalkanında oldu; sw kurulumu artık `cache: 'reload'` kullanıyor).
- Her değişiklikten sonra: script'i ayıklayıp `node --check` ile sözdizimi kontrolü, tarayıcıda görsel kontrol.
- Önizleme: tarayıcı sunucusu ~/Desktop'u okuyamıyor (macOS izni) → oyunu scratchpad'e `rsync` edip `python3 -m http.server` ile oradan sun. Tarayıcı paneli gizliyken rAF yavaşlar; testlerde `update()`'i elle çağır. **Önizleme tarayıcısı eski sayfayı önbellekten açabiliyor → her seferinde `index.html?v=<yeni>` ile aç.** Bot dosyasını (`SOURCES/TOOLS/bot.js`) önizleme klasörüne kopyalamayı unutma.
- Doğrudan boss testi: `?boss=true` (5 dalga atlanır, ilerleme kaydedilmez).
- Commit mesajı sonuna: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Kullanıcı tercihleri (önemli)
- **Büyük değişikliklerden önce planı sırayla anlat, onay al.** Küçük, açıkça istenen düzeltmeler doğrudan yapılabilir.
- **Referans görselleri birebir kopyalama**; sadece stili al, oyunun kendi mekaniklerine uyarla (ör. referanstaki skor paneli bizde yok).
- Skor ve yıldızlar bilinçli olarak **kaldırıldı**; geri ekleme.
- Oklu butonları sevmiyor (PLAY/CONTINUE'da ok yok).
- Görselleri kullanıcı üretir; Claude ölçü/stil yönlendirmesi verir, kırpar/boyutlandırır, oyunda karşılaştırır.

## Oyunun yapısı
- 4 bölge × 5 bölüm = 20 bölüm: Deep Space (1-5), Asteroid Belt (6-10), Nebula (11-15), Black Hole (16-20). Her bölgenin 5. bölümü boss.
- Bölge renkleri `SECTOR_COLORS`; HUD rengi bölgeye göre (`HUD_COL`).
- Bölüm ayarları: `getLevelConfig()` (interval, phantom, fog, ion, gravity, shift2, curveShots, debris…).
- Bölüm başı talimat kartı: `LEVEL_BRIEFS` (başlık + tek cümle + `drawBriefVisual` çizimi), START → 3-2-1 geri sayım.
- İlk karşılaşma açıklamaları: `FIRST_SEEN` (bir kez gösterilir, `ss_seen` localStorage).
- Oyun zamanı `playFrames` (sadece aktif oynanışta ilerler); animasyonlar `frameCount`.
- Kaçış yolu garantisi: `hazardWindows` / `wouldWall` / `pushShot` — üç şeridi aynı anda kapatan engel/mermi çıkmaz.
- Ses: `Sound` modülü (Web Audio, dosyasız): efektler + bölgeye göre ambiyans müzik, MUSIC / SOUND EFFECTS ayrı. iPhone için touchend'de unlock + keep-alive.
- DEV modu (menü sağ alt): tüm bölümler geçici açık, ilerleme kaydedilmez; yanında iki dokunuşlu RESET.
- Yazı tipleri: başlıklar Orbitron (`UI_FONT`), metin Exo 2 (`TEXT_FONT`, `MONO_FONT`).

## Asset klasörleri
- `ASSETS/cards/` menü kartı görselleri, `ASSETS/backgrounds/` oyun arkaplanları (852×1846),
  `ASSETS/rocks/` kaya sprite'ları (3 boyut × 3), `ASSETS/powerups/` güçlendirme rozetleri (256px), `ASSETS/shots/` düşman mermisi.
- `SOURCES/` taslaklar ve eski versiyonlar (ör. `SOURCES/POWERUPS/badge-v1`, `capsule-v1`, `badge-v3`).

## Son durum (2026-11-04, yeni sohbete geçerken)
- **Sektör 1 oynanış olarak bitti, kullanıcı memnun** ("çok iyi oldu"). Sıradaki iş: **görsel geliştirmeler**.
- Görsel iş listesi (öncelik sırası önerildi): 1) Rammer görseli (kullanıcı üretecek — Claude ölçü/stil verdi: diğer düşmanlarla aynı tarz, tepeden, burun aşağı, koçbaşı burun + ön zırh, kırmızı #ff2244, şeffaf ~512px, gölge/parıltı yok) 2) Kalkan görseli (boss metalik halkası beğenilmedi + diğer kalkanlıların kırmızı yayları) 3) Splitter / Burster / Kargo için özel sprite (şu an kodla boyanmış: `getSplitterSprite`, `getSweeperSprite`(Burster), `getRunnerSprite`) 4) Çift atış rozeti (küçükken ‖ gibi) (Boss kenar şeritte ekrandan taşıyor — kullanıcı: sorun değil, kalsın.)
- Sonraki büyük iş: sektör 2-4'ü sektör 1 gibi level level yeniden ele almak (yeni temel + hız + yeni mekanikler).

## Açık işler / geçmiş notlar
- Çift atış (double-shot) rozeti küçükken pause simgesine (‖) benziyor → kullanıcı daha sivri / açılı mermili yeni görsel üretebilir.
- Kullanıcı son sürümü telefonda deniyor; geri bildirimlerini bekle.
- Zorluk ölçüm botu: `SOURCES/TOOLS/bot.js` (casual/expert/**pro** profilleri — kullanıcıya en yakın: pro (react 10, horizon 35); `measure(levels, runs)` → avgHits, loseRate3, traps; gürültü ±0.4, 24-32 koşu kullan). `traps` = oyuncunun şeridi vurulacakken zamanında ulaşılabilir güvenli şerit olmayan anlar (2026-11-03: tüm bölümlerde ≤0.7/koşu, en çok L9).
- Zorluk ayarı: `LEVEL_TUNE` (getLevelConfig, temel = `baseLevelConfig`) + `BOSS_FIRE_MUL` + spawnBoss içindeki `BOSS_HP`.
- Bölüm süresi: `WAVE_SEC` = 10 sn (5 dalga = 50 sn; eskiden 14/70). Zorluk düşmesin diye `WAVE_DENSITY` (0.72) tüm düşman ve özel düşman aralıklarını sıklaştırır; kalanlar `LEVEL_TUNE` iMul ile.
- Yeni temel (kullanıcı sevdi): hızlı iniş (~3 px/kare), şeritte üst üste düşman (`stack`), eski canlar, daha çok düşman. Zırh (`armor`) denendi → "oyun yavaşladı", kaldırıldı. Sektör 1'in L1-L3'ünde var; L4+ henüz eski temelde.
- Kullanıcı dersleri: "hangisini vurayım" (öncelik) mekanikleri çalışmıyor çünkü düşmanlar anında ölüyor; HAREKET/kaçma/kovalama odaklı, sade görünen mekanikler seviliyor. Reddedilenler: formasyon (L2), Shield Link, çapraz atıcı (Spreader), yılan (karışık görünüp kolay + görünmeyen parça hatası), Charger/Mine Layer önerileri.
- Sektör 1 şu an (kullanıcı onayladı L1-L4): L1 kaydır+seyrek ateş, L2 SPLITTERS (turuncu, vurulunca 2 hızlı parça), L3 RAMMERS (kalkanlı kırmızı, şeridini işaretler, dalar; sadece kaçılır; süpürme/sıkışma anında işaretlemez), L4 BURSTERS (mor, üstte durur, burun parlar → 5'li seri → ~1.4 sn dinlenir; kullanıcının fikri), L5: 5 ön dalga = sektör özeti (1 normal, 2 Splitter, 3 Rammer+kargo, 4 Burster, 5 Splitter+Burster). Boss Void Vanguard (2026-11-04 son hali, `updateRecoil`): 3 faz — F1 zincirleme sıçrama (seri at → sıçra ×3, her sıçramada kısa açık, sonra uzun açık; %80'e kadar), F2 Dev Dalış (öfkeli: hızlı dalış, 1/3 yüksekliğe çıkıp tekrar dalar, arada seri; %45'e kadar), F3 Ateş Koridoru (her satırda kayan yol ↔ seri; %10'da son çare). Boss'ta küçük gemi/Rammer/Splitter YOK (kullanıcı kaldırttı). HP 30, ~45-55 sn. F2 dalışları ağırlıklı rastgele şerit (orta 1.5x, aynı şeride üst üste 0.3x), dalıştan sonra ekranın ~1/5'ine çıkar; koridorda boss ortada durur. Rammer'lar mermiyi yutar (genel kural, kullanıcı geri aldırdı).
- Sektör 1 zorluğu (2026-11-04): kullanıcı tüm sektör 1'i "kolay" buldu → bot ölçümüne göre ~+50-80% sıkılaştırıldı (bot ort.: L1 0.6, L2 2.3, L3 3.2, L4 3.3, L5 4.5). Kullanıcı bot "expert" profilinden belirgin şekilde iyi oynuyor; bot sayılarını kullanıcının hissine göre yorumla.
- Oyun hızı `GAME_SPEED` = 1.2 (sadece oynanışta; kullanıcı "yoğunluk yerine hızlandıralım"). Bot kare bazlı → hız etkisini react × GAME_SPEED ile taklit et (pro react 12). Ölçüm (pro, 1.2x): L1 0, L2 0.45, L3 1.1, L4 0.7, L5 2.05 (%30 kayıp, çoğu son çare koridoru). Koridor: 3. faz geçişleri 3 satır, son çare 2 satır.
- Boss akışı: ön dalgalar bitince yeni düşman gelmez; ekrandaki tüm gemiler vurulunca (her karede kontrol) WARNING + boss yukarıdan süzülür (~1.8 sn). `WAVE_DENSITY` 0.66. Boss parıltısı önceden çizilmiş sprite (`getBossGlowSprite`) — her karede shadowBlur iPhone'da takılma yapıyordu.
- (Geçmiş) Boss yardımcı gemileri (`updateBossMinions`) denendi, sonra kaldırıldı — fonksiyon duruyor ama çağrılmıyor.
- Tüm oyunda hasar sonrası 1 sn dokunulmazlık (`player.invuln`): tek hata = tek can. Hunter/Sweeper/Shield Link/Spreader/Snake kodu duruyor ama kullanılmıyor. Mekanik karıştırırken Rammer + başka şerit kapatan şeyler = kaçışsız an riski (kullanıcı şikâyet etti).
- Her bölümde: 3. dalgada Supply Runner (gümüş-beyaz kargo, taşıdığı rozeti düşürür, kaçarsa can gitmez), son dalgada "FINAL WAVE", son düşmanda ağır çekim (`slowMoT`).
- Bölüm ritmi şablonu: 1 ısınma · 2 baskı · 3 risk/ödül (kargo) · 4 nefes+sürpriz · 5 final. Sıradaki bölümleri tek tek bu şablonla ele al; kullanıcı level level konuşmak istiyor.
- Kullanıcı fikri (2026-11-03): ileriki bölgelerde bir bölümü HIZ üzerine kur — her şey daha hızlı akar, sabit duran kaya/engel şeritlerinden kaçarak ilerlersin (koşu/slalom hissi). Uygun yer: sektör 2 (Asteroid Belt, kayalar zaten var) ya da 4.
- AÇIK İŞ: Kalkan görseli — kullanıcı boss'un metalik halka kalkanını görsel olarak beğenmedi (2026-11-04), kendi görselini verecek. Gelince boss kalkanı + oyundaki diğer kalkanlı gemiler (Rammer, Burster/Gunner, Hunter vb. kırmızı yaylar) bu görselle güncellenecek.
- AÇIK İŞ: Rammer (kırmızı, vurulamaz, dalan gemi) için kullanıcı kendi görselini verecek (2026-11-04).
- ÇÖZÜLDÜ (2026-11-04, kullanıcı kararı): Burster ekrandayken o şeride yeni düşman doğmaz, Splitter parçaları o şeride fırlamaz. Eski not: Burster'ın şeridine başka gemi girince oyuncunun mermisi o gemiye takılıyor, Burster'ı dinlenmede öldürmeye vakit kalmıyor. "Şeride gemi girmesin" çok kolaylaştırır; "Burster serisi kendi şeridindeki gemileri vursun" önerisini kullanıcı mantıklı bulmadı. Başka çözüm düşünülecek.
- Kenara konan fikirler: Charger (ateşle iptal edilen şarj; ileriki sektör), Warp Gate (L13 sis yerine aday), boss'u önceki bölümde tanıtma (L9→Titan kayası, L14→drone çağırıcı, L19→tek şerit lazer).
- Müzik (2026-11-03): menü/harita teması, bölüm başına varyasyon (`VARIANTS`: kök kayması + arpej/kalp atışı katmanı), boss teması (`BOSS_PROG`, 4 sn akor + bas ostinato), döngü başına kayan akor sırası, her 20 akorda 2 akorluk nefes arası. Kullanıcı telefonda dinleyecek.
