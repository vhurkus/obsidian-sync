import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import { searchService } from '@/services/search-service'
import { indexedDBService } from '@/services/indexeddb-service'
import { NoteWithTags, NoteCreateInput, NoteUpdateInput } from '@/types'

interface NoteStore {
  // State
  notes: NoteWithTags[]
  currentNote: NoteWithTags | null
  loading: boolean
  error: string | null
  searchQuery: string
  selectedTags: string[]

  // Actions
  fetchNotes: () => Promise<void>
  createNote: (input: NoteCreateInput) => Promise<{ data: NoteWithTags | null; error: string | null }>
  updateNote: (id: string, input: NoteUpdateInput) => Promise<{ error: string | null }>
  deleteNote: (id: string) => Promise<{ error: string | null }>
  toggleFavorite: (noteId: string) => Promise<{ error: string | null }>
  updateAccessTime: (noteId: string) => Promise<void>
  setCurrentNote: (note: NoteWithTags | null) => void
  setSearchQuery: (query: string) => void
  setSelectedTags: (tags: string[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearNotes: () => void
}

export const useNoteStore = create<NoteStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      notes: [],
      currentNote: null,
      loading: false,
      error: null,
      searchQuery: '',
      selectedTags: [],

      // Actions
      fetchNotes: async () => {
        set({ loading: true, error: null })
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          
          if (!user) {
            throw new Error('Kullanıcı oturumu bulunamadı')
          }

          // Check if online
          const isOnline = navigator.onLine

          if (isOnline) {
            // Try to load from server first
            try {
              let data, error;
              
              // Try to load notes with tags
              const result = await supabase
                .from('notes')
                .select(`
                  *,
                  note_tags(
                    tags(*)
                  )
                `)
                .is('deleted_at', null)
                .order('updated_at', { ascending: false });
              
              data = result.data;
              error = result.error;
              
              if (data && !error) {
                // Transform the data to match NoteWithTags interface
                const transformedNotes: NoteWithTags[] = data.map(note => ({
                  ...note,
                  tags: note.note_tags?.map((nt: any) => nt.tags).filter(Boolean) || []
                }));
                
                // Save to IndexedDB for offline access
                for (const note of data) {
                  await indexedDBService.saveNote({
                    ...note,
                    sync_status: 'synced'
                  })
                }
                
                set({ notes: transformedNotes, loading: false });
                return;
              }
            } catch (relationshipError) {
              console.log('Relationship query failed, falling back to simple query');
              
              // Fallback to simple query
              const simpleResult = await supabase
                .from('notes')
                .select('*')
                .is('deleted_at', null)
                .order('updated_at', { ascending: false });

              if (!simpleResult.error && simpleResult.data) {
                // Transform to include empty tags array
                const transformedNotes: NoteWithTags[] = simpleResult.data.map(note => ({
                  ...note,
                  tags: [] // Empty tags array for now
                }));

                // Save to IndexedDB for offline access
                for (const note of simpleResult.data) {
                  await indexedDBService.saveNote({
                    ...note,
                    sync_status: 'synced'
                  })
                }

                set({ notes: transformedNotes, loading: false })
                return;
              }
            }
          }

          // Load from IndexedDB (offline or as fallback)
          console.log('[Note Store] Loading notes from IndexedDB')
          const offlineNotes = await indexedDBService.getAllNotes(user.id)
          
          // Filter out deleted notes and transform to NoteWithTags
          const transformedNotes: NoteWithTags[] = offlineNotes
            .filter(note => !note.deleted_at)
            .map(note => ({
              ...note,
              tags: [] // Empty tags array for offline notes
            }))
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

          set({ notes: transformedNotes, loading: false })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Notlar yüklenemedi'
          set({ error: errorMessage, loading: false })
        }
      },

