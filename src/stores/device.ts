// src/stores/device.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Database } from '@/types/database.types'

type UserSession = Database['public']['Tables']['user_sessions']['Row']

export interface DeviceState {
  // Current device
  currentDeviceId: string | null
  currentDeviceName: string | null

  // Active devices
  activeDevices: UserSession[]
  devicesLoading: boolean
  devicesError: string | null

  // Device management
  isManagingDevices: boolean

  // Actions
  setCurrentDevice: (deviceId: string, deviceName: string) => void
  setActiveDevices: (devices: UserSession[]) => void
  setDevicesLoading: (loading: boolean) => void
  setDevicesError: (error: string | null) => void
  setIsManagingDevices: (managing: boolean) => void
  
  updateDeviceActivity: (deviceId: string) => void
  removeDevice: (deviceId: string) => void
  clearDevices: () => void

  // Computed getters
  getDeviceCount: () => number
  getCurrentDevice: () => UserSession | null
  getOtherDevices: () => UserSession[]
  isCurrentDevice: (deviceId: string) => boolean
}

export const useDeviceStore = create<DeviceState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentDeviceId: null,
        currentDeviceName: null,
        activeDevices: [],
        devicesLoading: false,
        devicesError: null,
        isManagingDevices: false,

        // Actions
        setCurrentDevice: (deviceId, deviceName) => {
          set({
            currentDeviceId: deviceId,
            currentDeviceName: deviceName
          }, false, 'setCurrentDevice')
        },

        setActiveDevices: (devices) => {
          set({
            activeDevices: devices,
            devicesError: null
          }, false, 'setActiveDevices')
        },

        setDevicesLoading: (loading) => {
          set({ devicesLoading: loading }, false, 'setDevicesLoading')
        },

        setDevicesError: (error) => {
          set({ 
            devicesError: error,
            devicesLoading: false 
          }, false, 'setDevicesError')
        },

        setIsManagingDevices: (managing) => {
          set({ isManagingDevices: managing }, false, 'setIsManagingDevices')
        },

        updateDeviceActivity: (deviceId) => {
          set((state) => ({
            activeDevices: state.activeDevices.map(device => 
              device.device_id === deviceId
                ? { ...device, last_seen_at: new Date().toISOString() }
                : device
            )
          }), false, 'updateDeviceActivity')
        },

        removeDevice: (deviceId) => {
          set((state) => ({
            activeDevices: state.activeDevices.filter(device => 
              device.device_id !== deviceId
            )
          }), false, 'removeDevice')
        },

        clearDevices: () => {
          set({
            activeDevices: [],
            devicesError: null,
            devicesLoading: false
          }, false, 'clearDevices')
        },

        // Computed getters
        getDeviceCount: () => {
          return get().activeDevices.length
        },

        getCurrentDevice: () => {
          const state = get()
          return state.activeDevices.find(device => 
            device.device_id === state.currentDeviceId
          ) || null
        },

        getOtherDevices: () => {
          const state = get()
          return state.activeDevices.filter(device => 
            device.device_id !== state.currentDeviceId
          )
        },

        isCurrentDevice: (deviceId) => {
          return get().currentDeviceId === deviceId
        }
      }),
      {
        name: 'device-store',
        // Only persist current device info
        partialize: (state) => ({
          currentDeviceId: state.currentDeviceId,
          currentDeviceName: state.currentDeviceName
        })
      }
    )
  )
)
