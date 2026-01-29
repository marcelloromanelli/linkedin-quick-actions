/**
 * Keyboard Shortcuts Handler
 *
 * Handles D/A/S/W/Q key bindings for LinkedIn Recruiter navigation
 */

import type { Selectors, SelectorKey } from '../config'
import { pickArea, queryWithin, isSlideInOpen } from '../lib'
import { showToast, pulseOverlay, resetControlBarScore } from '../ui'
import { scoreCurrent } from './scoring'
import { getLocalStorage } from '../lib'
import { STORAGE_KEYS } from '../config'

/**
 * Click the first element matching a selector
 */
function clickFirst(selector: string, areaSelector: string | null): boolean {
  const el = queryWithin(selector, areaSelector)
  if (el) {
    pulseOverlay(el, 800)
    ;(el as HTMLElement).click()
    return true
  }
  return false
}

/**
 * Handle a keyboard shortcut
 */
export function handleKeydown(selectors: Selectors, e: KeyboardEvent): void {
  const target = e.target as HTMLElement | null

  // Don't capture when typing in inputs
  if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
    return
  }

  const key = e.key.toLowerCase()
  const inSlideIn = isSlideInOpen()

  switch (key) {
    case 'd': {
      // Next candidate
      resetControlBarScore()
      const area = pickArea('next')
      if (!inSlideIn && !queryWithin(selectors.next, area)) {
        showToast('Next not available', 'error')
        return
      }
      if (clickFirst(selectors.next, area)) {
        showToast('Next candidate ▶', 'ok')
      } else {
        showToast('Next button not found', 'error')
      }
      break
    }

    case 'a': {
      // Previous candidate
      resetControlBarScore()
      const area = pickArea('prev')
      if (!inSlideIn && !queryWithin(selectors.prev, area)) {
        showToast('Previous not available', 'error')
        return
      }
      if (clickFirst(selectors.prev, area)) {
        showToast('Previous candidate ◀', 'ok')
      } else {
        showToast('Previous button not found', 'error')
      }
      break
    }

    case 's': {
      // Save to pipeline
      const area = pickArea('save')
      if (!inSlideIn && !queryWithin(selectors.save, area)) {
        showToast('Save not available', 'error')
        return
      }
      if (clickFirst(selectors.save, area)) {
        showToast('Saved ✓', 'ok')
      } else {
        showToast('Save button not found', 'error')
      }
      break
    }

    case 'w': {
      // Hide candidate
      const area = pickArea('hide')
      let clicked = false

      // Try to find hide button near save button first
      try {
        const areaNode = document.querySelector(area || '')
        const saveBtn = areaNode
          ? areaNode.querySelector(selectors.save)
          : document.querySelector(selectors.save)

        if (saveBtn) {
          const group = saveBtn.closest('.shared-action-buttons, .profile-item-actions, .profile-item-actions__act')
          const hideBtn = group?.querySelector('button[data-live-test-component="hide-btn"]')
          if (hideBtn) {
            pulseOverlay(hideBtn, 800)
            ;(hideBtn as HTMLElement).click()
            showToast('Hidden ✕', 'ok')
            clicked = true
          }
        }
      } catch {
        // Fall through to default selector
      }

      if (!clicked) {
        if (!inSlideIn && !queryWithin(selectors.hide, area)) {
          showToast('Hide not available', 'error')
          return
        }
        if (clickFirst(selectors.hide, area)) {
          showToast('Hidden ✕', 'ok')
        } else {
          showToast('Hide button not found', 'error')
        }
      }
      break
    }

    case 'q': {
      // AI Score
      try {
        e.preventDefault()
        e.stopPropagation()
      } catch {
        // Ignore
      }

      resetControlBarScore()

      getLocalStorage<Record<string, number>>([STORAGE_KEYS.LAST_JOB])
        .then((d) => {
          const idx = typeof d?.[STORAGE_KEYS.LAST_JOB] === 'number'
            ? d[STORAGE_KEYS.LAST_JOB]
            : 0
          scoreCurrent(idx)
        })
        .catch(() => scoreCurrent(0))
      break
    }
  }
}

/**
 * Create the keyboard event listener
 */
export function createKeyboardHandler(
  selectors: Selectors,
  settings: { hotkeysEnabled: boolean }
): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    if (!settings.hotkeysEnabled) return
    handleKeydown(selectors, e)
  }
}
