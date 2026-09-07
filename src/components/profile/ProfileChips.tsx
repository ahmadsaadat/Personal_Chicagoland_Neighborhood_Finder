import { Car, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { UserProfile } from '../../types'
import { formatNumber } from '../../utils/format'

interface ProfileChipsProps {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
  onEditFamily: () => void
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

/** The car chip's own popover: a single control for owns-car + annual miles, right below the chip. */
function CarChip({ profile, onProfileChange }: { profile: UserProfile; onProfileChange: (next: UserProfile) => void }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <ChipButton
        icon={Car}
        label={profile.ownsCar ? `Car, ${formatNumber(profile.annualMilesDriven)} mi/yr` : 'No car'}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="text-xs font-medium text-slate-500">Do you own a car?</div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => onProfileChange({ ...profile, ownsCar: val })}
                className={`rounded-md py-1.5 text-xs font-medium transition ${
                  profile.ownsCar === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {val ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
          {profile.ownsCar && (
            <div className="mt-2.5">
              <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="chip-annual-miles">
                Annual miles driven
              </label>
              <input
                id="chip-annual-miles"
                type="number"
                min={0}
                step={500}
                value={profile.annualMilesDriven}
                onChange={(e) => onProfileChange({ ...profile, annualMilesDriven: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Quick-access chips for the profile fields NOT already covered by the
 * always-visible income/rent editor at the top of the tools panel. Car
 * ownership is fully self-contained here (a popover right under the chip);
 * family situation is a one-tap shortcut into the full profile section.
 */
export function ProfileChips({ profile, onProfileChange, onEditFamily }: ProfileChipsProps) {
  const familyLabel =
    profile.numChildren > 0
      ? `${profile.maritalStatus === 'married' ? 'Married' : 'Single'} · ${profile.numChildren} ${profile.numChildren === 1 ? 'child' : 'children'}`
      : profile.maritalStatus === 'married'
        ? 'Married'
        : 'Single'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CarChip profile={profile} onProfileChange={onProfileChange} />
      <ChipButton icon={User} label={familyLabel} onClick={onEditFamily} />
    </div>
  )
}
