import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { getSync, setSync, getLocal, setLocal, SYNC_SELECTORS, SYNC_SETTINGS, LOCAL_CFG, JOBS_INDEX, JOB_PREFIX } from '@/lib/storage'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
  Zap, ChevronDown, Check,
  RefreshCw, Trash2, Pencil, Plus, Save, FileText,
  ChevronRight, ChevronLeft, Bookmark, EyeOff
} from 'lucide-react'

// Action card component for the hotkey selectors
function ActionCard({
  hotkey,
  label,
  description,
  icon: Icon,
  value,
  onChange,
  gradient
}: {
  hotkey: string
  label: string
  description: string
  icon: React.ElementType
  value: string
  onChange: (v: string) => void
  gradient: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1]">
      {/* Gradient accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`} />

      <div className="relative space-y-4">
        {/* Header with key and icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${gradient.replace('bg-', 'bg-').replace('/20', '/15')} backdrop-blur-sm`}>
              <Icon className="w-5 h-5 text-white/80" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{label}</h3>
              <p className="text-xs text-white/40">{description}</p>
            </div>
          </div>

          {/* Large keyboard shortcut */}
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.08] border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <span className="text-xl font-bold text-white/90">{hotkey}</span>
          </div>
        </div>

        {/* Selector input */}
        <div className="space-y-2">
          <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
            CSS Selector
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter selector..."
            className="w-full h-10 px-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm font-mono text-white/80 placeholder:text-white/20 outline-none transition-all focus:bg-white/[0.08] focus:border-white/[0.15]"
          />
        </div>
      </div>
    </div>
  )
}

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
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">LinkedIn Quick Actions</h1>
              <p className="text-xs text-white/40">Settings & Configuration</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-5xl mx-auto px-8 py-8 space-y-10">

        {/* Hotkeys & Selectors - Redesigned */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Keyboard Actions</h2>
              <p className="text-sm text-white/40 mt-1">Configure shortcuts and CSS selectors for LinkedIn Recruiter</p>
            </div>
            <Button onClick={saveSelectors} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            <ActionCard
              hotkey="D"
              label="Next Candidate"
              description="Navigate to next profile"
              icon={ChevronRight}
              value={selectors.next}
              onChange={(v) => setSelectors({...selectors, next: v})}
              gradient="bg-cyan-500/20"
            />
            <ActionCard
              hotkey="A"
              label="Previous Candidate"
              description="Navigate to previous profile"
              icon={ChevronLeft}
              value={selectors.prev}
              onChange={(v) => setSelectors({...selectors, prev: v})}
              gradient="bg-violet-500/20"
            />
            <ActionCard
              hotkey="S"
              label="Save to Pipeline"
              description="Add candidate to pipeline"
              icon={Bookmark}
              value={selectors.save}
              onChange={(v) => setSelectors({...selectors, save: v})}
              gradient="bg-emerald-500/20"
            />
            <ActionCard
              hotkey="W"
              label="Hide Candidate"
              description="Remove from current list"
              icon={EyeOff}
              value={selectors.hide}
              onChange={(v) => setSelectors({...selectors, hide: v})}
              gradient="bg-rose-500/20"
            />
          </div>

          {/* Legend Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/60">D</div>
                <div className="w-6 h-6 rounded-md bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/60">A</div>
                <div className="w-6 h-6 rounded-md bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/60">S</div>
                <div className="w-6 h-6 rounded-md bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/60">W</div>
              </div>
              <span className="text-sm text-white/60">Show keyboard legend on LinkedIn page</span>
            </div>
            <Switch checked={legend} onCheckedChange={setLegend} />
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* AI Configuration */}
        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">AI Configuration</h2>
            <p className="text-sm text-white/40 mt-1">OpenAI integration for intelligent candidate scoring</p>
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-6">
            {/* API Key & Model Selection */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                  OpenAI API Key
                </label>
                <Input
                  type="password"
                  value={cfg.apiKey}
                  onChange={e=>setCfg({...cfg, apiKey:e.target.value})}
                  placeholder="sk-..."
                  className="font-mono bg-white/[0.03] border-white/[0.08]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                  Model
                </label>
                <div className="flex gap-2">
                  <Popover open={modelOpen} onOpenChange={setModelOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-between font-mono text-xs bg-white/[0.03] border-white/[0.08]">
                        {cfg.model || 'Select model'}
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[240px]" align="start">
                      <Command>
                        <CommandInput placeholder="Search..." />
                        <CommandEmpty>No models</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {models.map((m)=> (
                              <CommandItem
                                key={m}
                                value={m}
                                onSelect={()=>{ setCfg({...cfg, model:m}); setModelOpen(false) }}
                                className="font-mono"
                              >
                                <Check className={`w-3.5 h-3.5 mr-2 ${m === cfg.model ? 'opacity-100' : 'opacity-0'}`} />
                                {m}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" size="icon" onClick={()=>refreshModels()} className="bg-white/[0.03] border-white/[0.08]">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Custom Model Override
              </label>
              <Input
                value={customModel}
                onChange={e=>setCustomModel(e.target.value)}
                placeholder="e.g., gpt-4o-2024-08-06"
                className="font-mono bg-white/[0.03] border-white/[0.08]"
              />
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Auto-scan toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch id="autoscan" checked={cfg.autoScan} onCheckedChange={v=>setCfg({...cfg, autoScan: !!v})} />
                <label htmlFor="autoscan" className="text-sm text-white/70">Auto-scan profiles on navigation</label>
              </div>
              <Badge variant="warning">Beta</Badge>
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Impact Profile */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Impact Profile
              </label>
              <Textarea
                rows={4}
                value={cfg.impactProfile}
                onChange={e=>setCfg({...cfg, impactProfile: e.target.value})}
                placeholder="Describe your team's impact profile, culture, and what makes a great candidate..."
                className="bg-white/[0.03] border-white/[0.08]"
              />
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                  Recruiter Agent Prompt
                </label>
                <Button variant="ghost" size="sm" onClick={loadDefaultPrompt}>
                  <FileText className="w-4 h-4 mr-1.5" />
                  Load Default
                </Button>
              </div>
              <Textarea
                rows={8}
                value={cfg.systemPrompt}
                onChange={e=>setCfg({...cfg, systemPrompt: e.target.value})}
                placeholder="System prompt for the AI recruiter agent..."
                className="font-mono text-xs bg-white/[0.03] border-white/[0.08]"
              />
              <p className="text-xs text-white/30">
                This prompt guides the AI when evaluating candidates. Stored locally.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveCfg} className="gap-2">
                <Save className="w-4 h-4" />
                Save AI Settings
              </Button>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Job Descriptions */}
        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Job Descriptions</h2>
            <p className="text-sm text-white/40 mt-1">Target roles for candidate matching</p>
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            {/* Jobs Table */}
            {index.length > 0 && (
              <div className="border-b border-white/[0.06]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                      <TableHead className="text-xs font-medium text-white/40 uppercase tracking-wider h-10">Role</TableHead>
                      <TableHead className="text-xs font-medium text-white/40 uppercase tracking-wider h-10 text-right w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {index.map((j, i) => (
                      <TableRow key={j.id} className="group border-white/[0.04]">
                        <TableCell className="text-sm font-medium text-white/80 py-3">{j.name}</TableCell>
                        <TableCell className="text-right py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon-sm" onClick={()=>editJob(j.id!)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={()=>removeJob(j.id!, i)}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
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
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-white/40">
                <Plus className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  {edit.id ? 'Edit Job' : 'Add New Job'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-2">
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Role Name
                  </label>
                  <Input
                    value={edit.name}
                    onChange={e=>setEdit({...edit, name:e.target.value})}
                    placeholder="e.g., Senior Android Engineer"
                    className="bg-white/[0.03] border-white/[0.08]"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={saveJob} className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    {edit.id ? 'Update' : 'Add'}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                  Job Description
                </label>
                <Textarea
                  rows={5}
                  value={edit.text}
                  onChange={e=>setEdit({...edit, text:e.target.value})}
                  placeholder="Paste the full job description here..."
                  className="bg-white/[0.03] border-white/[0.08]"
                />
              </div>
              {edit.id && (
                <Button variant="ghost" size="sm" onClick={()=>setEdit({ name:'', text:'' })}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>
        </section>

      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'text-sm',
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
