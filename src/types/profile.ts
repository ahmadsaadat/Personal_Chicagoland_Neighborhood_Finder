export type MaritalStatus = 'single' | 'married'
export type HousingChoice = 'rent' | 'own'
export type IncomeType = 'salary' | 'hourly'

export interface UserProfile {
  annualIncome: number
  incomeType: IncomeType
  hourlyRate: number
  hoursPerWeek: number
  maritalStatus: MaritalStatus
  numChildren: number
  housingChoice: HousingChoice
  monthlyRent: number
  hasRoommates: boolean
  /** Total people splitting the rent (and utilities), including the user. Rent-only. */
  numPeopleSplittingRent: number
  /** Total monthly utilities for the unit — split among roommates the same way rent is. */
  monthlyUtilities: number
  homePurchasePrice: number
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
  monthlyRent: 1800,
  hasRoommates: false,
  numPeopleSplittingRent: 2,
  monthlyUtilities: 150,
  homePurchasePrice: 350000,
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
 * Splits a shared monthly cost (rent, utilities) evenly across everyone
 * sharing the unit, including the user — a no-op when there are no
 * roommates. Shared by rent and utilities so the two never drift apart.
 */
export function splitAmongRoommates(
  amount: number,
  profile: Pick<UserProfile, 'hasRoommates' | 'numPeopleSplittingRent'>,
): number {
  if (!profile.hasRoommates) return amount
  return amount / Math.max(1, profile.numPeopleSplittingRent)
}

/** The user's own out-of-pocket monthly rent after splitting with roommates. */
export function yourMonthlyRentShare(
  profile: Pick<UserProfile, 'monthlyRent' | 'hasRoommates' | 'numPeopleSplittingRent'>,
): number {
  return splitAmongRoommates(profile.monthlyRent, profile)
}

/** The user's own out-of-pocket monthly utilities after splitting with roommates. */
export function yourMonthlyUtilitiesShare(
  profile: Pick<UserProfile, 'monthlyUtilities' | 'hasRoommates' | 'numPeopleSplittingRent'>,
): number {
  return splitAmongRoommates(profile.monthlyUtilities, profile)
}
