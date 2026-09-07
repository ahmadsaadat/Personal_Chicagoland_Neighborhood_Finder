import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { annualFromHourly, type IncomeType, type UserProfile } from '../../types'
import { formatCurrency } from '../../utils/format'

interface IncomeFieldProps {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
}

function inputClass(extra = '') {
  return `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${extra}`
}

/** The "Annual income" field: a popover lets you choose salary vs. hourly pay. */
export function IncomeField({ profile, onProfileChange }: IncomeFieldProps) {
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

  function setIncomeType(type: IncomeType) {
    if (type === 'hourly') {
      onProfileChange({ ...profile, incomeType: type, annualIncome: annualFromHourly(profile.hourlyRate, profile.hoursPerWeek) })
    } else {
      onProfileChange({ ...profile, incomeType: type })
    }
  }

  function setHourly(hourlyRate: number, hoursPerWeek: number) {
    onProfileChange({ ...profile, hourlyRate, hoursPerWeek, annualIncome: annualFromHourly(hourlyRate, hoursPerWeek) })
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium text-slate-500">Annual income</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-1 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-800 transition hover:border-slate-300"
      >
        <span>
          <span className="text-slate-400">$</span> {profile.annualIncome.toLocaleString()}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="text-xs font-medium text-slate-500">How are you paid?</div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1">
            {(['salary', 'hourly'] as IncomeType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setIncomeType(type)}
                className={`rounded-md py-1.5 text-xs font-medium capitalize transition ${
                  profile.incomeType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {profile.incomeType === 'salary' ? (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="income-annual">
                Annual salary
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                <input
                  id="income-annual"
                  type="number"
                  min={0}
                  step={1000}
                  value={profile.annualIncome}
                  onChange={(e) => onProfileChange({ ...profile, annualIncome: Number(e.target.value) })}
                  className={inputClass('pl-5')}
                />
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="income-hourly-rate">
                    Hourly rate
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                    <input
                      id="income-hourly-rate"
                      type="number"
                      min={0}
                      step={0.5}
                      value={profile.hourlyRate}
                      onChange={(e) => setHourly(Number(e.target.value), profile.hoursPerWeek)}
                      className={inputClass('pl-5')}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="income-hours-week">
                    Hours/week
                  </label>
                  <input
                    id="income-hours-week"
                    type="number"
                    min={0}
                    max={168}
                    step={1}
                    value={profile.hoursPerWeek}
                    onChange={(e) => setHourly(profile.hourlyRate, Number(e.target.value))}
                    className={inputClass()}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">≈ {formatCurrency(profile.annualIncome)}/yr, assuming 52 paid weeks</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
