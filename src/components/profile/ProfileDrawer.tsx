import { useEffect, useState, type FormEvent } from 'react'
import { SlideOver } from '../common/SlideOver'
import { DEFAULT_PROFILE, type HousingChoice, type MaritalStatus, type UserProfile } from '../../types'

interface ProfileDrawerProps {
  open: boolean
  onClose: () => void
  profile: UserProfile
  onSave: (profile: UserProfile) => void
  onReset: () => void
}

const COMMUTE_PRESETS = ['Chicago Loop', 'The West Loop', "O'Hare Airport", 'Downtown Evanston', 'Remote / Work from home']

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-sm font-medium text-slate-700">{children}</label>
}

function inputClass(extra = '') {
  return `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${extra}`
}

export function ProfileDrawer({ open, onClose, profile, onSave, onReset }: ProfileDrawerProps) {
  const [draft, setDraft] = useState<UserProfile>(profile)

  // Re-sync the draft with the latest saved profile each time the drawer
  // opens, so stale in-progress edits from a prior open don't linger.
  useEffect(() => {
    if (open) setDraft(profile)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave(draft)
    onClose()
  }

  function handleReset() {
    setDraft(DEFAULT_PROFILE)
    onReset()
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Your profile"
      subtitle="This powers every estimate in the app — it's saved on this device only."
      footer={
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="profile-form"
              className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Save profile
            </button>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-600"
          >
            Reset to defaults
          </button>
        </div>
      }
    >
      <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
        <section>
          <FieldLabel>Annual household income</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={draft.annualIncome}
              onChange={(e) => set('annualIncome', Number(e.target.value))}
              className={inputClass('pl-6')}
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Marital status</FieldLabel>
            <select
              value={draft.maritalStatus}
              onChange={(e) => set('maritalStatus', e.target.value as MaritalStatus)}
              className={inputClass()}
            >
              <option value="single">Single</option>
              <option value="married">Married</option>
            </select>
          </div>
          <div>
            <FieldLabel>Children</FieldLabel>
            <input
              type="number"
              min={0}
              max={10}
              value={draft.numChildren}
              onChange={(e) => set('numChildren', Number(e.target.value))}
              className={inputClass()}
            />
          </div>
        </section>

        <section>
          <FieldLabel>Rent or own?</FieldLabel>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            {(['rent', 'own'] as HousingChoice[]).map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => set('housingChoice', choice)}
                className={`rounded-lg py-2 text-sm font-medium capitalize transition ${
                  draft.housingChoice === choice ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
        </section>

        {draft.housingChoice === 'rent' ? (
          <section>
            <FieldLabel>Monthly rent budget</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                min={0}
                step={50}
                value={draft.monthlyRent}
                onChange={(e) => set('monthlyRent', Number(e.target.value))}
                className={inputClass('pl-6')}
              />
            </div>
          </section>
        ) : (
          <section>
            <FieldLabel>Home purchase price</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                min={0}
                step={5000}
                value={draft.homePurchasePrice}
                onChange={(e) => set('homePurchasePrice', Number(e.target.value))}
                className={inputClass('pl-6')}
              />
            </div>
          </section>
        )}

        <section>
          <FieldLabel>Bedrooms</FieldLabel>
          <select
            value={draft.bedrooms}
            onChange={(e) => set('bedrooms', Number(e.target.value))}
            className={inputClass()}
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? 'Studio' : `${n} bedroom${n > 1 ? 's' : ''}`}
              </option>
            ))}
          </select>
        </section>

        <section>
          <FieldLabel>Do you own a car?</FieldLabel>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => set('ownsCar', val)}
                className={`rounded-lg py-2 text-sm font-medium transition ${
                  draft.ownsCar === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {val ? 'Yes' : 'No, I use transit'}
              </button>
            ))}
          </div>
        </section>

        {draft.ownsCar && (
          <section>
            <FieldLabel>Annual miles driven</FieldLabel>
            <input
              type="number"
              min={0}
              step={500}
              value={draft.annualMilesDriven}
              onChange={(e) => set('annualMilesDriven', Number(e.target.value))}
              className={inputClass()}
            />
          </section>
        )}

        <section>
          <FieldLabel>Commute destination</FieldLabel>
          <input
            type="text"
            list="commute-presets"
            value={draft.commuteDestination}
            onChange={(e) => set('commuteDestination', e.target.value)}
            className={inputClass()}
            placeholder="Chicago Loop"
          />
          <datalist id="commute-presets">
            {COMMUTE_PRESETS.map((preset) => (
              <option key={preset} value={preset} />
            ))}
          </datalist>
        </section>

        <section>
          <FieldLabel>Approximate monthly spending (non-housing)</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
            <input
              type="number"
              min={0}
              step={50}
              value={draft.monthlySpending}
              onChange={(e) => set('monthlySpending', Number(e.target.value))}
              className={inputClass('pl-6')}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            General discretionary spending used to estimate sales tax — groceries, restaurants, and utilities are
            already accounted for per neighborhood.
          </p>
        </section>
      </form>
    </SlideOver>
  )
}
