import { mixRgb, NEGATIVE_RGB, NEUTRAL_RGB, POSITIVE_RGB } from './incomeColor'

/**
 * Continuous red-to-green color scale for the choropleth map and any other
 * "good vs. bad for the user" magnitude encoding — the same red/neutral/green
 * language used for disposable-income figures elsewhere in the app (sidebar
 * cards, detail panel, ranked list), so the map reads as one consistent idea
 * instead of a second, unrelated palette.
 *
 * The green end always means "better for you"; the red end always means
 * "worse for you" — regardless of whether the underlying raw metric is "good
 * when high" (e.g. disposable income) or "good when low" (e.g. rent, tax
 * rate). Callers pass the metric's `goodDirection` and this module handles
 * the inversion, so color meaning stays consistent across every metric on
 * the map.
 */

/**
 * Cool blue-gray for neighborhoods with no data for the selected metric —
 * deliberately a different hue family (not a point on the red-green scale
 * above) so it can't be mistaken for a real "breaking even" or "best for
 * you" value.
 */
export const NO_DATA_COLOR = '#c7cdd6'

/** Three stops usable for a CSS gradient legend, worst to best. */
export const GRADIENT_STOPS = [
  `rgb(${NEGATIVE_RGB.join(', ')})`,
  `rgb(${NEUTRAL_RGB.join(', ')})`,
  `rgb(${POSITIVE_RGB.join(', ')})`,
] as const

export type GoodDirection = 'high' | 'low'

/**
 * Maps a raw value within [min, max] to a point on the red-neutral-green
 * scale, accounting for which raw direction ("high" or "low") is good for
 * the user. Continuous, not quantized, matching the smooth interpolation
 * used elsewhere for disposable-income figures.
 */
export function divergingColor(value: number, min: number, max: number, goodDirection: GoodDirection): string {
  if (!Number.isFinite(value)) return NO_DATA_COLOR
  if (max <= min) return `rgb(${NEUTRAL_RGB.join(', ')})`

  const t = clamp01((value - min) / (max - min)) // 0 = min raw value, 1 = max raw value
  const goodness = goodDirection === 'high' ? t : 1 - t // 0 = worst for you, 1 = best for you
  return goodness < 0.5
    ? mixRgb(NEGATIVE_RGB, NEUTRAL_RGB, goodness / 0.5)
    : mixRgb(NEUTRAL_RGB, POSITIVE_RGB, (goodness - 0.5) / 0.5)
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function median(sortedValues: number[]): number {
  const mid = Math.floor(sortedValues.length / 2)
  return sortedValues.length % 2 !== 0
    ? sortedValues[mid]
    : (sortedValues[mid - 1] + sortedValues[mid]) / 2
}

/**
 * Same red-neutral-green scale as divergingColor, but pivots neutral gray at
 * the dataset's actual median instead of the arithmetic midpoint of
 * min/max — for a right-skewed metric like disposable income (a few
 * comfortably-positive outliers stretch `max` far above where most
 * neighborhoods actually sit), min/max midpoint pivoting makes nearly
 * everything land on the green side even though half the neighborhoods are
 * below their peers. Splitting at the true 50th percentile keeps "below
 * average" reading as red and "above average" as green regardless of skew.
 */
export function medianPivotColor(value: number, allValues: number[], goodDirection: GoodDirection): string {
  if (!Number.isFinite(value)) return NO_DATA_COLOR
  if (allValues.length === 0) return `rgb(${NEUTRAL_RGB.join(', ')})`

  const sorted = [...allValues].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const mid = median(sorted)

  // 0 = worst raw value, 0.5 = median, 1 = best raw value — pivoted at the
  // median rather than the plain (min+max)/2 midpoint.
  let t: number
  if (value <= mid) {
    t = mid > min ? clamp01((value - min) / (mid - min)) * 0.5 : 0.5
  } else {
    t = max > mid ? 0.5 + clamp01((value - mid) / (max - mid)) * 0.5 : 0.5
  }
  const goodness = goodDirection === 'high' ? t : 1 - t
  return goodness < 0.5
    ? mixRgb(NEGATIVE_RGB, NEUTRAL_RGB, goodness / 0.5)
    : mixRgb(NEUTRAL_RGB, POSITIVE_RGB, (goodness - 0.5) / 0.5)
}
