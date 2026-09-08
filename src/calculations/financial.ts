import { getMunicipality, getNeighborhood, getNeighborhoodProfile, getRentForBedrooms, getTaxJurisdiction } from '../data'
import { splitAmongRoommates, type FinancialSummary, type UserProfile } from '../types'
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

// Utilities don't split like rent does: rent is a fixed cost no matter who's
// home, but utilities usage (showers, laundry, electricity) genuinely grows
// with headcount — just not linearly, since heating/internet/etc are shared.
// Each additional roommate is assumed to add this fraction of the baseline
// single-person estimate to the whole household's total usage; that scaled-up
// total is then split evenly across everyone (so it's still "divided by the
// number of roommates," just the numerator isn't the flat single-person
// figure). Purely an MVP approximation, not measured.
const UTILITIES_EXTRA_USAGE_PER_PERSON = 0.5

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
 * Your fair share of the household's utilities: scales the neighborhood's
 * baseline (single-person) estimate up by the extra usage each roommate
 * adds, then divides that household total evenly across everyone.
 */
function fairUtilitiesShare(
  baseMonthlyUtilities: number,
  profile: Pick<UserProfile, 'hasRoommates' | 'numPeopleSplittingRent'>,
): number {
  if (!profile.hasRoommates) return baseMonthlyUtilities
  const people = Math.max(1, profile.numPeopleSplittingRent)
  const householdTotal = baseMonthlyUtilities * (1 + UTILITIES_EXTRA_USAGE_PER_PERSON * (people - 1))
  return householdTotal / people
}

/**
 * calculateFinancialSummary(profile, neighborhoodId)
 *
 * The single source of truth for "how much money will I have left" math.
 * Combines taxes, housing, transportation, and everyday cost-of-living into
 * one estimated annual disposable income figure per neighborhood.
 *
 * Rent and utilities are always pulled from the NEIGHBORHOOD's own data
 * (median rent at the user's chosen bedroom size; cost-of-living utilities
 * estimate) rather than a flat number the user types in once — the whole
 * point of the tool is comparing how those figures differ by neighborhood,
 * so a single global rent/utilities input would silently defeat that.
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

  const monthlyRentShare =
    profile.housingChoice === 'rent'
      ? splitAmongRoommates(getRentForBedrooms(housing, profile.bedrooms), profile)
      : 0
  // Utilities are excluded from everydayExpensesAnnual below to avoid double
  // counting — this is the one figure used for them.
  const monthlyUtilitiesShare = fairUtilitiesShare(costOfLiving.utilitiesMonthly, profile)

  const monthlyHousingPayment =
    profile.housingChoice === 'own'
      ? monthlyMortgagePayment(profile.homePurchasePrice) +
        (profile.homePurchasePrice * HOME_INSURANCE_MAINTENANCE_PCT_OF_VALUE) / 12
      : 0

  const housingAnnualCost =
    profile.housingChoice === 'rent'
      ? (monthlyRentShare + monthlyUtilitiesShare) * 12
      : (monthlyHousingPayment + monthlyUtilitiesShare) * 12

  const transportationAnnualCost = profile.ownsCar
    ? profile.annualMilesDriven * MILEAGE_COST_PER_MILE + transportation.parkingMonthlyEstimate * 12
    : TRANSIT_MONTHLY_PASS * 12

  const personalizationFactor = Math.min(
    2,
    Math.max(0.5, profile.monthlySpending / DEFAULT_MONTHLY_SPENDING),
  )
  const familyFactor = 1 + profile.numChildren * 0.12
  // Utilities are intentionally excluded here — see monthlyUtilitiesShare
  // above, folded into housingAnnualCost instead, to avoid double counting.
  const everydayExpensesAnnual =
    (costOfLiving.groceriesMonthly +
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
    monthlyRentShare,
    monthlyUtilitiesShare,
    monthlyHousingPayment,
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
