'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { AppSettings, Theme } from '@/types'

interface SettingsStore extends AppSettings {
  // Actions
  setTheme: (theme: Theme) => void
  setAutoSave: (autoSave: boolean) => void
  setAutoSaveInterval: (interval: number) => void
  setShowPreview: (showPreview: boolean) => void
  setEditorFontSize: (size: number) => void
  setPreviewFontSize: (size: number) => void
  setSpellCheck: (spellCheck: boolean) => void
  toggleTheme: () => void
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  theme: 'light',
  autoSave: true,
  autoSaveInterval: 1000,
  showPreview: true,
  editorFontSize: 14,
  previewFontSize: 16,
  spellCheck: true,
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultSettings,
        
        setTheme: (theme: Theme) => {
          set({ theme })
          // Only run on client side
          if (typeof window !== 'undefined') {
            // Get the current class on HTML element
            const currentClass = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            
            // Only change if different from what's already applied
            if (currentClass !== theme) {
              document.documentElement.classList.remove('light', 'dark')
              document.documentElement.classList.add(theme)
            }
          }
        },
        
        setAutoSave: (autoSave: boolean) => set({ autoSave }),
        
        setAutoSaveInterval: (autoSaveInterval: number) => set({ autoSaveInterval }),
        
        setShowPreview: (showPreview: boolean) => set({ showPreview }),
        
        setEditorFontSize: (editorFontSize: number) => set({ editorFontSize }),
        
        setPreviewFontSize: (previewFontSize: number) => set({ previewFontSize }),
        
        setSpellCheck: (spellCheck: boolean) => set({ spellCheck }),
        
        toggleTheme: () => {
          const currentTheme = get().theme
          const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark'
          get().setTheme(newTheme)
        },
        
        resetSettings: () => {
          set(defaultSettings)
          get().setTheme(defaultSettings.theme)
        },
      }),
      {
        name: 'settings-store',
        // Apply theme on hydration but wait for client-side rendering
        onRehydrateStorage: () => (state) => {
          if (typeof window !== 'undefined' && state?.theme) {
            // We should wait a tick to avoid hydration mismatches
            setTimeout(() => {
              // Get the current class on HTML element
              const currentClass = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
              
              // Only change if different from what's already applied to avoid hydration mismatches
              if (currentClass !== state.theme) {
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(state.theme);
              }
            }, 0);
          }
        },
      }
    )
  )
)
