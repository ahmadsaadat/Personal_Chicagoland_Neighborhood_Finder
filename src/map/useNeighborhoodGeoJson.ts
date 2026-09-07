import type { FeatureCollection } from 'geojson'
import { useEffect, useState } from 'react'
// Vite serves any file as a static asset URL via the explicit `?url` suffix,
// so we don't need a custom loader or to touch vite.config.ts (which isn't
// owned by either engineer) just to import a .geojson file.
import geojsonUrl from '../data/geo/neighborhoods.geojson?url'

export type GeoJsonLoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: FeatureCollection }

/** Fetches the neighborhood boundary GeoJSON shipped as static app data. */
export function useNeighborhoodGeoJson(): GeoJsonLoadState {
  const [state, setState] = useState<GeoJsonLoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch(geojsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load neighborhood boundaries (${res.status})`)
        return res.json() as Promise<FeatureCollection>
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ status: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
