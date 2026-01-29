import { useState, useEffect, useCallback } from 'react'
import { getLocal, setLocal, AGENTS_INDEX, AGENT_PREFIX, DEFAULT_AGENT } from '@/lib/storage'
import { toast } from 'sonner'

export interface Agent {
  id: string
  name: string
  prompt: string
}

export interface AgentIndexEntry {
  id: string
  name: string
}

/**
 * Hook for managing AI agent personalities
 */
export function useAgents() {
  const [agents, setAgents] = useState<AgentIndexEntry[]>([])
  const [defaultAgentId, setDefaultAgentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load agents on mount
  useEffect(() => {
    Promise.all([
      getLocal(AGENTS_INDEX, [] as AgentIndexEntry[]),
      getLocal(DEFAULT_AGENT, null as string | null),
    ]).then(([idx, defaultId]) => {
      setAgents(idx)
      setDefaultAgentId(defaultId)
      setLoading(false)
    })
  }, [])

  // Save an agent (create or update)
  const save = useCallback(async (agent: Omit<Agent, 'id'> & { id?: string }) => {
    try {
      if (!agent.name || !agent.prompt) {
        toast.error('Name and prompt required')
        return false
      }

      if (agent.id) {
        // Update existing
        await setLocal(AGENT_PREFIX + agent.id, {
          id: agent.id,
          name: agent.name,
          prompt: agent.prompt,
        })
        const newAgents = agents.map((a) =>
          a.id === agent.id ? { id: a.id, name: agent.name } : a
        )
        await setLocal(AGENTS_INDEX, newAgents)
        setAgents(newAgents)
        toast.success('Agent updated')
      } else {
        // Create new
        const id = String(Date.now())
        await setLocal(AGENT_PREFIX + id, {
          id,
          name: agent.name,
          prompt: agent.prompt,
        })
        const newAgents = [...agents, { id, name: agent.name }]
        await setLocal(AGENTS_INDEX, newAgents)
        setAgents(newAgents)

        // If first agent, set as default
        if (agents.length === 0) {
          await setLocal(DEFAULT_AGENT, id)
          setDefaultAgentId(id)
        }
        toast.success('Agent saved')
      }
      return true
    } catch {
      toast.error('Failed to save')
      return false
    }
  }, [agents])

  // Remove an agent
  const remove = useCallback(async (id: string) => {
    try {
      const newAgents = agents.filter((a) => a.id !== id)
      await new Promise<void>((r) =>
        chrome.storage.local.remove(AGENT_PREFIX + id, () => r())
      )
      await setLocal(AGENTS_INDEX, newAgents)
      setAgents(newAgents)

      // If we deleted the default, set to first remaining
      if (defaultAgentId === id) {
        const newDefault = newAgents.length > 0 ? newAgents[0].id : null
        await setLocal(DEFAULT_AGENT, newDefault)
        setDefaultAgentId(newDefault)
      }
      toast.success('Agent removed')
    } catch {
      toast.error('Failed to remove')
    }
  }, [agents, defaultAgentId])

  // Get full agent data
  const getAgent = useCallback(async (id: string): Promise<Agent | null> => {
    const data = await new Promise<Record<string, Agent>>((r) =>
      chrome.storage.local.get([AGENT_PREFIX + id], (d: Record<string, Agent>) => r(d))
    )
    return data[AGENT_PREFIX + id] || null
  }, [])

  // Set default agent
  const setDefault = useCallback(async (id: string) => {
    try {
      await setLocal(DEFAULT_AGENT, id)
      setDefaultAgentId(id)
      toast.success('Default agent updated')
    } catch {
      toast.error('Failed to set default')
    }
  }, [])

  // Load default prompt from bundled file
  const loadDefaultPrompt = useCallback(async (): Promise<string> => {
    try {
      const url = chrome.runtime.getURL('dist/src/ai/system-prompt.txt')
      const res = await fetch(url)
      return await res.text()
    } catch {
      toast.error('Unable to load default prompt')
      return ''
    }
  }, [])

  return {
    agents,
    defaultAgentId,
    loading,
    save,
    remove,
    getAgent,
    setDefault,
    loadDefaultPrompt,
  }
}
