// src/services/sync-service.ts
import { supabase } from '@/lib/supabase/client'
import { Note } from '@/types'
import { deviceService } from './device-service'

export interface SyncConflict {
  noteId: string
  localVersion: number
  remoteVersion: number
  localContent: string
  remoteContent: string
  localTitle: string
  remoteTitle: string
  lastModified: string
}

export interface SyncResult {
  success: boolean
  conflict?: SyncConflict
  resolvedNote?: Note
  error?: string
}

export interface SyncStats {
  totalNotes: number
  synced: number
  conflicts: number
  errors: number
}

export class SyncService {
  private static instance: SyncService
  private syncQueue: Map<string, Note> = new Map()
  private isSyncing = false

  private constructor() {
    // Periodically sync queued changes
    setInterval(() => {
      this.processSyncQueue()
    }, 5000) // Every 5 seconds
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  /**
   * Save note with conflict resolution
   */
  async saveNote(note: Note): Promise<SyncResult> {
    try {
      // Add device information
      const noteWithDevice = {
        ...note,
        device_id: deviceService.getDeviceId(),
        updated_at: new Date().toISOString()
      }

      // Check for conflicts using the database function
      const { data: conflictResult, error: conflictError } = await supabase
        .rpc('resolve_note_conflict', {
          note_id: note.id,
          client_version: note.version || 1,
          new_content: note.content || '',
          new_title: note.title
        })

      if (conflictError) {
        console.log('Conflict resolution error:', conflictError)
        
        // Fallback to simple update if function doesn't exist
        if (conflictError.message && conflictError.message.includes('could not find function')) {
          console.log('Using fallback update method - database function missing')
          
          try {
            const { data: updatedNote, error: updateError } = await supabase
              .from('notes')
              .update({
                title: noteWithDevice.title,
                content: noteWithDevice.content,
                updated_at: noteWithDevice.updated_at,
                device_id: noteWithDevice.device_id,
                version: (noteWithDevice.version || 1) + 1
              })
              .eq('id', note.id)
              .select()
              .single()

            if (updateError) {
              console.log('Fallback update failed:', updateError.message)
              return { success: false, error: updateError.message }
            }

            console.log('Fallback update successful')
            return { success: true, resolvedNote: updatedNote }
          } catch (fallbackError) {
            console.log('Fallback method failed:', fallbackError)
            return { success: false, error: 'Both main and fallback save methods failed' }
          }
        }
        
        return { success: false, error: conflictError.message || 'Conflict resolution failed' }
      }

      const result = conflictResult?.[0]
      
      if (!result?.success && result?.conflict) {
        // Conflict detected - get the current version from server
        const { data: currentNote, error: fetchError } = await supabase
          .from('notes')
          .select('*')
          .eq('id', note.id)
          .single()

        if (fetchError) {
          return { success: false, error: fetchError.message }
        }

        // Return conflict for resolution
        const conflict: SyncConflict = {
          noteId: note.id,
          localVersion: note.version || 1,
          remoteVersion: result.current_version,
          localContent: note.content || '',
          remoteContent: currentNote.content || '',
          localTitle: note.title,
          remoteTitle: currentNote.title,
          lastModified: currentNote.updated_at
        }

        return { success: false, conflict }
      }

      // No conflict - note was updated successfully
      const { data: updatedNote, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', note.id)
        .single()

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      return { success: true, resolvedNote: updatedNote }
    } catch (error) {
      console.error('Save note error:', error)
      
      // Add to sync queue for retry
      this.addToSyncQueue(note)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Save failed'
      }
    }
  }

  /**
   * Resolve conflict with user choice
   */
  async resolveConflict(
    conflict: SyncConflict,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<SyncResult> {
    try {
      let resolvedContent: string
      let resolvedTitle: string

      switch (resolution) {
        case 'local':
          resolvedContent = conflict.localContent
          resolvedTitle = conflict.localTitle
          break
        case 'remote':
          resolvedContent = conflict.remoteContent
          resolvedTitle = conflict.remoteTitle
          break
        case 'merge':
          // Simple merge strategy - could be enhanced
          resolvedContent = this.mergeContent(conflict.localContent, conflict.remoteContent)
          resolvedTitle = conflict.localTitle // Use local title for merge
          break
        default:
          return { success: false, error: 'Invalid resolution strategy' }
      }

      // Force update with new version
      const { data: updatedNote, error } = await supabase
        .from('notes')
        .update({
          content: resolvedContent,
          title: resolvedTitle,
          version: conflict.remoteVersion + 1,
          device_id: deviceService.getDeviceId(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conflict.noteId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, resolvedNote: updatedNote }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Conflict resolution failed'
      }
    }
  }

  /**
   * Simple content merge strategy
   */
  private mergeContent(localContent: string, remoteContent: string): string {
    // This is a simple merge - in production you might want to use
    // a more sophisticated diff/merge algorithm
    
    if (localContent === remoteContent) {
      return localContent
    }

    // If one is empty, use the other
    if (!localContent.trim()) return remoteContent
    if (!remoteContent.trim()) return localContent

    // Simple line-based merge
    const localLines = localContent.split('\n')
    const remoteLines = remoteContent.split('\n')
    
    // For now, append remote changes to local
    // This could be enhanced with proper diff algorithms
    return `${localContent}\n\n--- Merged from other device ---\n${remoteContent}`
  }

  /**
   * Add note to sync queue for later processing
   */
  private addToSyncQueue(note: Note): void {
    this.syncQueue.set(note.id, note)
  }

  /**
   * Process queued sync operations
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.size === 0) {
      return
    }

    this.isSyncing = true

    try {
      const queuedNotes = Array.from(this.syncQueue.values())
      console.log(`Processing sync queue: ${queuedNotes.length} notes`)

      for (const note of queuedNotes) {
        try {
          const result = await this.saveNote(note)
          
          if (result.success) {
            this.syncQueue.delete(note.id)
            console.log(`Successfully synced note: ${note.id}`)
          } else if (result.conflict) {
            // Keep in queue but log conflict
            console.log(`Conflict detected for note: ${note.id}`)
          }
        } catch (error) {
          console.error(`Failed to sync note ${note.id}:`, error)
        }
      }
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Get sync queue status
   */
  getSyncQueueStatus(): { pending: number; notes: Note[] } {
    const notes = Array.from(this.syncQueue.values())
    return {
      pending: notes.length,
      notes
    }
  }

  /**
   * Force sync all queued items
   */
  async forceSyncAll(): Promise<SyncStats> {
    const stats: SyncStats = {
      totalNotes: this.syncQueue.size,
      synced: 0,
      conflicts: 0,
      errors: 0
    }

    if (stats.totalNotes === 0) {
      return stats
    }

    this.isSyncing = true

    try {
      const queuedNotes = Array.from(this.syncQueue.values())

      for (const note of queuedNotes) {
        try {
          const result = await this.saveNote(note)
          
          if (result.success) {
            stats.synced++
            this.syncQueue.delete(note.id)
          } else if (result.conflict) {
            stats.conflicts++
          } else {
            stats.errors++
          }
        } catch (error) {
          stats.errors++
          console.error(`Sync error for note ${note.id}:`, error)
        }
      }
    } finally {
      this.isSyncing = false
    }

    return stats
  }

  /**
   * Clear sync queue (useful for testing or reset)
   */
  clearSyncQueue(): void {
    this.syncQueue.clear()
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing
  }

  /**
   * Sync a specific note immediately
   */
  async syncNoteImmediately(note: Note): Promise<SyncResult> {
    return this.saveNote(note)
  }

  /**
   * Fetch latest version of a note from server
   */
  async fetchLatestNote(noteId: string): Promise<{ data: Note | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Fetch failed'
      }
    }
  }
}

export const syncService = SyncService.getInstance()
