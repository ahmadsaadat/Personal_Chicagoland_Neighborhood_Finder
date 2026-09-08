import { Check, Clock, DollarSign, Home, Plus, Train } from 'lucide-react'
import { Badge } from '../common/Badge'
import { getRentForBedrooms } from '../../data'
import { formatBedrooms, formatCurrency, formatMinutes } from '../../utils/format'
import { disposableIncomeColor } from '../../utils/incomeColor'
import type { NeighborhoodEntry } from '../../utils/metrics'

interface NeighborhoodCardProps {
  entry: NeighborhoodEntry
  bedrooms: number
  isCompareSelected: boolean
  compareDisabled: boolean
  onOpenDetail: (id: string) => void
  onToggleCompare: (id: string) => void
}

export function NeighborhoodCard({
  entry,
  bedrooms,
  isCompareSelected,
  compareDisabled,
  onOpenDetail,
  onToggleCompare,
}: NeighborhoodCardProps) {
  const { neighborhood, profile, summary } = entry
  const isNegative = summary.estimatedDisposableIncome < 0
  const rent = getRentForBedrooms(profile.housing, bedrooms)
  const rentLabel = formatBedrooms(bedrooms)

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpenDetail(neighborhood.id)}
        className="block w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{neighborhood.name}</h3>
            <Badge tone={neighborhood.type === 'chicago-community-area' ? 'blue' : 'neutral'}>
              {neighborhood.type === 'chicago-community-area' ? 'Chicago' : 'Suburb'}
            </Badge>
          </div>
          <div className="text-right">
            <div
              className="text-lg font-bold tabular-nums"
              style={{ color: disposableIncomeColor(summary.estimatedDisposableIncome, summary.grossIncome) }}
            >
              {formatCurrency(Math.round(summary.estimatedDisposableIncome / 12))}
            </div>
            <div className="text-[11px] text-slate-400">est. disposable income/mo</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1" title={`Median ${rentLabel} rent`}>
            <Home size={13} />
            <span>{formatCurrency(rent)}/mo {rentLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={13} />
            <span>{formatMinutes(profile.transportation.avgCommuteMinutesToLoop)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Train size={13} />
            <span>{Math.round(profile.transportation.transitScore)} transit</span>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onToggleCompare(neighborhood.id)}
        disabled={compareDisabled && !isCompareSelected}
        title={
          compareDisabled && !isCompareSelected
            ? 'You can compare up to 3 neighborhoods at a time'
            : isCompareSelected
              ? 'Remove from comparison'
              : 'Add to comparison'
        }
        className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition ${
          isCompareSelected
            ? 'border-[color:var(--color-compare-accent)] bg-[color:var(--color-compare-accent)] text-white'
            : compareDisabled
              ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
              : 'border-slate-200 bg-white text-slate-400 opacity-0 group-hover:opacity-100 hover:border-[color:var(--color-compare-accent)] hover:text-[color:var(--color-compare-accent)]'
        }`}
      >
        {isCompareSelected ? <Check size={14} /> : <Plus size={14} />}
      </button>

      {isNegative && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[color:var(--color-status-critical)]/8 px-2.5 py-1.5 text-xs font-medium text-[color:var(--color-status-critical)]">
          <DollarSign size={13} />
          Costs exceed income for this profile
        </div>
      )}
    </div>
  )
}
