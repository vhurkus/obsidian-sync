export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string | null
          path: string
          parent_id: string | null
          is_folder: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
          device_id: string | null
          version: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string | null
          path: string
          parent_id?: string | null
          is_folder?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          device_id?: string | null
          version?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string | null
          path?: string
          parent_id?: string | null
          is_folder?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          device_id?: string | null
          version?: number
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          created_at?: string
        }
      }
      note_tags: {
        Row: {
          note_id: string
          tag_id: string
        }
        Insert: {
          note_id: string
          tag_id: string
        }
        Update: {
          note_id?: string
          tag_id?: string
        }
      }
      sync_queue: {
        Row: {
          id: string
          user_id: string
          device_id: string
          action: string
          resource_type: string
          resource_id: string | null
          payload: Json | null
          created_at: string
          synced_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          action: string
          resource_type: string
          resource_id?: string | null
          payload?: Json | null
          created_at?: string
          synced_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          action?: string
          resource_type?: string
          resource_id?: string | null
          payload?: Json | null
          created_at?: string
          synced_at?: string | null
        }
      }
      search_index: {
        Row: {
          note_id: string
          user_id: string
          search_text: unknown
          updated_at: string
        }
        Insert: {
          note_id: string
          user_id: string
          search_text: unknown
          updated_at?: string
        }
        Update: {
          note_id?: string
          user_id?: string
          search_text?: unknown
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Note = Database['public']['Tables']['notes']['Row']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']
export type NoteUpdate = Database['public']['Tables']['notes']['Update']

export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']
export type TagUpdate = Database['public']['Tables']['tags']['Update']

export type NoteTag = Database['public']['Tables']['note_tags']['Row']
export type SyncQueueItem = Database['public']['Tables']['sync_queue']['Row']
export type SearchIndex = Database['public']['Tables']['search_index']['Row']
