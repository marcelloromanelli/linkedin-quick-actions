import { COLORS } from '../config'

/**
 * Get the appropriate color for a score value
 */
export function getScoreColor(score: number): string {
  if (score >= 70) return COLORS.success
  if (score >= 40) return COLORS.warning
  return COLORS.danger
}

/**
 * Get a human-readable label for a score value
 */
export function getScoreLabel(score: number): string {
  if (score >= 85) return 'Exceptional'
  if (score >= 70) return 'Strong Match'
  if (score >= 55) return 'Good Fit'
  if (score >= 40) return 'Moderate'
  return 'Weak Match'
}

/**
 * Clamp a score to valid range (0-100)
 */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}
