/**
 * Default CSS selectors for LinkedIn Recruiter UI elements.
 * These can be overridden by user settings.
 */
export const DEFAULT_SELECTORS = {
  next: 'nav[data-test-ts-pagination] a[rel="next"], a[data-test-pagination-next]',
  prev: 'nav[data-test-ts-pagination] a[rel="prev"], a[data-test-pagination-previous]',
  save: '[data-live-test-profile-container] button[data-live-test-save-to-first-stage], [data-live-test-profile-container] [data-live-test-component="save-to-pipeline-btn"] .save-to-pipeline__button',
  hide: '[data-live-test-profile-container] button[data-live-test-component="hide-btn"]',
} as const

export type SelectorKey = keyof typeof DEFAULT_SELECTORS
export type Selectors = Record<SelectorKey, string>
