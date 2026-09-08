import {
  getHomePriceForBedrooms,
  getMunicipality,
  getNeighborhood,
  getNeighborhoodProfile,
  getRentForBedrooms,
  getTaxJurisdiction,
} from '../data'
import { splitAmongRoommates, type FinancialSummary, type HousingData, type UserProfile } from '../types'
import { calculateTaxes } from './taxes'

// Baselines each spending category's personalization factor is measured
// against (see spendingFactor below) — chosen to sum to the old flat
// $1,200/mo default this replaced.
const DEFAULT_GROCERIES_SPENDING = 400
const DEFAULT_RESTAURANTS_SPENDING = 250
const DEFAULT_OTHER_SPENDING = 550
const TRANSIT_MONTHLY_PASS = 105 // CTA full-fare monthly pass

// 30-year fixed mortgage assumptions for turning a home price into a carrying
// cost, used only when the user chooses "own". Deliberately simple.
const MORTGAGE_DOWN_PAYMENT_PCT = 0.2
const MORTGAGE_ANNUAL_RATE = 0.065
const MORTGAGE_TERM_YEARS = 30
// Approximates homeowners insurance as a percent of home value per year —
// in practice this also absorbs routine maintenance, since the two aren't
// modeled separately, but it's surfaced to the user simply as "home
// insurance" since that's the dominant, more universal cost of the two.
const HOME_INSURANCE_PCT_OF_VALUE = 0.01

// Utilities don't split like rent does: rent is a fixed cost no matter who's
// home, but utilities usage (showers, laundry, electricity) genuinely grows
// with headcount — just not linearly, since heating/internet/etc are shared.
// Each additional roommate is assumed to add this fraction of the baseline
// single-person estimate to the whole household's total usage; that scaled-up
// total is then split evenly across everyone (so it's still "divided by the
// number of roommates," just the numerator isn't the flat single-person
// figure). Purely an MVP approximation, not measured.
const UTILITIES_EXTRA_USAGE_PER_PERSON = 0.5

/** Standard amortization: turns a home price into a monthly P&I payment. */
function monthlyMortgagePaymentFromPrice(homePrice: number): number {
  const principal = homePrice * (1 - MORTGAGE_DOWN_PAYMENT_PCT)
  const monthlyRate = MORTGAGE_ANNUAL_RATE / 12
  const numPayments = MORTGAGE_TERM_YEARS * 12
  if (monthlyRate === 0) return principal / numPayments
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  )
}

/** Inverse of the above: backs out the home price a given payment would buy. */
function impliedHomePrice(monthlyPayment: number): number {
  const monthlyRate = MORTGAGE_ANNUAL_RATE / 12
  const numPayments = MORTGAGE_TERM_YEARS * 12
  const principal =
    monthlyRate === 0
      ? monthlyPayment * numPayments
      : (monthlyPayment * (Math.pow(1 + monthlyRate, numPayments) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments))
  return principal / (1 - MORTGAGE_DOWN_PAYMENT_PCT)
}

/**
 * The home value used for property tax (and the insurance/maintenance share
 * of the housing payment). Two modes, since not everyone buys the type of
 * home a flat estimate implies:
 *  - 'median': use this neighborhood's own estimated home price at the
 *    user's chosen bedroom size (see getHomePriceForBedrooms) — the value
 *    varies by area, same as rent does.
 *  - 'custom': the user knows their own target monthly mortgage payment, so
 *    back out an implied home value from that instead, applied uniformly.
 */
