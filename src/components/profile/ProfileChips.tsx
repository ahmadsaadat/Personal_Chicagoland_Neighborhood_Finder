import { Car, User } from 'lucide-react'
import type { UserProfile } from '../../types'
import { formatNumber } from '../../utils/format'

interface ProfileChipsProps {
  profile: UserProfile
  onEdit: () => void
}

function Chip({ icon: Icon, label, onClick }: { icon: typeof Car; label: string; onClick: () => void }) {
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
 * Quick-access chips for the profile fields NOT already covered by the
 * always-visible income/rent editor at the top of the tools panel — car
 * ownership and family situation are edited less often, so they stay a
 * one-tap shortcut into the full profile drawer instead of their own inline
 * fields.
 */
export function ProfileChips({ profile, onEdit }: ProfileChipsProps) {
  const familyLabel =
    profile.numChildren > 0
      ? `${profile.maritalStatus === 'married' ? 'Married' : 'Single'} · ${profile.numChildren} ${profile.numChildren === 1 ? 'child' : 'children'}`
      : profile.maritalStatus === 'married'
        ? 'Married'
        : 'Single'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip icon={Car} label={profile.ownsCar ? `Car, ${formatNumber(profile.annualMilesDriven)} mi/yr` : 'No car'} onClick={onEdit} />
      <Chip icon={User} label={familyLabel} onClick={onEdit} />
    </div>
  )
}
