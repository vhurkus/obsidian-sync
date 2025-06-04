// src/stores/sync.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { SyncConflict, SyncStats } from '@/services/sync-service'

export interface SyncState {
  // Connection status
  isConnected: boolean
  isConnecting: boolean
  lastConnected: Date | null
  lastDisconnected: Date | null
  connectionError: string | null

  // Sync status
  isSyncing: boolean
  syncProgress: number
  pendingSyncCount: number
  lastSyncTime: Date | null

  // Conflicts
  conflicts: SyncConflict[]
  hasUnresolvedConflicts: boolean

  // Stats
  syncStats: SyncStats | null

  // Actions
  setConnectionStatus: (status: {
    connected: boolean
    connecting?: boolean
    error?: string | null
    lastConnected?: Date | null
    lastDisconnected?: Date | null
  }) => void

  setSyncStatus: (status: {
    syncing?: boolean
    progress?: number
    pendingCount?: number
    lastSyncTime?: Date | null
  }) => void

  addConflict: (conflict: SyncConflict) => void
  removeConflict: (noteId: string) => void
  clearConflicts: () => void

  setSyncStats: (stats: SyncStats | null) => void
  
  // Computed getters
  getConnectionDisplayText: () => string
  getSyncDisplayText: () => string
}

export const useSyncStore = create<SyncState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isConnected: false,
      isConnecting: false,
      lastConnected: null,
      lastDisconnected: null,
      connectionError: null,

      isSyncing: false,
      syncProgress: 0,
      pendingSyncCount: 0,
      lastSyncTime: null,

      conflicts: [],
      hasUnresolvedConflicts: false,

      syncStats: null,

      // Actions
      setConnectionStatus: (status) => {
        set((state) => ({
          isConnected: status.connected,
          isConnecting: status.connecting ?? state.isConnecting,
          connectionError: status.error ?? state.connectionError,
          lastConnected: status.lastConnected ?? state.lastConnected,
          lastDisconnected: status.lastDisconnected ?? state.lastDisconnected,
        }), false, 'setConnectionStatus')
      },

      setSyncStatus: (status) => {
        set((state) => ({
          isSyncing: status.syncing ?? state.isSyncing,
          syncProgress: status.progress ?? state.syncProgress,
          pendingSyncCount: status.pendingCount ?? state.pendingSyncCount,
          lastSyncTime: status.lastSyncTime ?? state.lastSyncTime,
        }), false, 'setSyncStatus')
      },

      addConflict: (conflict) => {
        set((state) => {
          const existingIndex = state.conflicts.findIndex(c => c.noteId === conflict.noteId)
          const newConflicts = [...state.conflicts]
          
          if (existingIndex >= 0) {
            newConflicts[existingIndex] = conflict
          } else {
            newConflicts.push(conflict)
          }

          return {
            conflicts: newConflicts,
            hasUnresolvedConflicts: newConflicts.length > 0
          }
        }, false, 'addConflict')
      },

      removeConflict: (noteId) => {
        set((state) => {
          const newConflicts = state.conflicts.filter(c => c.noteId !== noteId)
          return {
            conflicts: newConflicts,
            hasUnresolvedConflicts: newConflicts.length > 0
          }
        }, false, 'removeConflict')
      },

      clearConflicts: () => {
        set({
          conflicts: [],
          hasUnresolvedConflicts: false
        }, false, 'clearConflicts')
      },

      setSyncStats: (stats) => {
        set({ syncStats: stats }, false, 'setSyncStats')
      },

      // Computed getters
      getConnectionDisplayText: () => {
        const state = get()
        
        if (state.isConnecting) {
          return 'Connecting...'
        }
        
        if (state.isConnected) {
          return 'Connected'
        }
        
        if (state.connectionError) {
          // Provide user-friendly error messages
          if (state.connectionError.includes('Authentication required')) {
            return 'Login required for sync'
          }
          if (state.connectionError.includes('Channel error')) {
            return 'Connection error - please login'
          }
          if (state.connectionError.includes('timeout')) {
            return 'Connection timeout'
          }
          return `Connection error`
        }
        
        return 'Disconnected'
      },

      getSyncDisplayText: () => {
        const state = get()
        
        if (state.isSyncing) {
          if (state.syncProgress > 0) {
            return `Syncing... ${Math.round(state.syncProgress)}%`
          }
          return 'Syncing...'
        }
        
        if (state.pendingSyncCount > 0) {
          return `${state.pendingSyncCount} pending`
        }
        
        if (state.lastSyncTime) {
          const now = new Date()
          const diff = now.getTime() - state.lastSyncTime.getTime()
          const minutes = Math.floor(diff / 60000)
          
          if (minutes < 1) {
            return 'Synced just now'
          } else if (minutes < 60) {
            return `Synced ${minutes}m ago`
          } else {
            const hours = Math.floor(minutes / 60)
            return `Synced ${hours}h ago`
          }
        }
        
        return 'Not synced'
      }
    }),
    {
      name: 'sync-store',
    }
  )
)
