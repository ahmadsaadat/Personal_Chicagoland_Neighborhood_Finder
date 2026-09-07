export type MaritalStatus = 'single' | 'married'
export type HousingChoice = 'rent' | 'own'

export interface UserProfile {
  annualIncome: number
  maritalStatus: MaritalStatus
  numChildren: number
  housingChoice: HousingChoice
  monthlyRent: number
  homePurchasePrice: number
  bedrooms: number
  ownsCar: boolean
  annualMilesDriven: number
  commuteDestination: string
  monthlySpending: number
}

export const DEFAULT_PROFILE: UserProfile = {
  annualIncome: 85000,
  maritalStatus: 'single',
  numChildren: 0,
  housingChoice: 'rent',
  monthlyRent: 1800,
  homePurchasePrice: 350000,
  bedrooms: 1,
  ownsCar: true,
  annualMilesDriven: 8000,
  commuteDestination: 'Chicago Loop',
  monthlySpending: 1200,
}