      createNote: async (input: NoteCreateInput) => {
        set({ loading: true, error: null })

        try {
          const { data: { user } } = await supabase.auth.getUser()
          
          if (!user) {
            throw new Error('Kullanıcı oturumu bulunamadı')
          }

          const noteData = {
            id: crypto.randomUUID(),
            user_id: user.id,
            title: input.title,
            content: input.content || '',
            path: input.path,
            parent_id: input.parent_id || null,
            is_folder: input.is_folder || false,
            device_id: input.device_id || 'web',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version: 1
          }

          // Check if online
          const isOnline = navigator.onLine

          if (isOnline) {
            // Try to create online first
            try {
              const { data, error } = await supabase
                .from('notes')
                .insert([noteData])
                .select()
                .single()

              if (error) throw error

              // Save to IndexedDB for offline access
              await indexedDBService.saveNote({
                ...data,
                sync_status: 'synced'
              })

              // Add the new note to the store
              const currentNotes = get().notes
              const noteWithTags = { ...data, tags: [] }
              set({ 
                notes: [noteWithTags, ...currentNotes],
                currentNote: noteWithTags,
                loading: false 
              })

              return { data: noteWithTags, error: null }

            } catch (error) {
              console.log('[Note Store] Online creation failed, falling back to offline:', error)
              // Fall through to offline creation
            }
          }

          // Create offline with all required properties
          const noteWithTags = { 
            ...noteData, 
            parent_id: noteData.parent_id || null,
            tags: [],
            deleted_at: null,
            is_favorite: false,
            last_accessed_at: null
          }
          
          // Save to IndexedDB
          await indexedDBService.saveNote({
            ...noteData,
            parent_id: noteData.parent_id || null,
            deleted_at: null,
            is_favorite: false,
            last_accessed_at: null,
            sync_status: 'pending'
          })

          // Add to sync queue
          const { useOfflineStore } = await import('@/stores/offline')
          const addToSyncQueue = useOfflineStore.getState().addToSyncQueue
          await addToSyncQueue({
            user_id: user.id,
            device_id: noteData.device_id,
            action: 'create',
            resource_type: 'note',
            resource_id: noteData.id,
            payload: {
              ...noteData,
              parent_id: noteData.parent_id || null,
              deleted_at: null,
              is_favorite: false,
              last_accessed_at: null
            }
          })

          // Add the new note to the store
          const currentNotes = get().notes
          set({ 
            notes: [noteWithTags, ...currentNotes],
            currentNote: noteWithTags,
            loading: false 
          })

          return { data: noteWithTags, error: null }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Not oluşturulamadı'
          set({ error: errorMessage, loading: false })
          return { data: null, error: errorMessage }
        }
      },

      updateNote: async (id: string, input: NoteUpdateInput) => {
        set({ loading: true, error: null })

        try {
          const updateData = {
            ...input,
            updated_at: new Date().toISOString(),
            version: (get().currentNote?.version || 0) + 1
          }

          // Check if online
          const isOnline = navigator.onLine

          if (isOnline) {
            // Try to update online first
            try {
              const { data, error } = await supabase
                .from('notes')
                .update(updateData)
                .eq('id', id)
                .select()
                .single()

              if (error) throw error

              // Update IndexedDB
              const existingOfflineNote = await indexedDBService.getNote(id)
              if (existingOfflineNote) {
                await indexedDBService.saveNote({
                  ...existingOfflineNote,
                  ...data,
                  sync_status: 'synced'
                })
              }

              // Update the note in the store
              const currentNotes = get().notes
              const updatedNotes = currentNotes.map(note => 
                note.id === id ? { ...note, ...data } : note
              )

              set({ 
                notes: updatedNotes,
                currentNote: get().currentNote?.id === id ? { ...get().currentNote, ...data } : get().currentNote,
                loading: false 
              })

              return { error: null }

            } catch (error) {
              console.log('[Note Store] Online update failed, falling back to offline:', error)
              // Fall through to offline update
            }
          }

          // Update offline
          const existingOfflineNote = await indexedDBService.getNote(id)
          if (existingOfflineNote) {
            const updatedOfflineNote = {
              ...existingOfflineNote,
              ...updateData,
              sync_status: 'pending' as const
            }

            await indexedDBService.saveNote(updatedOfflineNote)

            // Add to sync queue
            const { useOfflineStore } = await import('@/stores/offline')
            const addToSyncQueue = useOfflineStore.getState().addToSyncQueue
            await addToSyncQueue({
              user_id: existingOfflineNote.user_id,
              device_id: existingOfflineNote.device_id || 'web',
              action: 'update',
              resource_type: 'note',
              resource_id: id,
              payload: updateData
            })

            // Update the note in the store
            const currentNotes = get().notes
            const updatedNotes = currentNotes.map(note => 
              note.id === id ? { ...note, ...updateData } : note
            )

            set({ 
              notes: updatedNotes,
              currentNote: get().currentNote?.id === id ? 
                { ...get().currentNote, ...updateData } as NoteWithTags : 
                get().currentNote,
              loading: false 
            })

            return { error: null }
          }

          throw new Error('Not bulunamadı')

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Not güncellenemedi'
          set({ error: errorMessage, loading: false })
          return { error: errorMessage }
        }
      },

