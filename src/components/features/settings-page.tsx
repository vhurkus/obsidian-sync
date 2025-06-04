'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useSettingsStore } from '@/stores/settings'
import { 
  Settings, 
  Palette, 
  Save, 
  Type, 
  Eye, 
  Keyboard,
  RotateCcw,
  Check,
  X
} from 'lucide-react'

interface SettingsPageProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPage({ isOpen, onClose }: SettingsPageProps) {
  const {
    theme,
    autoSave,
    autoSaveInterval,
    showPreview,
    editorFontSize,
    previewFontSize,
    spellCheck,
    setAutoSave,
    setAutoSaveInterval,
    setShowPreview,
    setEditorFontSize,
    setPreviewFontSize,
    setSpellCheck,
    resetSettings,
  } = useSettingsStore()

  const [tempInterval, setTempInterval] = useState(autoSaveInterval.toString())

  if (!isOpen) return null

  const handleIntervalChange = (value: string) => {
    setTempInterval(value)
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 500 && numValue <= 10000) {
      setAutoSaveInterval(numValue)
    }
  }

  const handleReset = () => {
    resetSettings()
    setTempInterval('1000')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold">Settings</h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Customize your ObsidianSync experience
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
          {/* Appearance Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Theme</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Choose between light and dark mode
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                    {theme}
                  </span>
                  <ThemeToggle size="sm" variant="outline" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editor Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Editor
              </CardTitle>
              <CardDescription>
                Configure editor appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Editor Font Size</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Adjust the font size in the editor
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editorFontSize > 10 && setEditorFontSize(editorFontSize - 1)}
                    disabled={editorFontSize <= 10}
                  >
                    -
                  </Button>
                  <span className="text-sm font-mono w-8 text-center">{editorFontSize}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editorFontSize < 24 && setEditorFontSize(editorFontSize + 1)}
                    disabled={editorFontSize >= 24}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Spell Check</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Enable spell checking in the editor
                  </p>
                </div>
                <Button
                  variant={spellCheck ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSpellCheck(!spellCheck)}
                  className="w-16"
                >
                  {spellCheck ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>
                Configure preview panel settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Show Preview by Default</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Start with split view enabled
                  </p>
                </div>
                <Button
                  variant={showPreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-16"
                >
                  {showPreview ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Preview Font Size</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Adjust the font size in the preview panel
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewFontSize > 12 && setPreviewFontSize(previewFontSize - 1)}
                    disabled={previewFontSize <= 12}
                  >
                    -
                  </Button>
                  <span className="text-sm font-mono w-8 text-center">{previewFontSize}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewFontSize < 20 && setPreviewFontSize(previewFontSize + 1)}
                    disabled={previewFontSize >= 20}
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-save Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Auto-save
              </CardTitle>
              <CardDescription>
                Configure automatic saving behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Enable Auto-save</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Automatically save changes while typing
                  </p>
                </div>
                <Button
                  variant={autoSave ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoSave(!autoSave)}
                  className="w-16"
                >
                  {autoSave ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </Button>
              </div>

              {autoSave && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto-save Interval</label>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Delay in milliseconds (500-10000)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="500"
                      max="10000"
                      step="100"
                      value={tempInterval}
                      onChange={(e) => handleIntervalChange(e.target.value)}
                      className="w-20 text-center"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">ms</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </CardTitle>
              <CardDescription>
                Quick actions and navigation shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quick Switcher</span>
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    Ctrl+K
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Save Note</span>
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    Ctrl+S
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">New Note</span>
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    Ctrl+N
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Toggle Sidebar</span>
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    Ctrl+\\
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Toggle Preview</span>
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    Ctrl+P
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reset Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Reset Settings
              </CardTitle>
              <CardDescription>
                Reset all settings to default values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-6">
          <div className="flex justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={onClose} className="px-3 sm:px-4">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
