import { SEQUENTIAL_STEPS } from '../utils/colorScale'
import type { MetricConfig } from '../utils/metrics'

interface MapLegendProps {
  metric: MetricConfig
  min: number
  max: number
}

/** Small sequential-scale legend shown in the corner of the map. */
export function MapLegend({ metric, min, max }: MapLegendProps) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] w-56 rounded-xl border border-slate-100 bg-white/95 p-3 shadow-lg backdrop-blur">
      <div className="text-xs font-semibold text-slate-700">{metric.label}</div>
      <div className="mt-2 flex h-2.5 overflow-hidden rounded-full">
        {SEQUENTIAL_STEPS.map((color) => (
          <span key={color} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-slate-500">
        <span>{metric.format(min)}</span>
        <span>{metric.format(max)}</span>
      </div>
      <div className="mt-1.5 text-[11px] leading-snug text-slate-400">{metric.helpText}</div>
    </div>
  )
}
