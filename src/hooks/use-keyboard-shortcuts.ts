'use client'

import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  callback: () => void
  description?: string
  preventDefault?: boolean
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Skip if user is typing in input fields
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[role="textbox"]')
    ) {
      // Allow some shortcuts even in input fields
      const allowedInInputs = ['Escape', 'F5']
      if (!allowedInInputs.includes(event.key)) {
        return
      }
    }

    for (const shortcut of shortcuts) {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()
      const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey)
      const shiftMatch = !!shortcut.shift === event.shiftKey
      const altMatch = !!shortcut.alt === event.altKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }
        shortcut.callback()
        break
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Enhanced keyboard navigation hook
export function useKeyboardNavigation<T>(items: T[], selectedIndex: number, onSelect: (index: number) => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (items.length === 0) return

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          onSelect(selectedIndex > 0 ? selectedIndex - 1 : items.length - 1)
          break
        case 'ArrowDown':
          event.preventDefault()
          onSelect(selectedIndex < items.length - 1 ? selectedIndex + 1 : 0)
          break
        case 'Home':
          event.preventDefault()
          onSelect(0)
          break
        case 'End':
          event.preventDefault()
          onSelect(items.length - 1)
          break
        case 'PageUp':
          event.preventDefault()
          onSelect(Math.max(0, selectedIndex - 10))
          break
        case 'PageDown':
          event.preventDefault()
          onSelect(Math.min(items.length - 1, selectedIndex + 10))
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [items.length, selectedIndex, onSelect])
}

// Predefined shortcut collections
export interface GlobalShortcutHandlers {
  onQuickSwitcher?: () => void
  onNewNote?: () => void
  onSave?: () => void
  onToggleSidebar?: () => void
  onTogglePreview?: () => void
  onSearch?: () => void
  onSettings?: () => void
  onToggleTheme?: () => void
  onCloseModal?: () => void
  onNextTab?: () => void
  onPrevTab?: () => void
  onFocusEditor?: () => void
  onFocusSidebar?: () => void
}

export function createGlobalShortcuts(handlers: GlobalShortcutHandlers): KeyboardShortcut[] {
  return [
    // Quick Switcher
    {
      key: 'k',
      ctrl: true,
      callback: handlers.onQuickSwitcher || (() => {}),
      description: 'Open Quick Switcher'
    },
    // New Note
    {
      key: 'n',
      ctrl: true,
      callback: handlers.onNewNote || (() => {}),
      description: 'Create New Note'
    },
    // Save
    {
      key: 's',
      ctrl: true,
      callback: handlers.onSave || (() => {}),
      description: 'Save Current Note'
    },
    // Toggle Sidebar
    {
      key: '\\',
      ctrl: true,
      callback: handlers.onToggleSidebar || (() => {}),
      description: 'Toggle Sidebar'
    },
    // Toggle Preview
    {
      key: 'p',
      ctrl: true,
      callback: handlers.onTogglePreview || (() => {}),
      description: 'Toggle Preview Mode'
    },
    // Search
    {
      key: 'f',
      ctrl: true,
      callback: handlers.onSearch || (() => {}),
      description: 'Focus Search'
    },
    // Settings
    {
      key: ',',
      ctrl: true,
      callback: handlers.onSettings || (() => {}),
      description: 'Open Settings'
    },
    // Toggle Theme
    {
      key: 't',
      ctrl: true,
      shift: true,
      callback: handlers.onToggleTheme || (() => {}),
      description: 'Toggle Theme'
    },
    // Close Modal/Escape
    {
      key: 'Escape',
      callback: handlers.onCloseModal || (() => {}),
      description: 'Close Modal or Cancel Action'
    },
    // Tab Navigation
    {
      key: 'Tab',
      ctrl: true,
      callback: handlers.onNextTab || (() => {}),
      description: 'Next Tab'
    },
    {
      key: 'Tab',
      ctrl: true,
      shift: true,
      callback: handlers.onPrevTab || (() => {}),
      description: 'Previous Tab'
    },
    // Focus Management
    {
      key: 'e',
      ctrl: true,
      callback: handlers.onFocusEditor || (() => {}),
      description: 'Focus Editor'
    },
    {
      key: 'b',
      ctrl: true,
      callback: handlers.onFocusSidebar || (() => {}),
      description: 'Focus Sidebar'
    }
  ]
}

// Hook for displaying keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const shortcuts = [
    { keys: ['Ctrl', 'K'], description: 'Open Quick Switcher' },
    { keys: ['Ctrl', 'N'], description: 'New Note' },
    { keys: ['Ctrl', 'S'], description: 'Save Note' },
    { keys: ['Ctrl', 'F'], description: 'Search in Notes' },
    { keys: ['Ctrl', 'B'], description: 'Toggle Sidebar' },
    { keys: ['Esc'], description: 'Close Modal/Cancel' },
    { keys: ['↑', '↓'], description: 'Navigate Lists' },
    { keys: ['Enter'], description: 'Select/Confirm' },
    { keys: ['Tab'], description: 'Switch Sections' }
  ]

  return shortcuts
}
