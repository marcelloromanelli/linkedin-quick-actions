/**
 * Storage keys for Chrome storage API
 */
export const STORAGE_KEYS = {
  SELECTORS: 'liqa-selectors-v1',
  SETTINGS: 'liqa-settings-v1',
  AI_CONFIG: 'liqa-ai-config-v1',
  JOBS_INDEX: 'liqa-jobs-index-v1',
  JOB_PREFIX: 'liqa-job-',
  LAST_JOB: 'liqa-last-job-index',
  AGENTS_INDEX: 'liqa-agents-index-v1',
  AGENT_PREFIX: 'liqa-agent-',
  DEFAULT_AGENT: 'liqa-default-agent',
} as const

/**
 * DOM element IDs used by the content script
 */
export const DOM_IDS = {
  TOAST: 'liqa-hint',
  LEGEND: 'liqa-legend',
  SCORE_OVERLAY: 'liqa-score',
  SCORE_BUTTON: 'liqa-score-btn',
  EVAL_CTA: 'liqa-eval-cta',
  PROGRESS_BAR: 'liqa-progress',
  PROGRESS_STYLE: 'liqa-progress-style',
  PULSE_STYLE: 'liqa-style-pulse',
  OVERLAY_STYLES: 'liqa-overlay-styles',
} as const

/**
 * LinkedIn Recruiter DOM areas for scoped queries
 */
export const AREAS = {
  header: '[data-test-pagination-header]',
  main: '[data-live-test-profile-container]',
} as const
