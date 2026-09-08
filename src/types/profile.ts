export type MaritalStatus = 'single' | 'married'
export type HousingChoice = 'rent' | 'own'
export type IncomeType = 'salary' | 'hourly'
/** How to value the home for an owner: 'median' derives it from the neighborhood's own data at the chosen bedroom size; 'custom' lets the user enter their own monthly mortgage payment instead. */
export type OwnHomeSizing = 'median' | 'custom'

export interface UserProfile {
  annualIncome: number
  incomeType: IncomeType
  hourlyRate: number
  hoursPerWeek: number
  maritalStatus: MaritalStatus
  numChildren: number
  housingChoice: HousingChoice
  hasRoommates: boolean
  /** Total people splitting the rent (and utilities), including the user. Rent-only. */
  numPeopleSplittingRent: number
  /** Own-only. 'median' uses each neighborhood's own home price at `bedrooms` size; 'custom' uses monthlyMortgagePayment instead. */
  ownHomeSizing: OwnHomeSizing
  /** Your own monthly mortgage payment (principal & interest only), used when ownHomeSizing is 'custom' — an implied home value is derived from it for property-tax comparisons. See calculations/financial.ts. */
  monthlyMortgagePayment: number
  /** Drives which per-bedroom rent figure is pulled from each neighborhood's own housing data when renting (0 = studio), and which per-bedroom home price when owning with ownHomeSizing 'median'. */
  bedrooms: number
  ownsCar: boolean
  annualMilesDriven: number
  commuteDestination: string
  monthlySpending: number
}

export const DEFAULT_PROFILE: UserProfile = {
  annualIncome: 85000,
  incomeType: 'salary',
  hourlyRate: 40,
  hoursPerWeek: 40,
  maritalStatus: 'single',
  numChildren: 0,
  housingChoice: 'rent',
  hasRoommates: false,
  numPeopleSplittingRent: 2,
  ownHomeSizing: 'median',
  monthlyMortgagePayment: 1800,
  bedrooms: 1,
  ownsCar: true,
  annualMilesDriven: 8000,
  commuteDestination: 'Chicago Loop',
  monthlySpending: 1200,
}

/** Annual income implied by an hourly rate and hours/week, assuming 52 paid weeks/year. */
export function annualFromHourly(hourlyRate: number, hoursPerWeek: number): number {
  return Math.round(hourlyRate * hoursPerWeek * 52)
}

/**
 * Splits a fixed shared cost (rent) evenly across everyone sharing the
 * unit, including the user — a no-op when there are no roommates. Rent is a
 * fixed cost regardless of headcount, so an even split is the right model
 * (unlike utilities — see calculations/financial.ts's fairUtilitiesShare
 * for why that one isn't a plain even split).
 */
export function splitAmongRoommates(
  amount: number,
  profile: Pick<UserProfile, 'hasRoommates' | 'numPeopleSplittingRent'>,
): number {
  if (!profile.hasRoommates) return amount
  return amount / Math.max(1, profile.numPeopleSplittingRent)
}
