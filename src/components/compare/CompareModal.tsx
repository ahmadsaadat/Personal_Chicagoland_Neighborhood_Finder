import { Modal } from '../common/Modal'
import { getRentForBedrooms } from '../../data'
import { formatBedrooms, formatCurrency } from '../../utils/format'
import type { NeighborhoodEntry } from '../../utils/metrics'

interface CompareModalProps {
  open: boolean
  onClose: () => void
  entries: NeighborhoodEntry[]
  bedrooms: number
}

interface CompareRow {
  label: string
  getValue: (entry: NeighborhoodEntry) => number
  betterWhenHigh: boolean
}

function buildRows(bedrooms: number): CompareRow[] {
  const rentLabel = formatBedrooms(bedrooms)
  return [
    {
      label: `Median ${rentLabel} rent /mo`,
      getValue: (e) => getRentForBedrooms(e.profile.housing, bedrooms),
      betterWhenHigh: false,
    },
    { label: 'Median home price', getValue: (e) => e.profile.housing.medianHomePrice, betterWhenHigh: false },
    { label: 'Property tax /yr', getValue: (e) => e.summary.taxes.propertyTaxEstimate, betterWhenHigh: false },
    {
      label: 'Income tax /yr (fed + state + local)',
      getValue: (e) => e.summary.taxes.federalIncomeTax + e.summary.taxes.stateIncomeTax + e.summary.taxes.localIncomeTax,
      betterWhenHigh: false,
    },
    { label: 'Transportation /yr', getValue: (e) => e.summary.transportationAnnualCost, betterWhenHigh: false },
    { label: 'Total annual cost', getValue: (e) => e.summary.totalAnnualCost, betterWhenHigh: false },
    { label: 'Est. disposable income /yr', getValue: (e) => e.summary.estimatedDisposableIncome, betterWhenHigh: true },
  ]
}

export function CompareModal({ open, onClose, entries, bedrooms }: CompareModalProps) {
  if (entries.length === 0) return null
  const rows = buildRows(bedrooms)

  return (
    <Modal open={open} onClose={onClose} title="Compare neighborhoods" subtitle="Best value in each row is highlighted.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400" />
              {entries.map((entry) => (
                <th key={entry.neighborhood.id} className="p-3 text-left">
                  <div className="text-sm font-semibold text-slate-900">{entry.neighborhood.name}</div>
                  <div className="text-xs font-normal text-slate-400">
                    {entry.neighborhood.type === 'chicago-community-area' ? 'Chicago' : 'Suburb'}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const values = entries.map((entry) => row.getValue(entry))
              const best = row.betterWhenHigh ? Math.max(...values) : Math.min(...values)
              const allTied = values.every((v) => v === values[0])
              return (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="sticky left-0 whitespace-nowrap bg-white p-3 text-xs font-medium text-slate-500">{row.label}</td>
                  {entries.map((entry, i) => {
                    const value = values[i]
                    const isBest = !allTied && value === best
                    return (
                      <td
                        key={entry.neighborhood.id}
                        className={`p-3 font-semibold tabular-nums ${
                          isBest ? 'rounded-lg bg-blue-50 text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        {formatCurrency(Math.round(value))}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
