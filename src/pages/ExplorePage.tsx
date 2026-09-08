import { SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { rankNeighborhoods } from '../calculations/ranking'
import { ChicagolandMap } from '../map/ChicagolandMap'
import { MapMetricSelector } from '../map/MapMetricSelector'
import { SlideOver } from '../components/common/SlideOver'
import { ToolsPanel, type PanelTab } from '../components/panel/ToolsPanel'
import type { UserProfile, MapMetric } from '../types'
import type { UseCompareSelectionResult } from '../hooks/useCompareSelection'
import { getMetricConfig, type NeighborhoodEntry } from '../utils/metrics'

interface ExplorePageProps {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
  onResetProfile: () => void
  entries: NeighborhoodEntry[]
  selectedNeighborhoodId: string | null
  onSelectNeighborhood: (id: string) => void
  compare: UseCompareSelectionResult
  profileExpanded: boolean
  onProfileExpandedChange: (expanded: boolean) => void
}

/**
 * The whole app, essentially: a full-bleed, always-interactive Chicagoland
 * map with a single "tools and info" panel overlaid on top of it — a
 * persistent left sidebar on larger screens, a slide-over sheet on mobile.
 * The map is never replaced by another view; the panel floats above it.
 */
export function ExplorePage({
  profile,
  onProfileChange,
  onResetProfile,
  entries,
  selectedNeighborhoodId,
  onSelectNeighborhood,
  compare,
  profileExpanded,
  onProfileExpandedChange,
}: ExplorePageProps) {
  const [metric, setMetric] = useState<MapMetric>('disposableIncome')
  const [tab, setTab] = useState<PanelTab>('list')
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)

  const metricConfig = getMetricConfig(metric)

  const ranked = useMemo(
    () => rankNeighborhoods(profile, entries.map((e) => e.neighborhood.id)),
    [profile, entries],
  )

  const { min, max } = useMemo(() => {
    if (entries.length === 0) return { min: 0, max: 0 }
    const values = entries.map((e) => metricConfig.getValue(e))
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [entries, metricConfig])

  function handleOpenDetail(id: string) {
    setMobilePanelOpen(false)
    onSelectNeighborhood(id)
  }

  const panelProps = {
    profile,
    onProfileChange,
    onResetProfile,
    profileExpanded,
    onProfileExpandedChange,
    metricConfig,
    min,
    max,
    tab,
    onTabChange: setTab,
    entries,
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
        entries={entries}
        metric={metric}
        bedrooms={profile.bedrooms}
        housingChoice={profile.housingChoice}
        selectedNeighborhoodId={selectedNeighborhoodId}
        compareIds={compare.selectedIds}
        onSelectNeighborhood={onSelectNeighborhood}
      />

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
    </div>
  )
}
