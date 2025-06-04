// src/hooks/use-device.ts
import { useEffect, useCallback } from 'react'
import { useDeviceStore } from '@/stores/device'
import { useAuthStore } from '@/stores/auth'
import { deviceService } from '@/services/device-service'

export const useDevice = () => {
  const { user } = useAuthStore()
  const {
    currentDeviceId,
    currentDeviceName,
    activeDevices,
    devicesLoading,
    devicesError,
    isManagingDevices,
    setCurrentDevice,
    setActiveDevices,
    setDevicesLoading,
    setDevicesError,
    setIsManagingDevices,
    updateDeviceActivity,
    removeDevice: removeDeviceFromStore,
    clearDevices,
    getDeviceCount,
    getCurrentDevice,
    getOtherDevices,
    isCurrentDevice
  } = useDeviceStore()

  // Initialize current device
  const initializeDevice = useCallback(async () => {
    if (!user) return

    try {
      // First set the current device in the store
      const deviceId = deviceService.getDeviceId()
      const deviceName = deviceService.getDeviceName()
      
      console.log(`Initializing device: ${deviceId} (${deviceName})`);
      
      setCurrentDevice(deviceId, deviceName)
      
      // Then try to register the device with server
      try {
        console.log('Registering device from useDevice hook...');
        const result = await deviceService.registerDevice(user.id)
        
        if (!result.success) {
          console.warn(`Device registration warning: ${result.error || 'Unknown error'}`);
          // Don't set an error in the UI since we already have device ID locally
          // Just log it for debugging
        } else {
          console.log('Device registered successfully from useDevice hook');
        }
      } catch (regError) {
        // Log the error but don't prevent the app from working
        const errorDetails = regError instanceof Error 
          ? regError.message 
          : (typeof regError === 'object' ? JSON.stringify(regError) : String(regError));
        console.warn(`Device registration error (non-critical): ${errorDetails}`);
      }
    } catch (error) {
      const errorDetails = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' ? JSON.stringify(error) : String(error));
      console.error(`Device initialization error: ${errorDetails}`);
      setDevicesError(errorDetails || 'Device initialization failed');
    }
  }, [user, setCurrentDevice, setDevicesError])

  // Load active devices
  const loadActiveDevices = useCallback(async () => {
    if (!user) return

    setDevicesLoading(true)
    setDevicesError(null)

    try {
      const result = await deviceService.getActiveDevices(user.id)
      
      if (result.data) {
        setActiveDevices(result.data)
      } else {
        setDevicesError(result.error || 'Failed to load devices')
      }
    } catch (error) {
      console.error('Load devices error:', error)
      setDevicesError(error instanceof Error ? error.message : 'Failed to load devices')
    } finally {
      setDevicesLoading(false)
    }
  }, [user, setActiveDevices, setDevicesLoading, setDevicesError])

  // Remove a device
  const removeDevice = useCallback(async (deviceId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const result = await deviceService.removeDevice(user.id, deviceId)
      
      if (result.success) {
        removeDeviceFromStore(deviceId)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove device'
      console.error('Remove device error:', error)
      return { success: false, error: errorMessage }
    }
  }, [user, removeDeviceFromStore])

  // Update device activity
  const updateActivity = useCallback(async () => {
    if (!user || !currentDeviceId) return

    try {
      await deviceService.updateDeviceActivity(user.id)
      updateDeviceActivity(currentDeviceId)
    } catch (error) {
      console.error('Update activity error:', error)
    }
  }, [user, currentDeviceId, updateDeviceActivity])

  // Cleanup inactive devices
  const cleanupInactiveDevices = useCallback(async () => {
    if (!user) return

    try {
      await deviceService.cleanupInactiveDevices(user.id)
      // Reload devices after cleanup
      await loadActiveDevices()
    } catch (error) {
      console.error('Cleanup devices error:', error)
    }
  }, [user, loadActiveDevices])

  // Deactivate current device (on logout/close)
  const deactivateCurrentDevice = useCallback(async () => {
    if (!user) return

    try {
      await deviceService.deactivateDevice(user.id)
    } catch (error) {
      console.error('Deactivate device error:', error)
    }
  }, [user])

  // Get device display info
  const getDeviceDisplayInfo = useCallback((deviceId: string) => {
    const device = activeDevices.find(d => d.device_id === deviceId)
    if (!device) return null

    const lastSeen = new Date(device.last_seen_at)
    const now = new Date()
    const diffMs = now.getTime() - lastSeen.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)

    let lastSeenText = 'Just now'
    if (diffMinutes >= 1 && diffMinutes < 60) {
      lastSeenText = `${diffMinutes}m ago`
    } else if (diffMinutes >= 60) {
      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) {
        lastSeenText = `${diffHours}h ago`
      } else {
        const diffDays = Math.floor(diffHours / 24)
        lastSeenText = `${diffDays}d ago`
      }
    }

    return {
      id: device.device_id,
      name: device.device_name || 'Unknown Device',
      isActive: device.is_active,
      lastSeen: lastSeenText,
      isCurrent: isCurrentDevice(deviceId),
      createdAt: new Date(device.created_at)
    }
  }, [activeDevices, isCurrentDevice])

  // Initialize on mount
  useEffect(() => {
    if (user) {
      initializeDevice()
      loadActiveDevices()
    } else {
      clearDevices()
    }
  }, [user, initializeDevice, loadActiveDevices, clearDevices])

  // Set up periodic activity updates (every 30 seconds)
  useEffect(() => {
    if (!user || !currentDeviceId) return

    const interval = setInterval(updateActivity, 30000)
    return () => clearInterval(interval)
  }, [user, currentDeviceId, updateActivity])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (user) {
        deactivateCurrentDevice()
      }
    }
  }, [user, deactivateCurrentDevice])

  return {
    // State
    currentDeviceId,
    currentDeviceName,
    activeDevices,
    devicesLoading,
    devicesError,
    isManagingDevices,

    // Actions
    loadActiveDevices,
    removeDevice,
    updateActivity,
    cleanupInactiveDevices,
    deactivateCurrentDevice,
    setIsManagingDevices,

    // Computed
    deviceCount: getDeviceCount(),
    currentDevice: getCurrentDevice(),
    otherDevices: getOtherDevices(),
    getDeviceDisplayInfo,
    isCurrentDevice,

    // Utilities
    hasMultipleDevices: getDeviceCount() > 1,
    hasOtherDevices: getOtherDevices().length > 0
  }
}
