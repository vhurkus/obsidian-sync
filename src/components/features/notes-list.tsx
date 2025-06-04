'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useNoteStore } from '@/stores/note'
import { NoteWithTags } from '@/types'
import { 
  Search, 
  Plus, 
  FileText, 
  Folder, 
  Trash2, 
  Edit, 
  Calendar,
  Hash
} from 'lucide-react'

interface NotesListProps {
  onNoteSelect?: (note: NoteWithTags) => void
  onNewNote?: () => void
  selectedNoteId?: string
}

export function NotesList({ onNoteSelect, onNewNote, selectedNoteId }: NotesListProps) {
  const { 
    notes, 
    loading, 
    error, 
    searchQuery, 
    fetchNotes, 
    deleteNote, 
    setSearchQuery,
    setCurrentNote   } = useNoteStore()
  
  const [filteredNotes, setFilteredNotes] = useState<NoteWithTags[]>([])

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Filter notes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes)
    } else {
      const filtered = notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredNotes(filtered)
    }
  }, [notes, searchQuery])

  const handleDeleteNote = async (note: NoteWithTags, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (confirm(`"${note.title}" notunu silmek istediğinizden emin misiniz?`)) {
      await deleteNote(note.id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getContentPreview = (content: string | null, maxLength = 100) => {
    if (!content) return 'İçerik yok...'
    
    const plainText = content.replace(/#+\s/g, '').replace(/\*\*(.+?)\*\*/g, '$1')
    return plainText.length > maxLength 
      ? plainText.slice(0, maxLength) + '...'
      : plainText
  }

  if (loading && notes.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notlarım ({filteredNotes.length})
          </CardTitle>
          <Button onClick={onNewNote} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Not
          </Button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Notlarda ara..."
            className="pl-10"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">
            {error}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        {filteredNotes.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            {notes.length === 0 ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto opacity-50" />
                <p className="text-lg font-medium">Henüz not yok</p>
                <p className="text-sm">İlk notunuzu oluşturmak için "Yeni Not" butonuna tıklayın</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Search className="h-12 w-12 mx-auto opacity-50" />
                <p className="text-lg font-medium">Arama sonucu bulunamadı</p>
                <p className="text-sm">Başka anahtar kelimeler deneyin</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setCurrentNote(note)
                  onNoteSelect?.(note)
                }}
                className={`
                  group cursor-pointer rounded-lg border p-3 transition-all hover:bg-accent
                  ${selectedNoteId === note.id ? 'bg-accent border-accent-foreground/20' : 'border-border'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {note.is_folder ? (
                        <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      )}
                      <h3 className="font-medium truncate text-sm">
                        {note.title || 'Başlıksız Not'}
                      </h3>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {getContentPreview(note.content)}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(note.updated_at)}
                      </div>
                      
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          <span className="truncate">
                            {note.tags.map(tag => tag.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentNote(note)
                        onNoteSelect?.(note)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteNote(note, e)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
