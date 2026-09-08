/**
 * Warm sequential color scale for the choropleth map and any other
 * "good vs. bad for the user" magnitude encoding. UI-only — consumes numbers,
 * returns hex colors.
 *
 * The lightest step always means "better for you" (more money left over);
 * the darkest, most saturated red always means "worse for you" (less money
 * left over) — regardless of whether the underlying raw metric is "good
 * when high" (e.g. disposable income) or "good when low" (e.g. rent, tax
 * rate). Callers pass the metric's `goodDirection` and this module handles
 * the inversion, so color meaning stays consistent across every metric on
 * the map.
 */
export const DIVERGING_STEPS = [
  '#9F3F46', // worst for you
  '#B84C4C',
  '#CD625F',
  '#DD817A',
  '#E9A69A',
  '#EFC9B8',
  '#F3E4D3', // best for you
] as const

/**
 * Cool blue-gray for neighborhoods with no data for the selected metric —
 * deliberately a different hue family (not just a lighter/darker version of
 * the warm scale above) so it can't be mistaken for a real "best for you"
 * value at the light end of that scale.
 */
export const NO_DATA_COLOR = '#c7cdd6'

export type GoodDirection = 'high' | 'low'

/**
 * Maps a raw value within [min, max] to a step on the warm sequential
 * scale, accounting for which raw direction ("high" or "low") is good for
 * the user. Quantized (not interpolated) for a legible, discrete legend.
 */
export function divergingColor(value: number, min: number, max: number, goodDirection: GoodDirection): string {
  if (!Number.isFinite(value)) return NO_DATA_COLOR
  if (max <= min) return DIVERGING_STEPS[Math.floor(DIVERGING_STEPS.length / 2)]

  const t = clamp01((value - min) / (max - min)) // 0 = min raw value, 1 = max raw value
  const goodness = goodDirection === 'high' ? t : 1 - t // 0 = worst for you, 1 = best for you
  const idx = Math.min(DIVERGING_STEPS.length - 1, Math.floor(goodness * DIVERGING_STEPS.length))
  return DIVERGING_STEPS[idx]
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}
