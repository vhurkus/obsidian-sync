import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import { Note, NoteWithTags, NoteCreateInput, NoteUpdateInput } from '@/types'

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
          const { data, error } = await supabase
            .from('notes')
            .select(`
              *,
              tags:note_tags(
                tag:tags(*)
              )
            `)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false })

          if (error) {
            set({ error: error.message, loading: false })
            return
          }

          // Transform the data to include tags properly
          const transformedNotes = data.map(note => ({
            ...note,
            tags: note.tags?.map((nt: any) => nt.tag) || []
          }))

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
            user_id: user.id,
            title: input.title,
            content: input.content || '',
            path: input.path,
            parent_id: input.parent_id,
            is_folder: input.is_folder || false,
            device_id: input.device_id || 'web'
          }

          const { data, error } = await supabase
            .from('notes')
            .insert([noteData])
            .select()
            .single()

          if (error) {
            set({ error: error.message, loading: false })
            return { data: null, error: error.message }
          }

          // Add the new note to the store
          const currentNotes = get().notes
          set({ 
            notes: [data, ...currentNotes],
            currentNote: data,
            loading: false 
          })

          return { data, error: null }
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

          const { data, error } = await supabase
            .from('notes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

          if (error) {
            set({ error: error.message, loading: false })
            return { error: error.message }
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
          const errorMessage = error instanceof Error ? error.message : 'Not güncellenemedi'
          set({ error: errorMessage, loading: false })
          return { error: errorMessage }
        }
      },

      deleteNote: async (id: string) => {
        set({ loading: true, error: null })

        try {
          // Soft delete
          const { error } = await supabase
            .from('notes')
            .update({ 
              deleted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id)

          if (error) {
            set({ error: error.message, loading: false })
            return { error: error.message }
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
          const errorMessage = error instanceof Error ? error.message : 'Not silinemedi'
          set({ error: errorMessage, loading: false })
          return { error: errorMessage }
        }
      },

      // Setters
      setCurrentNote: (note: Note | null) => set({ currentNote: note }),
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
