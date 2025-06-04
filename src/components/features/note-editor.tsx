'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useNoteStore } from '@/stores/note'
import { debounce } from '@/lib/utils'
import { Save, FileText, Eye, Edit3 } from 'lucide-react'
import { NoteWithTags } from '@/types'

interface NoteEditorProps {
  note?: NoteWithTags | null
  onSave?: (note: NoteWithTags) => void
  onCancel?: () => void
}

export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const { updateNote, createNote, loading, error } = useNoteStore()
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Auto-save functionality
  const debouncedSave = useCallback(
    debounce(async (title: string, content: string) => {
      if (note && (title !== note.title || content !== note.content)) {
        setIsSaving(true)
        const { error } = await updateNote(note.id, { title, content })
        if (!error) {
          setLastSaved(new Date())
        }
        setIsSaving(false)
      }
    }, 2000),
    [note, updateNote]
  )

  // Trigger auto-save when content changes
  useEffect(() => {
    if (note && (title || content)) {
      debouncedSave(title, content)
    }
  }, [title, content, debouncedSave, note])

  const handleSave = async () => {
    if (!title.trim()) {
      return
    }

    setIsSaving(true)

    try {
      if (note) {
        // Update existing note
        const { error } = await updateNote(note.id, { title, content })
        if (!error) {
          setLastSaved(new Date())
          onSave?.(note)
        }
      } else {
        // Create new note
        const path = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const { data, error } = await createNote({
          title,
          content,
          path: `notes/${path}`,
          is_folder: false
        })
        
        if (!error && data) {
          setLastSaved(new Date())
          onSave?.(data)
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  const renderPreview = () => {
    if (!content) {
      return (
        <div className="text-muted-foreground p-4 text-center">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>İçerik yazın ve önizleme görün</p>
        </div>
      )
    }

    return (
      <div className="prose prose-sm max-w-none p-4">
        {content.split('\n').map((line, index) => {
          if (line.startsWith('# ')) {
            return <h1 key={index} className="text-2xl font-bold mb-2">{line.slice(2)}</h1>
          }
          if (line.startsWith('## ')) {
            return <h2 key={index} className="text-xl font-semibold mb-2">{line.slice(3)}</h2>
          }
          if (line.startsWith('### ')) {
            return <h3 key={index} className="text-lg font-medium mb-2">{line.slice(4)}</h3>
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return <li key={index} className="ml-4">{line.slice(2)}</li>
          }
          if (line.trim() === '') {
            return <br key={index} />
          }
          return <p key={index} className="mb-2">{line}</p>
        })}
      </div>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {note ? 'Notu Düzenle' : 'Yeni Not'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-sm text-muted-foreground">
                Son kayıt: {lastSaved.toLocaleTimeString('tr-TR')}
              </span>
            )}
            {isSaving && <LoadingSpinner size="sm" />}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
            >
              {isPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isPreview ? 'Düzenle' : 'Önizle'}
            </Button>
            <Button onClick={handleSave} disabled={loading || isSaving || !title.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">
            {error}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Not başlığı..."
          className="text-lg font-medium"
        />

        <div className="flex-1 flex flex-col min-h-0">
          {isPreview ? (
            <div className="flex-1 border rounded-md overflow-auto">
              {renderPreview()}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Notunuzu buraya yazın...

Markdown formatı desteklenir:
# Büyük Başlık
## Orta Başlık
### Küçük Başlık
- Liste öğesi
"
              className="flex-1 resize-none border rounded-md p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
        </div>

        {onCancel && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              İptal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
