'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/stores/settings'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  showLabel?: boolean
}

export function ThemeToggle({ 
  size = 'md', 
  variant = 'ghost',
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useSettingsStore()
  const [mounted, setMounted] = useState(false)

  // Only show toggle after mounting to avoid hydration mismatch
  useEffect(() => {
    // Use a small delay to avoid hydration issues
    const timer = setTimeout(() => {
      setMounted(true)
    }, 0)
    
    return () => clearTimeout(timer)
  }, [])

  const sizeMap = {
    sm: { button: 'h-8 w-8', icon: 'h-3 w-3' },
    md: { button: 'h-10 w-10', icon: 'h-4 w-4' },
    lg: { button: 'h-12 w-12', icon: 'h-5 w-5' },
  }

  const { button: buttonSize, icon: iconSize } = sizeMap[size]

  // Use the same Button component structure for both server and client rendering
  // to avoid hydration mismatches, but control visibility with CSS
  return (
    <Button
      variant={variant}
      size="icon"
      onClick={mounted ? toggleTheme : undefined}
      className={`${buttonSize} transition-all duration-200 hover:scale-105 ${!mounted ? 'opacity-0 pointer-events-none' : ''}`}
      title={mounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Theme toggle'}
    >
      {mounted ? (
        theme === 'dark' ? (
          <Sun className={`${iconSize} text-yellow-500`} />
        ) : (
          <Moon className={`${iconSize} text-slate-700`} />
        )
      ) : (
        <span className="sr-only">Loading theme toggle</span>
      )}
      {showLabel && mounted && (
        <span className="ml-2 hidden sm:inline">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </Button>
  )
}
