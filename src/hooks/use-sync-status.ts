// src/hooks/use-sync-status.ts
import { useEffect, useCallback, useRef } from 'react'
import { useSyncStore } from '@/stores/sync'
import { syncService, SyncConflict } from '@/services/sync-service'

export const useSyncStatus = () => {
  const {
    isSyncing,
    syncProgress,
    pendingSyncCount,
    lastSyncTime,
    conflicts,
    hasUnresolvedConflicts,
    setSyncStatus,
    addConflict,
    removeConflict,
    setSyncStats
  } = useSyncStore()

  const syncStatusInterval = useRef<NodeJS.Timeout | null>(null)

  // Monitor sync queue status
  const updateSyncStatus = useCallback(() => {
    const queueStatus = syncService.getSyncQueueStatus()
    const isCurrentlySyncing = syncService.isSyncInProgress()
    
    setSyncStatus({
      syncing: isCurrentlySyncing,
      pendingCount: queueStatus.pending,
      lastSyncTime: queueStatus.pending === 0 ? new Date() : undefined
    })
  }, [setSyncStatus])

  // Force sync all pending items
  const forceSyncAll = useCallback(async () => {
    try {
      setSyncStatus({ syncing: true, progress: 0 })
      
      const stats = await syncService.forceSyncAll()
      
      setSyncStats(stats)
      setSyncStatus({ 
        syncing: false, 
        progress: 100,
        lastSyncTime: new Date() 
      })

      // Update sync status after force sync
      updateSyncStatus()

      return stats
    } catch (error) {
      console.error('Force sync error:', error)
      setSyncStatus({ syncing: false, progress: 0 })
      throw error
    }
  }, [setSyncStatus, setSyncStats, updateSyncStatus])

  // Resolve a specific conflict
  const resolveConflict = useCallback(async (
    conflict: SyncConflict,
    resolution: 'local' | 'remote' | 'merge'
  ) => {
    try {
      const result = await syncService.resolveConflict(conflict, resolution)
      
      if (result.success) {
        removeConflict(conflict.noteId)
        return result.resolvedNote
      } else {
        throw new Error(result.error || 'Conflict resolution failed')
      }
    } catch (error) {
      console.error('Conflict resolution error:', error)
      throw error
    }
  }, [removeConflict])

  // Get sync queue details
  const getSyncQueueStatus = useCallback(() => {
    return syncService.getSyncQueueStatus()
  }, [])

  // Clear all sync queue items
  const clearSyncQueue = useCallback(() => {
    syncService.clearSyncQueue()
    // Call updateSyncStatus directly without dependency
    const queueStatus = syncService.getSyncQueueStatus()
    const isCurrentlySyncing = syncService.isSyncInProgress()
    
    setSyncStatus({
      syncing: isCurrentlySyncing,
      pendingCount: queueStatus.pending,
      lastSyncTime: queueStatus.pending === 0 ? new Date() : undefined
    })
  }, [setSyncStatus])

  // Start monitoring sync status
  useEffect(() => {
    // Initial status update
    const initialUpdate = () => {
      const queueStatus = syncService.getSyncQueueStatus()
      const isCurrentlySyncing = syncService.isSyncInProgress()
      
      setSyncStatus({
        syncing: isCurrentlySyncing,
        pendingCount: queueStatus.pending,
        lastSyncTime: queueStatus.pending === 0 ? new Date() : undefined
      })
    }
    
    initialUpdate()

    // Set up periodic status updates
    syncStatusInterval.current = setInterval(initialUpdate, 2000) // Every 2 seconds

    return () => {
      if (syncStatusInterval.current) {
        clearInterval(syncStatusInterval.current)
      }
    }
  }, [setSyncStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncStatusInterval.current) {
        clearInterval(syncStatusInterval.current)
      }
    }
  }, [])

  return {
    // Status
    isSyncing,
    syncProgress,
    pendingSyncCount,
    lastSyncTime,
    conflicts,
    hasUnresolvedConflicts,

    // Actions
    forceSyncAll,
    resolveConflict,
    getSyncQueueStatus,
    clearSyncQueue,
    updateSyncStatus,

    // Computed
    hasPendingSync: pendingSyncCount > 0,
    syncStatusText: useSyncStore.getState().getSyncDisplayText()
  }
}
