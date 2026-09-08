import { User } from 'lucide-react'
import type { UserProfile } from '../../types'

interface ProfileChipsProps {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
}

function ChipButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof User
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <Icon size={13} className="text-slate-400" />
      {label}
    </button>
  )
}

/**
 * The marital-status chip, meant to sit alongside IncomeField/HousingField/
 * CarField in one chip row. A plain toggle — one click flips marital status
 * directly, no popover. Number of children (not a simple two-state toggle)
 * stays in the expandable full-profile section below.
 */
export function ProfileChips({ profile, onProfileChange }: ProfileChipsProps) {
  const familyLabel =
    profile.numChildren > 0
      ? `${profile.maritalStatus === 'married' ? 'Married' : 'Single'} · ${profile.numChildren} ${profile.numChildren === 1 ? 'child' : 'children'}`
      : profile.maritalStatus === 'married'
        ? 'Married'
        : 'Single'

  return (
    <ChipButton
      icon={User}
      label={familyLabel}
      onClick={() =>
        onProfileChange({ ...profile, maritalStatus: profile.maritalStatus === 'married' ? 'single' : 'married' })
      }
    />
  )
}
