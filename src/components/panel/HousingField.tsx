import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { HousingChoice, UserProfile } from '../../types'

interface HousingFieldProps {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
}

function inputClass(extra = '') {
  return `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${extra}`
}

/** The rent/home-price field: a popover lets you choose renting vs. owning. */
export function HousingField({ profile, onProfileChange }: HousingFieldProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isRent = profile.housingChoice === 'rent'
  const amount = isRent ? profile.monthlyRent : profile.homePurchasePrice

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
      <label className="mb-1 block text-xs font-medium text-slate-500">{isRent ? 'Monthly rent' : 'Home price'}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-1 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-800 transition hover:border-slate-300"
      >
        <span>
          <span className="text-slate-400">$</span> {amount.toLocaleString()}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
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
              {isRent ? 'Monthly rent' : 'Home purchase price'}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
              <input
                id="housing-amount"
                type="number"
                min={0}
                step={isRent ? 50 : 5000}
                value={amount}
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
        </div>
      )}
    </div>
  )
}
