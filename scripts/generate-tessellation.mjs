#!/usr/bin/env node
/**
 * One-time, build-time script that generates src/data/geo/neighborhoods.geojson.
 *
 * THIS IS NOT PART OF THE APP RUNTIME. It is a data-authoring step: it reads
 * the real Chicago community-area polygons (fixed/authoritative — never
 * modified here) and every suburb's centroid, computes a Voronoi tessellation
 * of the suburbs with d3-delaunay, clips it to a real Chicagoland county
 * boundary with @turf/turf, subtracts the real Chicago city boundary out of
 * the suburb cells, and writes the merged result as a single static GeoJSON
 * file. Neither `d3-delaunay` nor `@turf/turf` is ever imported from `src/`
 * — the app only ever loads the generated static file, exactly like before.
 *
 * Why this exists: with only real boundaries for 35 Chicago community areas
 * and 22 illustrative suburb squares, the map had huge empty gaps between
 * suburbs and Chicago. This script produces a full edge-to-edge tessellation
 * of the whole modeled region so the map has no gaps or floating shapes,
 * while being explicit in the output's metadata that the suburb shapes are a
 * computed illustrative partition, NOT real municipal boundaries.
 *
 * Run with: npm run geo:generate
 */
import { Delaunay } from 'd3-delaunay'
import {
  union,
  difference,
  intersect,
  simplify,
  area as turfArea,
  bbox as turfBbox,
  centroid as turfCentroid,
  distance as turfDistance,
  booleanIntersects,
} from '@turf/turf'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CACHE_DIR = path.join(ROOT, 'scripts/data/cache')
const OFFICIAL_PATH = path.join(CACHE_DIR, 'chicago-77-official.geojson')
const COUNTIES_CACHE_PATH = path.join(CACHE_DIR, 'chicagoland-counties.raw.geojson')
const NEIGHBORHOODS_JSON_PATH = path.join(ROOT, 'src/data/neighborhoods.json')
const OUTPUT_PATH = path.join(ROOT, 'src/data/geo/neighborhoods.geojson')

// Census cartographic (1:500,000, shoreline-clipped) county boundaries for
// the 6 counties this dataset models (Cook 031, DuPage 043, Kane 089, Lake
// 097, Will 197, McHenry 111, all FIPS state 17 = Illinois). Deliberately
// using the *generalized/cartographic* boundary layer rather than the legal
// TIGER boundary layer: the legal boundaries of Cook and Lake counties
// extend miles out into Lake Michigan (to the state's water border), which
// would otherwise make the Chicagoland "extent" include a huge chunk of
// open water for the Voronoi cells to sprawl into.
const TIGERWEB_COUNTIES_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/Generalized_ACS2024/State_County/MapServer/11/query?where=STATE%3D%2717%27+AND+COUNTY+IN+(%27031%27%2C%27043%27%2C%27097%27%2C%27089%27%2C%27197%27%2C%27111%27)&outFields=NAME%2CCOUNTY&f=geojson"

const ROUND = 4
function round4(n) {
  return Math.round(n * 10 ** ROUND) / 10 ** ROUND
}
function roundGeometry(geometry) {
  const roundRing = (ring) => ring.map(([lng, lat]) => [round4(lng), round4(lat)])
  if (geometry.type === 'Polygon') {
    return { type: 'Polygon', coordinates: geometry.coordinates.map(roundRing) }
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.coordinates.map((poly) => poly.map(roundRing)),
    }
  }
  return geometry
}

