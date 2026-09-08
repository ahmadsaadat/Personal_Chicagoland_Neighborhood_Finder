import { ChevronDown, List, Sparkles } from 'lucide-react'
import { HousingField } from './HousingField'
import { IncomeField } from './IncomeField'
import { NeighborhoodCard } from '../neighborhood/NeighborhoodCard'
import { ProfileChips } from '../profile/ProfileChips'
import { RankedList } from '../ranking/RankedList'
import { DIVERGING_STEPS, NO_DATA_COLOR } from '../../utils/colorScale'
import type { MetricConfig, NeighborhoodEntry } from '../../utils/metrics'
import type { RankedNeighborhood } from '../../calculations/ranking'
import type { MaritalStatus, UserProfile } from '../../types'
import { MAX_COMPARE } from '../../hooks/useCompareSelection'
import type { UseCompareSelectionResult } from '../../hooks/useCompareSelection'

export type PanelTab = 'list' | 'best'

interface ToolsPanelProps {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
  onResetProfile: () => void
  profileExpanded: boolean
  onProfileExpandedChange: (expanded: boolean) => void
  metricConfig: MetricConfig
  min: number
  max: number
  tab: PanelTab
  onTabChange: (tab: PanelTab) => void
  entries: NeighborhoodEntry[]
  ranked: RankedNeighborhood[]
  onOpenDetail: (id: string) => void
  compare: UseCompareSelectionResult
}

const COMMUTE_PRESETS = ['Chicago Loop', 'The West Loop', "O'Hare Airport", 'Downtown Evanston', 'Remote / Work from home']

function inputClass(extra = '') {
  return `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${extra}`
}

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-xs font-medium text-slate-500">{children}</label>
}

/**
 * The consolidated "tools and info" surface — a live income/rent editor,
 * the full profile, the metric legend, and the neighborhood list/ranking —
 * rendered once and reused both as a persistent desktop sidebar and as the
 * mobile slide-over's content. Everything here is either always visible or
 * expands in place; nothing opens a separate overlay that covers the map or
 * hides the rest of the panel. The whole panel scrolls as one column so it
 * has room to grow without needing a fixed-height section of its own.
 */
export function ToolsPanel({
  profile,
  onProfileChange,
  onResetProfile,
  profileExpanded,
  onProfileExpandedChange,
  metricConfig,
  min,
  max,
  tab,
  onTabChange,
  entries,
  ranked,
  onOpenDetail,
  compare,
}: ToolsPanelProps) {
  const worstValue = metricConfig.goodDirection === 'high' ? min : max
  const bestValue = metricConfig.goodDirection === 'high' ? max : min

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    onProfileChange({ ...profile, [key]: value })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Your numbers</div>
          <p className="text-xs text-slate-400">
            Drives every disposable-income estimate on the map — edit anytime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <IncomeField profile={profile} onProfileChange={onProfileChange} />
          <HousingField profile={profile} onProfileChange={onProfileChange} />
          <ProfileChips profile={profile} onProfileChange={onProfileChange} />
        </div>

        <div>
          <button
            type="button"
            onClick={() => onProfileExpandedChange(!profileExpanded)}
            className="flex w-full items-center justify-between gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-600"
          >
            Full profile &amp; assumptions
            <ChevronDown size={13} className={`transition-transform ${profileExpanded ? 'rotate-180' : ''}`} />
          </button>

          {profileExpanded && (
            <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Marital status</FieldLabel>
                  <select
                    value={profile.maritalStatus}
                    onChange={(e) => set('maritalStatus', e.target.value as MaritalStatus)}
                    className={inputClass()}
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Children</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={profile.numChildren}
                    onChange={(e) => set('numChildren', Number(e.target.value))}
                    className={inputClass()}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Commute to</FieldLabel>
                <input
                  type="text"
                  list="commute-presets"
                  value={profile.commuteDestination}
                  onChange={(e) => set('commuteDestination', e.target.value)}
                  className={inputClass()}
                  placeholder="Chicago Loop"
                />
                <datalist id="commute-presets">
                  {COMMUTE_PRESETS.map((preset) => (
                    <option key={preset} value={preset} />
                  ))}
                </datalist>
              </div>

              <div>
                <FieldLabel>Monthly spending (non-housing)</FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={profile.monthlySpending}
                    onChange={(e) => set('monthlySpending', Number(e.target.value))}
                    className={inputClass('pl-6')}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[11px] leading-snug text-slate-400">
                  Spending drives the sales-tax estimate; groceries/restaurants/utilities are per-neighborhood.
                </p>
                <button
                  type="button"
                  onClick={onResetProfile}
                  className="shrink-0 whitespace-nowrap pl-3 text-xs font-medium text-slate-400 transition hover:text-slate-600"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onTabChange('list')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List size={14} />
            List
          </button>
          <button
            type="button"
            onClick={() => onTabChange('best')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === 'best' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles size={14} />
            Best for you
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {tab === 'list' ? (
          <div className="grid grid-cols-1 gap-3">
            {entries.map((entry) => (
              <NeighborhoodCard
                key={entry.neighborhood.id}
                entry={entry}
                bedrooms={profile.bedrooms}
                isCompareSelected={compare.isSelected(entry.neighborhood.id)}
                compareDisabled={compare.isFull}
                onOpenDetail={onOpenDetail}
                onToggleCompare={compare.toggle}
              />
            ))}
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm text-slate-500">
              Ranked using your profile: disposable income matters most, then commute time, then overall lifestyle
              fit. Select up to {MAX_COMPARE} to compare side by side.
            </p>
            <RankedList ranked={ranked} onOpenDetail={onOpenDetail} />
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <div className="text-xs font-semibold text-slate-700">{metricConfig.label}</div>
        <div className="mt-2 flex h-2.5 overflow-hidden rounded-full">
          {DIVERGING_STEPS.map((color, i) => (
            <span key={`${color}-${i}`} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] tabular-nums text-slate-500">
          <span>{metricConfig.format(worstValue)}</span>
          <span>{metricConfig.format(bestValue)}</span>
        </div>
        <div className="mt-0.5 flex justify-between text-[10px] font-medium uppercase tracking-wide">
          <span className="text-[color:var(--color-scale-worst)]">Less for you</span>
          <span className="text-[color:var(--color-scale-best)]">More for you</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: NO_DATA_COLOR }} />
          No data
        </div>
      </div>
    </div>
  )
}
