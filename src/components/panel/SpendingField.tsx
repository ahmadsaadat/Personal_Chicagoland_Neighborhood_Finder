import { ChevronDown, ShoppingBasket } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PopoverPanel } from '../common/PopoverPanel'
import { formatCurrencyCompact } from '../../utils/format'
import type { UserProfile } from '../../types'

interface SpendingFieldProps {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
}

function inputClass(extra = '') {
  return `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${extra}`
}

/**
 * A numeric dollar input that stays empty while the user is mid-edit (e.g.
 * backspacing to retype) instead of a controlled input snapping an emptied
 * field back to "0" on every keystroke — same fix as the roommate-count and
 * mortgage-payment fields elsewhere in this panel.
 */
function SpendingInput({
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
          step={25}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          className={inputClass('pl-5')}
        />
      </div>
    </div>
  )
}

/**
 * The "Spending" chip: your own typical monthly grocery, restaurant, and
 * other (everything-else non-housing) spending. These aren't flat numbers
 * applied identically to every neighborhood — they scale each neighborhood's
 * own cost-of-living estimate for that category up or down from a baseline
 * (see spendingFactor in calculations/financial.ts), so a below-median-cost
 * area still shows as cheaper even for a big spender, and vice versa.
 */
export function SpendingField({ profile, onProfileChange }: SpendingFieldProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  const total = profile.monthlyGroceriesSpending + profile.monthlyRestaurantsSpending + profile.monthlyOtherSpending

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <ShoppingBasket size={13} className="text-slate-400" />
        {formatCurrencyCompact(total)}/mo
        <ChevronDown size={12} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <PopoverPanel open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} widthClassName="w-64">
        <div className="text-xs font-medium text-slate-500">Your typical monthly spending</div>
        <div className="mt-3 space-y-3">
          <SpendingInput
            id="spending-groceries"
            label="Groceries"
            value={profile.monthlyGroceriesSpending}
            onCommit={(n) => onProfileChange({ ...profile, monthlyGroceriesSpending: n })}
          />
          <SpendingInput
            id="spending-restaurants"
            label="Restaurants"
            value={profile.monthlyRestaurantsSpending}
            onCommit={(n) => onProfileChange({ ...profile, monthlyRestaurantsSpending: n })}
          />
          <SpendingInput
            id="spending-other"
            label="Other (shopping, entertainment, etc.)"
            value={profile.monthlyOtherSpending}
            onCommit={(n) => onProfileChange({ ...profile, monthlyOtherSpending: n })}
          />
        </div>
      </PopoverPanel>
    </>
  )
}