async function fetchCountyExtent() {
  let geojson
  try {
    const res = await fetch(TIGERWEB_COUNTIES_URL, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    geojson = await res.json()
    if (!geojson?.features?.length) throw new Error('empty response')
    writeFileSync(COUNTIES_CACHE_PATH, JSON.stringify(geojson))
    console.log(`Fetched ${geojson.features.length} county boundaries live from Census TIGERweb.`)
  } catch (err) {
    console.warn(`Live county fetch failed (${err.message}), falling back to bundled cache.`)
    geojson = JSON.parse(readFileSync(COUNTIES_CACHE_PATH, 'utf8'))
  }

  const simplified = geojson.features.map((f) =>
    simplify({ type: 'Feature', properties: f.properties, geometry: f.geometry }, { tolerance: 0.0007, highQuality: true }),
  )
  const dissolved = union({ type: 'FeatureCollection', features: simplified })
  return {
    polygon: dissolved,
    isRealBoundary: true,
    countyNames: geojson.features.map((f) => f.properties.NAME),
  }
}

/** Fallback used only if the live TIGERweb fetch AND the bundled cache both
 * fail: a padded convex hull around every included neighborhood centroid.
 * Clearly flagged as a convenience boundary, not an official one. */
function convexHullExtent(points) {
  // Minimal convex hull (Andrew's monotone chain) + fixed-degree padding.
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const buildHalf = (pts) => {
    const hull = []
    for (const p of pts) {
      while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) hull.pop()
      hull.push(p)
    }
    return hull
  }
  const lower = buildHalf(sorted)
  const upper = buildHalf([...sorted].reverse())
  const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)]
  const PAD = 0.08
  const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length
  const cy = hull.reduce((s, p) => s + p[1], 0) / hull.length
  const padded = hull.map(([x, y]) => {
    const dx = x - cx
    const dy = y - cy
    const len = Math.hypot(dx, dy) || 1
    return [x + (dx / len) * PAD, y + (dy / len) * PAD]
  })
  padded.push(padded[0])
  return {
    polygon: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [padded] } },
    isRealBoundary: false,
    countyNames: [],
  }
}

