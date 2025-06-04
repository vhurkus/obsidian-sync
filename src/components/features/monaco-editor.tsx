'use client'

import { useEffect, useRef, useState } from 'react'
import { Editor, Monaco } from '@monaco-editor/react'
import { useNoteStore } from '@/stores/note'
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
  Minimize2
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
  const { updateNote } = useNoteStore()
  const [content, setContent] = useState(note?.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const editorRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setContent(note?.content || '')
  }, [note])

  // Auto-save functionality with 1 second debounce (PRD requirement)
  const handleSave = async () => {
    if (!note || content === note.content) return

    setIsSaving(true)
    try {
      const updatedNote = { ...note, content }
      await updateNote(note.id, { content })
      setLastSaved(new Date())
      onSave?.(updatedNote)
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!note || content === note.content) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 1000) // 1 second debounce as per PRD

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, note]) // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Toolbar */}
      <div className="border-b border-gray-700 bg-gray-800 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Format buttons */}
          <div className="flex items-center space-x-1 border-r border-gray-600 pr-2 mr-2">
            {formatButtons.map((button, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={button.action}
                title={button.tooltip}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <button.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreviewToggle}
              title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              {isPreviewMode ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Save status */}
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            {isSaving ? (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Saving...</span>
              </div>
            ) : lastSaved ? (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </div>
            ) : null}
          </div>

          {/* Manual save button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || content === note?.content}
            title="Save (Ctrl+S)"
            className="text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
          </Button>

          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
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
          theme="obsidian-dark"
          options={{
            fontSize: 14,
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
            wordBasedSuggestions: 'off'
          }}
        />
      </div>
    </div>
  )
}
