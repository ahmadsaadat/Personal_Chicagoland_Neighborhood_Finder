import { SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { rankNeighborhoods } from '../calculations/ranking'
import { ChicagolandMap } from '../map/ChicagolandMap'
import { MapMetricSelector } from '../map/MapMetricSelector'
import { FilterDrawer } from '../components/filters/FilterDrawer'
import { EmptyState } from '../components/common/EmptyState'
import { SlideOver } from '../components/common/SlideOver'
import { ToolsPanel, type PanelTab } from '../components/panel/ToolsPanel'
import type { UserProfile, MapMetric } from '../types'
import type { UseCompareSelectionResult } from '../hooks/useCompareSelection'
import { applyFilters, countActiveFilters, DEFAULT_FILTERS, isFiltersActive, type FilterState } from '../utils/filters'
import { getMetricConfig, type NeighborhoodEntry } from '../utils/metrics'

interface ExplorePageProps {
  profile: UserProfile
  entries: NeighborhoodEntry[]
  selectedNeighborhoodId: string | null
  onSelectNeighborhood: (id: string) => void
  compare: UseCompareSelectionResult
  onOpenProfile: () => void
  isOnboarded: boolean
}

/**
 * The whole app, essentially: a full-bleed, always-interactive Chicagoland
 * map with a single "tools and info" panel overlaid on top of it — a
 * persistent left sidebar on larger screens, a slide-over sheet on mobile.
 * The map is never replaced by another view; the panel floats above it.
 */
export function ExplorePage({
  profile,
  entries,
  selectedNeighborhoodId,
  onSelectNeighborhood,
  compare,
  onOpenProfile,
  isOnboarded,
}: ExplorePageProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [metric, setMetric] = useState<MapMetric>('disposableIncome')
  const [tab, setTab] = useState<PanelTab>('list')
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)

  const filteredEntries = useMemo(() => applyFilters(entries, filters), [entries, filters])
  const metricConfig = getMetricConfig(metric)
  const activeFilterCount = countActiveFilters(filters)
  const filtersActive = isFiltersActive(filters)

  const ranked = useMemo(
    () => rankNeighborhoods(profile, filteredEntries.map((e) => e.neighborhood.id)),
    [profile, filteredEntries],
  )

  const { min, max } = useMemo(() => {
    if (filteredEntries.length === 0) return { min: 0, max: 0 }
    const values = filteredEntries.map((e) => metricConfig.getValue(e))
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [filteredEntries, metricConfig])

  function handleOpenDetail(id: string) {
    setMobilePanelOpen(false)
    onSelectNeighborhood(id)
  }

  const panelProps = {
    profile,
    onOpenProfile,
    isOnboarded,
    metricConfig,
    min,
    max,
    activeFilterCount,
    filtersActive,
    onOpenFilters: () => setFilterDrawerOpen(true),
    onResetFilters: () => setFilters(DEFAULT_FILTERS),
    tab,
    onTabChange: setTab,
    filteredEntries,
    totalCount: entries.length,
    ranked,
    onOpenDetail: handleOpenDetail,
    compare,
  }

  return (
    <div className="relative h-full w-full">
      {/* The map fills the entire surface — the sidebar/sheet float on top of
          it, they never resize or replace it, so Leaflet's own layout is
          never disturbed. `isolate` on the map keeps its internal panes
          (Leaflet assigns them z-index values in the hundreds) from leaking
          out and rendering above these overlay controls. */}
      <ChicagolandMap
        entries={filteredEntries}
        metric={metric}
        selectedNeighborhoodId={selectedNeighborhoodId}
        compareIds={compare.selectedIds}
        onSelectNeighborhood={onSelectNeighborhood}
      />

      {filteredEntries.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 lg:pl-[420px]">
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

      {/* Desktop: persistent sidebar overlaid on the map's left edge. */}
      <aside className="absolute inset-y-0 left-0 z-10 hidden w-[380px] flex-col border-r border-slate-200 bg-white shadow-xl lg:flex xl:w-[420px]">
        <ToolsPanel {...panelProps} />
      </aside>

      {/* The metric selector floats over the map's top-right corner, separate
          from the tools panel, on every screen size. */}
      <div className="pointer-events-auto absolute right-3 top-3 z-10">
        <MapMetricSelector value={metric} onChange={setMetric} />
      </div>

      {/* Mobile/tablet: a floating trigger that opens the same panel as a sheet. */}
      <button
        type="button"
        onClick={() => setMobilePanelOpen(true)}
        className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur lg:hidden"
      >
        <SlidersHorizontal size={15} />
        Explore
        {activeFilterCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      <div className="lg:hidden">
        <SlideOver
          open={mobilePanelOpen}
          onClose={() => setMobilePanelOpen(false)}
          title="Chicagoland"
          widthClassName="max-w-md"
          noBodyPadding
        >
          <ToolsPanel {...panelProps} />
        </SlideOver>
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
