import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronDown, Check, RefreshCw, Settings2, Save } from 'lucide-react'

interface AIScoringProps {
  config: {
    apiKey: string
    model: string
    autoScan: boolean
  }
  onConfigChange: (config: { apiKey: string; model: string; autoScan: boolean }) => void
  models: string[]
  customModel: string
  onCustomModelChange: (value: string) => void
  onRefreshModels: () => void
  onSave: () => void
}

export function AIScoring({
  config,
  onConfigChange,
  models,
  customModel,
  onCustomModelChange,
  onRefreshModels,
  onSave,
}: AIScoringProps) {
  const [setupOpen, setSetupOpen] = useState(true)
  const [modelOpen, setModelOpen] = useState(false)

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">AI Scoring</h2>
          <p className="text-sm text-white/40 mt-1">
            AI-powered candidate evaluation and scoring
          </p>
        </div>
        <Button onClick={onSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save AI Settings
        </Button>
      </div>

      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {/* API Setup - Collapsible */}
        <Collapsible open={setupOpen} onOpenChange={setSetupOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Settings2 className="w-4 h-4 text-white/40" />
                <span className="text-sm font-medium text-white/80">API Setup</span>
                {config.apiKey && (
                  <Badge variant="secondary" className="text-[10px]">
                    Configured
                  </Badge>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-white/40 transition-transform ${setupOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-6 space-y-4 border-b border-white/[0.06]">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    OpenAI API Key
                  </label>
                  <Input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
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
                        <Button
                          variant="outline"
                          className="flex-1 justify-between font-mono text-xs bg-white/[0.03] border-white/[0.08]"
                        >
                          {config.model || 'Select model'}
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[240px]" align="start">
                        <Command>
                          <CommandInput placeholder="Search..." />
                          <CommandEmpty>No models</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {models.map((m) => (
                                <CommandItem
                                  key={m}
                                  value={m}
                                  onSelect={() => {
                                    onConfigChange({ ...config, model: m })
                                    setModelOpen(false)
                                  }}
                                  className="font-mono"
                                >
                                  <Check
                                    className={`w-3.5 h-3.5 mr-2 ${m === config.model ? 'opacity-100' : 'opacity-0'}`}
                                  />
                                  {m}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onRefreshModels}
                      className="bg-white/[0.03] border-white/[0.08]"
                    >
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
                  onChange={(e) => onCustomModelChange(e.target.value)}
                  placeholder="e.g., gpt-4o-2024-08-06"
                  className="font-mono bg-white/[0.03] border-white/[0.08]"
                />
                <p className="text-xs text-white/30">
                  Optional: Enter a specific model ID to override the selection above.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Auto-scan toggle */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Switch
              id="autoscan"
              checked={config.autoScan}
              onCheckedChange={(v) => onConfigChange({ ...config, autoScan: v })}
            />
            <div>
              <label htmlFor="autoscan" className="text-sm text-white/70 cursor-pointer">
                Auto-scan profiles
              </label>
              <p className="text-xs text-white/40">
                Automatically score candidates when navigating
              </p>
            </div>
          </div>
          <Badge variant="warning">Beta</Badge>
        </div>
      </div>
    </section>
  )
}
