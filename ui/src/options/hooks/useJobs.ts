import { useState, useEffect, useCallback } from 'react'
import { getLocal, setLocal, JOBS_INDEX, JOB_PREFIX } from '@/lib/storage'
import { toast } from 'sonner'

export interface Job {
  id: string
  name: string
  text: string
  impactProfile: string
}

export interface JobIndexEntry {
  id: string
  name: string
}

/**
 * Hook for managing job descriptions
 */
export function useJobs() {
  const [index, setIndex] = useState<JobIndexEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Load jobs on mount
  useEffect(() => {
    getLocal(JOBS_INDEX, [] as JobIndexEntry[]).then((idx) => {
      setIndex(idx)
      setLoading(false)
    })
  }, [])

  // Save a job (create or update)
  const save = useCallback(async (job: Omit<Job, 'id'> & { id?: string }) => {
    try {
      if (!job.name || !job.text) {
        toast.error('Name and description required')
        return false
      }

      if (job.id) {
        // Update existing
        await setLocal(JOB_PREFIX + job.id, {
          id: job.id,
          name: job.name,
          text: job.text,
          impactProfile: job.impactProfile,
        })
        const newIndex = index.map((j) =>
          j.id === job.id ? { id: j.id, name: job.name } : j
        )
        await setLocal(JOBS_INDEX, newIndex)
        setIndex(newIndex)
        toast.success('Job updated')
      } else {
        // Create new
        const id = String(Date.now())
        await setLocal(JOB_PREFIX + id, {
          id,
          name: job.name,
          text: job.text,
          impactProfile: job.impactProfile,
        })
        const newIndex = [...index, { id, name: job.name }]
        await setLocal(JOBS_INDEX, newIndex)
        setIndex(newIndex)
        toast.success('Job saved')
      }
      return true
    } catch {
      toast.error('Failed to save')
      return false
    }
  }, [index])

  // Remove a job
  const remove = useCallback(async (id: string) => {
    try {
      const newIndex = index.filter((j) => j.id !== id)
      await new Promise<void>((r) =>
        chrome.storage.local.remove(JOB_PREFIX + id, () => r())
      )
      await setLocal(JOBS_INDEX, newIndex)
      setIndex(newIndex)
      toast.success('Job removed')
    } catch {
      toast.error('Failed to remove')
    }
  }, [index])

  // Get full job data
  const getJob = useCallback(async (id: string): Promise<Job | null> => {
    const data = await new Promise<Record<string, Job>>((r) =>
      chrome.storage.local.get([JOB_PREFIX + id], (d: Record<string, Job>) => r(d))
    )
    return data[JOB_PREFIX + id] || null
  }, [])

  return { index, loading, save, remove, getJob }
}
