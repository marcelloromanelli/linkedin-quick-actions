/**
 * Unified Control Bar
 *
 * A single elegant floating bar that combines:
 * - Keyboard shortcut indicators
 * - AI score display (inline)
 * - Quick actions
 */

import { COLORS, STYLES, DOM_IDS } from '../config'
import { createElement, isSlideInOpen } from '../lib'
import { getScoreColor, getScoreLabel } from '../lib'

const CONTROL_BAR_ID = 'liqa-control-bar'

interface ControlBarState {
  score: number | null
  loading: boolean
  strengths: string[]
  weaknesses: string[]
}

let state: ControlBarState = {
  score: null,
  loading: false,
  strengths: [],
  weaknesses: [],
}

let detailsExpanded = false

/**
 * Create a key indicator element with label
 */
function createKeyIndicator(
  key: string,
  label: string,
  tooltip: string,
  accentColor?: string
): HTMLElement {
  const wrapper = createElement('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '10px',
    cursor: 'default',
    transition: 'all 0.15s ease',
  })

  wrapper.title = tooltip
  wrapper.setAttribute('data-liqa-key', key)

  const keyEl = createElement('span', {
    fontFamily: STYLES.fontMono,
    fontSize: '11px',
    fontWeight: '700',
    color: '#fff',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: accentColor ? `${accentColor}30` : 'rgba(255,255,255,0.15)',
    borderRadius: '5px',
    border: accentColor ? `1px solid ${accentColor}50` : '1px solid rgba(255,255,255,0.2)',
  }, { textContent: key })

  const labelEl = createElement('span', {
    fontSize: '12px',
    fontWeight: '500',
    color: accentColor || 'rgba(255,255,255,0.8)',
    whiteSpace: 'nowrap',
  }, { textContent: label })

  wrapper.append(keyEl, labelEl)

  // Hover effect
  wrapper.onmouseenter = () => {
    wrapper.style.background = 'rgba(255,255,255,0.1)'
  }
  wrapper.onmouseleave = () => {
    wrapper.style.background = 'transparent'
  }

  return wrapper
}

/**
 * Create the score display section
 */
function createScoreDisplay(): HTMLElement {
  const wrapper = createElement('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginLeft: '4px',
    background: 'rgba(6,182,212,0.15)',
    border: '1px solid rgba(6,182,212,0.4)',
  }, { id: 'liqa-score-section' })

  // "Score" label
  const labelEl = createElement('span', {
    fontSize: '11px',
    fontWeight: '600',
    color: COLORS.accent.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  }, { textContent: 'Score' })

  // Score value or loading indicator
  const scoreValue = createElement('span', {
    fontFamily: STYLES.fontMono,
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
    minWidth: '28px',
    textAlign: 'center',
  }, { id: 'liqa-score-value', textContent: '—' })

  // Score label (hidden until score exists)
  const scoreLabel = createElement('span', {
    fontSize: '10px',
    fontWeight: '600',
    color: COLORS.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    display: 'none',
  }, { id: 'liqa-score-label' })

  // Expand indicator
  const expandIcon = createElement('span', {
    display: 'none',
    alignItems: 'center',
    color: COLORS.text.faint,
    transition: 'transform 0.2s ease',
  }, {
    id: 'liqa-expand-icon',
    innerHTML: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
  })

  wrapper.append(labelEl, scoreValue, scoreLabel, expandIcon)

  // Hover effect
  wrapper.onmouseenter = () => {
    wrapper.style.background = 'rgba(6,182,212,0.25)'
    wrapper.style.borderColor = 'rgba(34,211,238,0.6)'
  }
  wrapper.onmouseleave = () => {
    wrapper.style.background = 'rgba(6,182,212,0.15)'
    wrapper.style.borderColor = 'rgba(6,182,212,0.4)'
  }

  // Click to expand details
  wrapper.onclick = () => {
    if (state.score !== null) {
      toggleDetails()
    }
  }

  return wrapper
}

/**
 * Create the details panel (strengths/weaknesses)
 */
function createDetailsPanel(): HTMLElement {
  const panel = createElement('div', {
    position: 'absolute',
    bottom: '100%',
    right: '0',
    marginBottom: '8px',
    width: '320px',
    ...STYLES.glass,
    borderRadius: STYLES.radius.lg,
    padding: '16px',
    opacity: '0',
    transform: 'translateY(8px)',
    transition: 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
    pointerEvents: 'none',
    fontFamily: STYLES.fontFamily,
  }, { id: 'liqa-details-panel' })

  // Header with score
  const header = createElement('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${COLORS.border.subtle}`,
  })

  const headerLeft = createElement('div', {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  })

  const bigScore = createElement('span', {
    fontSize: '32px',
    fontWeight: '700',
    fontFamily: STYLES.fontMono,
    color: COLORS.success,
  }, { id: 'liqa-detail-score' })

  const maxScore = createElement('span', {
    fontSize: '14px',
    color: COLORS.text.faint,
  }, { textContent: '/100' })

  headerLeft.append(bigScore, maxScore)

  const headerLabel = createElement('span', {
    fontSize: '12px',
    fontWeight: '600',
    color: COLORS.success,
  }, { id: 'liqa-detail-label' })

  header.append(headerLeft, headerLabel)

  // Content sections
  const content = createElement('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }, { id: 'liqa-detail-content' })

  panel.append(header, content)
  return panel
}

