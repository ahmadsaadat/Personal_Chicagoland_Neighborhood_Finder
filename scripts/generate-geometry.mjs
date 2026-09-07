#!/usr/bin/env node
/**
 * One-time, build-time script that generates src/data/geo/neighborhoods.geojson.
 *
 * THIS IS NOT PART OF THE APP RUNTIME. It is a data-authoring step. It:
 *   1. Takes the 77 real Chicago community-area polygons
 *      (scripts/data/cache/chicago-77-official.geojson) as fixed,
 *      authoritative input — this script never modifies them.
 *   2. Fetches real municipal boundary polygons for all 102 suburbs from the
 *      U.S. Census Bureau's TIGER/Line "Places" geography (via the
 *      TIGERweb ArcGIS REST service), matches each suburb by name, and
 *      simplifies the matched polygon the same way the Chicago polygons are
 *      simplified (RDP simplification, largest-ring-only, 4-decimal
 *      rounding).
 *   3. Writes the merged 179-feature FeatureCollection to
 *      src/data/geo/neighborhoods.geojson.
 *
 * WHY THIS REPLACED THE OLD VORONOI TESSELLATION (scripts/generate-tessellation.mjs):
 * a user comparing the map against Google Maps confirmed the real Chicago
 * community-area polygons look correct, but pointed out that the suburb
 * "territory" shapes (a computed Voronoi tessellation — "closest town-center
 * wins") did not match reality, specifically calling out Cicero and Berwyn:
 * both are narrow, elongated towns along the Ogden/Cicero Ave corridor, and a
 * Voronoi cell ("closest centroid wins") looks nothing like that real shape.
 * This script replaces all 102 Voronoi cells with real TIGER/Line Place
 * boundaries. See docs/DATA_SOURCES.md for the full plain-language writeup.
 *
 * HONEST LIMITATION: unlike the old Voronoi tessellation, real municipal
 * boundaries do NOT tile edge-to-edge. There is real unincorporated land
 * between many towns (and around Chicago's edges) that belongs to no
 * modeled neighborhood. That is expected and correct — this script does not
 * force gaps closed, pad boundaries, or otherwise fabricate coverage.
 *
 * FALLBACK: if a specific suburb's name cannot be matched to a real Census
 * Place after a good-faith attempt (including "St."/"Saint" and similar
 * normalization, and point-in-polygon disambiguation for towns that share a
 * name with a downstate Illinois place — see the Wilmington case below),
 * this script falls back to that suburb's old Voronoi cell, preserved in
 * scripts/data/cache/suburb-voronoi-fallback.geojson (a frozen snapshot of
 * the pre-this-round tessellation), and tags ONLY that feature
 * `geometrySource: "voronoi-illustrative"`. As of this writing all 102
 * suburbs matched a real Place, so this fallback path is not exercised, but
 * it is kept so a future added suburb that can't be matched doesn't silently
 * disappear from the map.
 *
 * Neither `@turf/turf` (still used here for simplification/geometry helpers)
 * nor this script is ever imported from `src/` — the app only ever loads the
 * static generated GeoJSON file.
 *
 * Run with: npm run geo:generate
 */
import { simplify, area as turfArea, booleanPointInPolygon, centroid as turfCentroid, distance as turfDistance, point as turfPoint } from '@turf/turf'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CACHE_DIR = path.join(ROOT, 'scripts/data/cache')
const OFFICIAL_PATH = path.join(CACHE_DIR, 'chicago-77-official.geojson')
const PLACES_CACHE_PATH = path.join(CACHE_DIR, 'illinois-places.raw.geojson')
const VORONOI_FALLBACK_PATH = path.join(CACHE_DIR, 'suburb-voronoi-fallback.geojson')
const NEIGHBORHOODS_JSON_PATH = path.join(ROOT, 'src/data/neighborhoods.json')
const OUTPUT_PATH = path.join(ROOT, 'src/data/geo/neighborhoods.geojson')

// Census TIGERweb "Places, County Subdivisions, Consolidated Cities..."
// service, the top-level (non-label) "Incorporated Places 500K" layer (id
// 10) — generalized/cartographic (1:500,000) boundaries, same generalization
// tier as the State_County service the previous round used for county
// extents. Filtered to Illinois (STATE=17); we fetch every IL place once and
// match locally rather than querying per-suburb.
const TIGERWEB_PLACES_URL =
  'https://tigerweb.geo.census.gov/arcgis/rest/services/Generalized_ACS2024/Places_CouSub_ConCity_SubMCD/MapServer/10/query?where=STATE%3D%2717%27&outFields=GEOID%2CSTATE%2CPLACE%2CNAME%2CBASENAME%2CLSADC%2CAREALAND%2CAREAWATER&returnGeometry=true&outSR=4326&f=geojson'

const ROUND = 4
function round4(n) {
  return Math.round(n * 10 ** ROUND) / 10 ** ROUND
}
function roundRing(ring) {
  return ring.map(([lng, lat]) => [round4(lng), round4(lat)])
}
function roundGeometry(geometry) {
  if (geometry.type === 'Polygon') {
    return { type: 'Polygon', coordinates: geometry.coordinates.map(roundRing) }
  }
  if (geometry.type === 'MultiPolygon') {
    return { type: 'MultiPolygon', coordinates: geometry.coordinates.map((poly) => poly.map(roundRing)) }
  }
  return geometry
}

