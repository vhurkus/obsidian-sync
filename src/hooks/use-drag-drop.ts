'use client'

import { useState, useCallback, useRef } from 'react'
import { NoteWithTags } from '@/types'

interface DragItem {
  id: string
  type: 'note' | 'folder'
  data: NoteWithTags
}

interface UseDragDropProps {
  onNoteMove?: (noteId: string, newParentId: string | null, newIndex?: number) => Promise<void>
  onFolderMove?: (folderId: string, newParentId: string | null, newIndex?: number) => Promise<void>
}

export function useDragDrop({ onNoteMove, onFolderMove }: UseDragDropProps = {}) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null)
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleDragStart = useCallback((item: DragItem) => {
    setDraggedItem(item)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDragOverItem(null)
    setDropPosition(null)
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }
  }, [])

  const handleDragOver = useCallback((
    e: React.DragEvent,
    targetItem: DragItem,
    position: 'before' | 'after' | 'inside'
  ) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedItem || draggedItem.id === targetItem.id) {
      return
    }

    setDragOverItem(targetItem.id)
    setDropPosition(position)
  }, [draggedItem])

  const handleDrop = useCallback(async (
    e: React.DragEvent,
    targetItem: DragItem,
    position: 'before' | 'after' | 'inside'
  ) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedItem || draggedItem.id === targetItem.id) {
      handleDragEnd()
      return
    }

    try {
      let newParentId: string | null = null
      let newIndex: number | undefined = undefined

      if (position === 'inside') {
        // Moving inside a folder
        if (targetItem.data.is_folder) {
          newParentId = targetItem.id
        } else {
          // Can't move inside a note, treat as after
          newParentId = targetItem.data.parent_id || null
        }
      } else {
        // Moving before or after an item
        newParentId = targetItem.data.parent_id || null
        // Calculate index based on position
        newIndex = position === 'before' ? 0 : 1 // Simplified for now
      }

      // Call appropriate move handler
      if (draggedItem.type === 'note' && onNoteMove) {
        await onNoteMove(draggedItem.id, newParentId, newIndex)
      } else if (draggedItem.type === 'folder' && onFolderMove) {
        await onFolderMove(draggedItem.id, newParentId, newIndex)
      }
    } catch (error) {
      console.error('Error moving item:', error)
    } finally {
      handleDragEnd()
    }
  }, [draggedItem, onNoteMove, onFolderMove, handleDragEnd])

  const getDragProps = useCallback((item: DragItem) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', item.id)
      
      // Add a small delay to prevent accidental drags
      dragTimeoutRef.current = setTimeout(() => {
        handleDragStart(item)
      }, 100)
    },
    onDragEnd: handleDragEnd,
  }), [handleDragStart, handleDragEnd])

  const getDropProps = useCallback((item: DragItem) => ({
    onDragOver: (e: React.DragEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top
      const height = rect.height

      let position: 'before' | 'after' | 'inside'
      
      if (item.data.is_folder) {
        // For folders, allow inside drops in the middle third
        if (y < height * 0.25) {
          position = 'before'
        } else if (y > height * 0.75) {
          position = 'after'
        } else {
          position = 'inside'
        }
      } else {
        // For notes, only allow before/after
        position = y < height / 2 ? 'before' : 'after'
      }

      handleDragOver(e, item, position)
    },
    onDragLeave: (e: React.DragEvent) => {
      // Only clear if leaving the entire element, not just entering a child
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX
      const y = e.clientY
      
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragOverItem(null)
        setDropPosition(null)
      }
    },
    onDrop: (e: React.DragEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top
      const height = rect.height

      let position: 'before' | 'after' | 'inside'
      
      if (item.data.is_folder) {
        if (y < height * 0.25) {
          position = 'before'
        } else if (y > height * 0.75) {
          position = 'after'
        } else {
          position = 'inside'
        }
      } else {
        position = y < height / 2 ? 'before' : 'after'
      }

      handleDrop(e, item, position)
    },
  }), [handleDragOver, handleDrop])

  const getDropIndicatorProps = useCallback((itemId: string) => {
    const isDropTarget = dragOverItem === itemId
    const showIndicator = isDropTarget && draggedItem && draggedItem.id !== itemId

    return {
      showBefore: showIndicator && dropPosition === 'before',
      showAfter: showIndicator && dropPosition === 'after',
      showInside: showIndicator && dropPosition === 'inside',
      isDragging: draggedItem?.id === itemId,
    }
  }, [draggedItem, dragOverItem, dropPosition])

  return {
    draggedItem,
    getDragProps,
    getDropProps,
    getDropIndicatorProps,
    isDragging: !!draggedItem,
  }
}
