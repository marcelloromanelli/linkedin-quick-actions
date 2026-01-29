/**
 * Event Listeners
 *
 * Sets up all event listeners for the content script
 */

import { STORAGE_KEYS, DEFAULT_SELECTORS } from '../config'
import type { Selectors } from '../config'
import { getSelectors } from '../lib'
import { showToast, pulseOverlay, ensureControlBar, resetControlBarScore, updateControlBarScore } from '../ui'
import { createKeyboardHandler } from '../features'
import { createAutoScanObserver, resetAutoScan } from '../features'
import { scoreCurrent } from '../features'

/**
 * Setup message listener for score updates
 */
export function setupMessageListener(): void {
  window.addEventListener('message', (e) => {
    if (e?.data?.type === 'LIQA_SCORE_OVERLAY_UPDATE') {
      const { score, strengths, weaknesses } = e.data

      if (score === '…') {
        updateControlBarScore({ loading: true })
      } else if (score === 'error') {
        updateControlBarScore({ score: null, loading: false })
      } else if (typeof score === 'number') {
        updateControlBarScore({
          score,
          loading: false,
          strengths: strengths || [],
          weaknesses: weaknesses || [],
        })
      }
    }
  })
}

/**
 * Setup storage change listeners
 */
export function setupStorageListeners(
  settings: { hotkeysEnabled: boolean },
  onSelectorsChange: (newSelectors: Selectors) => void
): void {
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      // Handle selector changes
      if (area === 'sync' && changes[STORAGE_KEYS.SELECTORS]) {
        const newSelectors = {
          ...DEFAULT_SELECTORS,
          ...(changes[STORAGE_KEYS.SELECTORS].newValue || {}),
        }
        onSelectorsChange(newSelectors)
        showToast('Selectors updated', 'info')
      }

      // Handle settings changes
      if (area === 'sync' && changes[STORAGE_KEYS.SETTINGS]) {
        const { newValue } = changes[STORAGE_KEYS.SETTINGS]
        const enabled = newValue?.hotkeysEnabled !== false
        settings.hotkeysEnabled = enabled
        showToast(enabled ? 'Hotkeys enabled' : 'Hotkeys disabled', 'info')
      }
    })
  } catch {
    // Ignore errors
  }
}

/**
 * Setup mutation observers for UI updates
 */
export function setupMutationObservers(): void {
  // UI observer for control bar
  const uiObserver = new MutationObserver(() => {
    ensureControlBar()
  })

  try {
    uiObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
    })
  } catch {
    // Ignore errors
  }

  // Auto-scan observer
  const autoScanObserver = createAutoScanObserver()
  try {
    autoScanObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
    })
  } catch {
    // Ignore errors
  }
}

/**
 * Setup click listeners for pagination
 */
export function setupClickListeners(): void {
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement)?.closest?.(
      'a[rel="next"],a[rel="prev"],a[data-test-pagination-next],a[data-test-pagination-previous]'
    )

    if (target) {
      resetControlBarScore()
      resetAutoScan()
    }
  }, true)
}

/**
 * Setup runtime message listeners (from options page)
 */
export function setupRuntimeListeners(): void {
  try {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg?.type === 'LIQA_TEST_SELECTOR') {
        handleSelectorTest(msg)
      } else if (msg?.type === 'LIQA_SCORE_REQUEST') {
        const idx = typeof msg.jobIndex === 'number' ? msg.jobIndex : 0
        scoreCurrent(idx)
      }
    })
  } catch {
    // Ignore errors
  }
}

/**
 * Handle selector test message from options page
 */
async function handleSelectorTest(msg: { kind: string; selector?: string }): Promise<void> {
  const { kind } = msg
  let selector = typeof msg.selector === 'string' && msg.selector.trim()
    ? msg.selector.trim()
    : ''

  if (!selector) {
    try {
      const all = await getSelectors()
      selector = all?.[kind as keyof Selectors] || ''
    } catch {
      // Ignore
    }
  }

  if (!selector) {
    showToast(`No selector configured for ${kind}`, 'error')
    return
  }

  try {
    const nodes = Array.from(document.querySelectorAll(selector))
    if (!nodes.length) {
      showToast(`No match for ${kind}`, 'error')
      return
    }
    nodes.slice(0, 6).forEach((el) => pulseOverlay(el, 2000))
    showToast(`Matched ${nodes.length} for ${kind}`, 'ok')
  } catch {
    showToast('Invalid selector syntax', 'error')
  }
}
