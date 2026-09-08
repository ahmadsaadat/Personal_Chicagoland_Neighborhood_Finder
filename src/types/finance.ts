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
  /** Your monthly rent for the neighborhood's median rent at your chosen bedroom size, after any roommate split. 0 if owning. */
  monthlyRentShare: number
  /** Your monthly utilities share, using the neighborhood's cost-of-living estimate and (if renting with roommates) a fair-usage split. */
  monthlyUtilitiesShare: number
  /** Monthly mortgage principal & interest plus insurance/maintenance, for owners. 0 if renting. */
  monthlyHousingPayment: number
  /** Home value implied by the user's entered monthly mortgage payment, used as the property-tax basis. 0 if renting. */
  impliedHomeValue: number
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
