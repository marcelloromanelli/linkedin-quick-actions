interface SelectorInputProps {
  hotkey: string
  label: string
  value: string
  onChange: (value: string) => void
  defaultValue: string
}

export function SelectorInput({
  hotkey,
  label,
  value,
  onChange,
  defaultValue,
}: SelectorInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08]">
          <span className="text-sm font-bold text-white/70">{hotkey}</span>
        </div>
        <div className="flex-1">
          <label className="text-xs text-white/40 mb-1 block">{label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Leave empty to use default"
            className="w-full h-9 px-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm font-mono text-white/80 placeholder:text-white/20 outline-none transition-all focus:bg-white/[0.08] focus:border-white/[0.15]"
          />
        </div>
      </div>
      <div className="ml-11 text-[10px] text-white/30 font-mono break-all leading-relaxed">
        <span className="text-white/50">Default:</span> {defaultValue}
      </div>
    </div>
  )
}
