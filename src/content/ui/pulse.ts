/**
 * Pulse Highlight Effect
 *
 * Visual feedback when keyboard shortcuts activate buttons
 */

import { STYLES, DOM_IDS, COLORS } from '../config'
import { createElement } from '../lib'

/**
 * Ensure pulse animation styles are injected
 */
function ensurePulseStyles(): void {
  if (document.getElementById(DOM_IDS.PULSE_STYLE)) return

  const style = createElement('style', null, {
    id: DOM_IDS.PULSE_STYLE,
    textContent: `
      @keyframes liqa-pulse {
        0% { box-shadow: 0 0 0 2px rgba(6,182,212,.6), 0 0 12px 2px rgba(6,182,212,.3); }
        50% { box-shadow: 0 0 0 3px rgba(34,211,238,.9), 0 0 24px 8px rgba(34,211,238,.5); }
        100% { box-shadow: 0 0 0 2px rgba(6,182,212,.6), 0 0 12px 2px rgba(6,182,212,.3); }
      }
      @keyframes liqa-pulse-fade {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
      }
    `,
  })
  document.documentElement.appendChild(style)
}

/**
 * Create a pulse overlay around an element
 */
export function pulseOverlay(el: Element, durationMs = 1800): void {
  ensurePulseStyles()

  const rect = el.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return

  const pad = 4
  const overlay = createElement('div', {
    position: 'fixed',
    top: `${Math.max(0, rect.top - pad)}px`,
    left: `${Math.max(0, rect.left - pad)}px`,
    width: `${Math.max(0, rect.width + pad * 2)}px`,
    height: `${Math.max(0, rect.height + pad * 2)}px`,
    border: '2px solid rgba(34,211,238,0.8)',
    borderRadius: STYLES.radius.md,
    pointerEvents: 'none',
    zIndex: String(STYLES.zIndex),
    animation: `liqa-pulse 800ms ease-in-out infinite, liqa-pulse-fade ${durationMs}ms ease-out forwards`,
    boxSizing: 'border-box',
    background: 'rgba(6,182,212,0.08)',
  })

  document.documentElement.appendChild(overlay)
  setTimeout(() => overlay.remove(), durationMs)
}

/**
 * Brief flash effect for key press feedback
 */
export function flashKeyIndicator(key: string): void {
  const indicator = document.querySelector(`[data-liqa-key="${key}"]`) as HTMLElement
  if (!indicator) return

  indicator.style.background = `${COLORS.accent.primary}30`
  indicator.style.transform = 'scale(1.1)'

  setTimeout(() => {
    indicator.style.background = ''
    indicator.style.transform = ''
  }, 150)
}
