/**
 * Progress Bar
 *
 * Animated top-of-page progress indicator for AI scoring
 */

import { COLORS, STYLES, DOM_IDS } from '../config'
import { createElement } from '../lib'

/**
 * Show the progress bar
 */
export function showProgressBar(): void {
  if (document.getElementById(DOM_IDS.PROGRESS_BAR)) return

  // Inject animation styles
  const css = createElement('style', null, {
    id: DOM_IDS.PROGRESS_STYLE,
    textContent: `
      @keyframes liqa-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes liqa-glow-pulse {
        0%, 100% { box-shadow: 0 0 12px rgba(6,182,212,0.4); }
        50% { box-shadow: 0 0 24px rgba(34,211,238,0.7); }
      }
    `,
  })

  const bar = createElement('div', {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    height: '2px',
    background: `linear-gradient(90deg, ${COLORS.accent.primary}, ${COLORS.accent.secondary}, ${COLORS.accent.light}, ${COLORS.accent.primary})`,
    backgroundSize: '300% 100%',
    animation: 'liqa-gradient 1.5s ease-in-out infinite, liqa-glow-pulse 1.5s ease-in-out infinite',
    zIndex: String(STYLES.zIndex),
  }, { id: DOM_IDS.PROGRESS_BAR })

  document.documentElement.appendChild(css)
  document.documentElement.appendChild(bar)
}

/**
 * Hide the progress bar
 */
export function hideProgressBar(): void {
  document.getElementById(DOM_IDS.PROGRESS_BAR)?.remove()
  document.getElementById(DOM_IDS.PROGRESS_STYLE)?.remove()
}
