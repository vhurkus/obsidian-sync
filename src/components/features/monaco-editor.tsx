'use client'

import { useEffect, useRef, useState } from 'react'
import { Editor, Monaco } from '@monaco-editor/react'
import { useSyncStatus } from '@/hooks/use-sync-status'
import { useRealtime } from '@/hooks/use-realtime'
import { useSettingsStore } from '@/stores/settings'
import { syncService } from '@/services/sync-service'
import { Button } from '@/components/ui/button'
import { NoteWithTags } from '@/types'
import { 
  Bold, 
  Italic, 
  Link, 
  Code, 
  Eye, 
  Edit,
  Save,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react'

interface MonacoEditorProps {
  note: NoteWithTags | null
  onSave?: (note: NoteWithTags) => void
  isPreviewMode?: boolean
  onPreviewToggle?: () => void
  className?: string
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  note,
  onSave,
  isPreviewMode = false,
  onPreviewToggle,
  className = ''
}) => {
  const { conflicts, isSyncing } = useSyncStatus()
  const { isConnected } = useRealtime()
  const { theme, editorFontSize, spellCheck, autoSave, autoSaveInterval } = useSettingsStore()
  const [content, setContent] = useState(note?.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'conflict'>('idle')
  const editorRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check for conflicts for this note
  const noteConflict = note ? conflicts.find(c => c.noteId === note.id) : null

  useEffect(() => {
    setContent(note?.content || '')
  }, [note])

  // Auto-save functionality with sync service
  const handleSave = async () => {
    if (!note || content === note.content) return

    setIsSaving(true)
    setSyncStatus('syncing')

    try {
      // Use sync service for conflict-aware saving
      const result = await syncService.saveNote({
        ...note,
        content,
        updated_at: new Date().toISOString()
      })

      if (result.success && result.resolvedNote) {
        setLastSaved(new Date())
        setSyncStatus('synced')
        onSave?.(result.resolvedNote)
      } else if (result.conflict) {
        setSyncStatus('conflict')
        console.log('Conflict detected. Please resolve manually.')
      } else {
        setSyncStatus('error')
        console.log('Failed to save note:', result.error)
      }
    } catch (error) {
      console.log('Failed to save note:', error)
      setSyncStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!note || content === note.content || !autoSave) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, autoSaveInterval) // Use settings store interval

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, note, autoSave, autoSaveInterval]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditorDidMount = (editor: any, monaco: Monaco) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    editorRef.current = editor

    // Define custom Obsidian dark theme
    monaco.editor.defineTheme('obsidian-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'interface', foreground: '4EC9B0' },
        { token: 'enum', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'tag', foreground: '569CD6' },
        { token: 'attribute.name', foreground: '92C5F8' },
        { token: 'attribute.value', foreground: 'CE9178' },
        { token: 'markdown.heading', foreground: '4FC1FF', fontStyle: 'bold' },
        { token: 'markdown.bold', foreground: 'FFFFFF', fontStyle: 'bold' },
        { token: 'markdown.italic', foreground: 'FFFFFF', fontStyle: 'italic' },
        { token: 'markdown.code', foreground: 'F44747', background: '2D2D2D' },
        { token: 'markdown.link', foreground: '4FC1FF' },
        { token: 'markdown.quote', foreground: '6A9955', fontStyle: 'italic' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#5a5a5a',
        'editor.lineHighlightBackground': '#2d2d2d',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41'
      }
    })

    monaco.editor.setTheme('obsidian-dark')

    // Enhanced markdown language configuration
    monaco.languages.setMonarchTokensProvider('markdown', {
      tokenizer: {
        root: [
          // Headers
          [/^#{1,6}\s.*$/, 'markdown.heading'],
          
          // Bold text
          [/\*\*([^*]+|\*(?!\*))*\*\*/, 'markdown.bold'],
          [/__([^_]+|_(?!_))*__/, 'markdown.bold'],
          
          // Italic text
          [/\*([^*]+)\*/, 'markdown.italic'],
          [/_([^_]+)_/, 'markdown.italic'],
          
          // Inline code
          [/`([^`]+)`/, 'markdown.code'],
          
          // Links
          [/\[([^\]]+)\]\(([^)]+)\)/, 'markdown.link'],
          [/\[([^\]]+)\]\[([^\]]+)\]/, 'markdown.link'],
          
          // Images
          [/!\[([^\]]*)\]\(([^)]+)\)/, 'markdown.link'],
          
          // Blockquotes
          [/^>\s.*$/, 'markdown.quote'],
          
          // Lists
          [/^[\s]*[-*+]\s/, 'keyword'],
          [/^[\s]*\d+\.\s/, 'keyword'],
          
          // Horizontal rules
          [/^[\s]*[-*_]{3,}[\s]*$/, 'keyword'],
          
          // Code blocks
          [/^```[\s\S]*?^```$/m, 'markdown.code'],
          [/^~~~[\s\S]*?^~~~$/m, 'markdown.code'],
          
          // HTML tags
          [/<[^>]+>/, 'tag']
        ]
      }
    })

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      insertMarkdown('**', '**', 'bold text')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      insertMarkdown('*', '*', 'italic text')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      insertMarkdown('[', '](url)', 'link text')
    })
  }

  const insertMarkdown = (prefix: string, suffix: string, placeholder: string) => {
    const editor = editorRef.current
    if (!editor) return

    const selection = editor.getSelection()
    const selectedText = editor.getModel()?.getValueInRange(selection) || placeholder

    editor.executeEdits('insert-markdown', [{
      range: selection,
      text: `${prefix}${selectedText}${suffix}`
    }])

    // Focus back to editor
    editor.focus()
  }

  const formatButtons = [
    {
      icon: Bold,
      tooltip: 'Bold (Ctrl+B)',
      action: () => insertMarkdown('**', '**', 'bold text')
    },
    {
      icon: Italic,
      tooltip: 'Italic (Ctrl+I)',
      action: () => insertMarkdown('*', '*', 'italic text')
    },
    {
      icon: Link,
      tooltip: 'Link (Ctrl+K)',
      action: () => insertMarkdown('[', '](url)', 'link text')
    },
    {
      icon: Code,
      tooltip: 'Inline Code',
      action: () => insertMarkdown('`', '`', 'code')
    }
  ]

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''} ${className}`}>
      {/* Responsive Toolbar */}
      <div className="border-b border-gray-700 bg-gray-800 p-1.5 sm:p-2 flex items-center justify-between">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
          {/* Format buttons - show only essential ones on mobile */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 border-r border-gray-600 pr-1 sm:pr-2 mr-1 sm:mr-2">
            {formatButtons.slice(0, 2).map((button, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={button.action}
                title={button.tooltip}
                className="text-gray-300 hover:text-white hover:bg-gray-700 h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <button.icon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            ))}
            {/* Additional buttons hidden on small screens */}
            <div className="hidden sm:flex items-center space-x-1">
              {formatButtons.slice(2).map((button, index) => (
                <Button
                  key={index + 2}
                  variant="ghost"
                  size="sm"
                  onClick={button.action}
                  title={button.tooltip}
                  className="text-gray-300 hover:text-white hover:bg-gray-700 h-8 w-8 p-0"
                >
                  <button.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* View toggle */}
          {onPreviewToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreviewToggle}
              title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
              className="text-gray-300 hover:text-white hover:bg-gray-700 h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              {isPreviewMode ? <Edit className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
            </Button>
          )}
        </div>

        {/* Status and action buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Connection status */}
          <div className="flex items-center space-x-1">
            {!isConnected ? (
              <WifiOff className="w-3 h-3 text-red-400" />
            ) : noteConflict ? (
              <AlertTriangle className="w-3 h-3 text-orange-400" />
            ) : isSaving || isSyncing ? (
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            ) : lastSaved ? (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            ) : (
              <Wifi className="w-3 h-3 text-green-400" />
            )}
          </div>

          {/* Save status text - hidden on mobile */}
          <div className="hidden sm:flex items-center text-xs text-gray-400">
            {isSaving || isSyncing ? (
              <span>Syncing...</span>
            ) : syncStatus === 'conflict' ? (
              <span className="text-orange-400">Conflict</span>
            ) : syncStatus === 'error' ? (
              <span className="text-red-400">Error</span>
            ) : lastSaved ? (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            {/* Manual save button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || content === note?.content}
              title="Save (Ctrl+S)"
              className="text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-50 h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>

            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="text-gray-300 hover:text-white hover:bg-gray-700 h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language="markdown"
          value={content}
          onChange={(value) => setContent(value || '')}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'obsidian-dark' : 'vs'}
          options={{
            fontSize: editorFontSize,
            fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
            lineNumbers: 'on',
            wordWrap: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            contextmenu: true,
            mouseWheelZoom: true,
            quickSuggestions: false,
            parameterHints: { enabled: false },
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'off',
            wordBasedSuggestions: 'off',
            // Mobile-specific options
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            },
            // Add spell check if enabled
            ...(spellCheck && {
              'editor.wordWrap': 'on',
              'editor.wordWrapColumn': 80
            })
          }}
        />
      </div>
    </div>
  )
}
