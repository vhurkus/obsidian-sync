# ObsidianSync Development Rules

## 🎯 Genel Kurallar

### 1. Kod Yazım Standartları

- **TypeScript** kullan, `any` type'ından kaçın
- **ESLint** ve **Prettier** kurallarına uy
- Component isimleri **PascalCase**, fonksiyonlar **camelCase**
- Dosya isimleri component ise **PascalCase**, diğerleri **kebab-case**
- Her component kendi klasöründe olmalı (index.tsx + styles)

### 2. Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth layout group
│   ├── (dashboard)/       # Dashboard layout group
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── features/         # Feature-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and helpers
│   ├── supabase/        # Supabase client and helpers
│   └── utils/           # General utilities
├── services/            # Business logic and API calls
├── stores/              # Zustand stores
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

### 3. Component Geliştirme Kuralları

```typescript
// ✅ DOĞRU: Props interface tanımla
interface ComponentProps {
  title: string
  onSave?: (data: Note) => void
  children?: React.ReactNode
}

// ✅ DOĞRU: Functional component with proper typing
export const Component: React.FC<ComponentProps> = ({ 
  title, 
  onSave,
  children 
}) => {
  // Component logic
}

// ❌ YANLIŞ: any type kullanma
const handleSave = (data: any) => { }

// ✅ DOĞRU: Proper typing
const handleSave = (data: Note) => { }
```

### 4. State Management

```typescript
// ✅ DOĞRU: Zustand store yapısı
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface NoteStore {
  notes: Note[]
  selectedNoteId: string | null
  setNotes: (notes: Note[]) => void
  selectNote: (id: string) => void
}

export const useNoteStore = create<NoteStore>()(
  devtools(
    persist(
      (set) => ({
        notes: [],
        selectedNoteId: null,
        setNotes: (notes) => set({ notes }),
        selectNote: (id) => set({ selectedNoteId: id }),
      }),
      {
        name: 'note-store',
      }
    )
  )
)
```

### 5. Supabase Kullanım Kuralları

```typescript
// ✅ DOĞRU: Error handling ile
export async function getNotes(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching notes:', error)
    return { data: null, error }
  }
}

// ✅ DOĞRU: Type-safe queries
const { data: notes } = await supabase
  .from('notes')
  .select('*')
  .returns<Note[]>()
```

### 6. Error Handling

```typescript
// ✅ DOĞRU: Proper error boundaries
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Log to error reporting service
  }
}

// ✅ DOĞRU: Try-catch with user feedback
try {
  await saveNote(noteData)
  toast.success('Not kaydedildi!')
} catch (error) {
  toast.error('Not kaydedilemedi. Lütfen tekrar deneyin.')
  console.error('Save error:', error)
}
```

### 7. Performance Kuralları

```typescript
// ✅ DOĞRU: Memoization kullan
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>
})

// ✅ DOĞRU: useMemo for expensive computations
const searchResults = useMemo(() => {
  return notes.filter(note => 
    note.title.toLowerCase().includes(query.toLowerCase())
  )
}, [notes, query])

// ✅ DOĞRU: Debounce for search
const debouncedSearch = useDebouncedCallback(
  (value: string) => {
    searchNotes(value)
  },
  500
)
```

### 8. Güvenlik Kuralları

```typescript
// ✅ DOĞRU: Input sanitization
import DOMPurify from 'isomorphic-dompurify'

const sanitizedContent = DOMPurify.sanitize(userInput)

// ✅ DOĞRU: Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Never expose: process.env.SUPABASE_SERVICE_KEY

// ✅ DOĞRU: RLS policies kullan
// Tüm queries otomatik olarak user-scoped olacak
```

### 9. Testing Kuralları

```typescript
// ✅ DOĞRU: Component testing
import { render, screen, fireEvent } from '@testing-library/react'

describe('NoteEditor', () => {
  it('should save note on Ctrl+S', async () => {
    const onSave = jest.fn()
    render(<NoteEditor onSave={onSave} />)
    
    fireEvent.keyDown(document, { 
      key: 's', 
      ctrlKey: true 
    })
    
    expect(onSave).toHaveBeenCalled()
  })
})
```

### 10. Git Commit Kuralları

```bash
# ✅ DOĞRU: Conventional commits
feat: add markdown preview functionality
fix: resolve sync conflict on multiple devices
docs: update README with setup instructions
style: format code with prettier
refactor: extract note service logic
test: add unit tests for auth flow
chore: update dependencies

# Commit mesajı formatı:
# <type>(<scope>): <subject>
# 
# <body>
# 
# <footer>
```

## 🚀 Faz Geçiş Kriterleri

### Her fazı tamamlamadan önce:

1. **Kod Review Checklist:**
   - [ ] TypeScript hataları yok
   - [ ] ESLint uyarıları yok
   - [ ] Console.log'lar temizlendi
   - [ ] Error handling eklendi
   - [ ] Loading states eklendi

2. **Test Checklist:**
   - [ ] Component render oluyor
   - [ ] User interactions çalışıyor
   - [ ] API calls başarılı
   - [ ] Error states handle ediliyor

3. **UI/UX Checklist:**
   - [ ] Responsive design
   - [ ] Keyboard navigation
   - [ ] Loading indicators
   - [ ] Error messages user-friendly
   - [ ] Accessibility (a11y) kontrol edildi

## 📝 AI İçin Özel Talimatlar

1. **Her fazda:**
   - Önce gerekli dosyaları oluştur
   - Sonra implementasyonu yap
   - Test et ve hataları düzelt
   - Documentation ekle

2. **Dosya oluştururken:**
   - Tam path belirt: `src/components/Editor/index.tsx`
   - Import statements eksiksiz olsun
   - Type definitions inline değil, ayrı dosyada

3. **Hata durumlarında:**
   - User-friendly error messages
   - Fallback UI components
   - Retry mechanisms
   - Offline queue for sync

4. **State updates:**
   - Optimistic updates kullan
   - Loading states ekle
   - Error recovery ekle

5. **Performance:**
   - Lazy loading kullan
   - Code splitting yap
   - Image optimization
   - Bundle size kontrol et

## 🎯 Her Fazın Çıktıları

### Beklenen Dosyalar:

1. **Phase 1:**
   - `/app/(auth)/login/page.tsx`
   - `/app/(auth)/register/page.tsx`
   - `/lib/supabase/client.ts`
   - `/lib/supabase/middleware.ts`
   - `/types/database.types.ts`

2. **Phase 2:**
   - `/services/note-service.ts`
   - `/components/features/Sidebar/index.tsx`
   - `/components/features/NoteList/index.tsx`
   - `/app/(dashboard)/page.tsx`

3. **Phase 3:**
   - `/components/features/Editor/index.tsx`
   - `/components/features/MarkdownPreview/index.tsx`
   - `/hooks/useDebounce.ts`
   - `/lib/markdown/parser.ts`

[Her faz için devam eder...]

## 🔧 Debugging İpuçları

1. **Supabase bağlantı sorunları:**
   ```typescript
   // Check connection
   const { data, error } = await supabase.auth.getSession()
   if (error) console.error('Auth error:', error)
   ```

2. **Realtime sync sorunları:**
   ```typescript
   // Enable debug mode
   const channel = supabase.channel('debug', {
     config: { broadcast: { self: true } }
   })
   ```

3. **Performance sorunları:**
   ```typescript
   // Use React DevTools Profiler
   // Check re-renders with why-did-you-render
   ```

## 📚 Referanslar

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)