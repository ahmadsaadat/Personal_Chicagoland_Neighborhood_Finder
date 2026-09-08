import { ChevronDown, Home } from 'lucide-react'
import { useRef, useState } from 'react'
import { PopoverPanel } from '../common/PopoverPanel'
import { yourMonthlyRentShare, type HousingChoice, type UserProfile } from '../../types'
import { formatCurrencyCompact } from '../../utils/format'

interface HousingFieldProps {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
}

function inputClass(extra = '') {
  return `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${extra}`
}

/** The rent/home-price chip: a popover lets you choose renting vs. owning, and split rent with roommates. */
export function HousingField({ profile, onProfileChange }: HousingFieldProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const isRent = profile.housingChoice === 'rent'
  // The chip shows what actually drives your disposable income — your own
  // share after splitting with roommates, not the whole unit's rent.
  const chipAmount = isRent ? yourMonthlyRentShare(profile) : profile.homePurchasePrice

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <Home size={13} className="text-slate-400" />
        {formatCurrencyCompact(chipAmount)}
        {isRent ? '/mo' : ''}
        <ChevronDown size={12} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <PopoverPanel open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} widthClassName="w-64">
        <div className="text-xs font-medium text-slate-500">Rent or own?</div>
        <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1">
          {(['rent', 'own'] as HousingChoice[]).map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => onProfileChange({ ...profile, housingChoice: choice })}
              className={`rounded-md py-1.5 text-xs font-medium capitalize transition ${
                profile.housingChoice === choice ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {choice}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="housing-amount">
            {isRent ? 'Monthly rent (total)' : 'Home purchase price'}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
            <input
              id="housing-amount"
              type="number"
              min={0}
              step={isRent ? 50 : 5000}
              value={isRent ? profile.monthlyRent : profile.homePurchasePrice}
              onChange={(e) =>
                onProfileChange(
                  isRent
                    ? { ...profile, monthlyRent: Number(e.target.value) }
                    : { ...profile, homePurchasePrice: Number(e.target.value) },
                )
              }
              className={inputClass('pl-5')}
            />
          </div>
        </div>

        {isRent && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-2.5 py-2">
              <span className="text-xs font-medium text-slate-700">I have roommates</span>
              <input
                type="checkbox"
                checked={profile.hasRoommates}
                onChange={(e) => onProfileChange({ ...profile, hasRoommates: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
            </label>

            {profile.hasRoommates && (
              <div className="mt-2.5">
                <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="housing-roommates">
                  Number of roommates (not counting you)
                </label>
                <input
                  id="housing-roommates"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={profile.numRoommates}
                  onChange={(e) => onProfileChange({ ...profile, numRoommates: Number(e.target.value) })}
                  className={inputClass()}
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Split {Math.max(1, profile.numRoommates) + 1} ways — your share is{' '}
                  {formatCurrencyCompact(yourMonthlyRentShare(profile))}/mo
                </p>
              </div>
            )}
          </div>
        )}
      </PopoverPanel>
    </>
  )
}