function ownHomeValue(
  profile: Pick<UserProfile, 'ownHomeSizing' | 'monthlyMortgagePayment' | 'bedrooms'>,
  housing: HousingData,
): number {
  return profile.ownHomeSizing === 'median'
    ? getHomePriceForBedrooms(housing, profile.bedrooms)
    : impliedHomePrice(profile.monthlyMortgagePayment)
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
 * How much more or less than a typical household this profile spends in one
 * category, as a multiplier on that neighborhood's own cost-of-living
 * estimate for the same category — e.g. someone who enters $800/mo groceries
 * against a $400 baseline gets a 2x multiplier applied to whatever this
 * specific neighborhood's grocery estimate is, preserving area-to-area price
 * differences instead of replacing them with a flat number. Clamped to
 * [0.5x, 2x] so an extreme entry doesn't dominate the total.
 */
function spendingFactor(userMonthlySpending: number, baseline: number): number {
  return Math.min(2, Math.max(0.5, userMonthlySpending / baseline))
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

  const homePriceForPropertyTax = profile.housingChoice === 'own' ? ownHomeValue(profile, housing) : 0

  const taxes = calculateTaxes({
    profile,
    jurisdiction,
    isChicago: municipality.isChicago,
    effectivePropertyTaxRate: housing.effectivePropertyTaxRate,
    homePriceForPropertyTax,
  })

  const monthlyRentShare =
    profile.housingChoice === 'rent'
      ? splitAmongRoommates(getRentForBedrooms(housing, profile.bedrooms), profile)
      : 0
  // Utilities are excluded from everydayExpensesAnnual below to avoid double
  // counting — this is the one figure used for them.
  const monthlyUtilitiesShare = fairUtilitiesShare(costOfLiving.utilitiesMonthly, profile)

  const monthlyMortgagePaymentAmount =
    profile.housingChoice === 'own'
      ? profile.ownHomeSizing === 'median'
        ? monthlyMortgagePaymentFromPrice(homePriceForPropertyTax)
        : profile.monthlyMortgagePayment
      : 0

  const monthlyHomeInsurance =
    profile.housingChoice === 'own' ? (homePriceForPropertyTax * HOME_INSURANCE_PCT_OF_VALUE) / 12 : 0

  const monthlyHousingPayment = monthlyMortgagePaymentAmount + monthlyHomeInsurance

  const housingAnnualCost =
    profile.housingChoice === 'rent'
      ? (monthlyRentShare + monthlyUtilitiesShare) * 12
      : (monthlyHousingPayment + monthlyUtilitiesShare) * 12

  const transportationAnnualCost = profile.ownsCar
    ? (profile.monthlyCarNote +
        profile.monthlyCarInsurance +
        profile.monthlyGasSpending +
        transportation.parkingMonthlyEstimate) *
      12
    : TRANSIT_MONTHLY_PASS * 12

  const familyFactor = 1 + profile.numChildren * 0.12
  const groceriesFactor = spendingFactor(profile.monthlyGroceriesSpending, DEFAULT_GROCERIES_SPENDING)
  const restaurantsFactor = spendingFactor(profile.monthlyRestaurantsSpending, DEFAULT_RESTAURANTS_SPENDING)
  const otherFactor = spendingFactor(profile.monthlyOtherSpending, DEFAULT_OTHER_SPENDING)
  // Each category's neighborhood estimate scaled by its personalization
  // factor and family size — exposed per-category (rather than only as one
  // combined everydayExpensesAnnual figure) so a UI breakdown can show
  // exactly what you'd actually pay for each one, and have those four
  // numbers sum to the same total shown elsewhere. Multiplication
  // distributes over the sum, so summing these four already-scaled monthly
  // figures gives the identical annual total as computing it the other way
  // (scale-then-sum-then-multiply-by-familyFactor).
  // Healthcare has no user-entered spending level, so it isn't personalized —
  // it always uses the neighborhood's own estimate as-is (family-scaled only).
  const groceriesMonthlyActual = costOfLiving.groceriesMonthly * groceriesFactor * familyFactor
  const restaurantsMonthlyActual = costOfLiving.restaurantsMonthly * restaurantsFactor * familyFactor
  const healthcareMonthlyActual = costOfLiving.healthcareMonthly * familyFactor
  const otherMonthlyActual = costOfLiving.otherMonthly * otherFactor * familyFactor
  const everydayExpensesAnnual =
    (groceriesMonthlyActual + restaurantsMonthlyActual + healthcareMonthlyActual + otherMonthlyActual) * 12

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
    monthlyMortgagePaymentAmount,
    monthlyHomeInsurance,
    monthlyHousingPayment,
    estimatedHomeValue: homePriceForPropertyTax,
    housingAnnualCost,
    transportationAnnualCost,
    groceriesMonthlyActual,
    restaurantsMonthlyActual,
    healthcareMonthlyActual,
    otherMonthlyActual,
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
