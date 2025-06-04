// src/components/features/device-manager.tsx
'use client'

import React, { useState } from 'react'
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  Clock,
  AlertCircle,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDevice } from '@/hooks/use-device'

interface DeviceManagerProps {
  isOpen: boolean
  onClose: () => void
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({ isOpen, onClose }) => {
  const {
    activeDevices,
    devicesLoading,
    devicesError,
    currentDeviceId,
    loadActiveDevices,
    removeDevice,
    cleanupInactiveDevices,
    getDeviceDisplayInfo
  } = useDevice()

  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)

  const handleRefresh = async () => {
    await loadActiveDevices()
  }

  const handleRemoveDevice = async (deviceId: string) => {
    if (deviceId === currentDeviceId) {
      alert('Cannot remove current device')
      return
    }

    setRemovingDeviceId(deviceId)
    try {
      const result = await removeDevice(deviceId)
      if (!result.success) {
        alert(`Failed to remove device: ${result.error}`)
      }
    } catch {
      alert('Failed to remove device')
    } finally {
      setRemovingDeviceId(null)
    }
  }

  const handleCleanupInactive = async () => {
    setIsCleaningUp(true)
    try {
      await cleanupInactiveDevices()
    } catch {
      alert('Failed to cleanup inactive devices')
    } finally {
      setIsCleaningUp(false)
    }
  }

  const getDeviceIcon = (deviceName: string, isCurrent: boolean) => {
    const iconClass = `h-5 w-5 ${isCurrent ? 'text-blue-500' : 'text-gray-400'}`
    
    if (deviceName.toLowerCase().includes('mobile') || deviceName.toLowerCase().includes('android') || deviceName.toLowerCase().includes('ios')) {
      return <Smartphone className={iconClass} />
    }
    if (deviceName.toLowerCase().includes('tablet') || deviceName.toLowerCase().includes('ipad')) {
      return <Tablet className={iconClass} />
    }
    return <Monitor className={iconClass} />
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Device Management</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage devices connected to your account
          </p>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-96">
          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={devicesLoading}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${devicesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanupInactive}
              disabled={isCleaningUp}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cleanup
            </Button>
          </div>

          {/* Error Display */}
          {devicesError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-800 dark:text-red-200">
                  {devicesError}
                </span>
              </div>
            </div>
          )}

          {/* Devices List */}
          <div className="space-y-2">
            {activeDevices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {devicesLoading ? 'Loading devices...' : 'No active devices found'}
              </div>
            ) : (
              activeDevices.map((device) => {
                const displayInfo = getDeviceDisplayInfo(device.device_id)
                if (!displayInfo) return null

                const isCurrent = displayInfo.isCurrent
                const isRemoving = removingDeviceId === device.device_id

                return (
                  <div
                    key={device.device_id}
                    className={`p-3 border rounded-lg ${
                      isCurrent 
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {getDeviceIcon(displayInfo.name, isCurrent)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm truncate">
                              {displayInfo.name}
                            </span>
                            {isCurrent && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {displayInfo.isActive ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-500">
                              {displayInfo.lastSeen}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDevice(device.device_id)}
                          disabled={isRemoving}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {isRemoving ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      Device ID: {device.device_id.slice(-8)}...
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Summary */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Total devices:</span>
                <span>{activeDevices.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active devices:</span>
                <span>{activeDevices.filter(d => d.is_active).length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 text-center">
            Devices inactive for 30+ days are automatically removed
          </div>
        </div>
      </Card>
    </div>
  )
}
