'use client'

import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settings'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme } = useSettingsStore()
  const [mounted, setMounted] = useState(false)

  // Only apply theme effects after mounting to avoid hydration mismatch
  useEffect(() => {
    // Prevent hydration issues by only mounting after a small delay
    const timer = setTimeout(() => {
      setMounted(true)
    }, 0)
    
    return () => clearTimeout(timer)
  }, [])

  // Apply theme on mount and theme change
  useEffect(() => {
    if (!mounted) return

    // Get the current class on HTML element
    const currentClass = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    
    // Only change if different from what's already applied
    if (currentClass !== theme) {
      // Remove existing theme classes
      document.documentElement.classList.remove('light', 'dark')
      
      // Add current theme class
      document.documentElement.classList.add(theme)
    }
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff')
    }
  }, [theme, mounted])

  // Apply system theme preference on first load if no preference is stored
  useEffect(() => {
    if (!mounted) return
    
    const initializeTheme = () => {
      try {
        const storedSettings = localStorage.getItem('settings-store')
        if (!storedSettings) {
          // No stored preference, use system preference
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          const systemTheme = systemPrefersDark ? 'dark' : 'light'
          setTheme(systemTheme)
        }
      } catch (error) {
        // In case localStorage is not available (e.g., in an iframe or private browsing)
        console.error('Failed to access localStorage:', error)
      }
    }

    initializeTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const storedSettings = localStorage.getItem('settings-store')
        const parsedSettings = storedSettings ? JSON.parse(storedSettings) : null
        
        // Only follow system if theme is set to 'system' or no preference
        if (!parsedSettings || parsedSettings.state?.theme === 'system') {
          const systemTheme = e.matches ? 'dark' : 'light'
          setTheme(systemTheme)
        }
      } catch (error) {
        console.error('Failed to handle theme change:', error)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mounted, setTheme])

  return <>{children}</>
}
