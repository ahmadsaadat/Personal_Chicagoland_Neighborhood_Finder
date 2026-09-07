import { SlideOver } from '../common/SlideOver'
import { DEFAULT_FILTERS, type CarPreference, type FilterState } from '../../utils/filters'
import type { NeighborhoodType } from '../../types'

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  filters: FilterState
  onChange: (filters: FilterState) => void
  resultCount: number
}

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-sm font-medium text-slate-700">{children}</label>
}

function inputClass() {
  return 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
}

function NumberFilter({
  label,
  placeholder,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string
  placeholder: string
  value: number | null
  onChange: (value: number | null) => void
  prefix?: string
  suffix?: string
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>}
        <input
          type="number"
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className={`${inputClass()} ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>
        )}
      </div>
    </div>
  )
}

export function FilterDrawer({ open, onClose, filters, onChange, resultCount }: FilterDrawerProps) {
  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Filters"
      subtitle={`${resultCount} ${resultCount === 1 ? 'neighborhood matches' : 'neighborhoods match'}`}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Reset all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Show {resultCount} results
          </button>
        </div>
      }
    >
      <div className="space-y-7">
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Budget</h3>
          <div className="space-y-4">
            <NumberFilter
              label="Maximum 2BR rent"
              placeholder="No limit"
              value={filters.maxRent}
              onChange={(v) => set('maxRent', v)}
              prefix="$"
              suffix="/mo"
            />
            <NumberFilter
              label="Maximum home price"
              placeholder="No limit"
              value={filters.maxHomePrice}
              onChange={(v) => set('maxHomePrice', v)}
              prefix="$"
            />
            <NumberFilter
              label="Minimum disposable income"
              placeholder="No minimum"
              value={filters.minDisposableIncome}
              onChange={(v) => set('minDisposableIncome', v)}
              prefix="$"
              suffix="/yr"
            />
            <NumberFilter
              label="Maximum property tax rate"
              placeholder="No limit"
              value={filters.maxPropertyTaxRate === null ? null : filters.maxPropertyTaxRate * 100}
              onChange={(v) => set('maxPropertyTaxRate', v === null ? null : v / 100)}
              suffix="%"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Commute &amp; Car</h3>
          <div className="space-y-4">
            <NumberFilter
              label="Maximum commute to the Loop"
              placeholder="No limit"
              value={filters.maxCommuteMinutes}
              onChange={(v) => set('maxCommuteMinutes', v)}
              suffix="min"
            />
            <div>
              <FieldLabel>Car ownership preference</FieldLabel>
              <select
                value={filters.carPreference}
                onChange={(e) => set('carPreference', e.target.value as CarPreference)}
                className={inputClass()}
              >
                <option value="any">No preference</option>
                <option value="car-free-friendly">Great for car-free living</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Lifestyle</h3>
          <div className="space-y-4">
            <NumberFilter
              label="Minimum walkability"
              placeholder="No minimum"
              value={filters.minWalkability}
              onChange={(v) => set('minWalkability', v)}
              suffix="/100"
            />
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
              <span className="text-sm font-medium text-slate-700">Family-friendly only</span>
              <input
                type="checkbox"
                checked={filters.familyFriendlyOnly}
                onChange={(e) => set('familyFriendlyOnly', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
            </label>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Location</h3>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
            {(['all', 'chicago-community-area', 'suburb'] as Array<NeighborhoodType | 'all'>).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => set('neighborhoodType', type)}
                className={`rounded-lg py-2 text-xs font-medium capitalize transition ${
                  filters.neighborhoodType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {type === 'all' ? 'All' : type === 'chicago-community-area' ? 'Chicago' : 'Suburb'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SlideOver>
  )
}