/**
 * Create a detail section (strengths or weaknesses)
 */
function createDetailSection(
  title: string,
  items: string[],
  color: string,
  iconPath: string
): HTMLElement {
  const section = createElement('div', {})

  const header = createElement('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
  })

  const icon = createElement('span', {
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `${color}15`,
    borderRadius: '50%',
  }, {
    innerHTML: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5">${iconPath}</svg>`,
  })

  const label = createElement('span', {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: `${color}`,
  }, { textContent: title })

  header.append(icon, label)

  const list = createElement('ul', {
    margin: '0',
    padding: '0 0 0 24px',
    listStyle: 'none',
  })

  items.slice(0, 3).forEach((item) => {
    const li = createElement('li', {
      fontSize: '12px',
      color: COLORS.text.secondary,
      lineHeight: '1.5',
      marginBottom: '4px',
      position: 'relative',
    })
    li.innerHTML = `<span style="position:absolute;left:-12px;color:${COLORS.text.faint}">•</span>${item}`
    list.appendChild(li)
  })

  section.append(header, list)
  return section
}

/**
 * Toggle the details panel
 */
function toggleDetails(): void {
  const panel = document.getElementById('liqa-details-panel')
  const expandIcon = document.getElementById('liqa-expand-icon')
  if (!panel) return

  detailsExpanded = !detailsExpanded

  if (detailsExpanded) {
    panel.style.opacity = '1'
    panel.style.transform = 'translateY(0)'
    panel.style.pointerEvents = 'auto'
    if (expandIcon) expandIcon.style.transform = 'rotate(180deg)'
  } else {
    panel.style.opacity = '0'
    panel.style.transform = 'translateY(8px)'
    panel.style.pointerEvents = 'none'
    if (expandIcon) expandIcon.style.transform = 'rotate(0)'
  }
}

/**
 * Create the hint text
 */
function createHintText(): HTMLElement {
  return createElement('span', {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
    marginLeft: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }, {
    id: 'liqa-hint-text',
    innerHTML: `<kbd style="padding:3px 6px;background:rgba(255,255,255,0.1);border-radius:5px;font-family:${STYLES.fontMono};font-size:10px;color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.15)">Q</kbd><span style="color:rgba(255,255,255,0.6)">AI Score</span>`,
  })
}

/**
 * Create the control bar
 */
export function createControlBar(): HTMLElement {
  const bar = createElement('div', {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    ...STYLES.glass,
    padding: '4px 8px',
    borderRadius: STYLES.radius.xl,
    zIndex: String(STYLES.zIndex),
    fontFamily: STYLES.fontFamily,
  }, { id: CONTROL_BAR_ID })

  // Navigation keys
  const navGroup = createElement('div', {
    display: 'flex',
    alignItems: 'center',
    borderRight: `1px solid ${COLORS.border.subtle}`,
    paddingRight: '4px',
    marginRight: '4px',
  })

  navGroup.append(
    createKeyIndicator('A', 'Prev', 'Previous candidate'),
    createKeyIndicator('D', 'Next', 'Next candidate'),
  )

  // Action keys
  const actionGroup = createElement('div', {
    display: 'flex',
    alignItems: 'center',
    borderRight: `1px solid ${COLORS.border.subtle}`,
    paddingRight: '4px',
    marginRight: '4px',
  })

  actionGroup.append(
    createKeyIndicator('S', 'Save', 'Save to pipeline', COLORS.success),
    createKeyIndicator('W', 'Hide', 'Hide candidate', COLORS.danger),
  )

  // Score section
  const scoreSection = createScoreDisplay()

  // Hint text
  const hint = createHintText()

  // Details panel (hidden by default)
  const detailsPanel = createDetailsPanel()

  bar.append(navGroup, actionGroup, scoreSection, hint, detailsPanel)
  return bar
}

/**
 * Ensure the control bar exists in the DOM
 */
export function ensureControlBar(): void {
  if (!isSlideInOpen()) {
    removeControlBar()
    return
  }

  if (document.getElementById(CONTROL_BAR_ID)) return

  const bar = createControlBar()
  document.documentElement.appendChild(bar)
}

