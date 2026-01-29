/**
 * LinkedIn Quick Actions - Content Script
 *
 * Provides keyboard shortcuts for LinkedIn Recruiter and AI-powered candidate scoring.
 * Designed with iOS 26 glassmorphic UI aesthetic.
 */

import { getSelectors, getSettings, type Selectors } from './lib'
import { injectControlBarStyles } from './ui'
import { createKeyboardHandler } from './features'
import {
  setupMessageListener,
  setupStorageListeners,
  setupMutationObservers,
  setupClickListeners,
  setupRuntimeListeners,
} from './events'

// Module state
let detachKeyHandler: (() => void) | null = null

/**
 * Initialize the content script
 */
async function init(): Promise<void> {
  // Load configuration
  const [selectors, settings] = await Promise.all([
    getSelectors(),
    getSettings(),
  ])

  // Inject required styles
  injectControlBarStyles()

  // Setup keyboard handler
  const keyHandler = createKeyboardHandler(selectors, settings)
  window.addEventListener('keydown', keyHandler, true)
  detachKeyHandler = () => window.removeEventListener('keydown', keyHandler, true)

  // Setup all event listeners
  setupMessageListener()
  setupStorageListeners(settings, (newSelectors: Selectors) => {
    // Replace keyboard handler with updated selectors
    if (detachKeyHandler) detachKeyHandler()
    const newHandler = createKeyboardHandler(newSelectors, settings)
    window.addEventListener('keydown', newHandler, true)
    detachKeyHandler = () => window.removeEventListener('keydown', newHandler, true)
  })
  setupMutationObservers()
  setupClickListeners()
  setupRuntimeListeners()
}

// Start initialization after page is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(init, 500)
} else {
  window.addEventListener('DOMContentLoaded', () => setTimeout(init, 500))
}
