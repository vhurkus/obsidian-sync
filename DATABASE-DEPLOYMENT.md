# 🗄️ Database Schema Deployment

## 📋 Hemen Yapılması Gereken Adım

**Durum:** Uygulama çalışıyor ama veritabanı tabloları henüz oluşturulmamış  
**Çözüm:** SQL şemasını Supabase'e deploy etmek  
**Süre:** 5 dakika

## 🚀 Deployment Adımları

### 1. Supabase Dashboard'a Git
URL: https://supabase.com/dashboard/project/epjxgjlqjrlgougeakko/sql

### 2. SQL Editor'ı Aç
- Sol menüden "SQL Editor" seç
- "New Query" butonuna tıkla

### 3. Schema'yı Kopyala
`supabase-schema.sql` dosyasının tüm içeriğini kopyala

### 4. SQL'i Çalıştır
- Kopyalanan kodu SQL Editor'a yapıştır  
- "Run" butonuna tıkla
- Başarı mesajını bekle

### 5. Verification
Tablolar oluştuğunu kontrol et:
- Tables sekmesinden şu tabloları gör:
  - ✅ notes
  - ✅ tags  
  - ✅ note_tags
  - ✅ sync_queue
  - ✅ search_index

## 🧪 Test After Deployment

Deployment sonrası test edelim:

```bash
cd c:\Users\hyuce\Desktop\obsidian-sync
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(
  'https://epjxgjlqjrlgougeakko.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwanhnamxxanJsZ291Z2Vha2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDUwMjcsImV4cCI6MjA2NDU4MTAyN30.IPaima5NNzFoj6iCsumhZoW0TKAkSq5ghWXznKJwIzI'
);
client.from('notes').select('count').then(console.log);
"
```

## ⚡ Schema Özellikleri

Oluşturulacak özellikler:
- **Row Level Security (RLS)** - Multi-user güvenlik
- **Full-text Search** - PostgreSQL tsvector ile arama
- **Triggers** - Otomatik timestamp güncelleme
- **Indexes** - Performans optimizasyonu
- **Foreign Keys** - Veri bütünlüğü

## 🎯 Beklenen Sonuç

Deployment sonrası:
- ✅ Tüm CRUD operasyonları çalışacak
- ✅ Not oluşturma/düzenleme/silme aktif olacak
- ✅ Arama fonksiyonu çalışacak
- ✅ Tag sistemi kullanılabilecek
- ✅ Multi-user desteği hazır olacak

**Şu an için kritik adım:** Database schema deployment!

**Sonrasında:** Phase 3 - Monaco Editor implementation
