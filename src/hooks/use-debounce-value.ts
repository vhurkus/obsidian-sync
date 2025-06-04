import { useState, useEffect } from 'react'

/**
 * useDebounce hook for debouncing values
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * useDebounce hook for debouncing callbacks
 * @param callback - Function to execute after delay
 * @param delay - Delay in milliseconds 
 * @param deps - Dependencies array
 */
export function useDebounceCallback(
  callback: () => void,
  delay: number,
  deps: React.DependencyList
) {
  useEffect(() => {
    const timer = setTimeout(callback, delay)

    return () => {
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, delay, ...deps])
}

// Default export for backward compatibility (value-based)
export function useDebounce<T>(value: T, delay: number): T {
  return useDebounceValue(value, delay)
}
