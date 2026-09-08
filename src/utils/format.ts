/** UI-only formatting helpers. No data or tax logic lives here. */

export function formatCurrency(value: number, opts: { cents?: boolean } = {}): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(value)
}

/** Compact currency for tight spaces, e.g. $2.4k, $1.1M */
export function formatCurrencyCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

export function formatPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`
}

export function formatMinutes(value: number): string {
  return `${Math.round(value)} min`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural
}

/** "Studio", "1BR", "2BR", "3BR", ... — matches the bedroom toggles in HousingField. */
export function formatBedrooms(bedrooms: number): string {
  return bedrooms <= 0 ? 'Studio' : `${bedrooms}BR`
}
