'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useSyncStatus } from '@/hooks/use-sync-status'
import { useDevice } from '@/hooks/use-device'

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user } = useAuthStore()
  const { reconnect } = useRealtime()
  const { updateSyncStatus } = useSyncStatus()
  const { loadActiveDevices, updateActivity } = useDevice()

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    if (user) {
      // Load active devices
      loadActiveDevices()
      
      // Initialize sync status monitoring
      updateSyncStatus()
      
      // No need to call reconnect here - the useRealtime hook will handle the initial connection
      // Only reconnect if needed for recovery
      // reconnect()
      
      // Update activity periodically
      const activityInterval = setInterval(() => {
        updateActivity()
      }, 30000) // Update every 30 seconds

      return () => {
        clearInterval(activityInterval)
        // No need to manually disconnect - handled by useRealtime cleanup
      }
    }
  }, [user, loadActiveDevices, updateActivity, updateSyncStatus])

  return <>{children}</>
}
