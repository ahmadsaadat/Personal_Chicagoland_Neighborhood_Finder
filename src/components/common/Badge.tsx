import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  tone?: 'neutral' | 'blue' | 'good' | 'warning'
}

const TONE_CLASSES: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-50 text-blue-700',
  good: 'bg-[color:var(--color-status-good)]/10 text-[color:var(--color-status-good)]',
  warning: 'bg-[color:var(--color-status-warning)]/15 text-amber-700',
}

/** Small pill used for neighborhood type, transit lines, and status tags. */
export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  )
}
