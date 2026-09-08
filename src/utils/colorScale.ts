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
