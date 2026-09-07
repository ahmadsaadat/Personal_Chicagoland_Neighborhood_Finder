// Shared helpers for the one-time dataset-authoring scripts in scripts/data.
// Nothing here is imported by the app (src/**) — this is build-time-only
// tooling that produces the committed static JSON/GeoJSON files.

/** Simple deterministic string hash -> integer, used for repeatable jitter
 * (so re-running the generator produces byte-identical output). */
export function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return h
}

/** Deterministic pseudo-random number in [-1, 1] derived from a string seed. */
export function seededUnit(seed) {
  const h = hashString(seed)
  // Take the fractional part of a large multiplier to spread bits out.
  const x = Math.sin(h) * 10000
  return (x - Math.floor(x)) * 2 - 1
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function round0(n) {
  return Math.round(n)
}

export function round4(n) {
  return Math.round(n * 10000) / 10000
}

export function roundScore(n) {
  return clamp(Math.round(n), 1, 99)
}

/** Ordinary least squares fit of ys ~ xs, returns { slope, intercept }. */
export function linreg(xs, ys) {
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  const slope = num / den
  const intercept = my - slope * mx
  return { slope, intercept }
}

export function predict({ slope, intercept }, x) {
  return slope * x + intercept
}

// ---------------------------------------------------------------------------
// Regression coefficients fit on the round-1 dataset's real 35 Chicago
// community areas and real 22 suburbs (medianHomePrice as the predictor).
// Computed once from src/data/{housing,transportation,costOfLiving,lifestyle}.json
// as they stood before this round's additions, so new areas are calibrated
// consistently with the existing, already-reviewed relative differences
// rather than invented from scratch. See docs/DATA_SOURCES.md for the
// narrative explanation.
//
// KNOWN LIMITATION (found and manually corrected post-launch): CHICAGO_FIT
// .rent2BR is a single straight line across Chicago's entire ~$95k-$922k
// home-price range, so it necessarily flattens out at the high end and
// under-predicts rent for mid-to-high-value neighborhoods, and it can't
// capture rental-stock-heavy areas (Rogers Park, Edgewater, Uptown, Albany
// Park) whose real rents run well above what their home price alone would
// suggest. `src/data/housing.json`'s medianRent2BR was manually corrected
// for ~39 Chicago community areas after this was caught (see
// docs/DATA_SOURCES.md) — that correction lives only in the committed JSON,
// not in this formula, so re-running generate-dataset.mjs is safe (it only
// ever adds new ids, never overwrites existing ones) but this FIT should
// not be trusted as accurate for rent if it's ever reused for something new.
// ---------------------------------------------------------------------------
export const CHICAGO_FIT = {
  rent2BR: { slope: 0.002393854180682773, intercept: 797.6968433931455 },
  taxRate: { slope: -6.342350090576144e-9, intercept: 0.02395873007829846 },
  transitScore: { slope: 0.00003898557458074937, intercept: 52.704361932067386 },
  walkScore: { slope: 0.00003649705594721716, intercept: 61.56034124147007 },
  commute: { slope: -0.00002271271128013941, intercept: 37.326809460045666 },
  parking: { slope: 0.00013375630731909794, intercept: 107.42022331958228 },
  groceries: { slope: 0.00015454610869525273, intercept: 322.1548399262243 },
  utilities: { slope: 0.0000417112756884911, intercept: 124.28108434246445 },
  restaurants: { slope: 0.0002573322851996424, intercept: 131.77076052804298 },
  healthcare: { slope: 0.00007227126599234146, intercept: 165.51217796337716 },
  other: { slope: 0.00011563223380867978, intercept: 136.22581534792297 },
  safety: { slope: 0.000043672703136104115, intercept: 37.77783791269836 },
  family: { slope: 0.000004283293509046373, intercept: 56.81238369841687 },
  restDensity: { slope: 0.00006433068891850842, intercept: 31.55779531743077 },
  parksAccess: { slope: 0.000004789128717185477, intercept: 41.18124798210869 },
  studioRatio: 0.6208440380942808,
  oneBRRatio: 0.7996796958055987,
  threeBRRatio: 1.3139861826030323,
}

export const SUBURB_FIT = {
  rent2BR: { slope: 0.002297373206384276, intercept: 852.7976874439901 },
  transitScore: { slope: 0.000026240255567337275, intercept: 50.03373477528237 },
  walkScore: { slope: 0.000012695954198689383, intercept: 49.043077918029596 },
  commute: { slope: -0.000007702595967504244, intercept: 46.99764950899981 },
  parking: { slope: 0.00013696859165247775, intercept: 60.68549250846853 },
  groceries: { slope: 0.0001472256656945956, intercept: 326.1178721301441 },
  utilities: { slope: 0.00005962304698497036, intercept: 118.73902126466955 },
  restaurants: { slope: 0.00026153297623275347, intercept: 131.9433611093374 },
  healthcare: { slope: 0.00007737070884014237, intercept: 163.34591741181453 },
  other: { slope: 0.00012303031370601263, intercept: 132.30038158322282 },
  safety: { slope: 0.0000774020067798572, intercept: 32.652103583283825 },
  family: { slope: 0.000054818105496390035, intercept: 46.80789702065633 },
  restDensity: { slope: 0.00006204462677285527, intercept: 20.85635032051292 },
  parksAccess: { slope: 0.000032599399268288764, intercept: 41.14190297135405 },
  walkability: { slope: 0.000017403541794387945, intercept: 48.056969799532766 },
  transitAccess: { slope: 0.000023212691047185018, intercept: 51.19411768591527 },
  studioRatio: 0.6180006472597716,
  oneBRRatio: 0.7997856403741128,
  threeBRRatio: 1.32773592781263,
}

/** County baseline effective property tax rates (see docs/DATA_SOURCES.md). */
export const COUNTY_TAX_BASELINE = {
  cook: 0.019,
  dupage: 0.021,
  kane: 0.024,
  lake: 0.026,
  will: 0.028,
  mchenry: 0.0285,
}

const SOURCE_TEXT = {
  housing:
    'Informed MVP estimate calibrated to well-known relative Chicagoland rent/price patterns — replace with Zillow ZORI (rent index) / ZHVI (home value index) and the Cook/DuPage/Lake/Will/Kane/McHenry County Assessor offices for production figures.',
  transportation:
    'Informed MVP estimate; see notes for what is fact-sourced vs. modeled.',
  costOfLiving:
    'Informed MVP estimate scaled to each area’s relative cost tier — replace with BLS Consumer Expenditure Survey regional data and/or a Numbeo-style local cost index for production figures.',
  lifestyle:
    'Informed MVP composite index; see notes for what a production replacement dataset would be.',
}

const TRANSPORT_NOTE =
  'transitLines and hasRailAccess reflect actual, currently operating CTA/Metra routes serving this area; transitScore, walkScore, avgCommuteMinutesToLoop, and parkingMonthlyEstimate are informed MVP estimates — replace with the Walk Score API, CTA/Metra published schedules, and U.S. Census ACS commute-time tables for production figures.'

const LIFESTYLE_NOTE =
  'walkability/transitAccess mirror the transportation estimates above; restaurantDensity and parksAccess are informed MVP estimates (replace with Chicago/municipal open-data park layers and a business-density source such as the Chicago Data Portal business license dataset); safetyIndicator is an illustrative relative index only, NOT an official crime statistic (replace with Chicago Data Portal / municipal police crime data); familyFriendliness is a qualitative MVP composite (replace with GreatSchools/state report-card data plus park/school-district density).'

export function makeMeta(category, extraNotes) {
  return {
    source: SOURCE_TEXT[category],
    geographicLevel: 'neighborhood',
    year: 2025,
    valueType: 'estimated',
    ...(category === 'transportation' ? { notes: extraNotes ? `${TRANSPORT_NOTE} ${extraNotes}` : TRANSPORT_NOTE } : {}),
    ...(category === 'lifestyle' ? { notes: extraNotes ? `${LIFESTYLE_NOTE} ${extraNotes}` : LIFESTYLE_NOTE } : {}),
  }
}
