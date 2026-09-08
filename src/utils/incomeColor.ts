/**
 * Color for a disposable-income figure, scaled by how large it is relative
 * to the profile's annual income rather than a flat red/black split — a
 * -$500 result means something very different on a $200K income than on a
 * $40K one, and a barely-positive result shouldn't look as reassuring as a
 * deeply positive one. Interpolates continuously from red (deep in the red)
 * through neutral gray (breaking even) to green (comfortably ahead).
 */
const NEGATIVE_RGB = [185, 28, 28] as const // red-700
const NEUTRAL_RGB = [100, 116, 139] as const // slate-500
const POSITIVE_RGB = [21, 128, 61] as const // green-700

// Ratios beyond these are fully saturated — chosen so losing ~20% of income
// to costs reads as clearly critical, and keeping ~40%+ reads as clearly
// strong, without needing extreme outliers to hit full color.
const NEGATIVE_RATIO_FLOOR = -0.2
const POSITIVE_RATIO_CEILING = 0.4

function mix(a: readonly [number, number, number], b: readonly [number, number, number], t: number): string {
  const clamped = Math.max(0, Math.min(1, t))
  const r = Math.round(a[0] + (b[0] - a[0]) * clamped)
  const g = Math.round(a[1] + (b[1] - a[1]) * clamped)
  const bl = Math.round(a[2] + (b[2] - a[2]) * clamped)
  return `rgb(${r}, ${g}, ${bl})`
}

export function disposableIncomeColor(disposableIncome: number, annualIncome: number): string {
  if (!Number.isFinite(annualIncome) || annualIncome <= 0) {
    return `rgb(${NEUTRAL_RGB.join(', ')})`
  }
  const ratio = disposableIncome / annualIncome
  if (ratio <= 0) return mix(NEUTRAL_RGB, NEGATIVE_RGB, ratio / NEGATIVE_RATIO_FLOOR)
  return mix(NEUTRAL_RGB, POSITIVE_RGB, ratio / POSITIVE_RATIO_CEILING)
}
