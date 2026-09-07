import { Layers } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { MapMetric } from '../types'
import { MAP_METRICS, getMetricConfig } from '../utils/metrics'

interface MapMetricSelectorProps {
  value: MapMetric
  onChange: (metric: MapMetric) => void
}

/**
 * Google Maps-style "Layers" picker: a button that opens a panel of visual
 * option cards (icon + label) instead of a plain dropdown, so every metric
 * the choropleth can color by is visible at a glance.
 */
export function MapMetricSelector({ value, onChange }: MapMetricSelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const current = getMetricConfig(value)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 py-2.5 pl-3 pr-3.5 text-sm font-medium text-slate-700 shadow-lg backdrop-blur transition hover:border-slate-300"
      >
        <Layers size={16} className="text-slate-400" />
        {current.label}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-[272px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
        >
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Color map by</div>
          <div className="grid grid-cols-3 gap-2">
            {MAP_METRICS.map((metric) => {
              const isSelected = metric.key === value
              return (
                <button
                  key={metric.key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => {
                    onChange(metric.key)
                    setOpen(false)
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition ${
                    isSelected
                      ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400'
                      : 'border-transparent bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-500'
                    }`}
                  >
                    <metric.icon size={17} />
                  </span>
                  <span className={`text-[11px] font-medium leading-tight ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                    {metric.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
