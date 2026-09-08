import { ChevronDown, Home } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PopoverPanel } from '../common/PopoverPanel'
import { formatBedrooms, formatCurrencyCompact } from '../../utils/format'
import type { HousingChoice, UserProfile } from '../../types'

interface HousingFieldProps {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
}

const BEDROOM_OPTIONS = [
  { value: 0, label: 'Studio' },
  { value: 1, label: '1BR' },
  { value: 2, label: '2BR' },
  { value: 3, label: '3BR' },
]

function inputClass(extra = '') {
  return `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${extra}`
}

/**
 * The housing chip: choose renting vs. owning, and — when renting — which
 * bedroom size and whether you split with roommates. There's deliberately
 * no "monthly rent" dollar field here: rent and utilities always come from
 * each neighborhood's own data (see calculations/financial.ts), so the
 * comparison across neighborhoods stays meaningful instead of every area
 * showing the same flat number the user once typed in.
 */
export function HousingField({ profile, onProfileChange }: HousingFieldProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const isRent = profile.housingChoice === 'rent'

  // The roommate-count input is allowed to sit empty while typing (e.g.
  // backspacing to retype) rather than snapping to 0/1 on every keystroke —
  // only a real finite number commits to the profile. Kept as local text
  // state, synced back in whenever the committed value changes elsewhere
  // (e.g. a profile reset).
  const [peopleInput, setPeopleInput] = useState(String(profile.numPeopleSplittingRent))
  useEffect(() => {
    setPeopleInput(String(profile.numPeopleSplittingRent))
  }, [profile.numPeopleSplittingRent])

  function handlePeopleInputChange(raw: string) {
    setPeopleInput(raw)
    if (raw === '') return
    const n = Number(raw)
    if (Number.isFinite(n)) onProfileChange({ ...profile, numPeopleSplittingRent: n })
  }

  // Same empty-while-typing treatment as peopleInput above — a controlled
  // number input bound straight to a value snaps an emptied field back to
  // "0" immediately, so backspacing to retype (e.g. clearing "2000" to type
  // "1500") leaves a stray leading zero ("02000") instead of a blank field.
  const [mortgageInput, setMortgageInput] = useState(String(profile.monthlyMortgagePayment))
  useEffect(() => {
    setMortgageInput(String(profile.monthlyMortgagePayment))
  }, [profile.monthlyMortgagePayment])

  function handleMortgageInputChange(raw: string) {
    setMortgageInput(raw)
    if (raw === '') return
    const n = Number(raw)
    if (Number.isFinite(n)) onProfileChange({ ...profile, monthlyMortgagePayment: n })
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <Home size={13} className="text-slate-400" />
        {isRent ? (
          <>
            {formatBedrooms(profile.bedrooms)}
            {profile.hasRoommates ? ` · ${Math.max(1, profile.numPeopleSplittingRent)} people` : ''}
          </>
        ) : (
          `${formatCurrencyCompact(profile.monthlyMortgagePayment)}/mo`
        )}
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

        {isRent ? (
          <>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">Bedrooms</label>
              <div className="grid grid-cols-4 gap-1.5 rounded-lg bg-slate-100 p-1">
                {BEDROOM_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onProfileChange({ ...profile, bedrooms: opt.value })}
                    className={`rounded-md py-1.5 text-xs font-medium transition ${
                      profile.bedrooms === opt.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Rent and utilities always use each neighborhood's own numbers for this size — open a neighborhood to
                see them.
              </p>
            </div>

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
                    Total people splitting rent
                  </label>
                  <input
                    id="housing-roommates"
                    type="number"
                    min={2}
                    max={10}
                    step={1}
                    value={peopleInput}
                    onChange={(e) => handlePeopleInputChange(e.target.value)}
                    className={inputClass()}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="housing-amount">
              Monthly mortgage payment
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
              <input
                id="housing-amount"
                type="number"
                min={0}
                step={50}
                value={mortgageInput}
                onChange={(e) => handleMortgageInputChange(e.target.value)}
                className={inputClass('pl-5')}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Principal & interest only — property tax is estimated separately from this using each area's own rate.
            </p>
          </div>
        )}
      </PopoverPanel>
    </>
  )
}
