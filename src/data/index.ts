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
