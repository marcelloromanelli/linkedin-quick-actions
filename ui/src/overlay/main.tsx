import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

function ScoreCard() {
  const [open, setOpen] = useState(true)
  const [score, setScore] = useState<string>('…')
  const [bar, setBar] = useState<number>(0)
  const [details, setDetails] = useState<{strengths:string[],weaknesses:string[]}|null>(null)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'LIQA_SCORE_OVERLAY_UPDATE') {
        const { score: sc, strengths, weaknesses } = e.data
        if (typeof sc !== 'undefined') {
          const n = Math.max(0, Math.min(100, Number(sc)))
          setScore(String(n))
          setBar(n)
        }
        if (strengths || weaknesses) setDetails({ strengths: strengths||[], weaknesses: weaknesses||[] })
      }
      if (e.data?.type === 'LIQA_SCORE_OVERLAY_CLOSE') setOpen(false)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  if (!open) return null
  const color = bar>=70?'bg-green-600':bar>=40?'bg-amber-500':'bg-red-600'
  return (
    <div className="fixed top-16 right-4 z-[2147483647] text-sm">
      <Card className="min-w-[260px]">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Match Score: {score}</CardTitle>
          <Button variant="ghost" size="sm" onClick={()=>setOpen(false)}>×</Button>
        </CardHeader>
        <CardContent>
          <div className="h-2 rounded-full bg-neutral-800 overflow-hidden mb-2">
            <div className={`h-full ${color}`} style={{ width: `${bar}%` }} />
          </div>
          {details && (
            <div>
              <Separator className="my-2" />
              <div className="font-medium">Strengths</div>
              <ul className="list-disc ml-4 mb-2">
                {details.strengths.map((s,i)=>(<li key={i}>{s}</li>))}
              </ul>
              <div className="font-medium">Weaknesses</div>
              <ul className="list-disc ml-4">
                {details.weaknesses.map((s,i)=>(<li key={i}>{s}</li>))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function OverlayApp() {
  return <ScoreCard />
}

createRoot(document.getElementById('liqa-overlay-root')!).render(
  <StrictMode>
    <OverlayApp />
  </StrictMode>,
)
