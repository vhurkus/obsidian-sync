'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useNoteStore } from '@/stores/note'
import { Button } from '@/components/ui/button'
import { NotesList } from '@/components/features/notes-list'
import { MonacoEditor } from '@/components/features/monaco-editor'
import { MarkdownPreview } from '@/components/features/markdown-preview'
import { FileText, Settings, LogOut, Menu, X, Eye, Edit, Split } from 'lucide-react'
import { NoteWithTags } from '@/types'

export default function DashboardPage() {
  const { user, signOut, initialize } = useAuthStore()
  const { currentNote, setCurrentNote, createNote } = useNoteStore()
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split')
  const [newNoteTitle, setNewNoteTitle] = useState('')

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleSignOut = async () => {
    await signOut()
  }

  const handleNoteSelect = (note: NoteWithTags) => {
    setCurrentNote(note)
    setIsCreatingNew(false)
    // Close sidebar on mobile after selecting a note
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  const handleNewNote = () => {
    setCurrentNote(null)
    setIsCreatingNew(true)
    setNewNoteTitle('')
    // Close sidebar on mobile when creating new note
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return

    const noteInput = {
      title: newNoteTitle,
      content: `# ${newNoteTitle}\n\n`,
      path: `/${newNoteTitle.toLowerCase().replace(/\s+/g, '-')}`,
      is_folder: false,
    }

    const { data, error } = await createNote(noteInput)
    if (data && !error) {
      setCurrentNote(data)
      setIsCreatingNew(false)
    }
  }

  const handleNoteSave = (note: NoteWithTags) => {
    setCurrentNote(note)
    setIsCreatingNew(false)
  }

  const handleCancelEdit = () => {
    setIsCreatingNew(false)
    setCurrentNote(null)
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <div className="p-2 bg-slate-900 dark:bg-slate-100 rounded-md">
              <FileText className="h-5 w-5 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">ObsidianSync</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Hoş geldiniz, {user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar - Notes List */}
        <div className={`
          flex-shrink-0 w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950
          ${isSidebarOpen ? 'block' : 'hidden md:block'}
          md:relative absolute inset-y-0 left-0 z-50 md:z-auto
        `}>
          <div className="h-full p-4">
            <NotesList
              onNoteSelect={handleNoteSelect}
              onNewNote={handleNewNote}
              selectedNoteId={currentNote?.id}
            />
          </div>
        </div>

        {/* Mobile sidebar backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {isCreatingNew ? (
            /* New note creation */
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Yeni Not Oluştur
                </h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Not başlığı..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateNote()
                      } else if (e.key === 'Escape') {
                        handleCancelEdit()
                      }
                    }}
                  />
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={handleCreateNote}
                      disabled={!newNoteTitle.trim()}
                    >
                      Oluştur
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      İptal
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : currentNote ? (
            /* Monaco Editor with split view */
            <div className="h-full flex flex-col">
              {/* View mode controls */}
              <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {currentNote.title}
                  </h2>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={viewMode === 'edit' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('edit')}
                      className="h-8"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      variant={viewMode === 'preview' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('preview')}
                      className="h-8"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Önizleme
                    </Button>
                    <Button
                      variant={viewMode === 'split' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('split')}
                      className="h-8"
                    >
                      <Split className="h-4 w-4 mr-1" />
                      Split
                    </Button>
                  </div>
                </div>
              </div>

              {/* Editor/Preview area */}
              <div className="flex-1 flex min-h-0">
                {viewMode === 'edit' && (
                  <MonacoEditor
                    note={currentNote}
                    onSave={handleNoteSave}
                    className="w-full"
                  />
                )}
                
                {viewMode === 'preview' && (
                  <MarkdownPreview
                    note={currentNote}
                    className="w-full"
                  />
                )}
                
                {viewMode === 'split' && (
                  <>
                    <MonacoEditor
                      note={currentNote}
                      onSave={handleNoteSave}
                      className="w-1/2 border-r border-slate-200 dark:border-slate-800"
                    />
                    <MarkdownPreview
                      note={currentNote}
                      className="w-1/2"
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Welcome screen when no note is selected */
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <FileText className="h-12 w-12 text-slate-400" />
                </div>                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  ObsidianSync&apos;e Hoş Geldiniz
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Sol taraftaki listeden bir not seçin veya yeni bir not oluşturmaya başlayın.
                  Monaco Editor ile VS Code benzeri bir düzenleme deneyimi yaşayacaksınız.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleNewNote} className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    İlk Notunuzu Oluşturun
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Notları Göster
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