/**
 * Remove the control bar from the DOM
 */
export function removeControlBar(): void {
  document.getElementById(CONTROL_BAR_ID)?.remove()
}

/**
 * Update the score display
 */
export function updateControlBarScore(data: {
  score?: number | null
  loading?: boolean
  strengths?: string[]
  weaknesses?: string[]
}): void {
  if (data.score !== undefined) state.score = data.score
  if (data.loading !== undefined) state.loading = data.loading
  if (data.strengths) state.strengths = data.strengths
  if (data.weaknesses) state.weaknesses = data.weaknesses

  const scoreValue = document.getElementById('liqa-score-value')
  const scoreLabel = document.getElementById('liqa-score-label')
  const expandIcon = document.getElementById('liqa-expand-icon')
  const hintText = document.getElementById('liqa-hint-text')
  const detailScore = document.getElementById('liqa-detail-score')
  const detailLabel = document.getElementById('liqa-detail-label')
  const detailContent = document.getElementById('liqa-detail-content')

  if (state.loading) {
    if (scoreValue) {
      scoreValue.innerHTML = `<span style="display:inline-block;animation:liqa-pulse 1s ease-in-out infinite">···</span>`
      scoreValue.style.color = COLORS.accent.secondary
    }
    if (scoreLabel) scoreLabel.style.display = 'none'
    if (expandIcon) expandIcon.style.display = 'none'
    if (hintText) hintText.style.display = 'none'
    return
  }

  if (state.score !== null) {
    const color = getScoreColor(state.score)
    const label = getScoreLabel(state.score)

    if (scoreValue) {
      scoreValue.textContent = String(state.score)
      scoreValue.style.color = color
      scoreValue.style.textShadow = `0 0 12px ${color}40`
    }

    if (scoreLabel) {
      scoreLabel.textContent = label
      scoreLabel.style.color = color
      scoreLabel.style.display = 'block'
    }

    if (expandIcon && (state.strengths.length > 0 || state.weaknesses.length > 0)) {
      expandIcon.style.display = 'flex'
    }

    if (hintText) {
      hintText.innerHTML = `<kbd style="padding:3px 6px;background:rgba(255,255,255,0.1);border-radius:5px;font-family:${STYLES.fontMono};font-size:10px;color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.15)">Q</kbd><span style="color:rgba(255,255,255,0.6)">Rescore</span>`
    }

    // Update details panel
    if (detailScore) {
      detailScore.textContent = String(state.score)
      detailScore.style.color = color
      detailScore.style.textShadow = `0 0 20px ${color}40`
    }

    if (detailLabel) {
      detailLabel.textContent = label
      detailLabel.style.color = color
    }

    if (detailContent) {
      detailContent.innerHTML = ''
      if (state.strengths.length > 0) {
        detailContent.appendChild(
          createDetailSection(
            'Strengths',
            state.strengths,
            COLORS.success,
            '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'
          )
        )
      }
      if (state.weaknesses.length > 0) {
        detailContent.appendChild(
          createDetailSection(
            'Gaps',
            state.weaknesses,
            COLORS.danger,
            '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>'
          )
        )
      }
    }
  } else {
    if (scoreValue) {
      scoreValue.textContent = '—'
      scoreValue.style.color = COLORS.text.muted
      scoreValue.style.textShadow = 'none'
    }
    if (scoreLabel) scoreLabel.style.display = 'none'
    if (expandIcon) expandIcon.style.display = 'none'
    if (hintText) {
      hintText.innerHTML = `<kbd style="padding:3px 6px;background:rgba(255,255,255,0.1);border-radius:5px;font-family:${STYLES.fontMono};font-size:10px;color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.15)">Q</kbd><span style="color:rgba(255,255,255,0.6)">AI Score</span>`
    }
  }
}

/**
 * Reset the control bar state
 */
export function resetControlBarScore(): void {
  state = {
    score: null,
    loading: false,
    strengths: [],
    weaknesses: [],
  }
  detailsExpanded = false
  updateControlBarScore({})

  const panel = document.getElementById('liqa-details-panel')
  const expandIcon = document.getElementById('liqa-expand-icon')
  if (panel) {
    panel.style.opacity = '0'
    panel.style.transform = 'translateY(8px)'
    panel.style.pointerEvents = 'none'
  }
  if (expandIcon) {
    expandIcon.style.transform = 'rotate(0)'
  }
}

/**
 * Inject required CSS animations
 */
export function injectControlBarStyles(): void {
  if (document.getElementById('liqa-control-bar-styles')) return

  const style = createElement('style', null, {
    id: 'liqa-control-bar-styles',
    textContent: `
      @keyframes liqa-pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
    `,
  })
  document.head.appendChild(style)
}
