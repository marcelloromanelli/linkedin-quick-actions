export const SYNC_SELECTORS = 'liqa-selectors-v1'
export const SYNC_SETTINGS = 'liqa-settings-v1'
export const LOCAL_CFG = 'liqa-ai-config-v1'
export const JOBS_INDEX = 'liqa-jobs-index-v1'
export const JOB_PREFIX = 'liqa-job-'
export const LAST_JOB = 'liqa-last-job-index'

export function getSync<T>(key: string, fallback: T): Promise<T> {
  return new Promise((resolve) => chrome.storage.sync.get([key], (d: any) => resolve((d?.[key] ?? fallback) as T)))
}

export function setSync<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => chrome.storage.sync.set({ [key]: value }, () => resolve()))
}

export function getLocal<T>(key: string, fallback: T): Promise<T> {
  return new Promise((resolve) => chrome.storage.local.get([key], (d: any) => resolve((d?.[key] ?? fallback) as T)))
}

export function setLocal<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => chrome.storage.local.set({ [key]: value }, () => resolve()))
}

