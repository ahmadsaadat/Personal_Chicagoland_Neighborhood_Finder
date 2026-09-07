/**
 * Diverging blue↔red color scale for the choropleth map and any other
 * "good vs. bad for the user" magnitude encoding. UI-only — consumes numbers,
 * returns hex colors. Endpoints mirror the design system's --color-div-red-700
 * / --color-div-blue-700 tokens in src/index.css.
 *
 * Blue always means "better for you" (more money left over); red always
 * means "worse for you" (less money left over) — regardless of whether the
 * underlying raw metric is "good when high" (e.g. disposable income) or
 * "good when low" (e.g. rent, tax rate). Callers pass the metric's
 * `goodDirection` and this module handles the inversion, so color meaning
 * stays consistent across every metric on the map.
 *
 * Steps are a direct RGB interpolation between the red and blue endpoints —
 * deliberately no neutral/white/cream midpoint, so the mid-range renders as
 * a muted red-blue blend rather than a washed-out gap in the middle of the
 * scale. The fill endpoints are intentionally lighter/softer than the
 * --color-div-red-700 / --color-div-blue-700 CSS tokens (which stay more
 * saturated since they're used for small text labels that need contrast
 * against a white background) so ~180 map polygons don't read as harsh.
 */
const RED_ENDPOINT = { r: 0xd8, g: 0x69, b: 0x5c } // #d8695c
const BLUE_ENDPOINT = { r: 0x66, g: 0x90, b: 0xd1 } // #6690d1
const DIVERGING_STEP_COUNT = 8

function toHex(n: number): string {
  return Math.round(n).toString(16).padStart(2, '0')
}

function lerpColor(t: number): string {
  const r = RED_ENDPOINT.r + (BLUE_ENDPOINT.r - RED_ENDPOINT.r) * t
  const g = RED_ENDPOINT.g + (BLUE_ENDPOINT.g - RED_ENDPOINT.g) * t
  const b = RED_ENDPOINT.b + (BLUE_ENDPOINT.b - RED_ENDPOINT.b) * t
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export const DIVERGING_STEPS = Array.from({ length: DIVERGING_STEP_COUNT }, (_, i) =>
  lerpColor(i / (DIVERGING_STEP_COUNT - 1)),
) as readonly string[]

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
