# Space Shooter — proje notları (Claude için)

Mobil (iPhone) için tek dosyalık canvas oyunu. Kullanıcı Türkçe konuşur; yanıtlar Türkçe olmalı.

## Yayın / çalışma akışı
- Oyun: `index.html` (tüm kod), `sw.js` (service worker, network-first), `manifest.json`.
- Canlı: https://saracseymanur-collab.github.io/space-shooter/ (GitHub Pages, `main` dalı).
- Kullanıcı telefonda test eder: **"gönder" = commit + push**, sonra Pages güncellenene kadar `curl` ile kontrol et (~1-2 dk).
- Yeni asset eklenince `sw.js` içindeki `CACHE` sürümünü artır ve dosyayı `ASSETS` listesine ekle.
- Her değişiklikten sonra: script'i ayıklayıp `node --check` ile sözdizimi kontrolü, tarayıcıda görsel kontrol.
- Önizleme: tarayıcı sunucusu ~/Desktop'u okuyamıyor (macOS izni) → oyunu scratchpad'e `rsync` edip `python3 -m http.server` ile oradan sun. Tarayıcı paneli gizliyken rAF yavaşlar; testlerde `update()`'i elle çağır.
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

## Açık işler / son durum (2026-11-03)
- Çift atış (double-shot) rozeti küçükken pause simgesine (‖) benziyor → kullanıcı daha sivri / açılı mermili yeni görsel üretebilir.
- Kullanıcı son sürümü telefonda deniyor; geri bildirimlerini bekle.
- Zorluk ölçüm botu: `SOURCES/TOOLS/bot.js` (casual/expert profilleri; `measure(levels, runs)`; gürültü ±0.4, 24-32 koşu kullan).
- Zorluk ayarı (2026-11-03): 20 bölüm `LEVEL_TUNE` (getLevelConfig içinde, temel ayar = `baseLevelConfig`) ve `BOSS_FIRE_MUL` ile ayarlandı. Yeni mekanikler: formasyon (L2-4 son dalga, L16), dalan düşman (L3, L14, L16, L19), Gunner (L9, L12, L17). Sis bölümlerinde uyarılar sisin altında kalır → yoğun siste (L13) mekanik yok.
- Bot zayıflığı: sis/görünmezlik bota etki etmez (Nebula insan için daha zor), kayaları vurmayı değerlendirmez.
- Müzik (2026-11-03): menü/harita teması, bölüm başına varyasyon (`VARIANTS`: kök kayması + arpej/kalp atışı katmanı), boss teması (`BOSS_PROG`, 4 sn akor + bas ostinato), döngü başına kayan akor sırası, her 20 akorda 2 akorluk nefes arası. Kullanıcı telefonda dinleyecek.
