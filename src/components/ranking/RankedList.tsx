import { Clock, Home, Sparkles, Wallet } from 'lucide-react'
import type { RankedNeighborhood } from '../../calculations/ranking'
import { getNeighborhood } from '../../data'
import { formatCurrency, formatMinutes } from '../../utils/format'
import { disposableIncomeColor } from '../../utils/incomeColor'

interface RankedListProps {
  ranked: RankedNeighborhood[]
  annualIncome: number
  onOpenDetail: (id: string) => void
}

export function RankedList({ ranked, annualIncome, onOpenDetail }: RankedListProps) {
  return (
    <div className="space-y-3">
      {ranked.map((item, index) => (
        <button
          key={item.neighborhoodId}
          type="button"
          onClick={() => onOpenDetail(item.neighborhoodId)}
          className="flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                {getNeighborhood(item.neighborhoodId)?.name ?? item.neighborhoodId}
              </h3>
              <div
                className="flex items-center gap-1 text-sm font-bold"
                style={{ color: disposableIncomeColor(item.disposableIncome, annualIncome) }}
              >
                <Wallet size={14} className="text-slate-400" />
                {formatCurrency(Math.round(item.disposableIncome))}/yr
              </div>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.reason}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock size={12} /> {formatMinutes(item.commuteMinutes)} commute
              </span>
              <span className="flex items-center gap-1">
                <Home size={12} /> {formatCurrency(item.rent2BR)}/mo 2BR
              </span>
              <span className="flex items-center gap-1">
                <Sparkles size={12} /> match score {Math.round(item.score * 100)}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
