/**
 * Design Tokens - Dark Glass with Aqua Glimmer
 * iOS 26-inspired glassmorphic aesthetic
 */

export const COLORS = {
  // Score indicator colors
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',

  // Accent colors (aqua/cyan theme)
  accent: {
    primary: '#06b6d4',
    secondary: '#22d3ee',
    light: '#67e8f9',
  },

  // Text hierarchy
  text: {
    primary: 'rgba(255,255,255,0.95)',
    secondary: 'rgba(255,255,255,0.75)',
    muted: 'rgba(255,255,255,0.55)',
    faint: 'rgba(255,255,255,0.35)',
  },

  // Border colors
  border: {
    light: 'rgba(255,255,255,0.12)',
    subtle: 'rgba(255,255,255,0.08)',
    faint: 'rgba(255,255,255,0.05)',
    aqua: 'rgba(6,182,212,0.3)',
  },
} as const

export const STYLES = {
  // Dark glass - readable over any background
  glass: {
    background: 'rgba(15,23,42,0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.2)',
  },

  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontMono: 'ui-monospace, Menlo, monospace',

  // Z-index (maximum to overlay LinkedIn UI)
  zIndex: 2147483647,

  // Border radius scale
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '18px',
    full: '22px',
  },
} as const
