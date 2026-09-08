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

// IRS marginal tax brackets, standard deduction, and FICA wage base below are
// pinned to 2024 published figures as an illustrative MVP approximation. The
// IRS adjusts these for inflation every year (and Congress can change bracket
// structure via legislation), so these thresholds will drift from the actual
// current-year numbers over time — good enough for comparing locations
// relative to each other, not a substitute for current IRS Rev. Proc.
// figures. Replace with the current tax year's published brackets/deduction/
// wage base for production use.
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

// Illinois standard passenger-vehicle registration fee and Chicago's
// municipal vehicle license ("wheel tax" / city sticker) fee. Both vary by
// vehicle weight/type and are subject to legislative change; the wheel tax
// in particular applies only to vehicles registered inside Chicago city
// limits (isChicago below), never to suburban jurisdictions.
const IL_VEHICLE_REGISTRATION_ANNUAL = 151
const CHICAGO_WHEEL_TAX_ANNUAL = 95 // typical passenger vehicle city sticker, standard weight class

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

/**
 * Splits what's commonly lumped together as "federal taxes" into its actual
 * components: bracket-based federal income tax (after the child tax
 * credit), and the two FICA payroll taxes — Social Security and Medicare —
 * which are legally distinct taxes with their own rates, not part of income
 * tax, and worth showing the user separately.
 */
function calculateFederalTax(
  profile: UserProfile,
): { federalIncomeTax: number; socialSecurityTax: number; medicareTax: number } {
  const isMarried = profile.maritalStatus === 'married'
  const standardDeduction = isMarried ? STANDARD_DEDUCTION_MARRIED : STANDARD_DEDUCTION_SINGLE
  const taxableIncome = Math.max(0, profile.annualIncome - standardDeduction)
  const brackets = isMarried ? FEDERAL_BRACKETS_MARRIED : FEDERAL_BRACKETS_SINGLE
  const incomeTax = applyBrackets(taxableIncome, brackets)

  const childTaxCredit = profile.numChildren * CHILD_TAX_CREDIT_PER_CHILD
  const federalIncomeTax = Math.max(0, incomeTax - childTaxCredit)

  const socialSecurityTax =
    Math.min(profile.annualIncome, FICA_SOCIAL_SECURITY_WAGE_CAP) * FICA_SOCIAL_SECURITY_RATE
  const medicareTax = profile.annualIncome * FICA_MEDICARE_RATE

  return { federalIncomeTax, socialSecurityTax, medicareTax }
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
 * Sales tax on the user's own entered "other" (general, non-grocery,
 * non-restaurant) monthly spending, at the jurisdiction's full combined rate.
 *
 * Illinois eliminated its statewide 1% grocery tax effective January 1, 2026;
 * municipalities were given the option to enact their own local 1% grocery
 * tax to replace the lost revenue (via ordinance ahead of that date), and
 * many did, but not all. This MVP does not track that per-municipality
 * decision, so it keeps applying an approximate 1% effective grocery tax
 * rate as a placeholder — treat it as "verify whether this specific
 * municipality still taxes groceries locally" rather than a settled fact.
 */
const GROCERY_TAX_RATE_APPROXIMATION = 0.01

function estimateSalesTax(
  otherSpendingMonthly: number,
  groceriesSpendingMonthly: number,
  jurisdiction: TaxJurisdiction,
): number {
  const groceryTax = groceriesSpendingMonthly * 12 * GROCERY_TAX_RATE_APPROXIMATION
  const generalTax = otherSpendingMonthly * 12 * jurisdiction.combinedSalesTaxRate
  return groceryTax + generalTax
}

function estimateRestaurantTax(restaurantsSpendingMonthly: number, jurisdiction: TaxJurisdiction): number {
  const rate = jurisdiction.combinedSalesTaxRate + (jurisdiction.restaurantTaxRate ?? 0)
  return restaurantsSpendingMonthly * 12 * rate
}

export interface CalculateTaxesInput {
  profile: UserProfile
  jurisdiction: TaxJurisdiction
  isChicago: boolean
  effectivePropertyTaxRate: number
  /** Home value backing the property-tax estimate for owners (0 for renters) — derived from the user's entered monthly mortgage payment, not entered directly. See impliedHomePrice() in calculations/financial.ts. */
  homePriceForPropertyTax: number
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
  const { profile, jurisdiction, isChicago, effectivePropertyTaxRate, homePriceForPropertyTax } = input

  const { federalIncomeTax, socialSecurityTax, medicareTax } = calculateFederalTax(profile)
  const stateIncomeTax = calculateStateTax(profile)
  const localIncomeTax = 0 // Illinois municipalities, including Chicago, do not levy a local income tax.

  const salesTaxEstimate = estimateSalesTax(
    profile.monthlyOtherSpending,
    profile.monthlyGroceriesSpending,
    jurisdiction,
  )
  const restaurantTaxEstimate = estimateRestaurantTax(profile.monthlyRestaurantsSpending, jurisdiction)

  const propertyTaxEstimate =
    profile.housingChoice === 'own' ? homePriceForPropertyTax * effectivePropertyTaxRate : 0

  const vehicleTaxEstimate = profile.ownsCar
    ? IL_VEHICLE_REGISTRATION_ANNUAL + (isChicago ? CHICAGO_WHEEL_TAX_ANNUAL : 0)
    : 0

  const totalTax =
    federalIncomeTax +
    socialSecurityTax +
    medicareTax +
    stateIncomeTax +
    localIncomeTax +
    salesTaxEstimate +
    restaurantTaxEstimate +
    propertyTaxEstimate +
    vehicleTaxEstimate

  return {
    federalIncomeTax,
    socialSecurityTax,
    medicareTax,
    stateIncomeTax,
    localIncomeTax,
    salesTaxEstimate,
    restaurantTaxEstimate,
    propertyTaxEstimate,
    vehicleTaxEstimate,
    totalTax,
    assumptions: [
      'Federal income tax uses 2024 IRS brackets and standard deduction. Social Security (6.2%, capped at the wage base) and Medicare (1.45%) are itemized separately as FICA payroll taxes, not income tax.',
      'Illinois state tax uses the 4.95% flat rate with standard personal exemptions.',
      'Illinois and Chicago do not levy a local personal income tax.',
      'Sales tax applies the jurisdiction\'s combined state+county+RTA+home-rule rate to your entered "other spending," and the restaurant tax rate to your entered restaurant spending. Illinois eliminated its 1% statewide grocery tax on 1/1/2026; this estimate still applies an approximate 1% effective rate to your entered grocery spending as a placeholder for a possible local municipal grocery tax and should be verified against the specific municipality\'s current ordinance.',
      'Property tax applies only if you choose "own" and is estimated as an implied home value × the neighborhood\'s effective property tax rate — actual bills vary by assessment, exemptions, and levies.',
      'The implied home value comes from your entered monthly mortgage payment (assuming a 20% down payment, 6.5% rate, 30-year term) and is applied uniformly across every neighborhood so property-tax rates compare on an apples-to-apples basis. It does not adjust to each area\'s typical home price, so treat "cost to own" as the cost of carrying your stated payment at each area\'s rate, not the cost of buying a typical home there — compare the implied value against that neighborhood\'s median home price for a realism check.',
      'Vehicle taxes include IL registration and, only within Chicago city limits, the city vehicle sticker ("wheel tax") fee; they exclude fuel tax and sales tax paid at purchase. Both fees are flat per-vehicle amounts subject to legislative change — verify current amounts before relying on them.',
      'This is a simplified MVP estimate for comparing locations, not a tax filing or professional tax calculation.',
    ],
  }
}
