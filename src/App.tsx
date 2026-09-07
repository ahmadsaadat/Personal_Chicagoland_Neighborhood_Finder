import { getAllNeighborhoodProfiles } from './data'
import { calculateFinancialSummary } from './calculations/financial'
import { DEFAULT_PROFILE } from './types'

// Placeholder root component — replaced by the Frontend/UX engineer with the
// full landing page, map, profile form, and neighborhood exploration UI.
function App() {
  const entries = getAllNeighborhoodProfiles()

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <h1 className="text-2xl font-semibold">Chicagoland — scaffold sanity check</h1>
      <p className="mt-1 text-slate-500">
        This placeholder proves the data + calculations pipeline works end to end. It will be
        replaced with the full product UI.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {entries.map(({ neighborhood }) => {
          const summary = calculateFinancialSummary(DEFAULT_PROFILE, neighborhood.id)
          return (
            <li key={neighborhood.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="font-medium">{neighborhood.name}</div>
              <div className="text-sm text-slate-500">
                Est. disposable income: $
                {summary ? Math.round(summary.estimatedDisposableIncome).toLocaleString() : '—'}
                /yr
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default App
