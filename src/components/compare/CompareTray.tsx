import { Scale, X } from 'lucide-react'
import type { NeighborhoodEntry } from '../../utils/metrics'

interface CompareTrayProps {
  entries: NeighborhoodEntry[]
  onRemove: (id: string) => void
  onCompare: () => void
  onClear: () => void
}

/** Fixed bottom bar showing the up-to-3 neighborhoods staged for comparison. */
export function CompareTray({ entries, onRemove, onCompare, onClear }: CompareTrayProps) {
  if (entries.length === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 animate-[riseIn_200ms_ease-out]">
      <div className="flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Scale size={16} />
          Compare
        </div>
        <div className="flex flex-1 flex-wrap gap-2">
          {entries.map((entry) => (
            <span
              key={entry.neighborhood.id}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-sm font-medium text-slate-700"
            >
              {entry.neighborhood.name}
              <button
                type="button"
                onClick={() => onRemove(entry.neighborhood.id)}
                className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                aria-label={`Remove ${entry.neighborhood.name} from comparison`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="hidden shrink-0 text-xs font-medium text-slate-400 transition hover:text-slate-600 sm:block"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onCompare}
          disabled={entries.length < 2}
          className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Compare {entries.length > 1 ? `(${entries.length})` : ''}
        </button>
      </div>
    </div>
  )
}
