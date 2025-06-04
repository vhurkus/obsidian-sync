# ObsidianSync UI İyileştirme Planı

## 1. Arayüz Geliştirmeleri

### 1.1 Sol Sidebar İyileştirmeleri
- **Dikey İkon Çubuğu** - Obsidian'daki gibi sol kenarda minimal ikonlar ekleyin:
  - Dosya gezgini (klasör düzeni)
  - Arama ikonu
  - Favoriler/Yıldızlılar
  - Graf görünümü
  - Ayarlar
  - Etiketler görünümü

### 1.2 Panel Düzeni
- **Çoklu Panel Desteği** - Kullanıcının birden fazla belgeyi yan yana veya üst üste açabilmesi
- **Panel Yeniden Boyutlandırma** - Panellerin boyutunun ayarlanabilmesi
- **Split View Geliştirmesi** - Notları yan yana düzenleme/önizleme yapabilme

### 1.3 Not Düzenleyici İyileştirmeleri
- **Minimalist Araç Çubuğu** - Daha az dikkat dağıtıcı, sadece gerektiğinde görünen
- **Tab Sistemi** - Obsidian'daki gibi sekme sistemi ile birden fazla not açabilme
- **Çift Mod** - Düzenleme ve önizleme modları arasında geçiş

### 1.4 Graf Görünümü
- **İnteraktif Graf** - Notlar arasındaki bağlantıları gösteren bir graf görünümü
- **Düğüm Etkileşimi** - Grafdaki notlara tıklayarak açabilme
- **Graf Filtreleme** - Etiketlere veya kriterlere göre grafı filtreleme

### 1.5 Koyu Tema İyileştirmeleri
- **Daha Koyu Arka Plan** - Obsidian'ın koyu teması gibi gerçek koyu bir tema
- **Metin Vurgusu** - Daha iyi okuma deneyimi için doğru kontrast
- **Vurgulu Syntax** - Markdown için gelişmiş sözdizimi vurgulama

## 2. Kullanıcı Deneyimi İyileştirmeleri

### 2.1 Klavye Kısayolları
- **Gelişmiş Kısayollar** - Obsidian'daki gibi kapsamlı klavye kısayol desteği
- **Komut Paleti** - Ctrl+P ile erişilebilen komut paleti

### 2.2 Not Bağlantıları
- **[[Çift Köşeli Parantez]]** - Wiki tarzı bağlantı oluşturma
- **Otomatik Tamamlama** - Bağlantı yazarken not önerileri
- **Belge Önizlemeleri** - Bağlantıların üzerine gelindiğinde önizleme

### 2.3 Etiketler ve Metadata
- **YAML Frontmatter Desteği** - Notlar için meta veri tanımlama
- **Etiket Gezgini** - Tüm etiketlerin görüntülenebileceği panel
- **Etiket Otomatik Tamamlama** - # yazarken etiket önerileri

### 2.4 Arama ve Filtreleme
- **Gelişmiş Arama** - Tam metin, etiket ve özellik aramalarını destekleyen güçlü arama
- **Arama Sonuçları Paneli** - Obsidian'daki gibi arama sonuçlarını düzenli görüntüleme
- **Kaydetilmiş Aramalar** - Sık kullanılan aramaları kaydetme imkanı

## 3. Uygulama Özellikleri

### 3.1 Eklenti Sisteminin Temelleri
- **Temel API** - İleride eklenti desteği için altyapı hazırlanması
- **Tema Desteği** - Özelleştirilebilir tema sistemi

### 3.2 Görselleştirmeler
- **Zaman Çizelgesi** - Notların tarihlere göre görselleştirilmesi
- **Kavram Haritası** - İlişkili notların düzenlenmesi için alternatif görünüm

### 3.3 İçe/Dışa Aktarma
- **Markdown İçe Aktarma** - Toplu markdown dosyalarını içe aktarma
- **HTML/PDF Dışa Aktarma** - Notları farklı formatlara aktarma

## 4. Teknik İyileştirmeler

### 4.1 Performans Optimizasyonları
- **Büyük Dokümanlar** - Büyük notları akıcı bir şekilde işleme
- **Gecikmesiz Yazma** - Yazma sırasında gecikme olmaması

### 4.2 Offline Deneyim Geliştirmeleri
- **Çevrimdışı İlk (Offline-First)** - Tamamen çevrimdışı çalışabilme
- **Senkronizasyon İyileştirmeleri** - Daha görünür senkronizasyon durumu

## 5. Uygulama Haline Getirme

### 5.1 Electron Uygulaması
- **Çapraz Platform Uygulama** - Windows, macOS ve Linux için Electron tabanlı uygulama
- **Sistem Entegrasyonu** - Dosya sistemi ile daha iyi entegrasyon

### 5.2 Mobil Deneyim
- **Duyarlı Tasarım İyileştirmeleri** - Mobil cihazlar için optimize edilmiş UI
- **Mobil Uygulamalar** - İleride iOS ve Android uygulamaları için altyapı

## 6. Önceliklendirme

### Kısa Vadeli (1-2 Hafta)
1. Koyu tema iyileştirmeleri
2. Sol sidebar yeniden tasarımı
3. Panel düzeninin geliştirilmesi
4. Tab sisteminin eklenmesi

### Orta Vadeli (3-4 Hafta)
1. Graf görünümünün geliştirilmesi
2. Wiki tarzı bağlantı sistemi
3. Gelişmiş arama özellikleri
4. Çoklu panel desteği

### Uzun Vadeli (1-2 Ay)
1. Electron uygulamasına dönüştürme
2. Tema ve eklenti sistemi altyapısı
3. Mobil deneyim optimizasyonları
4. Görselleştirme araçları
