import { useState, useCallback } from 'react'
import { toast } from 'sonner'

const DEFAULT_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo']

/**
 * Hook for managing OpenAI model list
 */
export function useModels() {
  const [models, setModels] = useState<string[]>(DEFAULT_MODELS)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (apiKey: string) => {
    if (!apiKey?.trim()) {
      toast.error('Enter API key first')
      return
    }

    setLoading(true)
    try {
      const resp = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      })
      const data = await resp.json()

      const ids: string[] = (data?.data || [])
        .map((m: { id: string }) => m.id)
        .filter((id: string) => /(gpt|o\d)/i.test(id))
        .sort()

      const unique = Array.from(new Set(ids))
      if (unique.length) {
        setModels(unique)
        toast.success(`${unique.length} models loaded`)
      }
    } catch {
      toast.error('Failed to fetch models')
    } finally {
      setLoading(false)
    }
  }, [])

  return { models, setModels, refresh, loading }
}
