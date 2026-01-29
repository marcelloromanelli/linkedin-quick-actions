import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandInput, CommandEmpty, CommandList, CommandGroup, CommandItem } from '@/components/ui/command'
import { Sparkles, ChevronDown, Settings, Zap, Check } from 'lucide-react'
import { getLocal, getSync, setLocal, setSync, JOBS_INDEX, LAST_JOB, SYNC_SETTINGS, SYNC_SELECTORS } from '@/lib/storage'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

function PopupApp() {
  const [active, setActive] = useState(false)
  const [hotkeys, setHotkeys] = useState(true)
  const [jobs, setJobs] = useState<{id:string,name:string}[]>([])
  const [jobIdx, setJobIdx] = useState(0)
  const [jobOpen, setJobOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('dark')
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
    toast.success('Evaluating candidate...')
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
  }

  return (
    <div className="w-[380px] bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/15">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-semibold tracking-tight">Quick Actions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={active ? "success" : "secondary"}>
            {active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant={hotkeys ? "default" : "muted"}>
            {hotkeys ? 'Keys On' : 'Keys Off'}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Hotkeys Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Label htmlFor="hotkeys" className="text-xs font-medium">Keyboard shortcuts</Label>
            <div className="flex items-center gap-1">
              <kbd>D</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>W</kbd>
            </div>
          </div>
          <Switch id="hotkeys" checked={hotkeys} onCheckedChange={toggleHotkeys} />
        </div>

        <Separator />

        {/* Test Selectors - Compact Grid */}
        <div className="space-y-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Test Selectors
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <Button variant="outline" size="sm" onClick={() => test('next')}>
              Next
            </Button>
            <Button variant="outline" size="sm" onClick={() => test('prev')}>
              Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => test('save')}>
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={() => test('hide')}>
              Hide
            </Button>
          </div>
        </div>

        <Separator />

        {/* AI Evaluation */}
        <div className="space-y-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            AI Candidate Evaluation
          </div>
          <div className="flex gap-2">
            <Popover open={jobOpen} onOpenChange={setJobOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-between font-normal">
                  <span className="truncate">
                    {jobs[jobIdx]?.name || 'Select role...'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                <Command>
                  <CommandInput placeholder="Search roles..." className="h-8 text-xs" />
                  <CommandEmpty className="py-3 text-xs text-center text-muted-foreground">
                    No roles found
                  </CommandEmpty>
                  <CommandList className="max-h-[180px] scrollbar-thin">
                    <CommandGroup>
                      {jobs.map((j, i) => (
                        <CommandItem
                          key={j.id}
                          value={j.name}
                          onSelect={() => { setJobIdx(i); setJobOpen(false) }}
                          className="text-xs"
                        >
                          <Check className={`w-3.5 h-3.5 mr-2 ${i === jobIdx ? 'opacity-100' : 'opacity-0'}`} />
                          {j.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button onClick={scoreNow} disabled={!jobs.length} className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Evaluate
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Shortcut: <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-card/50">
        <Button variant="ghost" size="sm" onClick={() => chrome.runtime.openOptionsPage?.()}>
          <Settings className="w-3.5 h-3.5 mr-1.5" />
          Settings
        </Button>
        <span className="text-[10px] font-mono text-muted-foreground">v0.1.0</span>
      </footer>

      <Toaster
        position="bottom-center"
        toastOptions={{
          className: 'text-xs',
          duration: 2000,
        }}
      />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
)
