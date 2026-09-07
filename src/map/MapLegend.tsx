import { DIVERGING_STEPS, NO_DATA_COLOR } from '../utils/colorScale'
import type { MetricConfig } from '../utils/metrics'

interface MapLegendProps {
  metric: MetricConfig
  min: number
  max: number
}

/** Small diverging red↔blue legend shown floating in the corner of the map. */
export function MapLegend({ metric, min, max }: MapLegendProps) {
  // The color scale always runs worst-for-you (red) -> best-for-you (blue),
  // regardless of which raw direction is "good" for this metric — so figure
  // out which raw value (min or max) lands on which end before labeling.
  const worstValue = metric.goodDirection === 'high' ? min : max
  const bestValue = metric.goodDirection === 'high' ? max : min

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-10 w-60 rounded-xl border border-slate-100 bg-white/95 p-3 shadow-lg backdrop-blur">
      <div className="text-xs font-semibold text-slate-700">{metric.label}</div>
      <div className="mt-2 flex h-2.5 overflow-hidden rounded-full">
        {DIVERGING_STEPS.map((color, i) => (
          <span key={`${color}-${i}`} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-slate-500">
        <span>{metric.format(worstValue)}</span>
        <span>{metric.format(bestValue)}</span>
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] font-medium uppercase tracking-wide">
        <span className="text-[color:var(--color-div-red-700)]">Less for you</span>
        <span className="text-[color:var(--color-div-blue-700)]">More for you</span>
      </div>
      <div className="mt-1.5 text-[11px] leading-snug text-slate-400">{metric.helpText}</div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: NO_DATA_COLOR }} />
        No data
      </div>
    </div>
  )
}
