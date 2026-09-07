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
| 102 suburb municipal boundary polygons | U.S. Census Bureau **TIGER/Line "Places"** geography (incorporated municipalities), fetched via the Census TIGERweb ArcGIS REST service — see "How the suburb shapes are generated" below | municipality | 2024 vintage | **actual** (geometry) — real, surveyed municipal boundaries, simplified for file size |
| Suburb centroids | Real, well-known town-center coordinates (general public geographic knowledge) | municipality | — | **actual** |
| County → municipality → tax-jurisdiction → neighborhood hierarchy | `src/types/geo.ts` (already in place before round 1); real county/municipality assignments per neighborhood | structural | — | **actual** |

### How the suburb shapes are generated (real Census Place boundaries)

**Round 2 history, and why it changed:** round 2 gave the 102 suburbs a
computed **Voronoi tessellation** instead of real boundaries — every suburb's
real town-center coordinate was treated as a "seed" point, and each seed's
"territory" was every location on the map closer to it than to any other
seed. That produced a fully gap-free, edge-to-edge tiled map, but a Voronoi
cell is just "closest centroid wins" — it is not a real municipal boundary,
and it was always labeled `geometrySource: "voronoi-illustrative"` for
exactly that reason.

**A user comparing the shipped map against Google Maps confirmed the real
Chicago community-area polygons looked correct, but caught that the Voronoi
suburb shapes clearly didn't match reality — specifically calling out Cicero
and Berwyn.** Both are narrow, elongated towns along the Ogden Ave/Cicero Ave
corridor immediately west of Chicago; a Voronoi cell ("closest centroid
wins") has no way to produce that shape, since it only knows about the
distance between town centers, not any town's actual footprint.

**Round 3 replaces all 102 Voronoi cells with real municipal boundary
geometry** from the U.S. Census Bureau's **TIGER/Line "Places"** dataset —
the standard free public source for incorporated-municipality boundaries.
`properties.geometrySource` is now `"official"` for every one of the 102
suburbs, matching Chicago's convention, since it's real surveyed boundary
data rather than a computed illustrative shape.

The generation pipeline (`scripts/generate-geometry.mjs`, run via
`npm run geo:generate`):

1. Takes the 77 real Chicago community-area polygons as fixed, authoritative
   input — this script never modifies them.
2. Fetches every Illinois incorporated place from the Census **TIGERweb**
   ArcGIS REST service (`Generalized_ACS2024/Places_CouSub_ConCity_SubMCD`,
   the "Incorporated Places 500K" layer — the same generalized/cartographic
   tier the previous round's county-extent fetch used), queried with
   `STATE=17`, `f=geojson`. This is one live HTTP fetch for all ~1,300 IL
   places at once (falling back to a bundled cache at
   `scripts/data/cache/illinois-places.raw.geojson` if the live fetch fails,
   same pattern as the community-area and (former) county-extent fetches).
3. Matches each of the 102 suburbs to its Census Place by name. Census
   `BASENAME` already has the incorporation-type suffix stripped (e.g.
   "Cicero town" → `BASENAME` "Cicero"), so this is mostly a direct
   case-insensitive match; the one recurring quirk handled explicitly is
   "St. X" → Census's spelled-out "Saint X" (e.g. St. Charles). All 102
   suburb names matched a Census Place on the first attempt.
4. Disambiguates by real centroid where a name isn't unique statewide. Some
   Illinois place names repeat outside Chicagoland — for example there are
   two "Wilmington"s in the Census Places list, the Will County city near
   Joliet this dataset means, and an unrelated downstate village. Since
   every suburb already carries a real, well-known centroid coordinate, the
   script prefers whichever same-named candidate's polygon actually contains
   that point (falling back to nearest-centroid distance if none does).
5. Simplifies each matched polygon the same way the Chicago polygons already
   are: a Ramer–Douglas–Peucker pass (~65–80m tolerance), reduced to its
   largest ring (multi-part geometries, e.g. small annexation exclaves, are
   dropped), and rounded to 4 decimal places (~11m).
6. Writes the merged 179-feature `FeatureCollection` to
   `src/data/geo/neighborhoods.geojson`, compact (no pretty-print
   indentation) — real municipal boundaries carry far more vertices per ring
   than the old Voronoi cells did, and indentation alone would roughly
   quadruple a coordinate-heavy file's size. Nothing hand-edits this
   generated file, so the format tradeoff costs nothing.

**Fallback, if a future suburb can't be matched:** a frozen snapshot of the
pre-round-3 Voronoi cells is kept at
`scripts/data/cache/suburb-voronoi-fallback.geojson` purely as a last resort.
If a suburb is ever added whose name can't be matched to a real Census Place,
the script falls back to that suburb's old Voronoi cell and tags **only**
that one feature `geometrySource: "voronoi-illustrative"`, logging a warning,
rather than dropping it from the map. As of this round that fallback path is
not exercised — all 102 current suburbs matched a real boundary.

**Honest caveat — real boundaries do not tile edge-to-edge.** This is the
core behavioral difference from the old Voronoi tessellation, and it's
expected and correct, not a bug: there is real unincorporated land between
many Chicagoland towns (and along parts of Chicago's own edge) that belongs
to no modeled municipality. The map will now show gaps in places it
previously didn't — those gaps are more geographically honest than the old
fully-tiled illustration was, not a regression. This script does not attempt
to force those gaps closed, pad boundaries to close them, or otherwise
fabricate coverage.

`@turf/turf` remains a **devDependency only** (used here for polygon
simplification, area comparison, point-in-polygon disambiguation, and
distance calculations) — this script runs once, by hand, at data-authoring
time (`npm run geo:generate`), never as part of `npm run dev` or
`npm run build`, and is never imported anywhere under `src/`; the app only
ever loads the static generated GeoJSON file. `d3-delaunay` (used only for
the old Voronoi computation) is no longer a dependency at all, since nothing
in the new pipeline computes a Voronoi diagram.

The official Chicago polygons continue to be simplified with the same
Ramer–Douglas–Peucker pass (~65–80m tolerance) and rounded to 4 decimal
places (~11m); multi-part polygons were reduced to their largest ring, so
small detached exclaves are dropped. **Not survey-accurate — do not use for
anything requiring precise parcel-level boundaries**, for Chicago or for the
suburbs.

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
   `src/data/geo/neighborhoods.geojson` directly.** Since round 3, suburb
   shapes are fetched real Census Place boundaries, not hand-drawn or
   computed shapes. Instead:
   - If you added a new **Chicago community area** (shouldn't happen now
     that all 77 are covered, but if the Data Portal's community-area
     boundaries are ever redrawn): add it to
     `scripts/data/community-areas-new.mjs` and rerun
     `npm run data:generate` to fetch + simplify its real polygon into
     `scripts/data/cache/chicago-77-official.geojson`.
   - If you added a new **suburb**: nothing further needed here as long as
     its `name` in `neighborhoods.json` matches (or closely resembles) its
     real Census Place name — `generate-geometry.mjs` matches by name
     automatically. If the new suburb's name happens to repeat elsewhere in
     Illinois, double-check its `centroid` is accurate, since that's what
     disambiguates same-named candidates (see "How the suburb shapes are
     generated" above).
   - Then run `npm run geo:generate` to rebuild
     `src/data/geo/neighborhoods.geojson` from scratch. If the new suburb's
     name can't be matched to any real Census Place, the script throws
     rather than silently dropping it: the Voronoi fallback cache
     (`scripts/data/cache/suburb-voronoi-fallback.geojson`) only covers the
     102 suburbs that existed as of round 3, so a brand-new suburb has no
     fallback geometry available yet. In that case, fix the name/spelling to
     match the real Census Place first; only hand-supply a fallback entry in
     that cache file as a last resort if no real boundary can be found at
     all.
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
