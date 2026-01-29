import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, ChevronLeft, Bookmark, EyeOff, Settings2, Save } from 'lucide-react'
import { ShortcutCard } from '../components/ShortcutCard'
import { SelectorInput } from '../components/SelectorInput'

const DEFAULT_SELECTORS = {
  next: 'nav[data-test-ts-pagination] a[rel="next"], a[data-test-pagination-next]',
  prev: 'nav[data-test-ts-pagination] a[rel="prev"], a[data-test-pagination-previous]',
  save: '[data-live-test-profile-container] button[data-live-test-save-to-first-stage], [data-live-test-profile-container] [data-live-test-component="save-to-pipeline-btn"] .save-to-pipeline__button',
  hide: '[data-live-test-profile-container] button[data-live-test-component="hide-btn"]',
}

interface KeyboardShortcutsProps {
  selectors: Record<string, string>
  onSelectorsChange: (selectors: Record<string, string>) => void
  legend: boolean
  onLegendChange: (enabled: boolean) => void
  onSave: () => void
}

export function KeyboardShortcuts({
  selectors,
  onSelectorsChange,
  legend,
  onLegendChange,
  onSave,
}: KeyboardShortcutsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <p className="text-sm text-white/40 mt-1">
            Quick actions for LinkedIn Recruiter navigation
          </p>
        </div>
        <Button onClick={onSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      {/* Visual Shortcut Guide */}
      <div className="grid grid-cols-2 gap-3">
        <ShortcutCard
          hotkey="D"
          label="Next Candidate"
          description="Navigate to next profile"
          icon={ChevronRight}
          gradient="bg-cyan-500/20"
        />
        <ShortcutCard
          hotkey="A"
          label="Previous Candidate"
          description="Navigate to previous profile"
          icon={ChevronLeft}
          gradient="bg-violet-500/20"
        />
        <ShortcutCard
          hotkey="S"
          label="Save to Pipeline"
          description="Add candidate to pipeline"
          icon={Bookmark}
          gradient="bg-emerald-500/20"
        />
        <ShortcutCard
          hotkey="W"
          label="Hide Candidate"
          description="Remove from current list"
          icon={EyeOff}
          gradient="bg-rose-500/20"
        />
      </div>

      {/* Legend Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {['D', 'A', 'S', 'W'].map((key) => (
              <div
                key={key}
                className="w-6 h-6 rounded-md bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/60"
              >
                {key}
              </div>
            ))}
          </div>
          <span className="text-sm text-white/60">Show keyboard legend on LinkedIn page</span>
        </div>
        <Switch checked={legend} onCheckedChange={onLegendChange} />
      </div>

      {/* Advanced: CSS Selectors */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors">
            <Settings2 className="w-4 h-4" />
            <span>Advanced: Custom CSS Selectors</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4">
            <p className="text-xs text-white/40">
              Override the default button selectors if LinkedIn&apos;s UI has changed. Leave
              empty to use defaults.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <SelectorInput
                hotkey="D"
                label="Next button selector"
                value={selectors.next || ''}
                onChange={(v) => onSelectorsChange({ ...selectors, next: v })}
                defaultValue={DEFAULT_SELECTORS.next}
              />
              <SelectorInput
                hotkey="A"
                label="Previous button selector"
                value={selectors.prev || ''}
                onChange={(v) => onSelectorsChange({ ...selectors, prev: v })}
                defaultValue={DEFAULT_SELECTORS.prev}
              />
              <SelectorInput
                hotkey="S"
                label="Save button selector"
                value={selectors.save || ''}
                onChange={(v) => onSelectorsChange({ ...selectors, save: v })}
                defaultValue={DEFAULT_SELECTORS.save}
              />
              <SelectorInput
                hotkey="W"
                label="Hide button selector"
                value={selectors.hide || ''}
                onChange={(v) => onSelectorsChange({ ...selectors, hide: v })}
                defaultValue={DEFAULT_SELECTORS.hide}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
