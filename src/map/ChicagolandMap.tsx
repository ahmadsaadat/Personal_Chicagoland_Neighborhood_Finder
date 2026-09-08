import type { Feature, Geometry } from 'geojson'
import L, { type Layer, type PathOptions } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { GeoJSON, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { formatBedrooms, formatCurrency } from '../utils/format'
import { divergingColor, NO_DATA_COLOR } from '../utils/colorScale'
import { getMetricConfig, type NeighborhoodEntry } from '../utils/metrics'
import type { HousingChoice, MapMetric } from '../types'
import { fixLeafletDefaultIcon } from './leafletIconFix'
import { useNeighborhoodGeoJson } from './useNeighborhoodGeoJson'

fixLeafletDefaultIcon()

const CHICAGO_LOOP: [number, number] = [41.8786, -87.6251]

interface ChicagolandMapProps {
  entries: NeighborhoodEntry[]
  metric: MapMetric
  bedrooms: number
  housingChoice: HousingChoice
  selectedNeighborhoodId: string | null
  compareIds: string[]
  onSelectNeighborhood: (id: string) => void
}

interface NeighborhoodFeatureProps {
  id: string
  name: string
}

export function ChicagolandMap({
  entries,
  metric,
  bedrooms,
  housingChoice,
  selectedNeighborhoodId,
  compareIds,
  onSelectNeighborhood,
}: ChicagolandMapProps) {
  const geo = useNeighborhoodGeoJson()
  const metricConfig = getMetricConfig(metric)

  const entriesById = useMemo(() => {
    const map = new Map<string, NeighborhoodEntry>()
    for (const entry of entries) map.set(entry.neighborhood.geoFeatureId, entry)
    return map
  }, [entries])

  const { min, max, valuesSum } = useMemo(() => {
    if (entries.length === 0) return { min: 0, max: 0, valuesSum: 0 }
    const values = entries.map((e) => metricConfig.getValue(e))
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      valuesSum: values.reduce((a, b) => a + b, 0),
    }
  }, [entries, metricConfig])

  // GeoJSON style/handlers are captured in closures at layer-creation time, so
  // remount the layer whenever anything that should change its appearance
  // changes (metric, selection, compare set, or the underlying values for the
  // current user profile).
  const layerKey = `${metric}-${bedrooms}-${housingChoice}-${selectedNeighborhoodId ?? ''}-${compareIds.join(',')}-${valuesSum.toFixed(2)}`

  function styleFeature(feature?: Feature<Geometry, NeighborhoodFeatureProps>): PathOptions {
    const id = feature?.properties.id
    const entry = id ? entriesById.get(id) : undefined
    const fillColor = entry
      ? divergingColor(metricConfig.getValue(entry), min, max, metricConfig.goodDirection)
      : NO_DATA_COLOR
    const isSelected = entry?.neighborhood.id === selectedNeighborhoodId
    const isCompared = entry ? compareIds.includes(entry.neighborhood.id) : false

    return {
      fillColor,
      fillOpacity: entry ? 0.75 : 0.2,
      // '#5a8a6a' must match --color-compare-accent in src/index.css — Leaflet
      // styles polygons via inline SVG attributes, where CSS var() support is
      // unreliable, so this is hardcoded rather than referencing the token.
      color: isSelected ? '#0b0b0b' : isCompared ? '#5a8a6a' : '#ffffff',
      weight: isSelected ? 2.5 : isCompared ? 2.5 : 1,
      dashArray: isCompared && !isSelected ? '4 3' : undefined,
    }
  }

  function onEachFeature(feature: Feature<Geometry, NeighborhoodFeatureProps>, layer: Layer) {
    const entry = entriesById.get(feature.properties.id)
    if (entry) {
      const { neighborhood, summary } = entry
      const housingLine =
        housingChoice === 'rent'
          ? `${formatBedrooms(bedrooms)} rent: <strong>${formatCurrency(Math.round(summary.monthlyRentShare))}/mo</strong>`
          : `Housing payment: <strong>${formatCurrency(Math.round(summary.monthlyHousingPayment))}/mo</strong>`
      layer.bindTooltip(
        `<div style="font-family:var(--font-sans);min-width:170px">
          <div style="font-weight:600;font-size:13px;color:#0b0b0b;margin-bottom:4px">${neighborhood.name}</div>
          <div style="font-size:12px;color:#52514e">${housingLine}</div>
          <div style="font-size:12px;color:#52514e">Est. disposable income: <strong>${formatCurrency(Math.round(summary.estimatedDisposableIncome / 12))}/mo</strong></div>
        </div>`,
        { sticky: true, direction: 'top', opacity: 0.97, className: 'chicagoland-tooltip' },
      )
      layer.on({
        click: () => onSelectNeighborhood(neighborhood.id),
        mouseover: (e) => {
          const target = e.target as L.Path
          target.setStyle({ weight: 3, fillOpacity: 0.9 })
        },
        mouseout: (e) => {
          const target = e.target as L.Path
          target.setStyle(styleFeature(feature))
        },
      })
    }
  }

  return (
    // `isolate` creates a new stacking context so Leaflet's internal panes
    // (it assigns them z-index values in the hundreds — e.g. the tooltip and
    // popup panes) are contained here and can never render above sibling
    // overlay UI like the tools panel or drawers, no matter their z-index.
    <div className="relative isolate h-full w-full overflow-hidden bg-slate-100">
      <MapContainer
        center={[41.86, -87.68]}
        zoom={10}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: '#eef2f6' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {geo.status === 'ready' && (
          <GeoJSON key={layerKey} data={geo.data} style={styleFeature} onEachFeature={onEachFeature} />
        )}
        <Marker position={CHICAGO_LOOP}>
          <Popup>Chicago Loop — common commute destination reference point.</Popup>
        </Marker>
      </MapContainer>

      {geo.status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow">
            <Loader2 size={16} className="animate-spin" />
            Loading map boundaries…
          </div>
        </div>
      )}
      {geo.status === 'error' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[color:var(--color-status-critical)] shadow">
            <AlertTriangle size={16} />
            Couldn&apos;t load map boundaries.
          </div>
        </div>
      )}
    </div>
  )
}
