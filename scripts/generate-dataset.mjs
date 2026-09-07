#!/usr/bin/env node
/**
 * One-time, build-time dataset-authoring script (NOT part of the app
 * runtime). Expands the round-1 dataset:
 *   - Adds the 42 official Chicago community areas not already covered,
 *     completing all 77, using real boundary polygons re-fetched from the
 *     City of Chicago Data Portal ("Boundaries - Community Areas (current)",
 *     resource igwz-8jzy).
 *   - Adds 80 additional Chicagoland suburbs across Cook, DuPage, Lake,
 *     Will, Kane, and McHenry counties.
 *   - Writes updated src/data/{counties,municipalities,taxJurisdictions,
 *     neighborhoods,housing,transportation,costOfLiving,lifestyle}.json.
 *   - Writes scripts/data/cache/chicago-77-official.geojson: the 77 real
 *     Chicago community-area polygons (35 carried over unchanged from the
 *     current neighborhoods.geojson + 42 newly fetched/simplified), which
 *     scripts/generate-geometry.mjs then treats as fixed/authoritative
 *     input.
 *
 * Run with: node scripts/generate-dataset.mjs
 * (idempotent: skips any id that's already present in neighborhoods.json)
 */
import { centerOfMass } from '@turf/turf'
import area from '@turf/area'
import simplify from '@turf/simplify'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { NEW_COMMUNITY_AREAS } from './data/community-areas-new.mjs'
import { NEW_SUBURBS } from './data/suburbs-new.mjs'
import {
  CHICAGO_FIT,
  SUBURB_FIT,
  COUNTY_TAX_BASELINE,
  predict,
  clamp,
  round0,
  round4,
  roundScore,
  seededUnit,
  makeMeta,
} from './data/lib.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'src/data')
const CACHE_DIR = path.join(ROOT, 'scripts/data/cache')

function readJSON(rel) {
  return JSON.parse(readFileSync(path.join(DATA_DIR, rel), 'utf8'))
}
function writeJSON(rel, data) {
  writeFileSync(path.join(DATA_DIR, rel), `${JSON.stringify(data, null, 2)}\n`)
}

const CHICAGO_DATA_PORTAL_URL =
  'https://data.cityofchicago.org/resource/igwz-8jzy.geojson?$limit=100'
const RAW_CACHE_PATH = path.join(CACHE_DIR, 'chicago-community-areas.raw.geojson')

