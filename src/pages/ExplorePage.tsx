import { List, RotateCcw, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { rankNeighborhoods } from '../calculations/ranking'
import { ChicagolandMap } from '../map/ChicagolandMap'
import { MapLegend } from '../map/MapLegend'
import { MapMetricSelector } from '../map/MapMetricSelector'
import { FilterDrawer } from '../components/filters/FilterDrawer'
import { EmptyState } from '../components/common/EmptyState'
import { SlideOver } from '../components/common/SlideOver'
import { NeighborhoodCard } from '../components/neighborhood/NeighborhoodCard'
import { ProfileChips } from '../components/profile/ProfileChips'
import { RankedList } from '../components/ranking/RankedList'
import type { UserProfile, MapMetric } from '../types'
import type { UseCompareSelectionResult } from '../hooks/useCompareSelection'
import { MAX_COMPARE } from '../hooks/useCompareSelection'
import { applyFilters, countActiveFilters, DEFAULT_FILTERS, isFiltersActive, type FilterState } from '../utils/filters'
import { getMetricConfig, type NeighborhoodEntry } from '../utils/metrics'

/**
 * Which supplementary overlay panel (if any) floats on top of the map.
 * `null` means the map alone is showing — the persistent default view.
 */
export type ExplorePanel = 'list' | 'best' | null

interface ExplorePageProps {
  profile: UserProfile
  entries: NeighborhoodEntry[]
  activePanel: ExplorePanel
  onPanelChange: (panel: ExplorePanel) => void
  selectedNeighborhoodId: string | null
  onSelectNeighborhood: (id: string) => void
  compare: UseCompareSelectionResult
  onOpenProfile: () => void
  isOnboarded: boolean
}

/**
 * The explore experience: a full-bleed, always-interactive map with every
 * other control (metric, filters, list, best-for-you) floating on top of it
 * as compact overlay chips/panels, hoodmaps-style — the map is the page, not
 * a panel within it.
 */
export function ExplorePage({
  profile,
  entries,
  activePanel,
  onPanelChange,
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
  const hasCompareItems = compare.selectedIds.length > 0

  const ranked = useMemo(
    () => rankNeighborhoods(profile, filteredEntries.map((e) => e.neighborhood.id)),
    [profile, filteredEntries],
  )

  const { min, max } = useMemo(() => {
    if (filteredEntries.length === 0) return { min: 0, max: 0 }
    const values = filteredEntries.map((e) => metricConfig.getValue(e))
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [filteredEntries, metricConfig])

  function closePanel() {
    onPanelChange(null)
  }

  // Opening the detail slide-over from within the list/best-for-you overlay
  // closes that overlay first, so we never end up with two full-screen
  // slide-overs stacked on top of each other.
  function handleOpenDetail(id: string) {
    closePanel()
    onSelectNeighborhood(id)
  }

  return (
    <div className="relative h-full w-full">
      <ChicagolandMap
        entries={filteredEntries}
        metric={metric}
        selectedNeighborhoodId={selectedNeighborhoodId}
        compareIds={compare.selectedIds}
        onSelectNeighborhood={onSelectNeighborhood}
      />

      {filteredEntries.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
          <div className="pointer-events-auto">
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
          </div>
        </div>
      )}

      {/* Floating overlay controls — always above the map, always below drawers/modals (z-40+). */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between gap-2 p-3 sm:p-4">
        <div className="flex flex-col items-start gap-2">
          {!isOnboarded && (
            <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-blue-100 bg-blue-50/95 px-4 py-2 text-xs text-blue-800 shadow-sm backdrop-blur">
              <span className="hidden sm:inline">Seeing estimates for a default profile.</span>
              <span className="sm:hidden">Default profile</span>
              <button
                type="button"
                onClick={onOpenProfile}
                className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-blue-700"
              >
                Set up yours
              </button>
            </div>
          )}

          <div className="flex w-full flex-wrap items-start justify-between gap-2">
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <ProfileChips profile={profile} onEdit={onOpenProfile} />
            </div>
            <div className="pointer-events-auto flex items-center gap-2">
              <MapMetricSelector value={metric} onChange={setMetric} />
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="relative flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white"
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {isFiltersActive(filters) && (
            <div className="pointer-events-auto flex w-fit items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs text-slate-500 shadow-sm backdrop-blur">
              <span>
                {filteredEntries.length} of {entries.length} neighborhoods
              </span>
              <button
                type="button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="flex items-center gap-1 font-medium text-slate-600 transition hover:text-slate-800"
              >
                <RotateCcw size={11} /> Clear
              </button>
            </div>
          )}
        </div>

        {/* List / Best-for-you toggle: a floating pill toolbar, bottom-right on
            desktop, a full-width bottom toolbar row on mobile. Shifts up on
            mobile when the compare tray is showing so the two never overlap. */}
        <div
          className={`pointer-events-auto flex justify-end self-end sm:absolute sm:bottom-4 sm:right-4 sm:self-auto ${
            hasCompareItems ? 'mb-20 sm:mb-0' : ''
          }`}
        >
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={() => onPanelChange('list')}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <List size={15} />
              List
            </button>
            <button
              type="button"
              onClick={() => onPanelChange('best')}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Sparkles size={15} />
              Best for you
            </button>
          </div>
        </div>
      </div>

      <MapLegend metric={metricConfig} min={min} max={max} />

      {/* Supplementary overlay: full neighborhood list, on top of the still-visible map. */}
      <SlideOver
        open={activePanel === 'list'}
        onClose={closePanel}
        title="All neighborhoods"
        subtitle={`${filteredEntries.length} ${filteredEntries.length === 1 ? 'match' : 'matches'} your filters`}
      >
        {filteredEntries.length === 0 ? (
          <EmptyState
            icon={X}
            title="No neighborhoods match your filters"
            description="Try relaxing your rent, commute, or tax criteria to see more options."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredEntries.map((entry) => (
              <NeighborhoodCard
                key={entry.neighborhood.id}
                entry={entry}
                isCompareSelected={compare.isSelected(entry.neighborhood.id)}
                compareDisabled={compare.isFull}
                onOpenDetail={handleOpenDetail}
                onToggleCompare={compare.toggle}
              />
            ))}
          </div>
        )}
      </SlideOver>

      {/* Supplementary overlay: ranked "best for you", on top of the still-visible map. */}
      <SlideOver
        open={activePanel === 'best'}
        onClose={closePanel}
        title="Best for you"
        subtitle={`Ranked for your profile · compare up to ${MAX_COMPARE}`}
      >
        <p className="mb-4 text-sm text-slate-500">
          Ranked using your profile: disposable income matters most, then commute time, then overall lifestyle fit.
        </p>
        <RankedList ranked={ranked} onOpenDetail={handleOpenDetail} />
      </SlideOver>

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
