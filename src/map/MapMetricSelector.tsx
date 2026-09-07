import { ChevronDown } from 'lucide-react'
import type { MapMetric } from '../types'
import { MAP_METRICS } from '../utils/metrics'

interface MapMetricSelectorProps {
  value: MapMetric
  onChange: (metric: MapMetric) => void
}

/** Dropdown that chooses which metric colors the choropleth. */
export function MapMetricSelector({ value, onChange }: MapMetricSelectorProps) {
  return (
    <div className="relative z-[400]">
      <label className="sr-only" htmlFor="map-metric-select">
        Color map by
      </label>
      <select
        id="map-metric-select"
        value={value}
        onChange={(e) => onChange(e.target.value as MapMetric)}
        className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        {MAP_METRICS.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  )
}