async function main() {
  const official = JSON.parse(readFileSync(OFFICIAL_PATH, 'utf8'))
  if (official.features.length !== 77) {
    throw new Error(
      `Expected 77 official Chicago community-area features in ${OFFICIAL_PATH}, found ${official.features.length}. Run scripts/generate-dataset.mjs first.`,
    )
  }
  const neighborhoods = JSON.parse(readFileSync(NEIGHBORHOODS_JSON_PATH, 'utf8'))
  const suburbs = neighborhoods.filter((n) => n.type === 'suburb')
  console.log(`Loaded ${official.features.length} official Chicago polygons and ${suburbs.length} suburb centroids.`)

  // 1. Chicago city boundary = union of all 77 official (fixed/authoritative) polygons.
  const chicagoUnion = union({ type: 'FeatureCollection', features: official.features })

  // 2. Chicagoland extent = union of real county boundaries (Census TIGERweb),
  //    falling back to a padded convex hull only if both the live fetch and
  //    the bundled cache are unavailable.
  let extent
  try {
    extent = await fetchCountyExtent()
  } catch (err) {
    console.warn(`County boundary unavailable (${err.message}); falling back to a padded convex hull.`)
    const allPoints = [...suburbs.map((s) => s.centroid), ...neighborhoods.filter((n) => n.type !== 'suburb').map((n) => n.centroid)]
    extent = convexHullExtent(allPoints)
  }

  // 3. Voronoi diagram of every suburb centroid, bounded generously beyond
  //    the extent so edge cells aren't truncated by the Delaunay bounding
  //    box itself (only by the real extent polygon in step 4).
  //
  //    The 77 Chicago community-area centroids are added as AUXILIARY
  //    Delaunay sites here (their own cells are discarded below, never
  //    emitted) purely so the triangulation doesn't "reach across" the
  //    large Chicago-shaped gap in the suburb point set. Without them,
  //    suburbs on opposite sides of Chicago (e.g. Evanston and Calumet
  //    City) end up as each other's nearest Delaunay neighbors, producing
  //    wildly oversized, elongated cells that swing through where Chicago
  //    is. Chicago's real boundary is still taken entirely from the fixed
  //    77-polygon set, never from any Voronoi cell.
  const chicagoCentroids = neighborhoods
    .filter((n) => n.type === 'chicago-community-area')
    .map((n) => n.centroid)
  const points = [...suburbs.map((s) => s.centroid), ...chicagoCentroids]
  const [minX, minY, maxX, maxY] = turfBbox(extent.polygon)
  const margin = 1.0
  const delaunay = Delaunay.from(points)
  const voronoi = delaunay.voronoi([minX - margin, minY - margin, maxX + margin, maxY + margin])

  // Kept unrounded until the very end (after gap-filling below) so boolean
  // ops keep full precision; rounding only happens once, right before write.
  const suburbRaw = []
  let droppedCount = 0
  for (let i = 0; i < suburbs.length; i++) {
    const cellRing = voronoi.cellPolygon(i)
    if (!cellRing) {
      droppedCount++
      continue
    }
    let cellFeature = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [cellRing] } }

    // 4. Clip to the real Chicagoland extent.
    let clipped
    try {
      clipped = intersect({ type: 'FeatureCollection', features: [cellFeature, extent.polygon] })
    } catch {
      clipped = null
    }
    if (!clipped) {
      droppedCount++
      continue
    }

    // 5. Subtract the real Chicago city boundary so suburb cells never
    //    overlap the 77 authoritative community-area polygons.
    let carved
    try {
      carved = difference({ type: 'FeatureCollection', features: [clipped, chicagoUnion] })
    } catch {
      carved = clipped
    }
    if (!carved) {
      droppedCount++
      continue
    }

    // Polygon clipping against ~180 other shapes occasionally leaves
    // microscopic sliver fragments (a few square meters) as separate parts
    // of a MultiPolygon — floating specks, not real disconnected territory.
    // Drop any part under 0.05 km² and keep only the substantive part(s).
    const SLIVER_THRESHOLD_M2 = 50000
    let geometry = carved.geometry
    if (geometry.type === 'MultiPolygon') {
      const keptParts = geometry.coordinates.filter(
        (poly) => turfArea({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: poly } }) >= SLIVER_THRESHOLD_M2,
      )
      if (keptParts.length === 0) {
        droppedCount++
        continue
      }
      geometry = keptParts.length === 1 ? { type: 'Polygon', coordinates: keptParts[0] } : { type: 'MultiPolygon', coordinates: keptParts }
    }
    if (turfArea({ type: 'Feature', properties: {}, geometry }) < 1000) {
      droppedCount++
      continue
    }

    const suburb = suburbs[i]
    suburbRaw.push({ id: suburb.id, name: suburb.name, geometry })
  }

  if (droppedCount > 0) {
    console.warn(`${droppedCount} suburb cell(s) produced no usable geometry after clipping and were skipped.`)
  }

  // 6. Gap-fill pass. The real Chicago boundary is far more irregular than
  //    any Voronoi cell edge, so a handful of small wedges near Chicago's
  //    jagged edges (particularly the far south side) can end up outside
  //    every suburb cell AND outside the Chicago union — a real leftover
  //    gap, not floating-point noise. Find any such leftover area and merge
  //    each piece into whichever neighboring suburb cell it actually
  //    touches (nearest by centroid distance, if it touches more than one),
  //    so the final tessellation has zero gaps inside the modeled extent.
  let coverageSoFar = chicagoUnion
  for (const s of suburbRaw) {
    try {
      coverageSoFar = union({ type: 'FeatureCollection', features: [coverageSoFar, { type: 'Feature', properties: {}, geometry: s.geometry }] })
    } catch {
      // If a particular cell fails to union (degenerate geometry), leave it
      // out of the running coverage union only — it still ships as its own
      // feature; this only affects gap-detection accuracy for that cell.
    }
  }
  const leftover = difference({ type: 'FeatureCollection', features: [extent.polygon, coverageSoFar] })
  let gapFilledCount = 0
  if (leftover) {
    const leftoverParts =
      leftover.geometry.type === 'Polygon' ? [leftover.geometry.coordinates] : leftover.geometry.coordinates
    for (const poly of leftoverParts) {
      const gapFeature = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: poly } }
      const gapAreaM2 = turfArea(gapFeature)
      if (gapAreaM2 < 500) continue // floating-point noise, not a real gap
      const gapCentroid = turfCentroid(gapFeature)
      const touching = suburbRaw.filter((s) => {
        try {
          return booleanIntersects(gapFeature, { type: 'Feature', properties: {}, geometry: s.geometry })
        } catch {
          return false
        }
      })
      const candidates = touching.length > 0 ? touching : suburbRaw
      let nearest = null
      let nearestDist = Infinity
      for (const s of candidates) {
        const d = turfDistance(gapCentroid, turfCentroid({ type: 'Feature', properties: {}, geometry: s.geometry }))
        if (d < nearestDist) {
          nearestDist = d
          nearest = s
        }
      }
      if (!nearest) continue
      try {
        const merged = union({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry: nearest.geometry }, gapFeature],
        })
        nearest.geometry = merged.geometry
        gapFilledCount++
      } catch {
        // Leave ungapped rather than risk corrupting the target geometry.
      }
    }
  }
  if (gapFilledCount > 0) {
    console.log(`Merged ${gapFilledCount} leftover gap fragment(s) (mostly along Chicago's irregular real edges) into their nearest suburb cell.`)
  }

  // 7. Defragment pass. A cell can come out of clipping/gap-filling as a
  //    MultiPolygon with a second, disconnected lobe (uneven point density
  //    means a town's "closest point" region can wrap around a neighbor).
  //    Coverage is still gap-free and non-overlapping either way, but a
  //    single town owning two detached blobs reads as a stray floating
  //    shape on the map. Keep each town's largest lobe as its own feature
  //    and reassign every smaller lobe to whichever neighboring town's cell
  //    actually touches it, same rule as the gap-fill pass above. Two
  //    passes are enough in practice for this dataset's point density.
  const splitIntoPolygonParts = (geometry) =>
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  let defragmentedCount = 0
  for (let pass = 0; pass < 2; pass++) {
    for (const s of suburbRaw) {
      const parts = splitIntoPolygonParts(s.geometry)
      if (parts.length <= 1) continue
      const withArea = parts
        .map((coords) => ({ coords, area: turfArea({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: coords } }) }))
        .sort((a, b) => b.area - a.area)
      const [main, ...extras] = withArea
      s.geometry = { type: 'Polygon', coordinates: main.coords }
      for (const extra of extras) {
        const extraFeature = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: extra.coords } }
        const extraCentroid = turfCentroid(extraFeature)
        const touching = suburbRaw.filter((o) => {
          if (o === s) return false
          try {
            return booleanIntersects(extraFeature, { type: 'Feature', properties: {}, geometry: o.geometry })
          } catch {
            return false
          }
        })
        const candidates = touching.length > 0 ? touching : suburbRaw.filter((o) => o !== s)
        let nearest = null
        let nearestDist = Infinity
        for (const o of candidates) {
          const d = turfDistance(extraCentroid, turfCentroid({ type: 'Feature', properties: {}, geometry: o.geometry }))
          if (d < nearestDist) {
            nearestDist = d
            nearest = o
          }
        }
        if (!nearest) {
          // No other cell touches it (shouldn't happen in practice) — keep
          // it attached to its original town rather than lose the area.
          s.geometry = union({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: {}, geometry: s.geometry }, extraFeature],
          }).geometry
          continue
        }
        try {
          nearest.geometry = union({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: {}, geometry: nearest.geometry }, extraFeature],
          }).geometry
          defragmentedCount++
        } catch {
          // Leave the lobe with its original town rather than risk losing it.
          s.geometry = union({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: {}, geometry: s.geometry }, extraFeature],
          }).geometry
        }
      }
    }
  }
  if (defragmentedCount > 0) {
    console.log(`Reassigned ${defragmentedCount} detached lobe(s) to their touching neighbor so every suburb cell is a single connected shape.`)
  }

  // 8. Final trim: the union/difference chain above occasionally leaves
  //    sub-hectare numerical-precision specks as extra MultiPolygon parts
  //    (a few square meters to a few hundred). Drop anything under 5,000 m²
  //    (0.5 hectares) outright rather than keep reassigning noise around —
  //    negligible relative to the ~9,700 km² extent.
  const NOISE_THRESHOLD_M2 = 5000
  for (const s of suburbRaw) {
    const parts = splitIntoPolygonParts(s.geometry)
    if (parts.length <= 1) continue
    const kept = parts.filter(
      (coords) => turfArea({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: coords } }) >= NOISE_THRESHOLD_M2,
    )
    if (kept.length === 0) continue // shouldn't happen (main lobe is always well above this)
    s.geometry = kept.length === 1 ? { type: 'Polygon', coordinates: kept[0] } : { type: 'MultiPolygon', coordinates: kept }
  }

  const suburbFeatures = suburbRaw.map((s) => ({
    type: 'Feature',
    properties: { id: s.id, name: s.name, geometrySource: 'voronoi-illustrative' },
    geometry: roundGeometry(s.geometry),
  }))

  const officialFeatures = official.features.map((f) => ({
    type: 'Feature',
    properties: { id: f.properties.id, name: f.properties.name, geometrySource: 'official' },
    geometry: roundGeometry(f.geometry),
  }))

  const featureCollection = {
    type: 'FeatureCollection',
    metadata: {
      source:
        'Two-part methodology: (1) 77 official Chicago community-area boundary polygons from the City of Chicago Data Portal, "Boundaries - Community Areas (current)" (resource igwz-8jzy) — real, surveyed municipal geometry, taken as fixed input and never modified by this pipeline. (2) A computed Voronoi tessellation of every non-Chicago Chicagoland town\'s real centroid coordinate, generated with d3-delaunay, clipped to a Chicagoland county-boundary extent, and clipped again to exclude the real Chicago polygons, generated by scripts/generate-tessellation.mjs.',
      sourceUrl: 'https://data.cityofchicago.org/resource/igwz-8jzy.geojson',
      geographicLevel: 'neighborhood',
      year: 2025,
      valueType: 'estimated',
      notes:
        `WHAT A VORONOI TESSELLATION IS: pick a set of points (here, each suburb's real town-center coordinate), and for every point, draw the region of the map that is closer to that point than to any other point. The result is a set of polygons that share edges and cover the whole area with no gaps and no overlaps — like cutting a sheet of dough into pieces, one per town, where each piece's border sits exactly halfway to its neighbors. THE POLYGON BOUNDARIES THIS PRODUCES ARE NOT REAL MUNICIPAL BORDERS — a real town's actual boundary can be a very different shape than its Voronoi cell. This is purely a way to give every included town a visually reasonable, non-overlapping "territory" on the map so the whole region reads as tiled instead of leaving empty gaps between real Chicago boundaries and floating suburb markers. properties.geometrySource is "official" for the 77 real Chicago community-area polygons (see source above; simplified with Ramer-Douglas-Peucker to ~11m coordinate precision and reduced to each polygon's largest ring to control file size — not survey-accurate at high zoom) and "voronoi-illustrative" for the ${suburbFeatures.length} suburb cells (computed convenience shapes, NOT real municipal boundaries; only each suburb's centroid coordinate is a real fact). The outer edge of the whole tessellated region is the union of real Cook/DuPage/Kane/Lake/Will/McHenry county boundaries (Census TIGERweb cartographic boundary files), simplified the same way — a real regional boundary, though the choice of which 6 counties to model is this project's own scope decision, not an official "Chicagoland" definition (no single official one exists). Every feature's properties.id matches a Neighborhood.geoFeatureId in src/data/neighborhoods.json. Regenerate this file with \`npm run geo:generate\` (scripts/generate-tessellation.mjs) after adding or moving any neighborhood; it is a one-time authoring step, not part of the app build.`,
      chicagoCommunityAreaCount: officialFeatures.length,
      suburbCount: suburbFeatures.length,
      totalFeatureCount: officialFeatures.length + suburbFeatures.length,
      extentBasis: extent.isRealBoundary
        ? `Union of real county boundaries (Census TIGERweb): ${extent.countyNames.join(', ')}.`
        : 'FALLBACK: county boundary data was unavailable at generation time, so the outer extent is an illustrative padded convex hull around all included neighborhood centroids, NOT an official regional boundary.',
    },
    features: [...officialFeatures, ...suburbFeatures],
  }

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(featureCollection, null, 2)}\n`)
  const sizeKB = (Buffer.byteLength(JSON.stringify(featureCollection)) / 1024).toFixed(1)
  console.log(
    `Wrote ${OUTPUT_PATH}: ${officialFeatures.length} official + ${suburbFeatures.length} voronoi-illustrative = ${featureCollection.features.length} features (~${sizeKB} KB).`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
