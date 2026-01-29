import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandInput, CommandEmpty, CommandList, CommandGroup, CommandItem } from '@/components/ui/command'
import { Sparkles, ChevronDown, Settings, Check, Zap, Command as CommandIcon } from 'lucide-react'
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
    <div className="w-[400px] min-h-[420px] bg-background relative overflow-hidden">
      {/* Ambient glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Quick Actions</h1>
              <p className="text-[11px] text-muted-foreground">LinkedIn Recruiter</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={active ? "default" : "secondary"} className={active ? "shadow-[0_0_12px_rgba(34,211,238,0.3)]" : ""}>
              {active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-5 pb-5 space-y-5">
          {/* Keyboard Shortcuts Card */}
          <div className="glass rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-secondary/50">
                  <CommandIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <Label htmlFor="hotkeys" className="text-sm font-medium">Keyboard Shortcuts</Label>
                  <p className="text-[11px] text-muted-foreground">Navigate candidates quickly</p>
                </div>
              </div>
              <Switch id="hotkeys" checked={hotkeys} onCheckedChange={toggleHotkeys} />
            </div>

            {/* Keys */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <kbd>D</kbd>
                <span className="text-[11px] text-muted-foreground">Next</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd>A</kbd>
                <span className="text-[11px] text-muted-foreground">Prev</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd>S</kbd>
                <span className="text-[11px] text-muted-foreground">Save</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd>W</kbd>
                <span className="text-[11px] text-muted-foreground">Hide</span>
              </div>
            </div>

            {/* Test Buttons */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              <Button variant="glass" size="sm" onClick={() => test('next')} className="text-[11px]">
                Test
              </Button>
              <Button variant="glass" size="sm" onClick={() => test('prev')} className="text-[11px]">
                Test
              </Button>
              <Button variant="glass" size="sm" onClick={() => test('save')} className="text-[11px]">
                Test
              </Button>
              <Button variant="glass" size="sm" onClick={() => test('hide')} className="text-[11px]">
                Test
              </Button>
            </div>
          </div>

          {/* AI Evaluation Card */}
          <div className="glass rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/20 shadow-[0_0_12px_rgba(34,211,238,0.2)]">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium">AI Evaluation</h3>
                <p className="text-[11px] text-muted-foreground">Score candidate fit with AI</p>
              </div>
            </div>

            {/* Role Selector */}
            <Popover open={jobOpen} onOpenChange={setJobOpen}>
              <PopoverTrigger asChild>
                <Button variant="glass" className="w-full justify-between font-normal h-11">
                  <span className="truncate text-sm">
                    {jobs[jobIdx]?.name || 'Select role...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                <Command>
                  <CommandInput placeholder="Search roles..." className="h-10" />
                  <CommandEmpty className="py-4 text-sm text-center text-muted-foreground">
                    No roles found
                  </CommandEmpty>
                  <CommandList className="max-h-[200px] scrollbar-thin">
                    <CommandGroup>
                      {jobs.map((j, i) => (
                        <CommandItem
                          key={j.id}
                          value={j.name}
                          onSelect={() => { setJobIdx(i); setJobOpen(false) }}
                          className="text-sm"
                        >
                          <Check className={`w-4 h-4 mr-2 ${i === jobIdx ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                          {j.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Evaluate Button */}
            <Button onClick={scoreNow} disabled={!jobs.length} className="w-full h-11">
              <Sparkles className="w-4 h-4" />
              Evaluate Candidate
            </Button>

            {/* Shortcut hint */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Shortcut:</span>
              <kbd className="h-5 min-w-5 px-1.5 text-[10px]">⌘</kbd>
              <kbd className="h-5 min-w-5 px-1.5 text-[10px]">⇧</kbd>
              <kbd className="h-5 min-w-5 px-1.5 text-[10px]">F</kbd>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between px-5 py-3 border-t border-border/50">
          <Button variant="ghost" size="sm" onClick={() => chrome.runtime.openOptionsPage?.()}>
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <span className="text-[11px] font-mono text-muted-foreground/60">v0.1.0</span>
        </footer>
      </div>

      <Toaster
        position="bottom-center"
        toastOptions={{
          className: 'glass text-sm',
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
