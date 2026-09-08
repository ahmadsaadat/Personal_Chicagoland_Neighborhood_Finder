import type {
  CostOfLivingData,
  County,
  HousingData,
  LifestyleData,
  Municipality,
  Neighborhood,
  NeighborhoodProfile,
  TaxJurisdiction,
  TransportationData,
} from '../types'

import costOfLivingRaw from './costOfLiving.json'
import countiesRaw from './counties.json'
import housingRaw from './housing.json'
import lifestyleRaw from './lifestyle.json'
import municipalitiesRaw from './municipalities.json'
import neighborhoodsRaw from './neighborhoods.json'
import taxJurisdictionsRaw from './taxJurisdictions.json'
import transportationRaw from './transportation.json'

export const counties = countiesRaw as County[]
export const municipalities = municipalitiesRaw as Municipality[]
export const taxJurisdictions = taxJurisdictionsRaw as TaxJurisdiction[]
export const neighborhoods = neighborhoodsRaw as Neighborhood[]
export const housingById = housingRaw as Record<string, HousingData>
export const transportationById = transportationRaw as Record<string, TransportationData>
export const costOfLivingById = costOfLivingRaw as Record<string, CostOfLivingData>
export const lifestyleById = lifestyleRaw as Record<string, LifestyleData>

const countyById = new Map(counties.map((c) => [c.id, c]))
const municipalityById = new Map(municipalities.map((m) => [m.id, m]))
const taxJurisdictionById = new Map(taxJurisdictions.map((t) => [t.id, t]))
const neighborhoodById = new Map(neighborhoods.map((n) => [n.id, n]))

export function getNeighborhoods(): Neighborhood[] {
  return neighborhoods
}

export function getNeighborhood(id: string): Neighborhood | undefined {
  return neighborhoodById.get(id)
}

export function getCounty(id: string): County | undefined {
  return countyById.get(id)
}

export function getMunicipality(id: string): Municipality | undefined {
  return municipalityById.get(id)
}

export function getTaxJurisdiction(id: string): TaxJurisdiction | undefined {
  return taxJurisdictionById.get(id)
}

/** Joins all per-category datasets for one neighborhood into a single object. */
export function getNeighborhoodProfile(id: string): NeighborhoodProfile | undefined {
  const housing = housingById[id]
  const transportation = transportationById[id]
  const costOfLiving = costOfLivingById[id]
  const lifestyle = lifestyleById[id]
  if (!housing || !transportation || !costOfLiving || !lifestyle) return undefined
  return { housing, transportation, costOfLiving, lifestyle }
}

export function getAllNeighborhoodProfiles(): Array<{
  neighborhood: Neighborhood
  profile: NeighborhoodProfile
}> {
  return neighborhoods
    .map((neighborhood) => {
      const profile = getNeighborhoodProfile(neighborhood.id)
      return profile ? { neighborhood, profile } : undefined
    })
    .filter((entry): entry is { neighborhood: Neighborhood; profile: NeighborhoodProfile } => Boolean(entry))
}

// ---------------------------------------------------------------------------
// Additive accessors below this line (added when the dataset was expanded
// beyond the 6 seed neighborhoods). None of the functions above were changed.
// ---------------------------------------------------------------------------

export function getCounties(): County[] {
  return counties
}

export function getMunicipalities(): Municipality[] {
  return municipalities
}

export function getTaxJurisdictions(): TaxJurisdiction[] {
  return taxJurisdictions
}

/** All neighborhoods within a given county (e.g. "cook", "dupage", "lake", "will", "kane"). */
export function getNeighborhoodsByCounty(countyId: string): Neighborhood[] {
  return neighborhoods.filter((n) => n.countyId === countyId)
}

/**
 * All neighborhoods within a given municipality. For Chicago this returns all
 * 35 community areas at once; for suburbs it returns the single neighborhood
 * that represents that town (a suburb IS its own neighborhood in this model).
 */
export function getNeighborhoodsByMunicipality(municipalityId: string): Neighborhood[] {
  return neighborhoods.filter((n) => n.municipalityId === municipalityId)
}

/** All neighborhoods of a given type ("chicago-community-area" | "suburb"). */
export function getNeighborhoodsByType(type: Neighborhood['type']): Neighborhood[] {
  return neighborhoods.filter((n) => n.type === type)
}

/** All neighborhoods sharing a tax jurisdiction (useful for sales-tax-rate map views). */
export function getNeighborhoodsByTaxJurisdiction(taxJurisdictionId: string): Neighborhood[] {
  return neighborhoods.filter((n) => n.taxJurisdictionId === taxJurisdictionId)
}

/**
 * Convenience lookup: county -> municipality -> full Neighborhood record, in
 * one call, for UI breadcrumbs ("Cook County > Evanston > Evanston").
 */
export function getNeighborhoodHierarchy(id: string):
  | { neighborhood: Neighborhood; municipality: Municipality; county: County; taxJurisdiction: TaxJurisdiction }
  | undefined {
  const neighborhood = getNeighborhood(id)
  if (!neighborhood) return undefined
  const municipality = getMunicipality(neighborhood.municipalityId)
  const county = getCounty(neighborhood.countyId)
  const taxJurisdiction = getTaxJurisdiction(neighborhood.taxJurisdictionId)
  if (!municipality || !county || !taxJurisdiction) return undefined
  return { neighborhood, municipality, county, taxJurisdiction }
}

/**
 * Region-wide median rent for a given bedroom count, across every
 * neighborhood that has data for it. Used as a quick, no-neighborhood-
 * selected-yet starting point for the profile's own rent field (e.g. when
 * the user taps a "2BR" toggle before they've picked where to live) — not a
 * substitute for a specific neighborhood's own median rent.
 */
/**
 * Picks the right per-bedroom median rent off one neighborhood's housing
 * data (studio/1BR/2BR/3BR+), falling back to the guaranteed 2BR figure if
 * that specific size isn't modeled for this area. Shared by the detail
 * panel (to show a bedroom-matched benchmark instead of always "2BR") and
 * by getTypicalMonthlyRent below.
 */
export function getRentForBedrooms(housing: HousingData, bedrooms: number): number {
  if (bedrooms <= 0) return housing.medianRentStudio ?? housing.medianRent2BR
  if (bedrooms === 1) return housing.medianRent1BR ?? housing.medianRent2BR
  if (bedrooms === 2) return housing.medianRent2BR
  return housing.medianRent3BR ?? housing.medianRent2BR
}

export function getTypicalMonthlyRent(bedrooms: number): number {
  const values = Object.values(housingById).map((h) => getRentForBedrooms(h, bedrooms))
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  return Math.round(median)
}

/**
 * Approximates a per-bedroom home price for a neighborhood, since the
 * dataset only carries one medianHomePrice per area. Scales that figure by
 * the same ratio its rent scales by bedroom size (e.g. if 1BR rent here runs
 * 80% of 2BR rent, the 1BR home price estimate is 80% of the median home
 * price too) — reusing the bedroom-scaling pattern already established for
 * rent rather than inventing an unrelated one.
 */
export function getHomePriceForBedrooms(housing: HousingData, bedrooms: number): number {
  const rentRatio = getRentForBedrooms(housing, bedrooms) / housing.medianRent2BR
  return Math.round(housing.medianHomePrice * rentRatio)
}