/** Multi-part polygons are reduced to their largest ring by area, matching
 * the same convention already used for the 77 Chicago polygons (small
 * detached exclaves/annexation slivers are dropped). */
function largestPolygon(geometry) {
  if (geometry.type === 'Polygon') return geometry
  let best = null
  let bestArea = -Infinity
  for (const coords of geometry.coordinates) {
    const candidate = { type: 'Polygon', coordinates: coords }
    const a = turfArea({ type: 'Feature', properties: {}, geometry: candidate })
    if (a > bestArea) {
      bestArea = a
      best = candidate
    }
  }
  return best
}

/** Simplify + round a raw fetched place polygon the same way the Chicago
 * polygons were: RDP simplification (~65-80m tolerance), largest-ring-only,
 * rounded to 4 decimal places (~11m) to control file size. */
function simplifyPlacePolygon(rawGeometry) {
  const largest = largestPolygon(rawGeometry)
  const simplified = simplify(
    { type: 'Feature', properties: {}, geometry: largest },
    { tolerance: 0.0007, highQuality: true, mutate: false },
  )
  return roundGeometry(simplified.geometry)
}

async function fetchIllinoisPlaces() {
  try {
    const res = await fetch(TIGERWEB_PLACES_URL, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const geojson = await res.json()
    if (!geojson?.features?.length) throw new Error('empty response')
    writeFileSync(PLACES_CACHE_PATH, JSON.stringify(geojson))
    console.log(`Fetched ${geojson.features.length} Illinois Census Places live from TIGERweb.`)
    return { geojson, isLive: true }
  } catch (err) {
    console.warn(`Live TIGERweb Places fetch failed (${err.message}), falling back to bundled cache.`)
    return { geojson: JSON.parse(readFileSync(PLACES_CACHE_PATH, 'utf8')), isLive: false }
  }
}

/** Normalize a name for matching against Census BASENAME (which already has
 * the "village"/"city"/"town" suffix stripped). Handles the one recurring
 * quirk in our suburb list: "St. X" vs. Census's spelled-out "Saint X". */
function nameKeys(name) {
  const key = name.trim().toLowerCase()
  const keys = new Set([key])
  if (key.startsWith('st. ')) keys.add(`saint ${key.slice(4)}`)
  if (key.startsWith('st ')) keys.add(`saint ${key.slice(3)}`)
  return keys
}

/**
 * Match one suburb to its real Census Place. Most names are unique statewide
 * and resolve in one step. A handful of names recur elsewhere in downstate
 * Illinois (e.g. there are two "Wilmington"s — the Will County city near
 * Joliet we mean, and an unrelated village downstate) so when a name has
 * multiple statewide candidates we disambiguate using the suburb's real,
 * known centroid coordinate: prefer a candidate whose polygon actually
 * contains that point, falling back to whichever candidate's centroid is
 * geographically nearest.
 */
function matchPlace(suburb, placesByBasename) {
  const keys = nameKeys(suburb.name)
  const candidates = []
  for (const key of keys) {
    const found = placesByBasename.get(key)
    if (found) candidates.push(...found)
  }
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  const pt = turfPoint(suburb.centroid)
  const containing = candidates.filter((c) => {
    try {
      return booleanPointInPolygon(pt, c.feature)
    } catch {
      return false
    }
  })
  if (containing.length === 1) return containing[0]
  const pool = containing.length > 0 ? containing : candidates
  let best = null
  let bestDist = Infinity
  for (const c of pool) {
    const d = turfDistance(pt, turfCentroid(c.feature))
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  return best
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
  console.log(`Loaded ${official.features.length} official Chicago polygons and ${suburbs.length} suburbs to match.`)

  const { geojson: placesRaw, isLive } = await fetchIllinoisPlaces()
  const placesByBasename = new Map()
  for (const feature of placesRaw.features) {
    if (!feature.geometry) continue
    const key = feature.properties.BASENAME.trim().toLowerCase()
    const entry = { feature, properties: feature.properties }
    if (!placesByBasename.has(key)) placesByBasename.set(key, [])
    placesByBasename.get(key).push(entry)
  }
  console.log(`Loaded ${placesRaw.features.length} Illinois Census Places (${isLive ? 'live' : 'cached'}).`)

  const voronoiFallback = JSON.parse(readFileSync(VORONOI_FALLBACK_PATH, 'utf8'))
  const fallbackById = new Map(voronoiFallback.features.map((f) => [f.properties.id, f]))

  const suburbFeatures = []
  let realCount = 0
  let fallbackCount = 0
  const fallbackIds = []
  for (const suburb of suburbs) {
    const match = matchPlace(suburb, placesByBasename)
    if (match) {
      const geometry = simplifyPlacePolygon(match.feature.geometry)
      suburbFeatures.push({
        type: 'Feature',
        properties: {
          id: suburb.id,
          name: suburb.name,
          geometrySource: 'official',
          census: { geoid: match.properties.GEOID, placeName: match.properties.NAME },
        },
        geometry,
      })
      realCount++
    } else {
      const fallback = fallbackById.get(suburb.id)
      if (!fallback) {
        throw new Error(
          `No Census Place match AND no Voronoi fallback available for suburb "${suburb.id}" — cannot produce any geometry for it.`,
        )
      }
      console.warn(`No Census Place match found for "${suburb.name}" (${suburb.id}) — keeping its old Voronoi cell as a fallback.`)
      suburbFeatures.push({
        type: 'Feature',
        properties: { id: suburb.id, name: suburb.name, geometrySource: 'voronoi-illustrative' },
        geometry: fallback.geometry,
      })
      fallbackCount++
      fallbackIds.push(suburb.id)
    }
  }

  const officialFeatures = official.features.map((f) => ({
    type: 'Feature',
    properties: { id: f.properties.id, name: f.properties.name, geometrySource: 'official' },
    geometry: roundGeometry(f.geometry),
  }))

  const featureCollection = {
    type: 'FeatureCollection',
    metadata: {
      source:
        'Two-part methodology: (1) 77 official Chicago community-area boundary polygons from the City of Chicago Data Portal, "Boundaries - Community Areas (current)" (resource igwz-8jzy) — real, surveyed municipal geometry, taken as fixed input and never modified by this pipeline. (2) Real municipal boundary polygons for all Chicagoland suburbs from the U.S. Census Bureau TIGER/Line "Places" geography, fetched via the Census TIGERweb ArcGIS REST service (Generalized_ACS2024/Places_CouSub_ConCity_SubMCD, "Incorporated Places 500K" layer), matched to each suburb by name and (where a name recurs elsewhere in Illinois) disambiguated by which candidate polygon contains the suburb\'s known real centroid. Generated by scripts/generate-geometry.mjs.',
      sourceUrl:
        'https://tigerweb.geo.census.gov/arcgis/rest/services/Generalized_ACS2024/Places_CouSub_ConCity_SubMCD/MapServer/10',
      geographicLevel: 'neighborhood',
      year: 2024,
      valueType: 'actual',
      notes:
        `properties.geometrySource is "official" for the 77 real Chicago community-area polygons and for ${realCount} of the 102 suburbs, whose geometry is now real, surveyed U.S. Census TIGER/Line municipal boundary data (simplified with Ramer-Douglas-Peucker to ~11m coordinate precision and reduced to each polygon's largest ring to control file size — not survey-accurate at high zoom; small annexation exclaves are dropped). ${
          fallbackCount > 0
            ? `${fallbackCount} suburb(s) (${fallbackIds.join(', ')}) could not be matched to a real Census Place by name and fall back to their previous illustrative Voronoi cell, tagged "voronoi-illustrative" — NOT a real municipal boundary.`
            : 'All 102 suburbs matched a real Census Place; there is no Voronoi fallback in this build.'
        } IMPORTANT: unlike the old Voronoi tessellation this replaced, real municipal boundaries do NOT tile edge-to-edge — there is real unincorporated land between many towns and around parts of Chicago's edge that belongs to no modeled neighborhood. That is expected and correct, not a bug; this pipeline does not force gaps closed. Replaced the Voronoi-tessellation approach after a user comparison against Google Maps found the computed "closest centroid wins" cells did not match real town shapes (most visibly for Cicero and Berwyn, both narrow, elongated towns whose real shape a Voronoi cell cannot produce). Every feature's properties.id matches a Neighborhood.geoFeatureId in src/data/neighborhoods.json. Regenerate this file with \`npm run geo:generate\` (scripts/generate-geometry.mjs) after adding or moving any neighborhood; it is a one-time authoring step, not part of the app build.`,
      chicagoCommunityAreaCount: officialFeatures.length,
      suburbCount: suburbFeatures.length,
      suburbRealBoundaryCount: realCount,
      suburbVoronoiFallbackCount: fallbackCount,
      totalFeatureCount: officialFeatures.length + suburbFeatures.length,
    },
    features: [...officialFeatures, ...suburbFeatures],
  }

  // Written compact (no pretty-print indentation), unlike some other
  // hand-maintained src/data/*.json files: real municipal boundaries carry
  // far more vertices per ring than the old Voronoi cells did, and
  // indent=2 pretty-printing roughly quadruples a coordinate-heavy file's
  // size (each number/bracket on its own line). Compact keeps this file in
  // the same size ballpark as before and well under the 1MB budget; nothing
  // ever hand-edits this generated file, so readability isn't a concern.
  const serialized = JSON.stringify(featureCollection)
  writeFileSync(OUTPUT_PATH, `${serialized}\n`)
  const sizeKB = (Buffer.byteLength(serialized) / 1024).toFixed(1)
  console.log(
    `Wrote ${OUTPUT_PATH}: ${officialFeatures.length} official Chicago + ${realCount} real-boundary suburbs + ${fallbackCount} Voronoi-fallback suburb(s) = ${featureCollection.features.length} features (~${sizeKB} KB).`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
