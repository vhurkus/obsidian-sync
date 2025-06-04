import { Session } from '@supabase/supabase-js'

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export interface NoteWithTags extends Note {
  tags?: Tag[]
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error' | 'offline'
  lastSync: Date | null
  pendingChanges: number
}

export interface EditorState {
  content: string
  isDirty: boolean
  lastSaved: Date | null
  isAutoSaving: boolean
}

export interface SearchState {
  query: string
  results: Note[]
  loading: boolean
  filters: {
    tags: string[]
    dateRange?: {
      start: Date
      end: Date
    }
    favorites?: boolean
    recent?: boolean
  }
}

export interface SearchResult {
  note: Note
  highlights: string[]
  score: number
}

export interface QuickSwitcherState {
  isOpen: boolean
  query: string
  results: SearchResult[]
  selectedIndex: number
  loading: boolean
}

export type Theme = 'light' | 'dark' | 'system'

export interface AppSettings {
  theme: Theme
  autoSave: boolean
  autoSaveInterval: number
  showPreview: boolean
  editorFontSize: number
  previewFontSize: number
  spellCheck: boolean
}

export interface DeviceInfo {
  id: string
  name: string
  type: 'desktop' | 'mobile' | 'tablet'
  lastSeen: Date
}

// Import from database types
import type { Note, Tag, NoteTag, SyncQueueItem } from './database.types'

// Export the imported types
export type { Note, Tag, NoteTag, SyncQueueItem }

// Note input types for CRUD operations
export interface NoteCreateInput {
  title: string
  content?: string
  path: string
  parent_id?: string
  is_folder?: boolean
  device_id?: string
}

export interface NoteUpdateInput {
  title?: string
  content?: string
  path?: string
  parent_id?: string
  is_folder?: boolean
}
