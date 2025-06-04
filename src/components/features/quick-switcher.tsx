'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Star, Clock, FileText, Loader2 } from 'lucide-react'
import { searchService } from '@/services/search-service'
import { useDebounce } from '@/hooks/use-debounce'
import type { SearchResult } from '@/types'

interface QuickSwitcherProps {
  isOpen: boolean
  onClose: () => void
  onNoteSelect: (noteId: string) => void
}

export function QuickSwitcher({ isOpen, onClose, onNoteSelect }: QuickSwitcherProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentNotes, setRecentNotes] = useState<SearchResult[]>([])
  const [favoriteNotes, setFavoriteNotes] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'recent' | 'favorites'>('search')

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadInitialData()
      setQuery('')
      setSelectedIndex(0)
      setActiveTab('search')
    }
  }, [isOpen])

  // Focus input when opened  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery)
    } else {
      setResults([])
      setActiveTab('recent')
    }
  }, [debouncedQuery])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => {
            const maxIndex = getCurrentResults().length - 1
            return prev < maxIndex ? prev + 1 : 0
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => {
            const maxIndex = getCurrentResults().length - 1
            return prev > 0 ? prev - 1 : maxIndex
          })
          break
        case 'Enter':
          e.preventDefault()
          const currentResults = getCurrentResults()
          if (currentResults[selectedIndex]) {
            handleNoteSelect(currentResults[selectedIndex].note.id)
          }
          break
        case 'Tab':
          e.preventDefault()
          if (e.shiftKey) {
            setActiveTab(prev => 
              prev === 'search' ? 'favorites' : 
              prev === 'recent' ? 'search' : 'recent'
            )
          } else {
            setActiveTab(prev => 
              prev === 'search' ? 'recent' : 
              prev === 'recent' ? 'favorites' : 'search'
            )
          }
          setSelectedIndex(0)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const loadInitialData = async () => {
    try {
      const [recent, favorites] = await Promise.all([
        searchService.getRecentNotes(10),
        searchService.getFavoriteNotes(10)
      ])

      setRecentNotes(recent.map(note => ({
        note,
        highlights: [],
        score: 0
      })))

      setFavoriteNotes(favorites.map(note => ({
        note,
        highlights: [],
        score: 0
      })))
    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      const searchResults = await searchService.search({
        query: searchQuery,
        limit: 50,
        fuzzy: true
      })
      setResults(searchResults)
      setActiveTab('search')
      setSelectedIndex(0)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const getCurrentResults = () => {
    switch (activeTab) {
      case 'search':
        return results
      case 'recent':
        return recentNotes
      case 'favorites':
        return favoriteNotes
      default:
        return []
    }
  }

  const handleNoteSelect = (noteId: string) => {
    onNoteSelect(noteId)
    onClose()
  }

  const handleTabClick = (tab: 'search' | 'recent' | 'favorites') => {
    setActiveTab(tab)
    setSelectedIndex(0)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50">
      <div className="w-full max-w-2xl mx-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes... (use Tab to switch sections)"
                className="w-full pl-10 pr-4 py-3 bg-transparent border-0 text-lg placeholder-gray-400 focus:outline-none"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleTabClick('search')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Search className="inline h-4 w-4 mr-2" />
              Search ({results.length})
            </button>
            <button
              onClick={() => handleTabClick('recent')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'recent'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Clock className="inline h-4 w-4 mr-2" />
              Recent ({recentNotes.length})
            </button>
            <button
              onClick={() => handleTabClick('favorites')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Star className="inline h-4 w-4 mr-2" />
              Favorites ({favoriteNotes.length})
            </button>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-96 overflow-y-auto">
            {getCurrentResults().length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {activeTab === 'search' && !query.trim() && (
                  <div>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start typing to search your notes...</p>
                  </div>
                )}
                {activeTab === 'search' && query.trim() && !loading && (
                  <div>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notes found for &quot;{query}&quot;</p>
                  </div>
                )}
                {activeTab === 'recent' && (
                  <div>
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent notes</p>
                  </div>
                )}
                {activeTab === 'favorites' && (
                  <div>
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No favorite notes</p>
                  </div>
                )}
              </div>
            ) : (
              getCurrentResults().map((result, index) => (
                <div
                  key={result.note.id}
                  onClick={() => handleNoteSelect(result.note.id)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {result.note.title}
                        </h3>
                        {result.note.is_favorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Highlights */}
                      {result.highlights.length > 0 && (
                        <div className="mb-2">
                          {result.highlights.slice(0, 2).map((highlight, i) => (
                            <p key={i} className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {highlight}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{result.note.path}</span>
                        {activeTab === 'recent' && result.note.last_accessed_at && (
                          <span>Accessed {formatDate(result.note.last_accessed_at)}</span>
                        )}
                        <span>Updated {formatDate(result.note.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <div className="flex gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Tab Switch sections</span>
              </div>
              <span>ESC Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
