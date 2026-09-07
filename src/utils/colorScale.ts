/**
 * Sequential single-hue (blue) color scale for the choropleth map and any
 * other magnitude encoding. UI-only — consumes numbers, returns hex colors.
 * Steps mirror the design system's --color-seq-* tokens in src/index.css.
 */
export const SEQUENTIAL_STEPS = [
  '#cde2fb', // 100 — lowest
  '#9ec5f4', // 200
  '#6da7ec', // 300
  '#3987e5', // 400
  '#256abf', // 500
  '#184f95', // 600
  '#0d366b', // 700 — highest
] as const

/** Maps a value within [min, max] to one of the sequential steps (quantized, for a legible legend). */
export function sequentialColor(value: number, min: number, max: number): string {
  if (!Number.isFinite(value)) return '#e1e0d9' // gridline gray for missing data
  if (max <= min) return SEQUENTIAL_STEPS[Math.floor(SEQUENTIAL_STEPS.length / 2)]
  const t = clamp01((value - min) / (max - min))
  const idx = Math.min(SEQUENTIAL_STEPS.length - 1, Math.floor(t * SEQUENTIAL_STEPS.length))
  return SEQUENTIAL_STEPS[idx]
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}