async function fetchOfficialCommunityAreas() {
  try {
    const res = await fetch(CHICAGO_DATA_PORTAL_URL, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const geojson = await res.json()
    if (!geojson?.features?.length) throw new Error('empty response')
    console.log(`Fetched ${geojson.features.length} community areas live from the Chicago Data Portal.`)
    writeFileSync(RAW_CACHE_PATH, JSON.stringify(geojson))
    return geojson
  } catch (err) {
    console.warn(`Live fetch failed (${err.message}), falling back to bundled cache at ${RAW_CACHE_PATH}`)
    return JSON.parse(readFileSync(RAW_CACHE_PATH, 'utf8'))
  }
}

/** Multi-part polygons are reduced to their largest ring by area, matching
 * the round-1 methodology (small detached exclaves are dropped). */
function largestPolygon(geometry) {
  if (geometry.type === 'Polygon') return geometry
  // MultiPolygon: pick the ring with the largest area.
  let best = null
  let bestArea = -Infinity
  for (const coords of geometry.coordinates) {
    const candidate = { type: 'Polygon', coordinates: coords }
    const a = area({ type: 'Feature', properties: {}, geometry: candidate })
    if (a > bestArea) {
      bestArea = a
      best = candidate
    }
  }
  return best
}

function round4Coords(geometry) {
  const roundRing = (ring) => ring.map(([lng, lat]) => [round4(lng), round4(lat)])
  return { type: 'Polygon', coordinates: geometry.coordinates.map(roundRing) }
}

/** Simplify + round a raw fetched polygon feature the same way round 1 did:
 * RDP simplification (~65-80m tolerance) then reduced to its largest ring
 * and rounded to 4 decimal places (~11m) to keep file size small. */
function simplifyOfficialPolygon(rawGeometry) {
  const largest = largestPolygon(rawGeometry)
  const simplified = simplify(
    { type: 'Feature', properties: {}, geometry: largest },
    { tolerance: 0.0007, highQuality: true, mutate: false },
  )
  return round4Coords(simplified.geometry)
}

async function main() {
  const neighborhoods = readJSON('neighborhoods.json')
  const housing = readJSON('housing.json')
  const transportation = readJSON('transportation.json')
  const costOfLiving = readJSON('costOfLiving.json')
  const lifestyle = readJSON('lifestyle.json')
  const counties = readJSON('counties.json')
  const municipalities = readJSON('municipalities.json')
  const taxJurisdictions = readJSON('taxJurisdictions.json')

  const existingIds = new Set(neighborhoods.map((n) => n.id))

  // -------------------------------------------------------------------
  // 1. Chicago community areas (complete all 77)
  // -------------------------------------------------------------------
  const portalData = await fetchOfficialCommunityAreas()
  const featureByName = new Map(
    portalData.features.map((f) => [f.properties.community.trim().toUpperCase(), f]),
  )

  const newOfficialFeatures = []
  let addedCA = 0
  for (const def of NEW_COMMUNITY_AREAS) {
    if (existingIds.has(def.id)) continue
    const rawFeature = featureByName.get(def.communityName)
    if (!rawFeature) {
      throw new Error(`Could not find community area "${def.communityName}" in Data Portal response`)
    }
    const geometry = simplifyOfficialPolygon(rawFeature.geometry)
    const centroidFeature = centerOfMass({ type: 'Feature', properties: {}, geometry })
    const [lng, lat] = centroidFeature.geometry.coordinates

    neighborhoods.push({
      id: def.id,
      name: def.name,
      type: 'chicago-community-area',
      countyId: 'cook',
      municipalityId: 'chicago',
      taxJurisdictionId: 'chicago-jurisdiction',
      centroid: [round4(lng), round4(lat)],
      settlementPattern: 'urban',
      geoFeatureId: def.id,
    })

    const price = def.targetHomePrice
    const rent2BR = round0(predict(CHICAGO_FIT.rent2BR, price))
    const taxRate = clamp(round4(predict(CHICAGO_FIT.taxRate, price)), 0.019, 0.0245)

    housing[def.id] = {
      neighborhoodId: def.id,
      medianRentStudio: round0(rent2BR * CHICAGO_FIT.studioRatio),
      medianRent1BR: round0(rent2BR * CHICAGO_FIT.oneBRRatio),
      medianRent2BR: rent2BR,
      medianRent3BR: round0(rent2BR * CHICAGO_FIT.threeBRRatio),
      medianHomePrice: price,
      effectivePropertyTaxRate: taxRate,
      meta: makeMeta('housing'),
    }

    const railBoost = def.hasRailAccess ? 8 : -6
    transportation[def.id] = {
      neighborhoodId: def.id,
      transitScore: roundScore(predict(CHICAGO_FIT.transitScore, price) + railBoost),
      walkScore: roundScore(predict(CHICAGO_FIT.walkScore, price) + railBoost * 0.5),
      hasRailAccess: def.hasRailAccess,
      transitLines: def.transitLines,
      avgCommuteMinutesToLoop: round0(clamp(predict(CHICAGO_FIT.commute, price) - (def.hasRailAccess ? 3 : 0), 12, 55)),
      parkingMonthlyEstimate: round0(predict(CHICAGO_FIT.parking, price)),
      meta: makeMeta('transportation', def.notes),
    }

    costOfLiving[def.id] = {
      neighborhoodId: def.id,
      groceriesMonthly: round0(predict(CHICAGO_FIT.groceries, price)),
      utilitiesMonthly: round0(predict(CHICAGO_FIT.utilities, price)),
      restaurantsMonthly: round0(predict(CHICAGO_FIT.restaurants, price)),
      healthcareMonthly: round0(predict(CHICAGO_FIT.healthcare, price)),
      otherMonthly: round0(predict(CHICAGO_FIT.other, price)),
      meta: makeMeta('costOfLiving'),
    }

    lifestyle[def.id] = {
      neighborhoodId: def.id,
      walkability: roundScore(predict(CHICAGO_FIT.walkScore, price) + railBoost * 0.5),
      transitAccess: roundScore(predict(CHICAGO_FIT.transitScore, price) + railBoost),
      restaurantDensity: roundScore(predict(CHICAGO_FIT.restDensity, price) + (def.restaurantDensityAdj ?? 0)),
      parksAccess: roundScore(predict(CHICAGO_FIT.parksAccess, price) + (def.parksAccessAdj ?? 0)),
      safetyIndicator: roundScore(predict(CHICAGO_FIT.safety, price) + (def.safetyAdj ?? 0)),
      familyFriendliness: roundScore(predict(CHICAGO_FIT.family, price) + (def.familyAdj ?? 0)),
      meta: makeMeta('lifestyle', def.notes),
    }

    newOfficialFeatures.push({
      type: 'Feature',
      properties: { id: def.id, name: def.name, geometrySource: 'official' },
      geometry,
    })
    addedCA++
  }

  // Merge with the 35 official features already committed, to produce the
  // fixed/authoritative 77-polygon set the tessellation script consumes.
  const currentGeojson = JSON.parse(
    readFileSync(path.join(DATA_DIR, 'geo/neighborhoods.geojson'), 'utf8'),
  )
  const existingOfficial = currentGeojson.features.filter(
    (f) => f.properties.geometrySource === 'official',
  )
  const all77 = [...existingOfficial, ...newOfficialFeatures]
  writeFileSync(
    path.join(CACHE_DIR, 'chicago-77-official.geojson'),
    `${JSON.stringify({ type: 'FeatureCollection', features: all77 }, null, 2)}\n`,
  )
  console.log(`Community areas: added ${addedCA} new, ${existingOfficial.length} carried over, total ${all77.length}.`)

  // -------------------------------------------------------------------
  // 2. Suburbs (80 new towns across 6 counties)
  // -------------------------------------------------------------------
  if (!counties.some((c) => c.id === 'mchenry')) {
    counties.push({ id: 'mchenry', name: 'McHenry County', state: 'IL' })
  }

  let addedSuburbs = 0
  for (const def of NEW_SUBURBS) {
    if (existingIds.has(def.id)) continue

    municipalities.push({ id: def.id, name: def.name, countyId: def.countyId, isChicago: false })

    const taxJurisdictionId = `${def.id}-jurisdiction`
    const baseline = COUNTY_TAX_BASELINE[def.countyId]
    const jitter = seededUnit(`${def.id}-tax`) * 0.0015
    taxJurisdictions.push({
      id: taxJurisdictionId,
      name: def.name,
      countyId: def.countyId,
      combinedSalesTaxRate: round4(0.08 + (seededUnit(`${def.id}-sales`) * 0.5 + 0.5) * 0.025),
      meta: {
        source:
          'Illinois Department of Revenue, combined sales tax rate tables (SEED-STYLE ESTIMATE — verify against current IDOR publication before production use)',
        sourceUrl: 'https://tax.illinois.gov/research/taxrates/sales-use.html',
        geographicLevel: 'tax-jurisdiction',
        year: 2025,
        valueType: 'estimated',
        notes: `Approximates ${def.name}'s combined state + ${def.countyId} County + RTA/local + home-rule municipal sales tax rate based on the jurisdiction's known general rate tier; exact basis points not independently verified against the current IDOR table for this MVP.`,
      },
    })

    neighborhoods.push({
      id: def.id,
      name: def.name,
      type: 'suburb',
      countyId: def.countyId,
      municipalityId: def.id,
      taxJurisdictionId,
      centroid: def.centroid,
      settlementPattern: def.settlementPattern,
      geoFeatureId: def.id,
    })

    const price = def.targetHomePrice
    const rent2BR = round0(predict(SUBURB_FIT.rent2BR, price))
    const taxRate = round4(clamp(baseline + jitter, baseline - 0.002, baseline + 0.002))

    housing[def.id] = {
      neighborhoodId: def.id,
      medianRent2BR: rent2BR,
      medianRent1BR: round0(rent2BR * SUBURB_FIT.oneBRRatio),
      medianRent3BR: round0(rent2BR * SUBURB_FIT.threeBRRatio),
      medianHomePrice: price,
      effectivePropertyTaxRate: taxRate,
      meta: makeMeta('housing'),
    }

    const railBoost = def.hasRailAccess ? 10 : -4
    transportation[def.id] = {
      neighborhoodId: def.id,
      transitScore: roundScore(predict(SUBURB_FIT.transitScore, price) + railBoost),
      walkScore: roundScore(predict(SUBURB_FIT.walkScore, price) + railBoost * 0.4),
      hasRailAccess: def.hasRailAccess,
      transitLines: def.transitLines,
      avgCommuteMinutesToLoop: round0(clamp(predict(SUBURB_FIT.commute, price) - (def.hasRailAccess ? 4 : -6), 25, 75)),
      parkingMonthlyEstimate: round0(predict(SUBURB_FIT.parking, price)),
      meta: makeMeta('transportation'),
    }

    costOfLiving[def.id] = {
      neighborhoodId: def.id,
      groceriesMonthly: round0(predict(SUBURB_FIT.groceries, price)),
      utilitiesMonthly: round0(predict(SUBURB_FIT.utilities, price)),
      restaurantsMonthly: round0(predict(SUBURB_FIT.restaurants, price)),
      healthcareMonthly: round0(predict(SUBURB_FIT.healthcare, price)),
      otherMonthly: round0(predict(SUBURB_FIT.other, price)),
      meta: makeMeta('costOfLiving'),
    }

    lifestyle[def.id] = {
      neighborhoodId: def.id,
      walkability: roundScore(predict(SUBURB_FIT.walkability, price) + railBoost * 0.4),
      transitAccess: roundScore(predict(SUBURB_FIT.transitAccess, price) + railBoost),
      restaurantDensity: roundScore(predict(SUBURB_FIT.restDensity, price)),
      parksAccess: roundScore(predict(SUBURB_FIT.parksAccess, price)),
      safetyIndicator: roundScore(predict(SUBURB_FIT.safety, price)),
      familyFriendliness: roundScore(predict(SUBURB_FIT.family, price)),
      meta: makeMeta('lifestyle'),
    }

    addedSuburbs++
  }

  console.log(`Suburbs: added ${addedSuburbs} new.`)

  writeJSON('neighborhoods.json', neighborhoods)
  writeJSON('housing.json', housing)
  writeJSON('transportation.json', transportation)
  writeJSON('costOfLiving.json', costOfLiving)
  writeJSON('lifestyle.json', lifestyle)
  writeJSON('counties.json', counties)
  writeJSON('municipalities.json', municipalities)
  writeJSON('taxJurisdictions.json', taxJurisdictions)

  console.log(`Done. Total neighborhoods: ${neighborhoods.length}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
