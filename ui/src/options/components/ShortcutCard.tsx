import type { LucideIcon } from 'lucide-react'

interface ShortcutCardProps {
  hotkey: string
  label: string
  description: string
  icon: LucideIcon
  gradient: string
}

export function ShortcutCard({
  hotkey,
  label,
  description,
  icon: Icon,
  gradient,
}: ShortcutCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1]">
      <div
        className={`absolute top-0 right-0 w-24 h-24 ${gradient} blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`}
      />
      <div className="relative flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <span className="text-lg font-bold text-white/90">{hotkey}</span>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Icon className="w-4 h-4 text-white/50" />
          <div>
            <h3 className="text-sm font-medium text-white">{label}</h3>
            <p className="text-xs text-white/40">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
