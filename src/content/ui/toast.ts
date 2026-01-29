/**
 * Toast Notifications
 *
 * Minimal, elegant toast notifications for feedback
 */

import { COLORS, STYLES, DOM_IDS } from '../config'
import { createElement } from '../lib'

let hideTimeout: ReturnType<typeof setTimeout> | null = null

const ICONS = {
  ok: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${COLORS.success}" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${COLORS.danger}" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${COLORS.accent.secondary}" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
}

/**
 * Show a toast notification
 */
export function showToast(text: string, kind?: 'ok' | 'error' | 'info'): void {
  if (!text) return

  let toast = document.getElementById(DOM_IDS.TOAST) as HTMLElement | null

  if (!toast) {
    toast = createElement('div', {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%) translateY(-10px)',
      ...STYLES.glass,
      color: COLORS.text.primary,
      padding: '10px 16px',
      borderRadius: STYLES.radius.lg,
      fontSize: '13px',
      fontWeight: '500',
      zIndex: String(STYLES.zIndex),
      transition: 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
      fontFamily: STYLES.fontFamily,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      opacity: '0',
      pointerEvents: 'none',
    }, { id: DOM_IDS.TOAST })
    document.documentElement.appendChild(toast)
  }

  // Set icon and border color based on kind
  const icon = kind ? ICONS[kind] : ''
  let borderColor = COLORS.border.light

  if (kind === 'error') {
    borderColor = 'rgba(248,113,113,0.3)'
  } else if (kind === 'ok') {
    borderColor = 'rgba(52,211,153,0.3)'
  } else if (kind === 'info') {
    borderColor = 'rgba(34,211,238,0.3)'
  }

  toast.innerHTML = icon + `<span>${text}</span>`
  toast.style.borderColor = borderColor

  // Show
  toast.style.opacity = '1'
  toast.style.transform = 'translateX(-50%) translateY(0)'
  toast.style.pointerEvents = 'auto'

  // Auto-hide
  if (hideTimeout) clearTimeout(hideTimeout)
  hideTimeout = setTimeout(() => {
    if (toast) {
      toast.style.opacity = '0'
      toast.style.transform = 'translateX(-50%) translateY(-10px)'
      toast.style.pointerEvents = 'none'
    }
  }, 1800)
}

/**
 * Hide the toast immediately
 */
export function hideToast(): void {
  const toast = document.getElementById(DOM_IDS.TOAST)
  if (toast) {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(-50%) translateY(-10px)'
    toast.style.pointerEvents = 'none'
  }
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}
