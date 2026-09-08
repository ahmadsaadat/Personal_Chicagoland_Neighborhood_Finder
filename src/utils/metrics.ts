import {
  Banknote,
  Building2,
  Car,
  Footprints,
  Gauge,
  Home,
  Landmark,
  Receipt,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { FinancialSummary, MapMetric, Neighborhood, NeighborhoodProfile } from '../types'
import { formatCurrency, formatPercent } from './format'

export interface NeighborhoodEntry {
  neighborhood: Neighborhood
  profile: NeighborhoodProfile
  summary: FinancialSummary
}

export interface MetricConfig {
  key: MapMetric
  label: string
  /** Icon shown on the map's layer-style metric picker. */
  icon: LucideIcon
  /** Short form for compact UI like the map legend caption. */
  goodDirection: 'high' | 'low'
  /** One-line explanation of what "better" means for this metric, shown near the legend. */
  helpText: string
  getValue: (entry: NeighborhoodEntry) => number
  format: (value: number) => string
}

/**
 * `affordabilityIndex` isn't produced by src/calculations/*, so we derive it
 * here as a UI-only convenience metric: the share of gross income the
 * household keeps after taxes, housing, transportation, and everyday costs
 * in a given neighborhood, expressed 0-100. This is additive/illustrative
 * and does not change any shared calculation module.
 */
export function affordabilityIndex(entry: NeighborhoodEntry): number {
  if (entry.summary.grossIncome <= 0) return 0
  return (entry.summary.estimatedDisposableIncome / entry.summary.grossIncome) * 100
}

export const MAP_METRICS: MetricConfig[] = [
  {
    key: 'disposableIncome',
    label: 'Disposable Income',
    icon: Wallet,
    goodDirection: 'high',
    helpText: 'Estimated cash left over per month after taxes, housing, transportation, and everyday costs. Darker = more left over.',
    getValue: (e) => e.summary.estimatedDisposableIncome / 12,
    format: (v) => `${formatCurrency(v)}/mo`,
  },
  {
    key: 'medianRent2BR',
    label: 'Median 2BR Rent',
    icon: Home,
    goodDirection: 'low',
    helpText: 'Typical monthly rent for a 2-bedroom unit. Darker = more expensive.',
    getValue: (e) => e.profile.housing.medianRent2BR,
    format: (v) => `${formatCurrency(v)}/mo`,
  },
  {
    key: 'medianHomePrice',
    label: 'Median Home Price',
    icon: Building2,
    goodDirection: 'low',
    helpText: 'Typical purchase price for a home. Darker = more expensive.',
    getValue: (e) => e.profile.housing.medianHomePrice,
    format: (v) => formatCurrency(v),
  },
  {
    key: 'propertyTaxRate',
    label: 'Property Tax Rate',
    icon: Landmark,
    goodDirection: 'low',
    helpText: 'Effective annual property tax as a share of home value. Darker = higher rate.',
    getValue: (e) => e.profile.housing.effectivePropertyTaxRate,
    format: (v) => formatPercent(v, 2),
  },
  {
    key: 'totalAnnualTax',
    label: 'Total Annual Tax',
    icon: Receipt,
    goodDirection: 'low',
    helpText: 'Estimated federal, state, sales, property, and vehicle taxes combined for your profile. Darker = higher tax burden.',
    getValue: (e) => e.summary.taxes.totalTax,
    format: (v) => `${formatCurrency(v)}/yr`,
  },
  {
    key: 'housingAnnualCost',
    label: 'Housing Cost',
    icon: Banknote,
    goodDirection: 'low',
    helpText: 'Estimated annual rent or homeownership carrying cost for your profile. Darker = more expensive.',
    getValue: (e) => e.summary.housingAnnualCost,
    format: (v) => `${formatCurrency(v)}/yr`,
  },
  {
    key: 'transportationAnnualCost',
    label: 'Transportation Cost',
    icon: Car,
    goodDirection: 'low',
    helpText: 'Estimated annual commuting cost (car or transit) for your profile. Darker = more expensive.',
    getValue: (e) => e.summary.transportationAnnualCost,
    format: (v) => `${formatCurrency(v)}/yr`,
  },
  {
    key: 'walkability',
    label: 'Walkability',
    icon: Footprints,
    goodDirection: 'high',
    helpText: 'Walk Score-style index, 0-100. Darker = more walkable.',
    getValue: (e) => e.profile.lifestyle.walkability,
    format: (v) => `${Math.round(v)}/100`,
  },
  {
    key: 'affordabilityIndex',
    label: 'Affordability Index',
    icon: Gauge,
    goodDirection: 'high',
    helpText: 'Share of your income left over after core costs, 0-100 (UI-derived from disposable income ÷ gross income). Darker = more affordable for you.',
    getValue: affordabilityIndex,
    format: (v) => `${Math.round(v)}/100`,
  },
]

export function getMetricConfig(key: MapMetric): MetricConfig {
  const found = MAP_METRICS.find((m) => m.key === key)
  if (!found) throw new Error(`Unknown map metric: ${key}`)
  return found
}
