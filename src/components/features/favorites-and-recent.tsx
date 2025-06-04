'use client'

import { useState, useEffect } from 'react'
import { Star, Clock, FileText } from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { Note } from '@/types'
import { useNoteStore } from '@/stores/note'

interface FavoritesSectionProps {
  onNoteSelect: (noteId: string) => void
  selectedNoteId?: string
}

interface RecentFilesSectionProps {
  onNoteSelect: (noteId: string) => void
  selectedNoteId?: string
}

export function FavoritesSection({ onNoteSelect, selectedNoteId }: FavoritesSectionProps) {
  const [favoriteNotes, setFavoriteNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const { toggleFavorite } = useNoteStore()

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/notes/favorites')
        if (response.ok) {
          const data = await response.json()
          setFavoriteNotes(data)
        }
      } catch (error) {
        console.error('Failed to fetch favorites:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [])

  const handleToggleFavorite = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await toggleFavorite(noteId)
      // Update local state after toggle
      setFavoriteNotes(prevNotes => prevNotes.filter(note => note.id !== noteId))
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (favoriteNotes.length === 0) {
    return (
      <div className="text-center py-8">
        <Star className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600" />
        <h3 className="mt-4 text-gray-500 dark:text-gray-400">No favorite notes yet</h3>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Star notes to add them to your favorites
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {favoriteNotes.map(note => (
        <div
          key={note.id}
          onClick={() => onNoteSelect(note.id)}
          className={`flex items-start gap-3 p-3 rounded-md cursor-pointer group transition-colors ${
            selectedNoteId === note.id
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {note.title}
              </h3>
              <Star 
                className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={(e) => handleToggleFavorite(note.id, e)}
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="truncate">{note.path}</span>
              <span>•</span>
              <span>{formatDate(note.updated_at)}</span>
            </div>

            {/* TODO: Re-enable tags when Note type includes tags property */}
          </div>
        </div>
      ))}
    </div>
  )
}

export function RecentFilesSection({ onNoteSelect, selectedNoteId }: RecentFilesSectionProps) {
  const [recentNotes, setRecentNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentFiles = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/notes/recent')
        if (response.ok) {
          const data = await response.json()
          setRecentNotes(data)
        }
      } catch (error) {
        console.error('Failed to fetch recent files:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentFiles()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (recentNotes.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600" />
        <h3 className="mt-4 text-gray-500 dark:text-gray-400">No recent activity</h3>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Recently accessed notes will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {recentNotes.map(note => (
        <div
          key={note.id}
          onClick={() => onNoteSelect(note.id)}
          className={`flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors ${
            selectedNoteId === note.id 
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {note.title}
              </h3>
              {note.is_favorite && (
                <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>{note.last_accessed_at ? formatRelativeTime(note.last_accessed_at) : 'Never'}</span>
              <span>•</span>
              <span className="truncate">{note.path}</span>
            </div>

            {/* TODO: Re-enable tags when Note type includes tags property */}
          </div>
        </div>
      ))}
    </div>
  )
}
