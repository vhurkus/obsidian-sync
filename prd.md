# Obsidian Clone - Product Requirements Document (PRD)

## 🎯 Proje Özeti

**Proje Adı:** ObsidianSync - Ücretsiz Çoklu Cihaz Not Uygulaması  
**Hedef:** Obsidian benzeri bir markdown not uygulaması geliştirmek. Supabase kullanarak ücretsiz senkronizasyon sağlamak.  
**Kullanıcı:** @vhurkus

## 📋 Proje Gereksinimleri

### Fonksiyonel Gereksinimler

1. **Kimlik Doğrulama**
   - Email/şifre ile kayıt ve giriş
   - Magic link ile giriş (opsiyonel)
   - Oturum yönetimi
   - Şifre sıfırlama

2. **Not Yönetimi**
   - Markdown formatında not oluşturma
   - Not düzenleme (gerçek zamanlı otomatik kayıt)
   - Not silme (soft delete - geri dönüşüm kutusu)
   - Not arama (başlık ve içerik)
   - Klasör/hiyerarşi yapısı

3. **Editör Özellikleri**
   - Syntax highlighting
   - Markdown preview (canlı önizleme)
   - Klavye kısayolları (Ctrl+S, Ctrl+B, vb.)
   - Otomatik kaydetme (1 saniye debounce)
   - Markdown toolbar

4. **Senkronizasyon**
   - Gerçek zamanlı senkronizasyon (Supabase Realtime)
   - Conflict resolution (çakışma çözümü)
   - Offline çalışma ve sync queue
   - Device ID ile cihaz takibi

5. **UI/UX**
   - Split view (editör + önizleme)
   - Dark/Light tema
   - Responsive tasarım
   - Drag & drop dosya organizasyonu
   - Hızlı arama (Ctrl+K)

### Teknik Gereksinimler

- **Frontend:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Editor:** Monaco Editor
- **Backend:** Supabase (Auth, Database, Realtime, Storage)
- **State:** Zustand
- **Markdown:** react-markdown + remark plugins
- **Icons:** Lucide React

## 🏗️ Proje Fazları

### PHASE 1: Temel Altyapı (Backend + Auth)
**Süre:** 2-3 saat

1. Next.js projesi kurulumu
2. Supabase entegrasyonu
3. Veritabanı şeması oluşturma
4. Authentication implementasyonu
5. Temel layout ve routing

**Deliverables:**
- Çalışan Next.js projesi
- Supabase bağlantısı
- Login/Register sayfaları
- Protected routes

### PHASE 2: Not CRUD Operasyonları
**Süre:** 3-4 saat

1. Not oluşturma API'si
2. Not listeleme ve sidebar
3. Not güncelleme
4. Not silme (soft delete)
5. Klasör yapısı implementasyonu

**Deliverables:**
- Çalışan CRUD operasyonları
- Sidebar ile not listesi
- Basit not görüntüleme

### PHASE 3: Markdown Editör
**Süre:** 4-5 saat

1. Monaco Editor entegrasyonu
2. Markdown syntax highlighting
3. Otomatik kaydetme
4. Klavye kısayolları
5. Split view (editor + preview)

**Deliverables:**
- Tam fonksiyonel markdown editör
- Canlı önizleme
- Otomatik kayıt

### PHASE 4: Gerçek Zamanlı Senkronizasyon
**Süre:** 3-4 saat

1. Supabase Realtime setup
2. Multi-device sync
3. Conflict resolution
4. Sync status indicator
5. Device management

**Deliverables:**
- Çoklu cihaz desteği
- Gerçek zamanlı güncelleme
- Sync durumu göstergesi

### PHASE 5: Arama ve Organizasyon
**Süre:** 2-3 saat

1. Full-text arama
2. Fuzzy search
3. Tag sistemi
4. Favoriler
5. Son görüntülenenler

**Deliverables:**
- Güçlü arama fonksiyonu
- Tag filtreleme
- Quick switcher (Ctrl+K)

