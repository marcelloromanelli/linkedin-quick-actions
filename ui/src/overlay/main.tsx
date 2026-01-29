import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { X, TrendingUp, TrendingDown, Target, Loader2 } from 'lucide-react'

/**
 * Score Overlay
 *
 * A compact, data-focused card that displays AI candidate scores.
 * Precision design: monospace numbers, semantic colors, clean borders.
 */
function ScoreCard() {
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState<number | null>(null)
  const [details, setDetails] = useState<{strengths:string[],weaknesses:string[]}|null>(null)

  useEffect(() => {
    document.documentElement.classList.add('dark')

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'LIQA_SCORE_OVERLAY_UPDATE') {
        const { score: sc, strengths, weaknesses } = e.data
        if (typeof sc !== 'undefined') {
          const n = Math.max(0, Math.min(100, Number(sc)))
          setScore(n)
          setLoading(false)
        }
        if (strengths || weaknesses) {
          setDetails({ strengths: strengths || [], weaknesses: weaknesses || [] })
        }
      }
      if (e.data?.type === 'LIQA_SCORE_OVERLAY_CLOSE') {
        setOpen(false)
      }
      if (e.data?.type === 'LIQA_SCORE_OVERLAY_LOADING') {
        setLoading(true)
        setScore(null)
        setDetails(null)
        setOpen(true)
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  if (!open) return null

  // Score color classes
  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-success'
    if (s >= 40) return 'text-warning'
    return 'text-destructive'
  }

  const getBarColor = (s: number) => {
    if (s >= 70) return 'score-high'
    if (s >= 40) return 'score-mid'
    return 'score-low'
  }

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent'
    if (s >= 70) return 'Strong'
    if (s >= 55) return 'Good'
    if (s >= 40) return 'Moderate'
    return 'Weak'
  }

  return (
    <div className="fixed top-4 right-4 z-[2147483647] animate-fade-in">
      <div className="w-72 bg-card border border-border rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Match Score
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Score Display */}
        <div className="px-3 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Analyzing profile...</span>
            </div>
          ) : score !== null ? (
            <>
              {/* Score Number */}
              <div className="flex items-baseline justify-center gap-2 mb-3">
                <span className={`text-4xl font-bold font-mono tabular-nums ${getScoreColor(score)}`}>
                  {score}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>

              {/* Score Label */}
              <div className="text-center mb-3">
                <span className={`text-xs font-medium ${getScoreColor(score)}`}>
                  {getScoreLabel(score)} Match
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getBarColor(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-xs text-muted-foreground">
              No score available
            </div>
          )}
        </div>

        {/* Details */}
        {details && (details.strengths.length > 0 || details.weaknesses.length > 0) && (
          <div className="border-t border-border">
            {/* Strengths */}
            {details.strengths.length > 0 && (
              <div className="px-3 py-2.5 border-b border-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span className="text-[10px] font-medium uppercase tracking-wide text-success">
                    Strengths
                  </span>
                </div>
                <ul className="space-y-1">
                  {details.strengths.slice(0, 4).map((s, i) => (
                    <li key={i} className="text-xs text-foreground leading-snug flex items-start gap-1.5">
                      <span className="text-success mt-1">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {details.weaknesses.length > 0 && (
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-3 h-3 text-destructive" />
                  <span className="text-[10px] font-medium uppercase tracking-wide text-destructive">
                    Concerns
                  </span>
                </div>
                <ul className="space-y-1">
                  {details.weaknesses.slice(0, 4).map((s, i) => (
                    <li key={i} className="text-xs text-foreground leading-snug flex items-start gap-1.5">
                      <span className="text-destructive mt-1">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

createRoot(document.getElementById('liqa-overlay-root')!).render(
  <StrictMode>
    <ScoreCard />
  </StrictMode>,
)
