export interface TaxBreakdown {
  federalIncomeTax: number
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
  housingAnnualCost: number
  transportationAnnualCost: number
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
