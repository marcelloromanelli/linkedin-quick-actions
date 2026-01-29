import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandInput, CommandEmpty, CommandList, CommandGroup, CommandItem } from '@/components/ui/command'
import { Sparkles, Briefcase, Settings } from 'lucide-react'
import { getLocal, getSync, setLocal, setSync, JOBS_INDEX, LAST_JOB, SYNC_SETTINGS, SYNC_SELECTORS } from '@/lib/storage'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

function PopupApp() {
  const [active, setActive] = useState(false)
  const [hotkeys, setHotkeys] = useState(true)
  const [jobs, setJobs] = useState<{id:string,name:string}[]>([])
  const [jobIdx, setJobIdx] = useState(0)

  useEffect(() => {
    // Force dark theme
    try { document.documentElement.classList.add('dark') } catch {}
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
      const tab = tabs?.[0]
      setActive(!!(tab?.url?.startsWith('https://www.linkedin.com/talent/hire/')))
    })
    getSync(SYNC_SETTINGS, { hotkeysEnabled: true }).then(s => setHotkeys(s.hotkeysEnabled !== false))
    getLocal(JOBS_INDEX, [] as {id:string,name:string}[]).then(setJobs)
    getLocal(LAST_JOB, 0).then(setJobIdx)
  }, [])

  const toggleHotkeys = async (checked: boolean) => {
    setHotkeys(checked)
    const cur = await getSync(SYNC_SETTINGS, { hotkeysEnabled: true })
    await setSync(SYNC_SETTINGS, { ...cur, hotkeysEnabled: checked })
  }

  const test = (kind: 'next'|'prev'|'save'|'hide') => {
    chrome.tabs.query({ url: ['https://www.linkedin.com/talent/hire/*'] }, (tabs: any[]) => {
      const tab = tabs.find(t => t.active) || tabs[0]
      if (!tab?.id) return
      getSync(SYNC_SELECTORS, {} as any).then(cfg => {
        const selector = (cfg as any)[kind]
        chrome.tabs.sendMessage(tab.id, { type: 'LIQA_TEST_SELECTOR', kind, selector }, () => {
          if (!chrome.runtime.lastError) return
          chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/content/content.js'] }, () => {
            if (chrome.runtime.lastError) return
            chrome.tabs.sendMessage(tab.id, { type: 'LIQA_TEST_SELECTOR', kind, selector })
          })
        })
      })
    })
  }

  const scoreNow = async () => {
    await setLocal(LAST_JOB, jobIdx)
    toast.success('Evaluating current candidate…')
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
      const tab = tabs?.[0]
      if (!tab?.id) return
      chrome.tabs.sendMessage(tab.id, { type: 'LIQA_SCORE_REQUEST', jobIndex: jobIdx }, () => {
        if (!chrome.runtime.lastError) return
        chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/content/content.js'] }, () => {
          if (chrome.runtime.lastError) return
          chrome.tabs.sendMessage(tab.id, { type: 'LIQA_SCORE_REQUEST', jobIndex: jobIdx })
        })
      })
    })
    // Toaster appears; we can add notifications later
  }

  return (
    <div className="p-3 w-[420px] text-sm">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>LinkedIn Quick Actions</span>
            <span className="flex gap-2">
              <Badge variant="default">{active ? 'Active' : 'Inactive'}</Badge>
              <Badge variant="secondary">{hotkeys ? 'Hotkeys On' : 'Hotkeys Off'}</Badge>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="hotkeys">Enable D / A / S / W</Label>
            <div className="flex items-center gap-2">
              <Switch id="hotkeys" checked={hotkeys} onCheckedChange={toggleHotkeys} />
              <span className="text-muted-foreground" id="status">{hotkeys ? 'On' : 'Off'}</span>
            </div>
          </div>
          <Separator />
          <div>
            <div className="mb-2 font-medium">Test Selectors</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => test('next')}>Test Next</Button>
              <Button variant="outline" onClick={() => test('prev')}>Test Previous</Button>
              <Button variant="outline" onClick={() => test('save')}>Test Save</Button>
              <Button variant="outline" onClick={() => test('hide')}>Test Hide</Button>
              <Button onClick={() => ['next','prev','save','hide'].forEach((k,i)=>setTimeout(()=>test(k as any), i*100))}>Test All</Button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    {jobs[jobIdx]?.name || 'Target Role'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                <Command>
                  <CommandInput placeholder="Search jobs..." />
                  <CommandEmpty>No jobs found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {jobs.map((j, i) => (
                        <CommandItem key={j.id} value={j.name} onSelect={() => setJobIdx(i)}>
                          {j.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button onClick={scoreNow} disabled={!jobs.length}>
              <Sparkles className="mr-2 h-4 w-4" />
              Evaluate Fit
            </Button>
          </div>
          <div className="text-muted-foreground">Press Cmd/Ctrl+Shift+F to evaluate.</div>
          <Separator />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => chrome.runtime.openOptionsPage?.()}>
              <Settings className="mr-2 h-4 w-4" />
              Options
            </Button>
            <div className="text-[11px] text-muted-foreground">v0.1.0</div>
          </div>
        </CardContent>
      </Card>
      <Toaster richColors closeButton position="bottom-center" />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
)
