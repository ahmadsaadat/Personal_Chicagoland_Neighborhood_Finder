import type { TaxBreakdown, TaxJurisdiction, UserProfile } from '../types'

/**
 * Modular, approximate tax model for the MVP.
 *
 * This is intentionally NOT a tax-filing engine. It exists to let consumers
 * compare the relative tax burden of different Chicagoland locations, using
 * well-known published rates and a simplified progressive federal bracket
 * calculation. Every number produced here should be presented to the user as
 * an estimate.
 */

interface Bracket {
  upTo: number
  rate: number
}

// 2024 IRS marginal tax brackets (illustrative MVP approximation).
const FEDERAL_BRACKETS_SINGLE: Bracket[] = [
  { upTo: 11_600, rate: 0.1 },
  { upTo: 47_150, rate: 0.12 },
  { upTo: 100_525, rate: 0.22 },
  { upTo: 191_950, rate: 0.24 },
  { upTo: 243_725, rate: 0.32 },
  { upTo: 609_350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
]

const FEDERAL_BRACKETS_MARRIED: Bracket[] = [
  { upTo: 23_200, rate: 0.1 },
  { upTo: 94_300, rate: 0.12 },
  { upTo: 201_050, rate: 0.22 },
  { upTo: 383_900, rate: 0.24 },
  { upTo: 487_450, rate: 0.32 },
  { upTo: 731_200, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
]

const STANDARD_DEDUCTION_SINGLE = 14_600
const STANDARD_DEDUCTION_MARRIED = 29_200
const CHILD_TAX_CREDIT_PER_CHILD = 2_000

const IL_FLAT_RATE = 0.0495
const IL_PERSONAL_EXEMPTION_SINGLE = 2_775
const IL_PERSONAL_EXEMPTION_MARRIED = 5_550
const IL_EXEMPTION_PER_DEPENDENT = 2_775

const FICA_SOCIAL_SECURITY_RATE = 0.062
const FICA_SOCIAL_SECURITY_WAGE_CAP = 168_600 // 2024 cap
const FICA_MEDICARE_RATE = 0.0145

const IL_VEHICLE_REGISTRATION_ANNUAL = 151
const CHICAGO_WHEEL_TAX_ANNUAL = 95 // typical passenger vehicle city sticker

function applyBrackets(taxableIncome: number, brackets: Bracket[]): number {
  let tax = 0
  let lastCap = 0
  for (const bracket of brackets) {
    if (taxableIncome <= lastCap) break
    const taxableInBracket = Math.min(taxableIncome, bracket.upTo) - lastCap
    tax += taxableInBracket * bracket.rate
    lastCap = bracket.upTo
  }
  return Math.max(0, tax)
}

function calculateFederalTax(profile: UserProfile): number {
  const isMarried = profile.maritalStatus === 'married'
  const standardDeduction = isMarried ? STANDARD_DEDUCTION_MARRIED : STANDARD_DEDUCTION_SINGLE
  const taxableIncome = Math.max(0, profile.annualIncome - standardDeduction)
  const brackets = isMarried ? FEDERAL_BRACKETS_MARRIED : FEDERAL_BRACKETS_SINGLE
  const incomeTax = applyBrackets(taxableIncome, brackets)

  const childTaxCredit = profile.numChildren * CHILD_TAX_CREDIT_PER_CHILD
  const incomeTaxAfterCredits = Math.max(0, incomeTax - childTaxCredit)

  const socialSecurity =
    Math.min(profile.annualIncome, FICA_SOCIAL_SECURITY_WAGE_CAP) * FICA_SOCIAL_SECURITY_RATE
  const medicare = profile.annualIncome * FICA_MEDICARE_RATE

  return incomeTaxAfterCredits + socialSecurity + medicare
}

function calculateStateTax(profile: UserProfile): number {
  const isMarried = profile.maritalStatus === 'married'
  const exemption =
    (isMarried ? IL_PERSONAL_EXEMPTION_MARRIED : IL_PERSONAL_EXEMPTION_SINGLE) +
    profile.numChildren * IL_EXEMPTION_PER_DEPENDENT
  const taxableIncome = Math.max(0, profile.annualIncome - exemption)
  return taxableIncome * IL_FLAT_RATE
}

/**
 * Rough split of a household's non-housing monthly spending into "general
 * taxable" (subject to the full combined sales tax rate) vs. groceries
 * (Illinois taxes most groceries at a reduced local rate, effectively ~1%).
 */
function estimateSalesTax(
  monthlySpending: number,
  groceriesMonthly: number,
  jurisdiction: TaxJurisdiction,
): number {
  const groceryTax = groceriesMonthly * 12 * 0.01
  const generalTaxableAnnual = Math.max(0, monthlySpending - groceriesMonthly) * 12
  const generalTax = generalTaxableAnnual * jurisdiction.combinedSalesTaxRate
  return groceryTax + generalTax
}

function estimateRestaurantTax(restaurantsMonthly: number, jurisdiction: TaxJurisdiction): number {
  const rate = jurisdiction.combinedSalesTaxRate + (jurisdiction.restaurantTaxRate ?? 0)
  return restaurantsMonthly * 12 * rate
}

export interface CalculateTaxesInput {
  profile: UserProfile
  jurisdiction: TaxJurisdiction
  isChicago: boolean
  effectivePropertyTaxRate: number
  groceriesMonthly: number
  restaurantsMonthly: number
}

/**
 * calculateTaxes(profile, location)
 *
 * `location` is expressed here as the resolved tax jurisdiction plus a
 * couple of neighborhood-specific facts (whether it's Chicago proper, the
 * effective property tax rate, and local cost-of-living figures needed to
 * apportion sales tax). Callers typically build this via
 * `buildTaxInputForNeighborhood` in `src/calculations/financial.ts`.
 */
export function calculateTaxes(input: CalculateTaxesInput): TaxBreakdown {
  const { profile, jurisdiction, isChicago, effectivePropertyTaxRate, groceriesMonthly, restaurantsMonthly } =
    input

  const federalIncomeTax = calculateFederalTax(profile)
  const stateIncomeTax = calculateStateTax(profile)
  const localIncomeTax = 0 // Illinois municipalities, including Chicago, do not levy a local income tax.

  const salesTaxEstimate = estimateSalesTax(profile.monthlySpending, groceriesMonthly, jurisdiction)
  const restaurantTaxEstimate = estimateRestaurantTax(restaurantsMonthly, jurisdiction)

  const propertyTaxEstimate =
    profile.housingChoice === 'own' ? profile.homePurchasePrice * effectivePropertyTaxRate : 0

  const vehicleTaxEstimate = profile.ownsCar
    ? IL_VEHICLE_REGISTRATION_ANNUAL + (isChicago ? CHICAGO_WHEEL_TAX_ANNUAL : 0)
    : 0

  const totalTax =
    federalIncomeTax +
    stateIncomeTax +
    localIncomeTax +
    salesTaxEstimate +
    restaurantTaxEstimate +
    propertyTaxEstimate +
    vehicleTaxEstimate

  return {
    federalIncomeTax,
    stateIncomeTax,
    localIncomeTax,
    salesTaxEstimate,
    restaurantTaxEstimate,
    propertyTaxEstimate,
    vehicleTaxEstimate,
    totalTax,
    assumptions: [
      'Federal tax uses 2024 IRS brackets and standard deduction; includes Social Security and Medicare (FICA) payroll taxes.',
      'Illinois state tax uses the 4.95% flat rate with standard personal exemptions.',
      'Illinois and Chicago do not levy a local personal income tax.',
      'Sales tax applies the jurisdiction\'s combined state+county+RTA+home-rule rate to non-grocery spending; groceries are taxed at Illinois\' reduced ~1% local rate.',
      'Property tax applies only if you choose "own" and is estimated as home price × the neighborhood\'s effective property tax rate — actual bills vary by assessment, exemptions, and levies.',
      'Vehicle taxes include IL registration and, in Chicago, the city vehicle sticker fee; they exclude fuel and sales tax paid at purchase.',
      'This is a simplified MVP estimate for comparing locations, not a tax filing or professional tax calculation.',
    ],
  }
}
