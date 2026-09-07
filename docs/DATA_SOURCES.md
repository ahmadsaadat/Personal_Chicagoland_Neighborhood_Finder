# Data Sources

This catalogues every dataset referenced or used to build `src/data/**`, what
is real vs. estimated, and how to extend the dataset. It exists so nobody has
to reverse-engineer provenance from the JSON later, and it's meant to feed
directly into the project README.

## Coverage summary

- **179 neighborhoods** total: **all 77 official Chicago community areas**
  (complete — up from 35 in round 1) spanning the north, west, central, and
  south sides at a full range of price points, plus **102 Chicagoland
  suburbs/towns** across **6 counties** (Cook, DuPage, Lake, Will, Kane, and
  — new this round — McHenry).
- **6 counties**, **103 municipalities** (Chicago + 102 suburbs), **103 tax
  jurisdictions** (one per municipality — see the caveat under "Tax
  jurisdictions" below).
- Every numeric dataset record carries a `meta: DataSourceMeta` object
  (`source`, `geographicLevel`, `year`, `valueType`, optional `notes`).
  `valueType` is `"estimated"` unless noted otherwise below — **never treat an
  estimated figure as authoritative**.

## Geography

| What | Source | Level | Vintage | valueType |
|---|---|---|---|---|
| 77 Chicago community-area boundary polygons (complete set) | City of Chicago Data Portal, "Boundaries – Community Areas (current)" (resource `igwz-8jzy`) | neighborhood | 2024/2025 dataset pulls | **actual** (geometry), simplified for file size — see notes below |
| Chicago community-area centroids | Computed (area-weighted polygon centroid, via `@turf/turf`'s `centerOfMass`) directly from the above real boundary data | neighborhood | 2024/2025 dataset pulls | **calculated** from an actual source |
| 102 suburb "territory" polygons | Computed Voronoi tessellation of suburb centroids, clipped to a real county-boundary extent and to the real Chicago boundary — see "How the suburb shapes are generated" below | municipality | 2025 | **estimated** (explicitly labeled `geometrySource: "voronoi-illustrative"` in the GeoJSON) — NOT real municipal boundaries |
| Suburb centroids | Real, well-known town-center coordinates (general public geographic knowledge) | municipality | — | **actual** |
| Chicagoland extent (outer boundary of the tessellated region) | U.S. Census Bureau cartographic (1:500,000, shoreline-clipped) county boundaries for Cook, DuPage, Kane, Lake, Will, and McHenry counties, via the Census TIGERweb `Generalized_ACS2024/State_County` service | county (dissolved to one region) | 2024 vintage | **actual** boundary, used as a **calculated** clip extent — see caveat below |
| County → municipality → tax-jurisdiction → neighborhood hierarchy | `src/types/geo.ts` (already in place before round 1); real county/municipality assignments per neighborhood | structural | — | **actual** |

### How the suburb shapes are generated (Voronoi tessellation)

Round 1 gave the 22 suburbs illustrative squares, which left huge visual gaps
between them and Chicago on the map. Round 2 replaces those squares with a
**Voronoi tessellation** — here's what that means in plain terms:

Take every suburb's real town-center coordinate as a "seed" point. For every
location on the map, ask "which seed point is closest?" — the set of
locations whose answer is "this seed" forms that seed's Voronoi cell. Doing
this for every seed at once produces a set of polygons that share edges and
tile the whole map with **no gaps and no overlaps**, like cutting a sheet of
dough into pieces, one per town, where each piece's edge sits exactly halfway
between it and its nearest neighboring town.

**This produces a visually reasonable, fully-tiled map — it does NOT produce
real municipal boundaries.** A real town's actual shape can look nothing like
its Voronoi cell. Every suburb feature is tagged
`properties.geometrySource: "voronoi-illustrative"` in the GeoJSON precisely
so this is never confused with a surveyed boundary.

The generation pipeline (`scripts/generate-tessellation.mjs`, run via
`npm run geo:generate`):

1. Takes the 77 real Chicago community-area polygons as fixed, authoritative
   input — this script never modifies them.
2. Computes the Voronoi diagram of all 102 suburb centroids with
   **`d3-delaunay`** (the 77 Chicago community-area centroids are also fed in
   as auxiliary seed points purely so the triangulation doesn't "reach
   across" the Chicago-shaped hole in the suburb point set — their own cells
   are discarded, never emitted; Chicago's shape always comes from step 1).
3. Clips every suburb's cell to the Chicagoland county extent, and separately
   subtracts the real Chicago union out of it, using **`@turf/turf`**
   (`intersect`/`difference`/`union`).
4. Runs two cleanup passes: a **gap-fill** pass that merges any sliver left
   outside every cell (mostly along Chicago's real, jagged edges, which are
   far more irregular than a straight Voronoi edge) into its nearest
   touching neighbor, and a **defragment** pass that keeps each town's
   largest contiguous lobe as its feature and reassigns smaller detached
   lobes to whichever neighboring town's cell actually touches them, so a
   single town doesn't end up rendered as two disconnected shapes.
5. Rounds coordinates to 4 decimal places (~11m) and writes the merged
   `FeatureCollection` to `src/data/geo/neighborhoods.geojson`.

Both `d3-delaunay` and `@turf/turf` are **devDependencies only** — this
script runs once, by hand, at data-authoring time (`npm run geo:generate`),
never as part of `npm run dev` or `npm run build`. Neither library is ever
imported anywhere under `src/`; the app only ever loads the static generated
GeoJSON file, exactly like round 1.

**Coverage math, if you want to check it yourself:** unioning every feature
in the generated file covers ~9,697 km² against a real extent (the six
counties' union) of ~9,696 km² — the two remaining gap fragments after
cleanup total well under 1 km² (numerical-precision noise, not a real
missing area), and the sum of every feature's individual area matches the
union area to within the same rounding tolerance (i.e., no meaningful
overlap either).

**Caveat on the extent:** the choice of which 6 counties to model as
"Chicagoland" is this project's own scope decision — there is no single
official definition of "Chicagoland." If the live Census fetch or the
bundled cache is ever unavailable when `npm run geo:generate` runs, the
script falls back to a padded convex hull around all included neighborhood
centroids instead, and marks `metadata.extentBasis` accordingly so that
fallback is never silently presented as a real boundary.

The official Chicago polygons were simplified with a Ramer–Douglas–Peucker
pass (~65–80m tolerance) and rounded to 4 decimal places (~11m) to keep the
file small (~250 KB for all 179 features, well under the ~1MB budget);
multi-part polygons were reduced to their largest ring, so small detached
exclaves are dropped. **Not survey-accurate — do not use for anything
requiring precise parcel-level boundaries.**

To get real suburb boundaries later (replacing the Voronoi cells entirely):
U.S. Census Bureau **TIGER/Line "Places"** shapefiles
(https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html),
converted to GeoJSON and simplified the same way as the Chicago polygons.

## Taxes

| What | Source | Level | Vintage | valueType |
|---|---|---|---|---|
| Illinois flat state income tax (4.95%) | Illinois Department of Revenue (well-known, stable since 2017) | state | current | **actual** (encoded directly in `src/calculations/taxes.ts`, no JSON meta since it's a code constant) |
| No IL/Chicago local personal income tax | Illinois Department of Revenue / Illinois Municipal Code (well-known) | state/municipal | current | **actual** |
| Combined sales tax rates (`taxJurisdictions.json`) | Illinois Department of Revenue combined sales-tax-rate tables | tax-jurisdiction | 2025 (**estimated — verify against the current IDOR table**) | **estimated** for every jurisdiction. Chicago's 10.25% breakdown (6.25% state + 1.75% Cook + 1.0% RTA + 1.25% city home-rule) is well-established and given higher confidence in its `notes`, but is still marked `estimated` per the "only mark `actual` when confident in the *specific* figure" rule, since IDOR updates these periodically. |
| Federal income tax brackets / standard deduction / FICA wage base | 2024 IRS published figures, used as an illustrative approximation | national | 2024 (**drifts from the current tax year**) | **estimated** approximation — see the comment block at the top of `src/calculations/taxes.ts` |
| IL vehicle registration fee ($151) / Chicago wheel tax ($95) | Illinois Secretary of State / City of Chicago (well-known standard passenger-vehicle fees) | state / municipal | recent, subject to change | **estimated** (flat fees, not tied to vehicle class/weight) |
| Illinois grocery sales tax | Illinois eliminated its statewide 1% grocery tax effective **January 1, 2026**; municipalities could opt into an equivalent local grocery tax | state/municipal | 2026 legislative change | The calculator still applies an approximate 1% effective rate as a placeholder, since this dataset doesn't track which of the 103 modeled municipalities enacted a replacement local tax — see the code comment in `estimateSalesTax()`. **Verify per-municipality before relying on this.** |

**Tax jurisdictions caveat:** Illinois sales tax is a stacked state + county +
RTA + home-rule-municipal (+ sometimes special-district) rate, and in reality
a single municipality can contain more than one combined rate depending on
special taxing districts. This MVP models exactly **one dominant jurisdiction
per municipality** (all 77 Chicago community areas currently share one
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
  Lake / Will / Kane / McHenry **County Assessor** offices for property tax
  and assessed-value data.
- Effective property tax rates use a county baseline (Cook 1.9%, DuPage 2.1%,
  Kane 2.4%, Lake 2.6%, Will 2.8%, McHenry 2.85% — all Illinois counties are
  known to run well above the national average) with a mild adjustment for
  Chicago community areas reflecting Cook County's classification/assessment
  system, under which lower-valued South/West Side properties often carry a
  comparably high or higher *effective* rate than pricier North Side
  properties — this is a real, documented pattern (see Cook County
  Assessor / Civic Federation reporting), not just noise. Round 2's 42
  additional Chicago community areas and 80 additional suburbs were
  calibrated with the same pattern: a linear regression fit on the 35
  real-round-1 community areas (and, separately, the 22 real-round-1
  suburbs) maps a hand-assigned relative home-price anchor to rent, tax
  rate, transportation, cost-of-living, and lifestyle figures, so new
  entries land consistently on the existing relative scale rather than being
  invented independently — see `scripts/data/lib.mjs` for the fitted
  coefficients and `scripts/data/community-areas-new.mjs` /
  `scripts/data/suburbs-new.mjs` for the price anchors and their rationale.

### Manual rent correction (post-launch)

A user comparison against real listings caught that the single linear
regression above (`CHICAGO_FIT.rent2BR` in `scripts/data/lib.mjs`) badly
under-priced several Chicago community areas — most visibly Rogers Park,
which the formula priced below cheaper South/West Side areas despite being
a lakefront neighborhood with strong transit. The root cause: one straight
line fit across Chicago's full ~$95k–$922k home-price range necessarily
flattens out at the high end (the fitted rent-to-price ratio drops from
~13% at the cheapest areas to under 4% at the priciest, which is a much
wider swing than real Chicago rental yields), and a home-price-driven
formula can't capture areas where the housing stock is dominated by older
rental apartment buildings rather than owner-occupied units (Rogers Park,
Edgewater, Uptown, Albany Park), where real rents run well above what the
neighborhood's typically-lower home price would predict.

`medianRent2BR` was manually corrected for 39 of the 77 Chicago community
areas (roughly everything from Montclare up through Near North Side on the
price ladder, plus a handful of specific rental-heavy/gentrifying outliers
below that price band) using informed real-world rental-market knowledge
rather than the formula, with `medianRentStudio`/`1BR`/`3BR` recomputed from
the corrected 2BR figure via the dataset's existing bedroom-count ratios.
Each corrected record's `meta.notes` says so explicitly. The regression in
`scripts/data/lib.mjs` was intentionally left as-is (it's still fine for the
fields it's more reliable for, like transit/walk scores) but is now flagged
in a code comment as not to be trusted for rent if reused. The 39 corrected
ids, for reference: rogers-park, west-ridge, humboldt-park, woodlawn,
south-shore, grand-boulevard, douglas, mckinley-park, belmont-cragin,
montclare, irving-park, avondale, uptown, bridgeport, ohare, portage-park,
edgewater, morgan-park, albany-park, jefferson-park, pilsen, dunning,
armour-square, norwood-park, edison-park, beverly, logan-square, hyde-park,
kenwood, forest-glen, west-town, near-west-side, lincoln-square,
north-center, lakeview, loop, near-south-side, lincoln-park, near-north-side.

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

All 77 Chicago community areas are now covered, so from here on this almost
always means adding another suburb. Touch files in this order so nothing is
left half-wired:

1. **`src/data/counties.json`** — add the county if it isn't already one of
   the 6 modeled (`cook`, `dupage`, `lake`, `will`, `kane`, `mchenry`).
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
   coordinate), `settlementPattern`, and `geoFeatureId` (set it equal to
   `id` — see step 6).
5. **`src/data/housing.json`, `transportation.json`, `costOfLiving.json`,
   `lifestyle.json`** — add one record keyed by the neighborhood `id` in each
   file, matching the shapes in `src/types/data.ts`, each with its own `meta`.
   Keep new figures consistent with real-world relative differences versus
   neighboring areas already in the dataset — don't invent a number that
   contradicts well-known reality (e.g. don't make a South Side industrial
   corridor pricier than the Gold Coast). `scripts/data/lib.mjs`'s
   `CHICAGO_FIT` / `SUBURB_FIT` regression coefficients exist precisely to
   make this mechanical: pick a relative home-price anchor by comparing the
   new area to a similar one already in the dataset, and derive the rest.
6. **Regenerate the geometry — do not hand-edit
   `src/data/geo/neighborhoods.geojson` directly.** Since round 2, suburb
   shapes are a computed Voronoi tessellation, not hand-drawn shapes,
   because adding a hand-drawn polygon would create exactly the
   overlaps/gaps this round eliminated. Instead:
   - If you added a new **Chicago community area** (shouldn't happen now
     that all 77 are covered, but if the Data Portal's community-area
     boundaries are ever redrawn): add it to
     `scripts/data/community-areas-new.mjs` and rerun
     `npm run data:generate` to fetch + simplify its real polygon into
     `scripts/data/cache/chicago-77-official.geojson`.
   - If you added a new **suburb**: nothing further needed here — its
     centroid in `neighborhoods.json` is all `generate-tessellation.mjs`
     needs.
   - Then run `npm run geo:generate` to rebuild
     `src/data/geo/neighborhoods.geojson` from scratch with the new
     centroid included as a Voronoi seed. This will also reshape the Voronoi
     cells of the new suburb's immediate neighbors, since they now share a
     border with it — that's expected and correct.
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
