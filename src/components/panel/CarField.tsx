import { Car, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PopoverPanel } from '../common/PopoverPanel'
import { formatCurrencyCompact } from '../../utils/format'
import type { UserProfile } from '../../types'

interface CarFieldProps {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
}

function inputClass(extra = '') {
  return `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${extra}`
}

/**
 * A dollar input that stays empty while mid-edit (e.g. backspacing to
 * retype) instead of a controlled input snapping an emptied field back to
 * "0" on every keystroke — same fix as the roommate-count, mortgage-payment,
 * and spending fields elsewhere in this panel.
 */
function CostInput({
  id,
  label,
  value,
  onCommit,
}: {
  id: string
  label: string
  value: number
  onCommit: (next: number) => void
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => {
    setText(String(value))
  }, [value])

  function handleChange(raw: string) {
    setText(raw)
    if (raw === '') return
    const n = Number(raw)
    if (Number.isFinite(n)) onCommit(n)
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
        <input
          id={id}
          type="number"
          min={0}
          step={10}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          className={inputClass('pl-5')}
        />
      </div>
    </div>
  )
}

/**
 * The "Car" chip: whether you drive at all, and — if so — your monthly car
 * note (loan/lease), insurance, and gas, each prepopulated with a reasonable
 * default. These are flat inputs applied the same everywhere (unlike rent),
 * since a car payment and insurance premium don't vary by neighborhood the
 * way housing does; only parking, pulled from each neighborhood's own data,
 * varies by area (see calculations/financial.ts).
 */
export function CarField({ profile, onProfileChange }: CarFieldProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  const total = profile.monthlyCarNote + profile.monthlyCarInsurance + profile.monthlyGasSpending

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <Car size={13} className="text-slate-400" />
        {profile.ownsCar ? `${formatCurrencyCompact(total)}/mo` : 'No car'}
        <ChevronDown size={12} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <PopoverPanel open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} widthClassName="w-64">
        <div className="text-xs font-medium text-slate-500">Do you have a car?</div>
        <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1">
          {[true, false].map((hasCar) => (
            <button
              key={String(hasCar)}
              type="button"
              onClick={() => onProfileChange({ ...profile, ownsCar: hasCar })}
              className={`rounded-md py-1.5 text-xs font-medium transition ${
                profile.ownsCar === hasCar ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {hasCar ? 'Car' : 'No car'}
            </button>
          ))}
        </div>

        {profile.ownsCar && (
          <div className="mt-3 space-y-3">
            <CostInput
              id="car-note"
              label="Car note (loan/lease)"
              value={profile.monthlyCarNote}
              onCommit={(n) => onProfileChange({ ...profile, monthlyCarNote: n })}
            />
            <CostInput
              id="car-insurance"
              label="Car insurance"
              value={profile.monthlyCarInsurance}
              onCommit={(n) => onProfileChange({ ...profile, monthlyCarInsurance: n })}
            />
            <CostInput
              id="car-gas"
              label="Gas"
              value={profile.monthlyGasSpending}
              onCommit={(n) => onProfileChange({ ...profile, monthlyGasSpending: n })}
            />
            <p className="text-[11px] text-slate-400">
              Parking is estimated separately using each neighborhood's own typical cost.
            </p>
          </div>
        )}
      </PopoverPanel>
    </>
  )
}
