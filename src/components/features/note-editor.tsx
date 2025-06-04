'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useNoteStore } from '@/stores/note'
import { useSyncStatus } from '@/hooks/use-sync-status'
import { syncService } from '@/services/sync-service'
import { Save, FileText, Eye, Edit3, Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { NoteWithTags } from '@/types'

interface NoteEditorProps {
  note?: NoteWithTags | null
  onSave?: (note: NoteWithTags) => void
  onCancel?: () => void
}

export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const { updateNote, createNote, loading, error } = useNoteStore()
  const { conflicts } = useSyncStatus()
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'conflict'>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)

  // Check for conflicts for this note
  const noteConflict = note ? conflicts.find(c => c.noteId === note.id) : null  // Auto-save functionality with sync
  const saveNote = useCallback(async () => {
    if (note && (title !== note.title || content !== note.content)) {
      setIsSaving(true)
      setSyncStatus('syncing')
      setSyncError(null)

      try {
        // Use sync service for conflict-aware saving
        const result = await syncService.saveNote({
          ...note,
          title,
          content,
          updated_at: new Date().toISOString()
        })

        if (result.success && result.resolvedNote) {
          setLastSaved(new Date())
          setSyncStatus('synced')
          
          // Update local store with resolved note
          await updateNote(note.id, {
            ...result.resolvedNote,
            content: result.resolvedNote.content || undefined
          })
          
          // Update local state if server version is different
          if (result.resolvedNote.title !== title) {
            setTitle(result.resolvedNote.title)
          }
          if (result.resolvedNote.content !== content) {
            setContent(result.resolvedNote.content || '')
          }
        } else if (result.conflict) {
          setSyncStatus('conflict')
          setSyncError('Sync conflict detected - please resolve conflicts')
        } else {
          setSyncStatus('error')
          setSyncError(result.error || 'Save failed')
        }
      } catch (error) {
        setSyncStatus('error')
        setSyncError(error instanceof Error ? error.message : 'Save failed')
        console.error('Auto-save error:', error)
      } finally {
        setIsSaving(false)
      }
    }
  }, [note, title, content, updateNote])

  // Create debounced save function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (note || isCreatingNew) {
        saveNote();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [title, content, saveNote]);  // Added saveNote to dependencies

  const handleSave = async () => {
    if (!title.trim()) {
      return
    }

    setIsSaving(true)
    setSyncStatus('syncing')
    setSyncError(null)

    try {
      if (note) {
        // Update existing note with sync service
        const result = await syncService.saveNote({
          ...note,
          title,
          content,
          updated_at: new Date().toISOString()
        })

        if (result.success && result.resolvedNote) {
          setLastSaved(new Date())
          setSyncStatus('synced')
          onSave?.(result.resolvedNote)
        } else if (result.conflict) {
          setSyncStatus('conflict')
          setSyncError('Sync conflict detected - please resolve conflicts')
        } else {
          setSyncStatus('error')
          setSyncError(result.error || 'Save failed')
        }
      } else {
        // Create new note (no conflicts possible)
        const path = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const { data, error } = await createNote({
          title,
          content,
          path: `notes/${path}`,
          is_folder: false
        })
        
        if (!error && data) {
          setLastSaved(new Date())
          setSyncStatus('synced')
          onSave?.(data)
        } else {
          setSyncStatus('error')
          setSyncError(error || 'Create failed')
        }
      }
    } catch (error) {
      setSyncStatus('error')
      setSyncError(error instanceof Error ? error.message : 'Save failed')
      console.error('Save error:', error)
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
            {/* Sync Status Indicator */}
            {syncStatus === 'syncing' && (
              <div className="flex items-center gap-1 text-blue-600">
                <LoadingSpinner size="sm" />
                <span className="text-sm">Senkronize ediliyor...</span>
              </div>
            )}
            {syncStatus === 'synced' && lastSaved && (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-sm">
                  Kaydedildi: {lastSaved.toLocaleTimeString('tr-TR')}
                </span>
              </div>
            )}
            {syncStatus === 'error' && (
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm">Hata</span>
              </div>
            )}
            {syncStatus === 'conflict' && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Çakışma</span>
              </div>
            )}
            
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

        {/* Error Display */}
        {(error || syncError) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">
            {syncError || error}
          </div>
        )}

        {/* Conflict Warning */}
        {noteConflict && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-orange-800 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Bu not için çakışma tespit edildi. Lütfen çakışmaları çözün.</span>
            </div>
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
