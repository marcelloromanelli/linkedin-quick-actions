import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Separator } from '@/components/ui/separator'
import { getSync, setSync, getLocal, setLocal, SYNC_SELECTORS, SYNC_SETTINGS, LOCAL_CFG, JOBS_INDEX, JOB_PREFIX } from '@/lib/storage'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
  Zap, Keyboard, Bot, Briefcase, ChevronDown, Check,
  RefreshCw, Trash2, Pencil, Plus, Save, FileText
} from 'lucide-react'

function OptionsApp() {
  const [selectors, setSelectors] = useState<any>({ next:'',prev:'',save:'',hide:'' })
  const [legend, setLegend] = useState(true)
  const [cfg, setCfg] = useState<any>({ apiKey:'', model:'gpt-4o-mini', autoScan:false, impactProfile:'', systemPrompt:'' })
  const [models, setModels] = useState<string[]>(['gpt-4o-mini','gpt-4o','gpt-4-turbo'])
  const [customModel, setCustomModel] = useState('')
  const [modelOpen, setModelOpen] = useState(false)
  const [index, setIndex] = useState<{id:string,name:string}[]>([])
  const [edit, setEdit] = useState<{id?:string,name:string,text:string}>({ name:'', text:'' })

  useEffect(() => {
    document.documentElement.classList.add('dark')
    getSync(SYNC_SELECTORS, selectors).then(setSelectors)
    getSync(SYNC_SETTINGS, { hotkeysEnabled:true, legendEnabled:true }).then(s=> setLegend(s.legendEnabled !== false))
    getLocal(LOCAL_CFG, cfg).then(async (c) => {
      setCfg(c)
      if (c?.apiKey) refreshModels(c.apiKey)
    })
    getLocal(JOBS_INDEX, [] as {id:string,name:string}[]).then(setIndex)
  }, [])

  const saveSelectors = async () => {
    try {
      await setSync(SYNC_SELECTORS, selectors)
      await setSync(SYNC_SETTINGS, { hotkeysEnabled:true, legendEnabled: legend })
      toast.success('Selectors saved')
    } catch {
      toast.error('Failed to save')
    }
  }

  const saveCfg = async () => {
    try {
      const model = customModel.trim() || cfg.model
      await setLocal(LOCAL_CFG, { ...cfg, model })
      toast.success('AI settings saved')
    } catch {
      toast.error('Failed to save')
    }
  }

  async function loadDefaultPrompt() {
    try {
      const url = chrome.runtime.getURL('src/ai/prompt.txt')
      const res = await fetch(url)
      const text = await res.text()
      setCfg((prev:any)=>({ ...prev, systemPrompt: text }))
      toast.success('Default prompt loaded')
    } catch {
      toast.error('Unable to load prompt')
    }
  }

  async function refreshModels(apiKey?: string) {
    try {
      const key = (apiKey ?? cfg.apiKey).trim()
      if (!key) return
      const resp = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${key}` } })
      const data = await resp.json()
      const ids: string[] = (data?.data || []).map((m:any)=>m.id).filter((id:string)=>/(gpt|o\d)/i.test(id))
      const uniq = Array.from(new Set([...ids].sort()))
      if (uniq.length) setModels(uniq)
      if (!uniq.includes(cfg.model)) setCfg((prev:any)=>({...prev, model: uniq[0] || prev.model}))
      toast.success(`${uniq.length} models loaded`)
    } catch {
      toast.error('Failed to fetch models')
    }
  }

  const saveJob = async () => {
    try {
      if (!edit.name || !edit.text) { toast.error('Name and description required'); return }
      if (edit.id) {
        await setLocal(JOB_PREFIX+edit.id, { id: edit.id, name: edit.name, text: edit.text })
        const ni = index.map(j => j.id === edit.id ? ({ id:j.id, name: edit.name }) : j)
        await setLocal(JOBS_INDEX, ni); setIndex(ni)
      } else {
        const id = String(Date.now())
        await setLocal(JOB_PREFIX+id, { id, name: edit.name, text: edit.text })
        const ni = [...index, { id, name: edit.name }]
        await setLocal(JOBS_INDEX, ni); setIndex(ni)
      }
      setEdit({ name:'', text:'' })
      toast.success('Job saved')
    } catch {
      toast.error('Failed to save')
    }
  }

  const removeJob = async (id: string, i: number) => {
    try {
      const ni = [...index]; ni.splice(i,1)
      await new Promise<void>(r => chrome.storage.local.remove(JOB_PREFIX+id, ()=>r()))
      await setLocal(JOBS_INDEX, ni); setIndex(ni)
      toast.success('Job removed')
    } catch {
      toast.error('Failed to remove')
    }
  }

  const editJob = async (id: string) => {
    const data = await new Promise<any>(r => chrome.storage.local.get([JOB_PREFIX+id], (d:any)=> r(d[JOB_PREFIX+id])))
    setEdit({ id, name: data?.name||'', text: data?.text||''})
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/15">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">LinkedIn Quick Actions</h1>
              <p className="text-[10px] text-muted-foreground">Settings & Configuration</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* Hotkeys & Selectors */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-muted-foreground" />
              <CardTitle>Hotkeys & Selectors</CardTitle>
            </div>
            <CardDescription>CSS selectors for LinkedIn Recruiter button targeting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Next <kbd className="ml-1">D</kbd>
                </Label>
                <Input
                  value={selectors.next}
                  onChange={e=>setSelectors({...selectors,next:e.target.value})}
                  placeholder="CSS selector"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Previous <kbd className="ml-1">A</kbd>
                </Label>
                <Input
                  value={selectors.prev}
                  onChange={e=>setSelectors({...selectors,prev:e.target.value})}
                  placeholder="CSS selector"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Save <kbd className="ml-1">S</kbd>
                </Label>
                <Input
                  value={selectors.save}
                  onChange={e=>setSelectors({...selectors,save:e.target.value})}
                  placeholder="CSS selector"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Hide <kbd className="ml-1">W</kbd>
                </Label>
                <Input
                  value={selectors.hide}
                  onChange={e=>setSelectors({...selectors,hide:e.target.value})}
                  placeholder="CSS selector"
                  className="font-mono"
                />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch id="legend" checked={legend} onCheckedChange={setLegend} />
                <Label htmlFor="legend" className="text-xs">Show keyboard legend on page</Label>
              </div>
              <Button onClick={saveSelectors} size="sm">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Selectors
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-muted-foreground" />
              <CardTitle>AI Configuration</CardTitle>
            </div>
            <CardDescription>OpenAI integration for candidate scoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key & Model Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  OpenAI API Key
                </Label>
                <Input
                  type="password"
                  value={cfg.apiKey}
                  onChange={e=>setCfg({...cfg, apiKey:e.target.value})}
                  placeholder="sk-..."
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Model
                </Label>
                <div className="flex gap-2">
                  <Popover open={modelOpen} onOpenChange={setModelOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-between font-mono text-xs">
                        {cfg.model || 'Select model'}
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[240px]" align="start">
                      <Command>
                        <CommandInput placeholder="Search..." className="h-8 text-xs" />
                        <CommandEmpty className="py-2 text-xs text-center text-muted-foreground">No models</CommandEmpty>
                        <CommandList className="max-h-[200px] scrollbar-thin">
                          <CommandGroup>
                            {models.map((m)=> (
                              <CommandItem
                                key={m}
                                value={m}
                                onSelect={()=>{ setCfg({...cfg, model:m}); setModelOpen(false) }}
                                className="text-xs font-mono"
                              >
                                <Check className={`w-3 h-3 mr-2 ${m === cfg.model ? 'opacity-100' : 'opacity-0'}`} />
                                {m}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" size="icon" onClick={()=>refreshModels()}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Custom Model (Override)
              </Label>
              <Input
                value={customModel}
                onChange={e=>setCustomModel(e.target.value)}
                placeholder="e.g., gpt-4o-2024-08-06"
                className="font-mono"
              />
            </div>

            <Separator />

            {/* Auto-scan toggle */}
            <div className="flex items-center gap-2">
              <Switch id="autoscan" checked={cfg.autoScan} onCheckedChange={v=>setCfg({...cfg, autoScan: !!v})} />
              <Label htmlFor="autoscan" className="text-xs">Auto-scan profiles on navigation</Label>
              <Badge variant="warning" className="ml-auto">Beta</Badge>
            </div>

            <Separator />

            {/* Impact Profile */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Impact Profile
              </Label>
              <Textarea
                rows={4}
                value={cfg.impactProfile}
                onChange={e=>setCfg({...cfg, impactProfile: e.target.value})}
                placeholder="Describe your team's impact profile, culture, and what makes a great candidate..."
              />
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Recruiter Agent Prompt
                </Label>
                <Button variant="ghost" size="sm" onClick={loadDefaultPrompt}>
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Load Default
                </Button>
              </div>
              <Textarea
                rows={8}
                value={cfg.systemPrompt}
                onChange={e=>setCfg({...cfg, systemPrompt: e.target.value})}
                placeholder="System prompt for the AI recruiter agent..."
                className="font-mono text-[11px]"
              />
              <p className="text-[10px] text-muted-foreground">
                This prompt guides the AI when evaluating candidates. Stored locally.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveCfg}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save AI Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Descriptions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <CardTitle>Job Descriptions</CardTitle>
            </div>
            <CardDescription>Target roles for candidate matching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Jobs Table */}
            {index.length > 0 && (
              <div className="border border-border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[10px] uppercase tracking-wide h-8">Role</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide h-8 text-right w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {index.map((j, i) => (
                      <TableRow key={j.id} className="group">
                        <TableCell className="text-xs font-medium py-2">{j.name}</TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon-sm" onClick={()=>editJob(j.id!)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={()=>removeJob(j.id!, i)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Add/Edit Form */}
            <div className="p-3 border border-border rounded-md bg-muted/30 space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {edit.id ? 'Edit Job' : 'Add New Job'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Role Name
                  </Label>
                  <Input
                    value={edit.name}
                    onChange={e=>setEdit({...edit, name:e.target.value})}
                    placeholder="e.g., Senior Android Engineer"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={saveJob} className="w-full">
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {edit.id ? 'Update' : 'Add'}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Job Description
                </Label>
                <Textarea
                  rows={5}
                  value={edit.text}
                  onChange={e=>setEdit({...edit, text:e.target.value})}
                  placeholder="Paste the full job description here..."
                />
              </div>
              {edit.id && (
                <Button variant="ghost" size="sm" onClick={()=>setEdit({ name:'', text:'' })}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

      </main>

      <Toaster
        position="bottom-right"
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
    <OptionsApp />
  </StrictMode>,
)
