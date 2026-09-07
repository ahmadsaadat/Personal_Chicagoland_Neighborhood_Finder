import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatTileProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint?: string
  emphasis?: boolean
  tone?: 'neutral' | 'good' | 'critical'
}

const TONE_CLASSES: Record<NonNullable<StatTileProps['tone']>, string> = {
  neutral: 'text-slate-900',
  good: 'text-[color:var(--color-status-good)]',
  critical: 'text-[color:var(--color-status-critical)]',
}

/** A single labeled metric used across neighborhood cards, detail panels, and comparisons. */
export function StatTile({ icon: Icon, label, value, hint, emphasis = false, tone = 'neutral' }: StatTileProps) {
  return (
    <div
      className={`rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-slate-200 hover:bg-slate-50 ${
        emphasis ? 'ring-1 ring-inset ring-blue-100' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 text-slate-500">
        <Icon size={14} strokeWidth={2} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`mt-1.5 font-semibold tabular-nums ${emphasis ? 'text-2xl' : 'text-lg'} ${TONE_CLASSES[tone]}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
    </div>
  )
}
