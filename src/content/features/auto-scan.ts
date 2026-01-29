/**
 * Auto-scan Feature
 *
 * Automatically scores candidates when navigating profiles
 */

import { STORAGE_KEYS } from '../config'
import { isSlideInOpen } from '../lib'
import { scoreCurrent } from './scoring'

let lastScoredUrl = ''
let autoscanTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Check if auto-scan should run
 */
function performAutoScan(): void {
  if (!isSlideInOpen()) return

  const url = location.href
  if (url === lastScoredUrl) return

  try {
    if (!chrome?.runtime?.id || !chrome?.storage?.local?.get) return

    chrome.storage.local.get([STORAGE_KEYS.AI_CONFIG], (data) => {
      const cfg = data?.[STORAGE_KEYS.AI_CONFIG] || {}
      if (cfg.autoScan) {
        lastScoredUrl = url
        scoreCurrent()
      }
    })
  } catch {
    // Ignore errors
  }
}

/**
 * Debounced auto-scan trigger
 */
export function maybeAutoScan(): void {
  if (autoscanTimer) return

  autoscanTimer = setTimeout(() => {
    autoscanTimer = null
    performAutoScan()
  }, 150)
}

/**
 * Reset the last scored URL (e.g., when navigating)
 */
export function resetAutoScan(): void {
  lastScoredUrl = ''
}

/**
 * Create a mutation observer for auto-scan
 */
export function createAutoScanObserver(): MutationObserver {
  return new MutationObserver(() => maybeAutoScan())
}
