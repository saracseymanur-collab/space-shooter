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

## Hikâye (2026-11-05 yeni karar)
- Onaylı hikâye belgesi: **`SOURCES/STORY/STORY.md`** (V1.0, tüm panel metinleri İngilizce; altında eski metinler + neden değiştiği). Hikâyeyle ilgili her işte önce onu oku.
- Özet: Astra kayıp koloni sanılıyor → sinyal → kurtarma filosu pusuya düşer, tek sen kalırsın → düşman kim belli değil (Act I) → Astra bağlantısı (Act II, L10 sonu: amblem + "...see you among the stars") → gerçek (Act III, L15 sonu 3 panel) → final: Void Leader = ağabey; boss yenilince oyun durur, INCOMING TRANSMISSION, ANSWER / IGNORE → iki son (Reunion / Silence). Düşman hareketi adı artık **Void Rebellion** (tüm Astra değil).
- Oyunda henüz ESKİ metinler duruyor (`INTRO_PANELS`, `ZONE_TRANSITION_MESSAGES`, `ENDING_PANELS`, `MENU_CARDS` alt başlıkları, `LEVEL_BRIEFS` ROCK TITAN / COMMAND CENTER satırları "Void Colony"/"fleet's escape"). Kullanıcı adım adım güncellemek istiyor: 1) giriş 7 panel 2) bölge geçişleri (3→4 üç panel, ipuçları) 3) menü alt başlıkları + brief satırları 4) final seçim ekranı + iki son (en büyük iş: boss 0 HP'de patlamaz, oyun durur, iki buton).
- Giriş (2026-11-05 yayında, dc7c5ae): 7 panel + tam ekran görsel (`INTRO_IMGS`, `ASSETS/story/intro-1..7.jpg`, 852×1846: genişliğe sığdırılıp alt kısım görselin koyu rengiyle uzatıldı, kırpma yok; orijinaller `SOURCES/STORY/intro/`). Görsel varsa metin altta (0.60–0.86 H). Panel 7'deki gezegen Dünya'ya benziyor (Kuzey Amerika) — ileride yenilenebilir.
- **BEKLEYEN (2026-11-06):** kullanıcı girişin EN BAŞINA hikâyeyle ilgili birkaç panel daha ekleyecek (metin + görsel getirecek). Gelince `INTRO_PANELS` başına ekle, görsel dosyalarını yeniden numarala (intro-1… kayar), sw `CACHE` artır + ASSETS listesi, `STORY.md` giriş bölümünü güncelle.
- Açık kararlar: ana gezegenin adı, kardeş isimleri, zaman aralığı, ipuçlarının sunumu (metin paneli mi), ağabeyin teslim olmasının inandırıcılığı.

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

## Son durum (2026-11-06, yeni sohbete geçerken)
- 2026-11-05 yapılanlar (hepsi yayında): boss ruh hali renkleri (pembe seri + burunda ateş topu, kırmızı dalış + kalkan izi, turuncu koridor); Rammer'a boss tarzı uyarı (şeritte akan oklar, kırmızı boyalı boss kalkanı hep açık, dalış kopyaları, can barı yok — hiç vurulamaz); Burster'a pembe ısınma + kıvılcım + ateş topu (şerit boyaması kaldırıldı); yeni hikâye (bkz. Hikâye bölümü) ve 7 panellik görselli giriş.
- Sıradaki: kullanıcının getireceği ek giriş panelleri → bölge geçişleri (1→2, 2→3 ipucu, 3→4 üç panel) → menü/brief metinleri → final seçim ekranı + iki son. Ardından sektör 2 oynanışı (hikâyede "gizli maden ve üretim üssü").

## Sektör 2 yeniden yapımı (2026-11-06 başladı, kullanıcı taslağı onayladı; adım adım)
- Taslak: L6 Slalom · L7 Pusu (kayaların arkasından) · L8 Patlatma (meteorun yeni hali, madenciler kaya patlatır) · L9 Yük Gemileri (Gunner yerine; üstte şerit değiştirir, arkasına kaya bırakır, kovalanır) · L10 Rock Titan (Kaya Fırlatma → Matkap Dalışı → Göçük; zırh döküldükçe Astra amblemi görünür, sonra 2→3 paneli + "...see you among the stars").
- L6 bitti, kullanıcı onayladı (2026-11-06: "iyi bir seviyede"); sıradaki L7. L6 (ASTEROID RUN): `SLALOM_WAVES` + `updateSlalom`; normal düşman yok, tüm saha tek hızla akar (`sl` bayrağı), demir kapılar + kırılır kaya (size 24: parçalanmaz) + boşlukta nöbetçi gemi (normal kural: vurulmazsa can gider) + 3. dalgada kargo. Kristal/Overdrive L6'da yok (kullanıcı: "manasız"), L7'de başlar. Kullanıcı pro 1.5 can kaybettiren sürümü de "çok kolay" buldu, "Ateş Koridoru kadar zor olmalı" dedi; kayaları büyük buldu (iron size 26, çarpma alanı görsele uyduruldu). Yol dışı gemi (`chase`: kapı aralığı en az 56 kareye açılır), çift kapı (`dbl`), son dalga 7.5 px/kare. Bot (react 22/10/12, 20 koşu): casual 9.1, expert 3.05, pro 2.75 (%55 kayıp). Bu tempoda `traps` metriği şişiyor (30 sn pencere kapı aralığından uzun). Kullanıcı bot sayılarından çok daha iyi oynuyor: hissine güven. Kullanıcı bu sürümü yanmadan geçti ama "çok da zorlaştırmayalım, ilk bölüm" dedi: zorluk bu seviyede kalsın. "Tam olmadı" dediği için kapılara dolgu kayaları (`addSlalomFiller`) ve bölüm sonu anı (`slalomOutro`: hız düşer, kodla çizilmiş maden silüeti, SOMETHING IS OUT THERE) eklendi; silüet görselini kullanıcı üretebilir. Kullanıcı son sürümü de "biraz kolay" buldu → boşluk her kapıda değişiyor, gemiler arttı, kapılar biraz sıklaştı, bazı kapılar tek büyük kaya (`big`). Kullanıcı fikri: gemi hep yolda olmasın → yol dışı gemi artık demir kayanın hemen önünde (`slalomPin`, kapı aralığı 56+ kare: vur, kaya gelmeden kaç); boşluktaki gemi azaltıldı.
- L7 yapıldı (AMBUSH, 2026-11-06, telefonda denenecek): `AMBUSH_WAVES` + `updateAmbush`; normal düşman yok, demir kaya sıraları iner, gemi kayanın arkasında çizilmez (`e.amb`, `e.escort`), `AMBUSH_PEEK` kare önce kırmızı parıltı + burun görünür (`drawAmbushPeek`), sonra yan şeride fırlar. Gemiler ateş etmez (kullanıcı: ateş edince öldürmeye alan kalmıyor). Sıra türleri: tek kaya, iki kaya (gemi boşluğa çıkar), ortadaki kayadan iki yana iki gemi; 3. dalgada kargo kayanın arkasında; 4. dalgada bazı kayaların arkası boş. Kristal/Overdrive sıralar arasındaki kırılır kayalardan. Bot (32 koşu): casual 2.6, expert 2.0, pro 1.3, fast 0.8. L8+ hâlâ eski `spawnAmbusher` yolunu kullanıyor.
- L7 yeniden konuşuluyor (2026-11-06): kullanıcı "pek olmamış, ateş ettikleri için öldürmeye alan kalmıyor" dedi, ama ateş tamamen kalksın da istemedi; hikâyeye göre mekanik seçilecek. Şu an yayındaki sürümde gemiler ateş etmiyor.
- Sektör 2 arka planı `asteroid-belt-v3.jpg`: kullanıcının görseli (`SOURCES/BACKGROUNDS/asteroid-belt-v1.jpg`) ×1.3 aydınlatıldı. Kullanıcının verdiği görseli başka görselle değiştirme (menü kartından türetmek reddedildi).
- Mağaza planı: App Store + Google Play, Capacitor; depo gizleme mağaza hazırlığına kadar bekliyor.

## NOT: Taş çeşitliliği (kullanıcı, 2026-11-06)
- L6'da taşlar "çok aynı" görünüyor; şekiller çeşitlendirilecek. Demir kayada şimdilik 3 sprite var (`ASSETS/rocks/rock-large-*`, gri boyanıyor). Kullanıcıdan yeni taş görselleri istenecek (uzun, köşeli, çatlak vb.; şeffaf PNG); yeni dosya gelince `sw.js` CACHE + ASSETS güncellenecek.

## Harita (2026-11-06)
- Kıvrımlı rota denendi, kullanıcı eski kartları daha derli toplu buldu. Şimdi 4 sektörde de: düz köşeli kartlar (`mapNodeRect`, tek satır ad, sola yaslı; LEVEL, BOSS, NEXT MISSION yazıları yok) + solda düz yol (`drawMapPath`, `mapPathY`, `MAP_PATH_X`), her kartın hizasında durak, gemi `mapShip` (bölüm bitince sonraki durağa uçar), yolun iki ucunda `MAP_ENDS` yazıları. Sektör 4'ün "TO THE LAST SIGNAL" yazısı geçici.

## Önceki durum (2026-11-04)
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
