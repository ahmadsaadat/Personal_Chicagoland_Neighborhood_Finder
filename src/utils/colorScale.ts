/**
 * Diverging blue↔red color scale for the choropleth map and any other
 * "good vs. bad for the user" magnitude encoding. UI-only — consumes numbers,
 * returns hex colors. Steps mirror the design system's --color-div-* tokens
 * in src/index.css.
 *
 * Blue always means "better for you" (more money left over); red always
 * means "worse for you" (less money left over) — regardless of whether the
 * underlying raw metric is "good when high" (e.g. disposable income) or
 * "good when low" (e.g. rent, tax rate). Callers pass the metric's
 * `goodDirection` and this module handles the inversion, so color meaning
 * stays consistent across every metric on the map.
 */
export const DIVERGING_STEPS = [
  '#b3261e', // reddest — worst for you
  '#cc4a3c',
  '#e0765f',
  '#eeb29d',
  '#f1eee7', // neutral midpoint
  '#a9c6ee',
  '#6f9de3',
  '#3d75d1',
  '#1d4fa0', // bluest — best for you
] as const

/** Neutral gray used for neighborhoods with no data for the selected metric. */
export const NO_DATA_COLOR = '#e1e0d9'

export type GoodDirection = 'high' | 'low'

/**
 * Maps a raw value within [min, max] to a step on the diverging blue↔red
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
