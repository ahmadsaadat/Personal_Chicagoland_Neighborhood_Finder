# Data Sources

This catalogues every dataset referenced or used to build `src/data/**`, what
is real vs. estimated, and how to extend the dataset. It exists so nobody has
to reverse-engineer provenance from the JSON later, and it's meant to feed
directly into the project README.

## Coverage summary

- **57 neighborhoods** total: **35 Chicago community areas** (of the city's 77
  official community areas) spanning the north, west, central, and south
  sides at a range of price points, plus **22 Chicagoland suburbs** across
  **5 counties** (Cook, DuPage, Lake, Will, Kane).
- **5 counties**, **23 municipalities** (Chicago + 22 suburbs), **23 tax
  jurisdictions** (one per municipality — see the caveat under "Tax
  jurisdictions" below).
- Every numeric dataset record carries a `meta: DataSourceMeta` object
  (`source`, `geographicLevel`, `year`, `valueType`, optional `notes`).
  `valueType` is `"estimated"` unless noted otherwise below — **never treat an
  estimated figure as authoritative**.

## Geography

| What | Source | Level | Vintage | valueType |
|---|---|---|---|---|
| 35 Chicago community-area boundary polygons | City of Chicago Data Portal, "Boundaries – Community Areas (current)" (resource `igwz-8jzy`) | neighborhood | 2024 dataset pull | **actual** (geometry), simplified for file size — see notes below |
| Chicago community-area centroids | Computed (area-weighted polygon centroid) directly from the above real boundary data | neighborhood | 2024 dataset pull | **calculated** from an actual source |
| 22 suburb boundary polygons | Illustrative MVP squares, NOT a real dataset | municipality | 2025 | **estimated** (explicitly labeled `geometrySource: "illustrative"` in the GeoJSON) |
| Suburb centroids | Real, well-known town-center coordinates (general public geographic knowledge) | municipality | — | **actual** |
| County → municipality → tax-jurisdiction → neighborhood hierarchy | `src/types/geo.ts` (already in place before this pass); real county/municipality assignments per neighborhood | structural | — | **actual** |

`src/data/geo/neighborhoods.geojson` is a single merged `FeatureCollection`
(kept as one file, matching the original seed's path, so nothing importing it
by path breaks). Its top-level `metadata` and each feature's
`properties.geometrySource` (`"official"` vs `"illustrative"`) disclose which
half is which. The official Chicago polygons were simplified with a
Ramer–Douglas–Peucker pass (~65–80m tolerance) and rounded to 4 decimal
places (~11m) to keep the file small (~23 KB for all 57 features); multi-part
polygons were reduced to their largest ring, so small detached exclaves are
dropped. **Not survey-accurate — do not use for anything requiring precise
parcel-level boundaries.**

To get real suburb boundaries later: U.S. Census Bureau **TIGER/Line
"Places"** shapefiles (https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html),
converted to GeoJSON and simplified the same way.

## Taxes

| What | Source | Level | Vintage | valueType |
|---|---|---|---|---|
| Illinois flat state income tax (4.95%) | Illinois Department of Revenue (well-known, stable since 2017) | state | current | **actual** (encoded directly in `src/calculations/taxes.ts`, no JSON meta since it's a code constant) |
| No IL/Chicago local personal income tax | Illinois Department of Revenue / Illinois Municipal Code (well-known) | state/municipal | current | **actual** |
| Combined sales tax rates (`taxJurisdictions.json`) | Illinois Department of Revenue combined sales-tax-rate tables | tax-jurisdiction | 2025 (**estimated — verify against the current IDOR table**) | **estimated** for every jurisdiction. Chicago's 10.25% breakdown (6.25% state + 1.75% Cook + 1.0% RTA + 1.25% city home-rule) is well-established and given higher confidence in its `notes`, but is still marked `estimated` per the "only mark `actual` when confident in the *specific* figure" rule, since IDOR updates these periodically. |
| Federal income tax brackets / standard deduction / FICA wage base | 2024 IRS published figures, used as an illustrative approximation | national | 2024 (**drifts from the current tax year**) | **estimated** approximation — see the comment block at the top of `src/calculations/taxes.ts` |
| IL vehicle registration fee ($151) / Chicago wheel tax ($95) | Illinois Secretary of State / City of Chicago (well-known standard passenger-vehicle fees) | state / municipal | recent, subject to change | **estimated** (flat fees, not tied to vehicle class/weight) |
| Illinois grocery sales tax | Illinois eliminated its statewide 1% grocery tax effective **January 1, 2026**; municipalities could opt into an equivalent local grocery tax | state/municipal | 2026 legislative change | The calculator still applies an approximate 1% effective rate as a placeholder, since this dataset doesn't track which of the 23 modeled municipalities enacted a replacement local tax — see the code comment in `estimateSalesTax()`. **Verify per-municipality before relying on this.** |

**Tax jurisdictions caveat:** Illinois sales tax is a stacked state + county +
RTA + home-rule-municipal (+ sometimes special-district) rate, and in reality
a single municipality can contain more than one combined rate depending on
special taxing districts. This MVP models exactly **one dominant jurisdiction
per municipality** (all 35 Chicago community areas currently share one
`chicago-jurisdiction`), which is a deliberate simplification, not a claim
that all of Chicago has a single uniform effective rate at every address.

## Housing

`housing.json` — median rents (studio/1BR/2BR/3BR), median home price,
effective property tax rate.

- **valueType: estimated** for every record. Figures are informed estimates
  calibrated to realistic *relative* differences between areas (e.g. Lincoln
  Park costs meaningfully more than Pilsen, which costs more than Englewood),
  not pulled from a live feed.
- **Production replacement sources:** Zillow **ZORI** (rent index) and
  **ZHVI** (home value index) per neighborhood/ZIP, and the Cook / DuPage /
  Lake / Will / Kane **County Assessor** offices for property tax and
  assessed-value data.
- Effective property tax rates use a county baseline (Cook 1.9%, DuPage 2.1%,
  Kane 2.4%, Lake 2.6%, Will 2.8% — all Illinois counties are known to run
  well above the national average) with a mild adjustment for Chicago
  community areas reflecting Cook County's classification/assessment system,
  under which lower-valued South/West Side properties often carry a
  comparably high or higher *effective* rate than pricier North Side
  properties — this is a real, documented pattern (see Cook County
  Assessor / Civic Federation reporting), not just noise.

## Transportation

`transportation.json` — `transitScore`, `walkScore`, `hasRailAccess`,
`transitLines`, `avgCommuteMinutesToLoop`, `parkingMonthlyEstimate`.

- `transitLines` and `hasRailAccess` reflect **actual, currently operating**
  CTA rail lines and Metra commuter lines serving each area (e.g. Blue Line
  in Logan Square/Austin, Metra Electric in Hyde Park/South Shore, Metra
  BNSF terminating in Aurora, Metra UP-N terminating in Waukegan) — **actual**
  facts, sourced from general knowledge of the CTA and Metra system maps.
- `transitScore`, `walkScore`, `avgCommuteMinutesToLoop`, and
  `parkingMonthlyEstimate` are **estimated** MVP composites derived from a
  settlement-pattern/transit-tier model, not measured.
- **Production replacement sources:** the **Walk Score API**, CTA/Metra
  published schedules for real commute times, and U.S. Census **ACS**
  commute-time-to-work tables (which report actual measured travel times by
  tract/PUMA).
- Because `TransportationData` carries one `meta` per record rather than one
  per field, each record's `meta.valueType` is set to `"estimated"` overall
  (since it mixes actual route facts with estimated scores) with `notes`
  spelling out exactly which fields are which. This is a modeling constraint
  worth knowing about, not a bug — see "Extending the schema" below if you
  want to split it.

## Cost of living

`costOfLiving.json` — groceries, utilities, restaurants, healthcare, other,
monthly.

- **valueType: estimated**, scaled to each area's relative cost tier.
- **Production replacement sources:** BLS **Consumer Expenditure Survey**
  regional data, and/or a Numbeo-style local cost-of-living index.

## Lifestyle

`lifestyle.json` — walkability, transit access, restaurant density, parks
access, safety indicator, family friendliness (0–100 scales).

- **valueType: estimated** for all fields.
- `safetyIndicator` is explicitly an **illustrative relative index only — not
  an official crime statistic.** Production replacement: Chicago Data Portal
  crime datasets (and equivalent municipal police data for suburbs).
- `parksAccess` / `restaurantDensity` production replacements: Chicago Data
  Portal park boundary layers and business-license/points-of-interest data.
- `familyFriendliness` is a qualitative MVP composite; production replacement
  would blend GreatSchools/Illinois Report Card school-quality data with
  park/school-district density.

## How to add a new neighborhood

Touch files in this order so nothing is left half-wired:

1. **`src/data/counties.json`** — add the county if it isn't already one of
   the 5 modeled (`cook`, `dupage`, `lake`, `will`, `kane`).
2. **`src/data/municipalities.json`** — add the municipality (skip if it's an
   existing Chicago community area — those all share the `chicago`
   municipality).
3. **`src/data/taxJurisdictions.json`** — add a jurisdiction with a
   `combinedSalesTaxRate` sourced (or estimated + noted) from the IDOR
   combined rate table, and a `meta` block. Reuse `chicago-jurisdiction` if
   it's another Chicago community area.
4. **`src/data/neighborhoods.json`** — add the `Neighborhood` record:
   `id` (kebab-case slug), `name`, `type`, `countyId`, `municipalityId`,
   `taxJurisdictionId`, `centroid` (`[lng, lat]`, use a real, findable
   coordinate), `settlementPattern`, and `geoFeatureId` (must match a feature
   you add in step 6).
5. **`src/data/housing.json`, `transportation.json`, `costOfLiving.json`,
   `lifestyle.json`** — add one record keyed by the neighborhood `id` in each
   file, matching the shapes in `src/types/data.ts`, each with its own `meta`.
   Keep new figures consistent with real-world relative differences versus
   neighboring areas already in the dataset — don't invent a number that
   contradicts well-known reality (e.g. don't make a South Side industrial
   corridor pricier than the Gold Coast).
6. **`src/data/geo/neighborhoods.geojson`** — add a `Feature` with
   `properties.id` equal to the neighborhood's `geoFeatureId` and a
   `properties.geometrySource` of `"official"` (if you have real boundary
   data) or `"illustrative"` (if you're falling back to a simple shape around
   the centroid). Update the top-level `metadata` notes if you change the
   overall provenance mix.
7. Run `npx tsc -b --noEmit` and `npm run build` to catch shape mismatches,
   then sanity-check the new neighborhood shows up via
   `getAllNeighborhoodProfiles()` and produces a sane
   `calculateFinancialSummary()` result (no `NaN`s, directionally reasonable
   relative to comparable neighborhoods).

### Extending the schema

`src/types/*.ts` may be extended additively (new optional fields on existing
interfaces, or brand-new interfaces) without breaking the Frontend engineer's
in-progress work. One concrete idea for later: split `TransportationData`'s
single `meta` into `factsMeta` (for `transitLines`/`hasRailAccess`) and
`estimatesMeta` (for the modeled scores), since right now those are
genuinely different provenance jammed into one `DataSourceMeta`. This pass
didn't make that change to avoid touching a shape the frontend may already be
destructuring against — flagged here for the lead to decide on.
