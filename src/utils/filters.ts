import type { NeighborhoodType } from '../types'
import type { NeighborhoodEntry } from './metrics'

export type CarPreference = 'any' | 'car-free-friendly'

export interface FilterState {
  maxRent: number | null
  maxHomePrice: number | null
  minDisposableIncome: number | null
  maxCommuteMinutes: number | null
  carPreference: CarPreference
  minWalkability: number | null
  familyFriendlyOnly: boolean
  maxPropertyTaxRate: number | null
  neighborhoodType: NeighborhoodType | 'all'
}

export const DEFAULT_FILTERS: FilterState = {
  maxRent: null,
  maxHomePrice: null,
  minDisposableIncome: null,
  maxCommuteMinutes: null,
  carPreference: 'any',
  minWalkability: null,
  familyFriendlyOnly: false,
  maxPropertyTaxRate: null,
  neighborhoodType: 'all',
}

const FAMILY_FRIENDLY_THRESHOLD = 70
const CAR_FREE_TRANSIT_THRESHOLD = 70

export function isFiltersActive(filters: FilterState): boolean {
  return (
    filters.maxRent !== null ||
    filters.maxHomePrice !== null ||
    filters.minDisposableIncome !== null ||
    filters.maxCommuteMinutes !== null ||
    filters.carPreference !== 'any' ||
    filters.minWalkability !== null ||
    filters.familyFriendlyOnly ||
    filters.maxPropertyTaxRate !== null ||
    filters.neighborhoodType !== 'all'
  )
}

export function countActiveFilters(filters: FilterState): number {
  let n = 0
  if (filters.maxRent !== null) n++
  if (filters.maxHomePrice !== null) n++
  if (filters.minDisposableIncome !== null) n++
  if (filters.maxCommuteMinutes !== null) n++
  if (filters.carPreference !== 'any') n++
  if (filters.minWalkability !== null) n++
  if (filters.familyFriendlyOnly) n++
  if (filters.maxPropertyTaxRate !== null) n++
  if (filters.neighborhoodType !== 'all') n++
  return n
}

export function applyFilters(entries: NeighborhoodEntry[], filters: FilterState): NeighborhoodEntry[] {
  return entries.filter((entry) => {
    const { neighborhood, profile, summary } = entry

    if (filters.maxRent !== null && profile.housing.medianRent2BR > filters.maxRent) return false
    if (filters.maxHomePrice !== null && profile.housing.medianHomePrice > filters.maxHomePrice) return false
    if (filters.minDisposableIncome !== null && summary.estimatedDisposableIncome < filters.minDisposableIncome) {
      return false
    }
    if (
      filters.maxCommuteMinutes !== null &&
      profile.transportation.avgCommuteMinutesToLoop > filters.maxCommuteMinutes
    ) {
      return false
    }
    if (filters.carPreference === 'car-free-friendly' && profile.transportation.transitScore < CAR_FREE_TRANSIT_THRESHOLD) {
      return false
    }
    if (filters.minWalkability !== null && profile.lifestyle.walkability < filters.minWalkability) return false
    if (filters.familyFriendlyOnly && profile.lifestyle.familyFriendliness < FAMILY_FRIENDLY_THRESHOLD) return false
    if (filters.maxPropertyTaxRate !== null && profile.housing.effectivePropertyTaxRate > filters.maxPropertyTaxRate) {
      return false
    }
    if (filters.neighborhoodType !== 'all' && neighborhood.type !== filters.neighborhoodType) return false

    return true
  })
}
