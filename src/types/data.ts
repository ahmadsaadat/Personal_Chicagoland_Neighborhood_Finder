import type { DataSourceMeta } from './geo'

export interface HousingData {
  neighborhoodId: string
  medianRentStudio?: number
  medianRent1BR?: number
  medianRent2BR: number
  medianRent3BR?: number
  medianHomePrice: number
  /** Effective property tax rate as a fraction of market value (annual tax / value) */
  effectivePropertyTaxRate: number
  meta: DataSourceMeta
}

export interface TransportationData {
  neighborhoodId: string
  /** 0-100, higher is better transit access */
  transitScore: number
  /** 0-100, higher is more walkable */
  walkScore: number
  hasRailAccess: boolean
  /** e.g. ["Blue Line", "Metra UP-NW"] */
  transitLines: string[]
  avgCommuteMinutesToLoop: number
  parkingMonthlyEstimate: number
  meta: DataSourceMeta
}

export interface CostOfLivingData {
  neighborhoodId: string
  groceriesMonthly: number
  utilitiesMonthly: number
  restaurantsMonthly: number
  healthcareMonthly: number
  otherMonthly: number
  meta: DataSourceMeta
}

export interface LifestyleData {
  neighborhoodId: string
  /** 0-100 scales unless noted */
  walkability: number
  transitAccess: number
  restaurantDensity: number
  parksAccess: number
  /** Illustrative relative safety indicator, NOT an official crime statistic */
  safetyIndicator: number
  familyFriendliness: number
  meta: DataSourceMeta
}

/** Everything the app needs about one neighborhood, joined for convenience. */
export interface NeighborhoodProfile {
  housing: HousingData
  transportation: TransportationData
  costOfLiving: CostOfLivingData
  lifestyle: LifestyleData
}
