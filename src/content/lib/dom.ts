import { AREAS } from '../config'
import type { SelectorKey } from '../config'

/**
 * Get the appropriate DOM area for a selector kind
 */
export function pickArea(kind: SelectorKey): string | null {
  if (kind === 'next' || kind === 'prev') return AREAS.header
  if (kind === 'save' || kind === 'hide') return AREAS.main
  return null
}

/**
 * Query for an element within a specific area
 */
export function queryWithin(selector: string, areaSelector: string | null): Element | null {
  if (areaSelector) {
    const area = document.querySelector(areaSelector)
    if (area) return area.querySelector(selector)
  }
  return document.querySelector(selector)
}

/**
 * Check if LinkedIn's slide-in modal is open
 */
export function isSlideInOpen(): boolean {
  return !!document.querySelector('.base-slidein__modal--open,[data-test-base-slidein]')
}

/**
 * Create a DOM element with styles and attributes
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  styles?: Partial<CSSStyleDeclaration> | null,
  attributes: Record<string, string> = {}
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)

  if (styles) {
    Object.assign(el.style, styles)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'innerHTML') {
      el.innerHTML = value
    } else if (key === 'textContent') {
      el.textContent = value
    } else {
      el.setAttribute(key, value)
    }
  })

  return el
}

/**
 * Extract profile text from LinkedIn Recruiter page
 */
export function extractProfileText(): string {
  const container = document.querySelector('[data-live-test-profile-container]')
  if (!container) return ''

  const selectors = [
    '.pagination-header__header-text',
    '[data-test-row-lockup-full-name]',
    '[data-test-row-lockup-headline]',
    '[data-test-summary-card-text]',
    '[data-test-position-list-container]',
    '[data-test-education-item]',
  ]

  const texts: string[] = []
  selectors.forEach((sel) => {
    container.querySelectorAll(sel).forEach((n) => {
      const text = (n as HTMLElement).innerText
      if (text) texts.push(text)
    })
  })

  return texts.filter(Boolean).join('\n\n')
}
