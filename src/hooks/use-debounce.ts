import { useEffect, useRef } from 'react'

/**
 * useDebounce hook - PRD requirement for 1 second debounce on auto-save
 * @param callback - Function to execute after delay
 * @param delay - Delay in milliseconds 
 * @param deps - Dependencies array
 */
export function useDebounce(
  callback: () => void,
  delay: number,
  deps: React.DependencyList
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(callback, delay)

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, deps)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}
