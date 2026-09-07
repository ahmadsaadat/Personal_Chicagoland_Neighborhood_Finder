import { ArrowRight, Banknote, Car, Compass, Home, Landmark, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { getAllNeighborhoodProfiles } from '../data'
import { formatCurrency } from '../utils/format'

interface LandingPageProps {
  onExplore: () => void
  onFindBestMatch: () => void
}

const FEATURES = [
  {
    icon: Landmark,
    title: 'Real tax math',
    description: 'Federal, Illinois state, sales, property, and vehicle taxes — modeled for your income and choices, not a flat estimate.',
  },
  {
    icon: Home,
    title: 'Housing & commute',
    description: 'Median rent, home prices, and transit access side by side with what your actual commute would look like.',
  },
  {
    icon: Banknote,
    title: 'Disposable income, upfront',
    description: 'Every neighborhood boils down to one number: what you would actually have left over each year.',
  },
]

export function LandingPage({ onExplore, onFindBestMatch }: LandingPageProps) {
  const neighborhoodCount = useMemo(() => getAllNeighborhoodProfiles().length, [])

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
          <Compass size={13} className="text-blue-500" />
          {neighborhoodCount} Chicagoland neighborhoods, and growing
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Find the right place to live.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-500">
          Compare Chicagoland neighborhoods by taxes, housing, transportation, and the cost of living.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onExplore}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md sm:w-auto"
          >
            Explore Chicagoland
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={onFindBestMatch}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:w-auto"
          >
            <Sparkles size={15} className="text-blue-500" />
            Find my best neighborhood
          </button>
        </div>
      </div>

      <div className="mx-auto mt-20 grid max-w-5xl gap-5 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <feature.icon size={18} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-slate-100 bg-white/60 p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
          <Car size={14} />
          Example: a single renter earning {formatCurrency(85000)}/yr with a car could see disposable income vary by
          thousands of dollars a year depending on neighborhood — taxes, rent, and commute costs add up differently
          everywhere.
        </div>
      </div>
    </div>
  )
}