      deleteNote: async (id: string) => {
        set({ loading: true, error: null })

        try {
          const deleteData = {
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Check if online
          const isOnline = navigator.onLine

          if (isOnline) {
            // Try to delete online first
            try {
              const { error } = await supabase
                .from('notes')
                .update(deleteData)
                .eq('id', id)

              if (error) throw error

              // Update IndexedDB
              const existingOfflineNote = await indexedDBService.getNote(id)
              if (existingOfflineNote) {
                await indexedDBService.saveNote({
                  ...existingOfflineNote,
                  ...deleteData,
                  sync_status: 'synced'
                })
              }

              // Remove from store
              const currentNotes = get().notes
              const filteredNotes = currentNotes.filter(note => note.id !== id)

              set({ 
                notes: filteredNotes,
                currentNote: get().currentNote?.id === id ? null : get().currentNote,
                loading: false 
              })

              return { error: null }

            } catch (error) {
              console.log('[Note Store] Online delete failed, falling back to offline:', error)
              // Fall through to offline delete
            }
          }

          // Delete offline
          const existingOfflineNote = await indexedDBService.getNote(id)
          if (existingOfflineNote) {
            await indexedDBService.saveNote({
              ...existingOfflineNote,
              ...deleteData,
              sync_status: 'pending'
            })

            // Add to sync queue
            const { useOfflineStore } = await import('@/stores/offline')
            const addToSyncQueue = useOfflineStore.getState().addToSyncQueue
            await addToSyncQueue({
              user_id: existingOfflineNote.user_id,
              device_id: existingOfflineNote.device_id || 'web',
              action: 'delete',
              resource_type: 'note',
              resource_id: id,
              payload: deleteData
            })

            // Remove from store
            const currentNotes = get().notes
            const filteredNotes = currentNotes.filter(note => note.id !== id)

            set({ 
              notes: filteredNotes,
              currentNote: get().currentNote?.id === id ? null : get().currentNote,
              loading: false 
            })

            return { error: null }
          }

          throw new Error('Not bulunamadı')

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Not silinemedi'
          set({ error: errorMessage, loading: false })
          return { error: errorMessage }
        }
      },

      toggleFavorite: async (noteId: string) => {
        try {
          const newStatus = await searchService.toggleFavorite(noteId)
          
          // Update the note in the store
          const currentNotes = get().notes
          const updatedNotes = currentNotes.map(note => 
            note.id === noteId ? { ...note, is_favorite: newStatus } : note
          )

          set({ 
            notes: updatedNotes,
            currentNote: get().currentNote?.id === noteId ? 
              { ...get().currentNote, is_favorite: newStatus } as NoteWithTags : 
              get().currentNote
          })

          return { error: null }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Favori durumu değiştirilemedi'
          set({ error: errorMessage })
          return { error: errorMessage }
        }
      },

      updateAccessTime: async (noteId: string) => {
        try {
          await searchService.updateAccessTime(noteId)
          
          // Update access time in store
          const currentNotes = get().notes
          const updatedNotes = currentNotes.map(note => 
            note.id === noteId ? 
              { ...note, last_accessed_at: new Date().toISOString() } : 
              note
          )

          set({ 
            notes: updatedNotes,
            currentNote: get().currentNote?.id === noteId ? 
              { ...get().currentNote, last_accessed_at: new Date().toISOString() } as NoteWithTags : 
              get().currentNote
          })
        } catch (error) {
          console.error('Error updating access time:', error)
        }
      },

      // Setters
      setCurrentNote: (note: NoteWithTags | null) => {
        set({ currentNote: note })
        // Update access time when a note is selected
        if (note) {
          get().updateAccessTime(note.id)
        }
      },
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setSelectedTags: (tags: string[]) => set({ selectedTags: tags }),
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearNotes: () => set({ notes: [], currentNote: null, error: null }),
    }),
    {
      name: 'note-store',
    }
  )
)
