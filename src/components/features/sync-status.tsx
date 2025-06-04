// src/components/features/sync-status.tsx
'use client'

import React from 'react'
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle, Clock, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSyncStore } from '@/stores/sync'
import { useDeviceStore } from '@/stores/device'
import { useSyncStatus } from '@/hooks/use-sync-status'
import { useRealtime } from '@/hooks/use-realtime'

interface SyncStatusProps {
  className?: string
  showDetails?: boolean
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const {
    isConnected,
    connectionError,
    isSyncing,
    pendingSyncCount,
    hasUnresolvedConflicts,
    getConnectionDisplayText,
    getSyncDisplayText
  } = useSyncStore()

  const { activeDevices } = useDeviceStore()
  const { forceSyncAll } = useSyncStatus()
  const { reconnect } = useRealtime()

  const connectionText = getConnectionDisplayText()
  const syncText = getSyncDisplayText()

  const getStatusIcon = () => {
    if (hasUnresolvedConflicts) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
    
    if (connectionError) {
      return <WifiOff className="h-4 w-4 text-red-500" />
    }
    
    if (!isConnected) {
      return <WifiOff className="h-4 w-4 text-gray-400" />
    }
    
    if (isSyncing) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    }
    
    if (pendingSyncCount > 0) {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getStatusColor = () => {
    if (hasUnresolvedConflicts) return 'text-orange-600'
    if (connectionError) return 'text-red-600'
    if (!isConnected) return 'text-gray-500'
    if (isSyncing) return 'text-blue-600'
    if (pendingSyncCount > 0) return 'text-yellow-600'
    return 'text-green-600'
  }

  const handleRetryConnection = () => {
    reconnect()
  }

  const handleForcSync = () => {
    forceSyncAll()
  }

  if (!showDetails) {
    // Compact status display
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-gray-400" />
        )}
        {activeDevices.length > 1 && (
          <div className="flex items-center space-x-1">
            <Smartphone className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">{activeDevices.length}</span>
          </div>
        )}
      </div>
    )
  }

  // Detailed status display
  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-lg p-4 ${className}`}>
      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">Connection</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${getStatusColor()}`}>
              {connectionText}
            </span>
            {connectionError && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetryConnection}
                className="h-6 px-2 text-xs"
              >
                Retry
              </Button>
            )}
          </div>
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">Sync</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${getStatusColor()}`}>
              {syncText}
            </span>
            {pendingSyncCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleForcSync}
                disabled={isSyncing}
                className="h-6 px-2 text-xs"
              >
                Sync Now
              </Button>
            )}
          </div>
        </div>

        {/* Device Count */}
        {activeDevices.length > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Devices</span>
            </div>
            <span className="text-sm text-gray-600">
              {activeDevices.length} active
            </span>
          </div>
        )}

        {/* Conflicts Warning */}
        {hasUnresolvedConflicts && (
          <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-800 dark:text-orange-200">
                Sync conflicts need resolution
              </span>
            </div>
          </div>
        )}

        {/* Connection Error */}
        {connectionError && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-800 dark:text-red-200">
                {connectionError}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
