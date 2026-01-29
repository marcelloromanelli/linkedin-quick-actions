import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Separator } from '@/components/ui/separator'
import { getSync, setSync, getLocal, setLocal, SYNC_SELECTORS, SYNC_SETTINGS, LOCAL_CFG, JOBS_INDEX, JOB_PREFIX } from '@/lib/storage'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

function OptionsApp() {
  const [selectors, setSelectors] = useState<any>({ next:'',prev:'',save:'',hide:'' })
  const [legend, setLegend] = useState(true)
  const [cfg, setCfg] = useState<any>({ apiKey:'', model:'gpt-5-medium', autoScan:false, impactProfile:'', systemPrompt:'' })
  const [models, setModels] = useState<string[]>(['gpt-5-mini','gpt-5-medium','gpt-5-large'])
  const [customModel, setCustomModel] = useState('')
  const [index, setIndex] = useState<{id:string,name:string}[]>([])
  const [edit, setEdit] = useState<{id?:string,name:string,text:string}>({ name:'', text:'' })

  useEffect(() => {
    // Force dark theme
    try { document.documentElement.classList.add('dark') } catch {}
    getSync(SYNC_SELECTORS, selectors).then(setSelectors)
    getSync(SYNC_SETTINGS, { hotkeysEnabled:true, legendEnabled:true }).then(s=> setLegend(s.legendEnabled !== false))
    getLocal(LOCAL_CFG, cfg).then(async (c) => {
      setCfg(c)
      if (c?.apiKey) {
        refreshModels(c.apiKey)
      }
    })
    getLocal(JOBS_INDEX, [] as {id:string,name:string}[]).then(setIndex)
  }, [])

  const saveSelectors = async () => {
    try {
      await setSync(SYNC_SELECTORS, selectors)
      await setSync(SYNC_SETTINGS, { hotkeysEnabled:true, legendEnabled: legend })
      toast.success('Selectors and settings saved')
    } catch (e) {
      toast.error('Failed to save selectors/settings')
    }
  }

  const saveCfg = async () => {
    try {
      const model = customModel.trim() || cfg.model
      await setLocal(LOCAL_CFG, { ...cfg, model })
      toast.success('AI settings saved')
    } catch (e) {
      toast.error('Failed to save AI settings')
    }
  }

  async function loadDefaultPrompt() {
    try {
      const url = chrome.runtime.getURL('src/ai/prompt.txt')
      const res = await fetch(url)
      const text = await res.text()
      setCfg((prev:any)=>({ ...prev, systemPrompt: text }))
      toast.success('Loaded default recruiter agent prompt')
    } catch {
      toast.error('Unable to load default prompt')
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
      // Ensure cfg.model is one of the list (or keep existing)
      if (!uniq.includes(cfg.model)) setCfg((prev:any)=>({...prev, model: uniq[0] || prev.model}))
    } catch {}
  }

  const saveJob = async () => {
    try {
      if (!edit.name || !edit.text) { toast.error('Please enter name and description'); return }
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
    } catch (e) {
      toast.error('Failed to save job')
    }
  }

  const removeJob = async (id: string, i: number) => {
    try {
      const ni = [...index]; ni.splice(i,1)
      await new Promise<void>(r => chrome.storage.local.remove(JOB_PREFIX+id, ()=>r()))
      await setLocal(JOBS_INDEX, ni); setIndex(ni)
      toast.success('Job removed')
    } catch (e) {
      toast.error('Failed to remove job')
    }
  }

  const editJob = async (id: string) => {
    const data = await new Promise<any>(r => chrome.storage.local.get([JOB_PREFIX+id], (d:any)=> r(d[JOB_PREFIX+id])))
    setEdit({ id, name: data?.name||'', text: data?.text||''})
  }

  return (
    <div className="p-6 max-w-4xl text-sm space-y-4">
      <h1 className="text-xl font-semibold">LinkedIn Quick Actions – Options</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Hotkeys & Selectors</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Next selector</Label>
              <Input value={selectors.next} onChange={e=>setSelectors({...selectors,next:e.target.value})} placeholder="CSS for Next" />
            </div>
            <div>
              <Label>Previous selector</Label>
              <Input value={selectors.prev} onChange={e=>setSelectors({...selectors,prev:e.target.value})} placeholder="CSS for Previous" />
            </div>
            <div>
              <Label>Save selector</Label>
              <Input value={selectors.save} onChange={e=>setSelectors({...selectors,save:e.target.value})} placeholder="CSS for Save" />
            </div>
            <div>
              <Label>Hide selector</Label>
              <Input value={selectors.hide} onChange={e=>setSelectors({...selectors,hide:e.target.value})} placeholder="CSS for Hide" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="legend">Show in-page legend</Label>
            <Switch id="legend" checked={legend} onCheckedChange={setLegend} />
          </div>
          <div className="flex justify-end"><Button onClick={saveSelectors}>Save</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">AI Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>OpenAI API Key</Label>
              <Input type="password" value={cfg.apiKey} onChange={e=>setCfg({...cfg, apiKey:e.target.value})} placeholder="sk-..." />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <div>
                  <Label>Model</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {cfg.model || 'Select a model'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                      <Command>
                        <CommandInput placeholder="Search models..." />
                        <CommandEmpty>No models found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {models.map((m)=> (
                              <CommandItem key={m} value={m} onSelect={()=>setCfg({...cfg, model:m})}>{m}</CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Custom model (optional)</Label>
                  <Input value={customModel} onChange={e=>setCustomModel(e.target.value)} placeholder="e.g., gpt-4.1-mini" />
                </div>
              </div>
              <Button variant="outline" onClick={()=>refreshModels()}>Refresh</Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="autoscan">Auto-scan profiles</Label>
            <Switch id="autoscan" checked={cfg.autoScan} onCheckedChange={v=>setCfg({...cfg, autoScan: !!v})} />
          </div>
          <div>
            <Label>Impact Profile</Label>
            <Textarea rows={6} value={cfg.impactProfile} onChange={e=>setCfg({...cfg, impactProfile: e.target.value})} placeholder="Describe GetYourGuide impact profile..." />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Recruiter Agent Prompt</Label>
              <Button variant="outline" size="sm" onClick={loadDefaultPrompt}>Load default</Button>
            </div>
            <Textarea rows={10} value={cfg.systemPrompt} onChange={e=>setCfg({...cfg, systemPrompt: e.target.value})} placeholder="System prompt to guide the recruiter agent..." />
            <div className="text-xs text-muted-foreground mt-1">Used as the system prompt; saved locally.</div>
          </div>
          <div className="flex justify-end"><Button onClick={saveCfg}>Save AI Settings</Button></div>
          <Separator />
          <div>
            <div className="mb-2 font-medium">Job Descriptions</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {index.map((j,i)=> (
                  <TableRow key={j.id}>
                    <TableCell>{j.name}</TableCell>
                    <TableCell className="truncate max-w-[360px]">…</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" className="mr-2" onClick={()=>editJob(j.id!)}>Edit</Button>
                      <Button variant="outline" onClick={()=>removeJob(j.id!, i)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid grid-cols-1 gap-2 mt-3">
              <div className="grid md:grid-cols-2 gap-2">
                <div>
                  <Label>Job name</Label>
                  <Input value={edit.name} onChange={e=>setEdit({...edit, name:e.target.value})} placeholder="e.g., Android Engineer" />
                </div>
                <div className="flex items-end"><Button className="w-full md:w-auto" onClick={saveJob}>Save</Button></div>
              </div>
              <Textarea rows={6} value={edit.text} onChange={e=>setEdit({...edit, text:e.target.value})} placeholder="Paste the job description here..." />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Root() {
  return (
    <>
      <OptionsApp />
      <Toaster richColors closeButton />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
