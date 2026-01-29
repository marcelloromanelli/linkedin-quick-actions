import { useState, useEffect, useCallback } from 'react'
import { getSync, setSync, getLocal, setLocal } from '@/lib/storage'

/**
 * Hook for synced storage with automatic loading
 */
export function useSyncStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSync(key, defaultValue).then((v) => {
      setValue(v)
      setLoading(false)
    })
  }, [key])

  const save = useCallback(async (newValue: T) => {
    setValue(newValue)
    await setSync(key, newValue)
  }, [key])

  return { value, setValue, save, loading }
}

/**
 * Hook for local storage with automatic loading
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLocal(key, defaultValue).then((v) => {
      setValue(v)
      setLoading(false)
    })
  }, [key])

  const save = useCallback(async (newValue: T) => {
    setValue(newValue)
    await setLocal(key, newValue)
  }, [key])

  return { value, setValue, save, loading }
}
