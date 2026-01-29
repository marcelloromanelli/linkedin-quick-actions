import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { getSync, setSync, getLocal, setLocal, SYNC_SELECTORS, SYNC_SETTINGS, LOCAL_CFG } from '@/lib/storage'
import { useModels, useJobs, useAgents } from './hooks'
import { KeyboardShortcuts, AIScoring, AgentPersonalities, JobDescriptions } from './sections'

export function OptionsApp() {
  // Selectors & Settings
  const [selectors, setSelectors] = useState<Record<string, string>>({})
  const [legend, setLegend] = useState(true)

  // AI Config
  const [aiConfig, setAiConfig] = useState({ apiKey: '', model: 'gpt-4o-mini', autoScan: false })
  const [customModel, setCustomModel] = useState('')
  const { models, refresh: refreshModels } = useModels()

  // Jobs
  const { index: jobs, save: saveJob, remove: removeJob, getJob } = useJobs()
  const [editJob, setEditJob] = useState({ name: '', text: '', impactProfile: '' } as {
    id?: string
    name: string
    text: string
    impactProfile: string
  })

  // Agents
  const {
    agents,
    defaultAgentId,
    save: saveAgent,
    remove: removeAgent,
    getAgent,
    setDefault: setDefaultAgent,
    loadDefaultPrompt,
  } = useAgents()
  const [editAgent, setEditAgent] = useState({ name: '', prompt: '' } as {
    id?: string
    name: string
    prompt: string
  })

  // Load initial data
  useEffect(() => {
    document.documentElement.classList.add('dark')

    getSync(SYNC_SELECTORS, {}).then(setSelectors)
    getSync(SYNC_SETTINGS, { hotkeysEnabled: true, legendEnabled: true }).then((s) =>
      setLegend(s.legendEnabled !== false)
    )
    getLocal(LOCAL_CFG, { apiKey: '', model: 'gpt-4o-mini', autoScan: false }).then(async (cfg) => {
      setAiConfig(cfg)
      if (cfg?.apiKey) refreshModels(cfg.apiKey)
    })
  }, [])

  // Save handlers
  const handleSaveSelectors = async () => {
    try {
      await setSync(SYNC_SELECTORS, selectors)
      await setSync(SYNC_SETTINGS, { hotkeysEnabled: true, legendEnabled: legend })
      toast.success('Selectors saved')
    } catch {
      toast.error('Failed to save')
    }
  }

  const handleSaveAIConfig = async () => {
    try {
      const model = customModel.trim() || aiConfig.model
      await setLocal(LOCAL_CFG, { ...aiConfig, model })
      toast.success('AI settings saved')
    } catch {
      toast.error('Failed to save')
    }
  }

  const handleSaveJob = async () => {
    const success = await saveJob(editJob)
    if (success) {
      setEditJob({ name: '', text: '', impactProfile: '' })
    }
  }

  const handleLoadJobForEdit = async (id: string) => {
    const job = await getJob(id)
    if (job) {
      setEditJob({
        id: job.id,
        name: job.name,
        text: job.text,
        impactProfile: job.impactProfile,
      })
    }
  }

  const handleSaveAgent = async () => {
    const success = await saveAgent(editAgent)
    if (success) {
      setEditAgent({ name: '', prompt: '' })
    }
  }

  const handleLoadAgentForEdit = async (id: string) => {
    const agent = await getAgent(id)
    if (agent) {
      setEditAgent({
        id: agent.id,
        name: agent.name,
        prompt: agent.prompt,
      })
    }
  }

  const handleLoadDefaultPrompt = async () => {
    const prompt = await loadDefaultPrompt()
    if (prompt) {
      setEditAgent((prev) => ({ ...prev, prompt }))
      toast.success('Default prompt loaded')
    }
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
              <h1 className="text-base font-semibold text-white tracking-tight">
                LinkedIn Quick Actions
              </h1>
              <p className="text-xs text-white/40">Settings & Configuration</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-5xl mx-auto px-8 py-8 space-y-10">
        <KeyboardShortcuts
          selectors={selectors}
          onSelectorsChange={setSelectors}
          legend={legend}
          onLegendChange={setLegend}
          onSave={handleSaveSelectors}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <AIScoring
          config={aiConfig}
          onConfigChange={setAiConfig}
          models={models}
          customModel={customModel}
          onCustomModelChange={setCustomModel}
          onRefreshModels={() => refreshModels(aiConfig.apiKey)}
          onSave={handleSaveAIConfig}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <AgentPersonalities
          agents={agents}
          defaultAgentId={defaultAgentId}
          editAgent={editAgent}
          onEditAgentChange={setEditAgent}
          onSave={handleSaveAgent}
          onRemove={removeAgent}
          onSetDefault={setDefaultAgent}
          onLoadForEdit={handleLoadAgentForEdit}
          onLoadDefaultPrompt={handleLoadDefaultPrompt}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <JobDescriptions
          jobs={jobs}
          editJob={editJob}
          onEditJobChange={setEditJob}
          onSave={handleSaveJob}
          onRemove={removeJob}
          onLoadForEdit={handleLoadJobForEdit}
        />
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
