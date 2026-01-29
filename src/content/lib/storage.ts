import { STORAGE_KEYS, DEFAULT_SELECTORS, type Selectors } from '../config'

/**
 * Get selectors from sync storage, merged with defaults
 */
export function getSelectors(): Promise<Selectors> {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get([STORAGE_KEYS.SELECTORS], (data) => {
        const saved = data?.[STORAGE_KEYS.SELECTORS]
        resolve({ ...DEFAULT_SELECTORS, ...(saved || {}) })
      })
    } catch {
      resolve({ ...DEFAULT_SELECTORS })
    }
  })
}

/**
 * Get settings from sync storage
 */
export interface Settings {
  hotkeysEnabled: boolean
  legendEnabled?: boolean
}

export function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get([STORAGE_KEYS.SETTINGS], (data) => {
        const defaults: Settings = { hotkeysEnabled: true }
        resolve({ ...defaults, ...(data?.[STORAGE_KEYS.SETTINGS] || {}) })
      })
    } catch {
      resolve({ hotkeysEnabled: true })
    }
  })
}

/**
 * Get values from local storage
 */
export function getLocalStorage<T = Record<string, unknown>>(keys: string[]): Promise<T> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(keys, (data) => resolve(data as T))
    } catch {
      resolve({} as T)
    }
  })
}

/**
 * Get AI configuration
 */
export interface AIConfig {
  apiKey?: string
  model?: string
  autoScan?: boolean
  impactProfile?: string
  systemPrompt?: string
}

export async function getAIConfig(): Promise<AIConfig> {
  const data = await getLocalStorage<Record<string, AIConfig>>([STORAGE_KEYS.AI_CONFIG])
  return data?.[STORAGE_KEYS.AI_CONFIG] || {}
}

/**
 * Get job by index from storage
 */
export interface Job {
  id: string
  name: string
  text: string
  impactProfile?: string
}

export interface JobIndexEntry {
  id: string
  name: string
}

export async function getJobAtIndex(jobIndex: number): Promise<Job | null> {
  const data = await getLocalStorage<Record<string, unknown>>([
    STORAGE_KEYS.JOBS_INDEX,
    STORAGE_KEYS.LAST_JOB,
  ])

  const index = (data?.[STORAGE_KEYS.JOBS_INDEX] as JobIndexEntry[]) || []
  const chosen = typeof jobIndex === 'number'
    ? jobIndex
    : (typeof data?.[STORAGE_KEYS.LAST_JOB] === 'number' ? data[STORAGE_KEYS.LAST_JOB] as number : 0)

  const entry = index[chosen]
  if (!entry) return null

  const jobKey = STORAGE_KEYS.JOB_PREFIX + entry.id
  const jobData = await getLocalStorage<Record<string, Job>>([jobKey])
  return jobData?.[jobKey] || { id: entry.id, name: entry.name, text: '' }
}

/**
 * Get default agent's system prompt
 */
export async function getDefaultAgentPrompt(): Promise<string | null> {
  const data = await getLocalStorage<Record<string, string>>([STORAGE_KEYS.DEFAULT_AGENT])
  const defaultAgentId = data?.[STORAGE_KEYS.DEFAULT_AGENT]

  if (!defaultAgentId) return null

  const agentKey = STORAGE_KEYS.AGENT_PREFIX + defaultAgentId
  const agentData = await getLocalStorage<Record<string, { prompt?: string }>>([agentKey])
  return agentData?.[agentKey]?.prompt?.trim() || null
}
