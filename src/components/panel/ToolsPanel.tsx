import { ChevronDown, List, RotateCcw, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../common/EmptyState'
import { FilterFields } from '../filters/FilterFields'
import { NeighborhoodCard } from '../neighborhood/NeighborhoodCard'
import { ProfileChips } from '../profile/ProfileChips'
import { RankedList } from '../ranking/RankedList'
import { DIVERGING_STEPS, NO_DATA_COLOR } from '../../utils/colorScale'
import type { FilterState } from '../../utils/filters'
import type { MetricConfig, NeighborhoodEntry } from '../../utils/metrics'
import type { RankedNeighborhood } from '../../calculations/ranking'
import type { HousingChoice, UserProfile } from '../../types'
import { MAX_COMPARE } from '../../hooks/useCompareSelection'
import type { UseCompareSelectionResult } from '../../hooks/useCompareSelection'

export type PanelTab = 'list' | 'best'

interface ToolsPanelProps {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
  onOpenProfile: () => void
  metricConfig: MetricConfig
  min: number
  max: number
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  activeFilterCount: number
  filtersActive: boolean
  onResetFilters: () => void
  tab: PanelTab
  onTabChange: (tab: PanelTab) => void
  filteredEntries: NeighborhoodEntry[]
  totalCount: number
  ranked: RankedNeighborhood[]
  onOpenDetail: (id: string) => void
  compare: UseCompareSelectionResult
}

function inputClass(extra = '') {
  return `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${extra}`
}

/**
 * The consolidated "tools and info" surface — a live income/rent editor,
 * metric legend, filters, and the neighborhood list/ranking — rendered once
 * and reused both as a persistent desktop sidebar and as the mobile
 * slide-over's content. Everything here is either always visible or expands
 * in place; nothing opens a separate overlay that covers the map or hides
 * the rest of the panel.
 */
export function ToolsPanel({
  profile,
  onProfileChange,
  onOpenProfile,
  metricConfig,
  min,
  max,
  filters,
  onFiltersChange,
  activeFilterCount,
  filtersActive,
  onResetFilters,
  tab,
  onTabChange,
  filteredEntries,
  totalCount,
  ranked,
  onOpenDetail,
  compare,
}: ToolsPanelProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const worstValue = metricConfig.goodDirection === 'high' ? min : max
  const bestValue = metricConfig.goodDirection === 'high' ? max : min

  function setHousingChoice(choice: HousingChoice) {
    onProfileChange({ ...profile, housingChoice: choice })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Your numbers</div>
          <p className="text-xs text-slate-400">
            Drives every disposable-income estimate on the map — edit anytime.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="quick-income">
              Annual income
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
              <input
                id="quick-income"
                type="number"
                min={0}
                step={1000}
                value={profile.annualIncome}
                onChange={(e) => onProfileChange({ ...profile, annualIncome: Number(e.target.value) })}
                className={inputClass('pl-5')}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="quick-housing-amount">
              {profile.housingChoice === 'rent' ? 'Monthly rent' : 'Home price'}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
              <input
                id="quick-housing-amount"
                type="number"
                min={0}
                step={profile.housingChoice === 'rent' ? 50 : 5000}
                value={profile.housingChoice === 'rent' ? profile.monthlyRent : profile.homePurchasePrice}
                onChange={(e) =>
                  onProfileChange(
                    profile.housingChoice === 'rent'
                      ? { ...profile, monthlyRent: Number(e.target.value) }
                      : { ...profile, homePurchasePrice: Number(e.target.value) },
                  )
                }
                className={inputClass('pl-5')}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {(['rent', 'own'] as HousingChoice[]).map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setHousingChoice(choice)}
              className={`rounded-lg py-1.5 text-xs font-medium capitalize transition ${
                profile.housingChoice === choice ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {choice}
            </button>
          ))}
        </div>

        <ProfileChips profile={profile} onEdit={onOpenProfile} />
        <button
          type="button"
          onClick={onOpenProfile}
          className="self-start text-xs font-medium text-slate-400 transition hover:text-slate-600"
        >
          Full profile &amp; assumptions →
        </button>

        <div>
          <button
            type="button"
            onClick={() => setFiltersExpanded((v) => !v)}
            className="relative flex w-full items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <ChevronDown size={15} className={`text-slate-400 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
          </button>

          {filtersActive && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span>
                {filteredEntries.length} of {totalCount} neighborhoods
              </span>
              <button
                type="button"
                onClick={onResetFilters}
                className="flex items-center gap-1 font-medium text-slate-500 transition hover:text-slate-700"
              >
                <RotateCcw size={11} /> Clear filters
              </button>
            </div>
          )}

          {filtersExpanded && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <FilterFields filters={filters} onChange={onFiltersChange} />
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

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filteredEntries.length === 0 ? (
          <EmptyState
            icon={X}
            title="No neighborhoods match your filters"
            description="Try relaxing your rent, commute, or tax criteria to see more options."
          />
        ) : tab === 'list' ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredEntries.map((entry) => (
              <NeighborhoodCard
                key={entry.neighborhood.id}
                entry={entry}
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
          <span className="text-[color:var(--color-div-red-700)]">Less for you</span>
          <span className="text-[color:var(--color-div-blue-700)]">More for you</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: NO_DATA_COLOR }} />
          No data
        </div>
      </div>
    </div>
  )
}
