export interface TaxBreakdown {
  /** Federal income tax only (brackets minus child tax credit) — excludes FICA, which is broken out separately below. */
  federalIncomeTax: number
  /** Social Security payroll tax (6.2%, capped at the wage base). */
  socialSecurityTax: number
  /** Medicare payroll tax (1.45%, uncapped). */
  medicareTax: number
  stateIncomeTax: number
  localIncomeTax: number
  salesTaxEstimate: number
  restaurantTaxEstimate: number
  propertyTaxEstimate: number
  vehicleTaxEstimate: number
  totalTax: number
  assumptions: string[]
}

export interface FinancialSummary {
  neighborhoodId: string
  grossIncome: number
  taxes: TaxBreakdown
  /** Your monthly rent for the neighborhood's median rent at your chosen bedroom size, after any roommate split. 0 if owning. */
  monthlyRentShare: number
  /** Your monthly utilities share, using the neighborhood's cost-of-living estimate and (if renting with roommates) a fair-usage split. */
  monthlyUtilitiesShare: number
  /** Monthly mortgage principal & interest only, for owners. 0 if renting. */
  monthlyMortgagePaymentAmount: number
  /** Monthly home insurance estimate, for owners. 0 if renting. */
  monthlyHomeInsurance: number
  /** Monthly mortgage principal & interest plus home insurance, for owners. 0 if renting. */
  monthlyHousingPayment: number
  /** Home value used as the property-tax basis for owners — either this neighborhood's own estimate at the chosen bedroom size, or implied from a custom monthly mortgage payment, depending on ownHomeSizing. 0 if renting. */
  estimatedHomeValue: number
  housingAnnualCost: number
  transportationAnnualCost: number
  /** Your actual monthly grocery cost — this neighborhood's estimate scaled by your entered spending level and family size. Sums with the other three *MonthlyActual fields (×12) to everydayExpensesAnnual. */
  groceriesMonthlyActual: number
  /** Your actual monthly restaurant cost, same scaling treatment as groceries. */
  restaurantsMonthlyActual: number
  /** Your actual monthly healthcare cost — not personalized by spending level (no such input exists), only by family size. */
  healthcareMonthlyActual: number
  /** Your actual monthly "other" cost, same scaling treatment as groceries. */
  otherMonthlyActual: number
  everydayExpensesAnnual: number
  totalAnnualCost: number
  estimatedDisposableIncome: number
}

/** Map metrics the user can choose to color the choropleth by. */
export type MapMetric =
  | 'disposableIncome'
  | 'medianRent2BR'
  | 'medianHomePrice'
  | 'propertyTaxRate'
  | 'totalAnnualTax'
  | 'housingAnnualCost'
  | 'transportationAnnualCost'
  | 'walkability'
  | 'affordabilityIndex'
