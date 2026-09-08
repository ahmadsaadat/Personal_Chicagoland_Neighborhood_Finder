import { mixRgb, NEGATIVE_RGB, POSITIVE_RGB } from './incomeColor'

/**
 * Two-color red-to-green scale for the choropleth map — deliberately no
 * third "neutral" hue in between. A red/neutral-gray/green blend reads as
 * three choices instead of one axis, which is harder to scan across dozens
 * of map polygons than a straight "worse ← → better" gradient; a direct
 * red-green blend passes through a muted brown/olive at the midpoint
 * instead, never a color that could be mistaken for its own third category.
 *
 * Green always means "better for you"; red always means "worse for you" —
 * regardless of whether the underlying raw metric is "good when high" (e.g.
 * disposable income) or "good when low" (e.g. rent, tax rate). Callers pass
 * the metric's `goodDirection` and this module handles the inversion, so
 * color meaning stays consistent across every metric on the map.
 */

/**
 * Cool blue-gray for neighborhoods with no data for the selected metric —
 * a distinct hue family, never a point on the red-green scale above, so it
 * can't be mistaken for a real value.
 */
export const NO_DATA_COLOR = '#c7cdd6'

/** Two stops usable for a CSS gradient legend, worst to best. */
export const GRADIENT_STOPS = [`rgb(${NEGATIVE_RGB.join(', ')})`, `rgb(${POSITIVE_RGB.join(', ')})`] as const

export type GoodDirection = 'high' | 'low'

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
 * Maps a value to a point on the red-green scale, pivoted at the dataset's
 * actual median rather than the arithmetic midpoint of min/max — for a
 * right-skewed metric like disposable income (a few comfortably-positive
 * outliers stretch `max` far above where most neighborhoods actually sit),
 * min/max midpoint pivoting makes nearly everything land on the green side
 * even though half the neighborhoods are below their peers. Splitting at the
 * true 50th percentile keeps "below average" reading toward red and "above
 * average" toward green regardless of skew.
 */
export function medianPivotColor(value: number, allValues: number[], goodDirection: GoodDirection): string {
  if (!Number.isFinite(value)) return NO_DATA_COLOR
  if (allValues.length === 0) return mixRgb(NEGATIVE_RGB, POSITIVE_RGB, 0.5)

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
  return mixRgb(NEGATIVE_RGB, POSITIVE_RGB, goodness)
}
