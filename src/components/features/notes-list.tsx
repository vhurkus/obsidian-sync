'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useNoteStore } from '@/stores/note'
import { useDragDrop } from '@/hooks/use-drag-drop'
import { NoteWithTags } from '@/types'
import { 
  Search, 
  Plus, 
  FileText, 
  Folder, 
  Trash2, 
  Edit, 
  Calendar,
  Hash,
  Star
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
    toggleFavorite,
    setSearchQuery,
    setCurrentNote
  } = useNoteStore()
  
  const [filteredNotes, setFilteredNotes] = useState<NoteWithTags[]>([])

  // Drag and drop functionality
  const {
    draggedItem,
    getDragProps,
    getDropProps,
    getDropIndicatorProps,
    isDragging
  } = useDragDrop({
    onNoteMove: async (noteId: string, newParentId: string | null, newIndex?: number) => {
      // Handle note reordering/moving here
      console.log('Moving note:', { noteId, newParentId, newIndex })
      // This would need to be implemented in the note store
    }
  })

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
      <CardHeader className="flex-shrink-0 p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            <span>Notlarım</span>
            <span className="text-sm text-muted-foreground">({filteredNotes.length})</span>
          </CardTitle>
          <Button onClick={onNewNote} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-2" />
            <span>Yeni Not</span>
          </Button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Notlarda ara..."
            className="pl-10 h-10 text-base"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm mt-4">
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
                <p className="text-sm">İlk notunuzu oluşturmak için &quot;Yeni Not&quot; butonuna tıklayın</p>
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
            {filteredNotes.map((note) => {
              const dragItem = {
                id: note.id,
                type: note.is_folder ? 'folder' as const : 'note' as const,
                data: note
              }

              return (
                <div
                  key={note.id}
                  {...getDragProps(dragItem)}
                  {...getDropProps(dragItem)}
                  onClick={() => {
                    setCurrentNote(note)
                    onNoteSelect?.(note)
                  }}
                  className={`
                    group cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:shadow-md
                    ${selectedNoteId === note.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }
                    ${isDragging && draggedItem?.id === note.id ? 'opacity-50' : ''}
                  `}
                >
                  {/* Drop indicator */}
                  {(() => {
                    const indicator = getDropIndicatorProps(note.id)
                    return (
                      <>
                        {indicator.showBefore && (
                          <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                        )}
                        {indicator.showAfter && (
                          <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                        )}
                        {indicator.showInside && note.is_folder && (
                          <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg" />
                        )}
                      </>
                    )
                  })()}
                  
                  <div className="flex items-start justify-between gap-2">
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
                      
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-tight">
                        {getContentPreview(note.content, 80)}
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

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Favorite star - always visible if favorited, otherwise shown on hover */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(note.id)
                        }}
                        className={`h-8 w-8 p-0 ${note.is_favorite ? 'opacity-100 text-yellow-500 hover:text-yellow-600' : 'opacity-0 group-hover:opacity-100 hover:text-yellow-500'} transition-all`}
                      >
                        <Star className={`h-4 w-4 ${note.is_favorite ? 'fill-current' : ''}`} />
                      </Button>
                      
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
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteNote(note, e)}
                          className="h-8 w-8 p-0 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