### PHASE 6: Offline Desteği
**Süre:** 3-4 saat

1. Service Worker setup
2. IndexedDB entegrasyonu
3. Offline queue sistemi
4. Background sync
5. Cache stratejisi

**Deliverables:**
- Offline çalışma
- Otomatik senkronizasyon
- PWA desteği

### PHASE 7: UI/UX İyileştirmeleri
**Süre:** 2-3 saat

1. Dark/Light tema
2. Responsive design
3. Drag & drop
4. Keyboard navigation
5. Settings sayfası

**Deliverables:**
- Profesyonel UI
- Tema değiştirme
- Mobil uyumlu tasarım

### PHASE 8: Optimizasyon ve Test
**Süre:** 2-3 saat

1. Performance optimizasyonu
2. Error handling
3. Unit testler
4. E2E testler
5. Deployment hazırlığı

**Deliverables:**
- Optimize edilmiş uygulama
- Test coverage
- Production-ready kod

## 📊 Veritabanı Şeması

```sql
-- Users (Supabase Auth)

-- Notes
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  path TEXT NOT NULL,
  parent_id UUID REFERENCES notes(id),
  is_folder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  device_id TEXT,
  version INTEGER DEFAULT 1,
  UNIQUE(user_id, path)
);

-- Tags
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Note Tags (Many-to-Many)
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Sync Queue (for offline support)
CREATE TABLE sync_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  action TEXT NOT NULL, -- create, update, delete
  resource_type TEXT NOT NULL, -- note, tag, etc
  resource_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- Search Index (for full-text search)
CREATE TABLE search_index (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_text TSVECTOR,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create search index
CREATE INDEX search_text_idx ON search_index USING GIN(search_text);

-- RLS Policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own note_tags" ON note_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_tags.note_id 
      AND notes.user_id = auth.uid()
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_search_index()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO search_index (note_id, user_id, search_text)
  VALUES (
    NEW.id,
    NEW.user_id,
    to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''))
  )
  ON CONFLICT (note_id) DO UPDATE
  SET 
    search_text = to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '')),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search index
CREATE TRIGGER update_search_index_trigger
AFTER INSERT OR UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_search_index();
```

## 🎨 UI/UX Mockup

```
┌─────────────────────────────────────────────────────────┐
│  ObsidianSync                              [User] [⚙️]   │
├─────────────────┬───────────────────────────────────────┤
│ [+ New Note]    │  Note Title                    [📌]   │
│ [🔍 Search]     ├───────────────────────────────────────┤
│                 │                                         │
│ 📁 My Notes     │  # Markdown Content Here               │
│  └── 📄 Note 1  │                                         │
│  └── 📄 Note 2  │  - List item 1                         │
│  └── 📁 Folder  │  - List item 2                         │
│      └── Note 3 │                                         │
│                 │  **Bold text** and *italic*            │
│ 🏷️ Tags         │                                         │
│  └── work       │  ```code                                │
│  └── personal   │  console.log('Hello')                   │
│                 │  ```                                    │
│ ⭐ Favorites    │                                         │
│ 🕒 Recent       │                                         │
│ 🗑️ Trash        │                                         │
│                 │ [💾 Saving...] [👁️ Preview] [📤 Share] │
└─────────────────┴───────────────────────────────────────┘
```

## 📱 Responsive Breakpoints

- Mobile: < 768px (Drawer navigation)
- Tablet: 768px - 1024px (Collapsible sidebar)
- Desktop: > 1024px (Full layout)

## 🔐 Security Requirements

1. Row Level Security (RLS) tüm tablolarda aktif
2. User sadece kendi verilerini görebilmeli
3. API rate limiting
4. Input sanitization
5. XSS koruması

## 🚀 Deployment

1. Vercel deployment
2. Environment variables
3. Supabase production setup
4. Custom domain (opsiyonel)
5. Analytics (opsiyonel)

## 📈 Success Metrics

- Page load time < 2s
- Time to Interactive < 3s
- Offline functionality
- 100% sync reliability
- Zero data loss