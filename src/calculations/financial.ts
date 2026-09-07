import { getMunicipality, getNeighborhood, getNeighborhoodProfile, getTaxJurisdiction } from '../data'
import type { FinancialSummary, UserProfile } from '../types'
import { calculateTaxes } from './taxes'

const DEFAULT_MONTHLY_SPENDING = 1200
const MILEAGE_COST_PER_MILE = 0.65 // AAA-style all-in cost (gas, maintenance, insurance, depreciation)
const TRANSIT_MONTHLY_PASS = 105 // CTA full-fare monthly pass

// 30-year fixed mortgage assumptions for turning a home price into a carrying
// cost, used only when the user chooses "own". Deliberately simple.
const MORTGAGE_DOWN_PAYMENT_PCT = 0.2
const MORTGAGE_ANNUAL_RATE = 0.065
const MORTGAGE_TERM_YEARS = 30
const HOME_INSURANCE_MAINTENANCE_PCT_OF_VALUE = 0.01

function monthlyMortgagePayment(homePrice: number): number {
  const principal = homePrice * (1 - MORTGAGE_DOWN_PAYMENT_PCT)
  const monthlyRate = MORTGAGE_ANNUAL_RATE / 12
  const numPayments = MORTGAGE_TERM_YEARS * 12
  if (monthlyRate === 0) return principal / numPayments
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  )
}

/**
 * calculateFinancialSummary(profile, neighborhoodId)
 *
 * The single source of truth for "how much money will I have left" math.
 * Combines taxes, housing, transportation, and everyday cost-of-living into
 * one estimated annual disposable income figure per neighborhood.
 */
export function calculateFinancialSummary(
  profile: UserProfile,
  neighborhoodId: string,
): FinancialSummary | undefined {
  const neighborhood = getNeighborhood(neighborhoodId)
  const nProfile = getNeighborhoodProfile(neighborhoodId)
  if (!neighborhood || !nProfile) return undefined

  const jurisdiction = getTaxJurisdiction(neighborhood.taxJurisdictionId)
  const municipality = getMunicipality(neighborhood.municipalityId)
  if (!jurisdiction || !municipality) return undefined

  const { housing, transportation, costOfLiving } = nProfile

  const taxes = calculateTaxes({
    profile,
    jurisdiction,
    isChicago: municipality.isChicago,
    effectivePropertyTaxRate: housing.effectivePropertyTaxRate,
    groceriesMonthly: costOfLiving.groceriesMonthly,
    restaurantsMonthly: costOfLiving.restaurantsMonthly,
  })

  const housingAnnualCost =
    profile.housingChoice === 'rent'
      ? profile.monthlyRent * 12
      : (monthlyMortgagePayment(profile.homePurchasePrice) +
          (profile.homePurchasePrice * HOME_INSURANCE_MAINTENANCE_PCT_OF_VALUE) / 12) *
        12

  const transportationAnnualCost = profile.ownsCar
    ? profile.annualMilesDriven * MILEAGE_COST_PER_MILE + transportation.parkingMonthlyEstimate * 12
    : TRANSIT_MONTHLY_PASS * 12

  const personalizationFactor = Math.min(
    2,
    Math.max(0.5, profile.monthlySpending / DEFAULT_MONTHLY_SPENDING),
  )
  const familyFactor = 1 + profile.numChildren * 0.12
  const everydayExpensesAnnual =
    (costOfLiving.groceriesMonthly +
      costOfLiving.utilitiesMonthly +
      costOfLiving.restaurantsMonthly +
      costOfLiving.healthcareMonthly +
      costOfLiving.otherMonthly) *
    12 *
    personalizationFactor *
    familyFactor

  // Property tax is already embedded in a renter's rent by the landlord, so
  // for renters we exclude the separate `propertyTaxEstimate` line from the
  // total-cost rollup to avoid double counting (it stays visible in the
  // detailed tax breakdown as $0 for renters — see calculateTaxes).
  const totalAnnualCost =
    taxes.totalTax + housingAnnualCost + transportationAnnualCost + everydayExpensesAnnual

  const estimatedDisposableIncome = profile.annualIncome - totalAnnualCost

  return {
    neighborhoodId,
    grossIncome: profile.annualIncome,
    taxes,
    housingAnnualCost,
    transportationAnnualCost,
    everydayExpensesAnnual,
    totalAnnualCost,
    estimatedDisposableIncome,
  }
}

export function calculateFinancialSummaries(
  profile: UserProfile,
  neighborhoodIds: string[],
): FinancialSummary[] {
  return neighborhoodIds
    .map((id) => calculateFinancialSummary(profile, id))
    .filter((s): s is FinancialSummary => Boolean(s))
}
