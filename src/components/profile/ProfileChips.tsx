import { Car, User } from 'lucide-react'
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
  icon: typeof Car
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
 * Quick-access chips for the profile fields NOT already covered by the
 * always-visible income/rent editor at the top of the tools panel. Both
 * chips are plain toggles — one click flips car ownership or marital status
 * directly, no popover or drawer in between. Number of children (not a
 * simple two-state toggle) stays in the expandable full-profile section
 * below.
 */
export function ProfileChips({ profile, onProfileChange }: ProfileChipsProps) {
  const familyLabel =
    profile.numChildren > 0
      ? `${profile.maritalStatus === 'married' ? 'Married' : 'Single'} · ${profile.numChildren} ${profile.numChildren === 1 ? 'child' : 'children'}`
      : profile.maritalStatus === 'married'
        ? 'Married'
        : 'Single'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ChipButton
        icon={Car}
        label={profile.ownsCar ? 'Car' : 'No car'}
        onClick={() => onProfileChange({ ...profile, ownsCar: !profile.ownsCar })}
      />
      <ChipButton
        icon={User}
        label={familyLabel}
        onClick={() =>
          onProfileChange({ ...profile, maritalStatus: profile.maritalStatus === 'married' ? 'single' : 'married' })
        }
      />
    </div>
  )
}
