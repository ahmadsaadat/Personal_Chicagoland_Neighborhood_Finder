import { List, Map as MapIcon, RotateCcw, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { rankNeighborhoods } from '../calculations/ranking'
import { ChicagolandMap } from '../map/ChicagolandMap'
import { MapLegend } from '../map/MapLegend'
import { MapMetricSelector } from '../map/MapMetricSelector'
import { FilterDrawer } from '../components/filters/FilterDrawer'
import { EmptyState } from '../components/common/EmptyState'
import { NeighborhoodCard } from '../components/neighborhood/NeighborhoodCard'
import { ProfileChips } from '../components/profile/ProfileChips'
import { RankedList } from '../components/ranking/RankedList'
import type { UserProfile, MapMetric } from '../types'
import type { UseCompareSelectionResult } from '../hooks/useCompareSelection'
import { MAX_COMPARE } from '../hooks/useCompareSelection'
import { applyFilters, countActiveFilters, DEFAULT_FILTERS, isFiltersActive, type FilterState } from '../utils/filters'
import { getMetricConfig, type NeighborhoodEntry } from '../utils/metrics'

export type ExploreTab = 'map' | 'list' | 'best'

interface ExplorePageProps {
  profile: UserProfile
  entries: NeighborhoodEntry[]
  activeTab: ExploreTab
  onTabChange: (tab: ExploreTab) => void
  selectedNeighborhoodId: string | null
  onSelectNeighborhood: (id: string) => void
  compare: UseCompareSelectionResult
  onOpenProfile: () => void
  isOnboarded: boolean
}

const TABS: Array<{ key: ExploreTab; label: string; icon: typeof MapIcon }> = [
  { key: 'map', label: 'Map', icon: MapIcon },
  { key: 'list', label: 'List', icon: List },
  { key: 'best', label: 'Best for you', icon: Sparkles },
]

export function ExplorePage({
  profile,
  entries,
  activeTab,
  onTabChange,
  selectedNeighborhoodId,
  onSelectNeighborhood,
  compare,
  onOpenProfile,
  isOnboarded,
}: ExplorePageProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [metric, setMetric] = useState<MapMetric>('disposableIncome')

  const filteredEntries = useMemo(() => applyFilters(entries, filters), [entries, filters])
  const metricConfig = getMetricConfig(metric)
  const activeFilterCount = countActiveFilters(filters)

  const ranked = useMemo(
    () => rankNeighborhoods(profile, filteredEntries.map((e) => e.neighborhood.id)),
    [profile, filteredEntries],
  )

  const { min, max } = useMemo(() => {
    if (filteredEntries.length === 0) return { min: 0, max: 0 }
    const values = filteredEntries.map((e) => metricConfig.getValue(e))
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [filteredEntries, metricConfig])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {!isOnboarded && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span>
            You&apos;re seeing estimates for a default profile. Set up yours for numbers tailored to your income and
            situation.
          </span>
          <button
            type="button"
            onClick={onOpenProfile}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            Set up profile
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ProfileChips profile={profile} onEdit={onOpenProfile} />
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === tab.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="relative flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {isFiltersActive(filters) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <span>
            Showing {filteredEntries.length} of {entries.length} neighborhoods
          </span>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="flex items-center gap-1 font-medium text-slate-500 transition hover:text-slate-700"
          >
            <RotateCcw size={11} /> Clear filters
          </button>
        </div>
      )}

      <div className="mt-5">
        {filteredEntries.length === 0 ? (
          <EmptyState
            icon={X}
            title="No neighborhoods match your filters"
            description="Try relaxing your rent, commute, or tax criteria to see more options."
            action={
              <button
                type="button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Reset filters
              </button>
            }
          />
        ) : activeTab === 'map' ? (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative h-[420px] lg:h-[calc(100vh-260px)] lg:min-h-[480px]">
              <div className="absolute right-3 top-3 z-[1000]">
                <MapMetricSelector value={metric} onChange={setMetric} />
              </div>
              <ChicagolandMap
                entries={filteredEntries}
                metric={metric}
                selectedNeighborhoodId={selectedNeighborhoodId}
                compareIds={compare.selectedIds}
                onSelectNeighborhood={onSelectNeighborhood}
              />
              <MapLegend metric={metricConfig} min={min} max={max} />
            </div>
            <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:max-h-[calc(100vh-260px)] lg:grid-cols-1">
              {filteredEntries.map((entry) => (
                <NeighborhoodCard
                  key={entry.neighborhood.id}
                  entry={entry}
                  isCompareSelected={compare.isSelected(entry.neighborhood.id)}
                  compareDisabled={compare.isFull}
                  onOpenDetail={onSelectNeighborhood}
                  onToggleCompare={compare.toggle}
                />
              ))}
            </div>
          </div>
        ) : activeTab === 'list' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry) => (
              <NeighborhoodCard
                key={entry.neighborhood.id}
                entry={entry}
                isCompareSelected={compare.isSelected(entry.neighborhood.id)}
                compareDisabled={compare.isFull}
                onOpenDetail={onSelectNeighborhood}
                onToggleCompare={compare.toggle}
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            <p className="mb-4 text-sm text-slate-500">
              Ranked using your profile: disposable income matters most, then commute time, then overall lifestyle
              fit. Select up to {MAX_COMPARE} to compare side by side.
            </p>
            <RankedList ranked={ranked} onOpenDetail={onSelectNeighborhood} />
          </div>
        )}
      </div>

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        resultCount={filteredEntries.length}
      />
    </div>
  )
}
