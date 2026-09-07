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
  /** Roommates in addition to the user — 1 means "you + 1 roommate" (2 people splitting rent). Rent-only. */
  hasRoommates: boolean
  numRoommates: number
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
  numRoommates: 1,
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
 * The user's own out-of-pocket monthly rent after splitting with roommates
 * (numRoommates doesn't count the user, so "1 roommate" splits the total
 * two ways). Used both for display and for the actual disposable-income
 * calculation, so the two never drift apart.
 */
export function yourMonthlyRentShare(profile: Pick<UserProfile, 'monthlyRent' | 'hasRoommates' | 'numRoommates'>): number {
  if (!profile.hasRoommates) return profile.monthlyRent
  const people = Math.max(1, profile.numRoommates) + 1
  return profile.monthlyRent / people
}
