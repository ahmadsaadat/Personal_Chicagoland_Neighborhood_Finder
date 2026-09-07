# Chicagoland — Team Contract

This is the shared interface both teammates build against so their work
integrates cleanly without stepping on each other's files. The lead developer
owns merging both branches into `main` at the end.

## File ownership (avoid touching the other side's files)

**Data/Geography Engineer owns:**
- `src/data/*.json` (all datasets)
- `src/data/geo/*.geojson`
- `scripts/**` — one-time, dev-only data/geometry-authoring scripts (never
  imported by the app; see `docs/DATA_SOURCES.md`)
- `src/data/index.ts` (the accessor/loader module — you may add new exported
  functions, but do not remove or change the signature of existing ones
  without flagging it in your final report)
- `src/calculations/taxes.ts`, `src/calculations/financial.ts`,
  `src/calculations/ranking.ts`
- `src/types/*.ts` — you may EXTEND interfaces (add optional fields) if a
  dataset needs it, but do not rename or remove existing fields, since the
  frontend is being built against the current shape concurrently.

**Frontend/UX Engineer owns:**
- `src/components/*`, `src/pages/*`, `src/map/*`, `src/hooks/*`
- `src/utils/*` (UI-only helpers; not data or tax logic)
- `src/App.tsx`, `src/main.tsx`, `src/index.css`
- You consume data exclusively through the functions exported from
  `src/data/index.ts` and `src/calculations/*` — never hardcode neighborhood
  data in components.

If you find you need a change on the other side (a new field, a new accessor
function), make the change anyway if it's additive and low-risk (new optional
field, new function), and clearly call it out in your final summary so the
lead can reconcile it at merge time. Do not delete or rename anything the
other engineer already committed.

## The current data contract (already implemented, do not break)

`src/types/index.ts` re-exports everything from `geo.ts`, `data.ts`,
`profile.ts`, `finance.ts`. Key shapes:

- `Neighborhood` — id, name, type (`chicago-community-area` | `suburb`),
  countyId, municipalityId, taxJurisdictionId, centroid `[lng, lat]`,
  settlementPattern, geoFeatureId (matches a GeoJSON feature's
  `properties.id`).
- `NeighborhoodProfile` — `{ housing, transportation, costOfLiving, lifestyle }`,
  one joined object per neighborhood.
- `UserProfile` — the onboarding form shape (income, marital status,
  children, rent/own, bedrooms, car ownership, miles driven, commute
  destination, monthly spending). See `DEFAULT_PROFILE` for sane defaults.
- `FinancialSummary` — the output of `calculateFinancialSummary(profile,
  neighborhoodId)`: taxes breakdown, housing/transportation/everyday annual
  costs, `totalAnnualCost`, and `estimatedDisposableIncome`.
- `MapMetric` — the union of metrics the choropleth can color by.

`src/data/index.ts` exports: `getNeighborhoods()`, `getNeighborhood(id)`,
`getNeighborhoodProfile(id)`, `getAllNeighborhoodProfiles()`,
`getCounty(id)`, `getMunicipality(id)`, `getTaxJurisdiction(id)`.

`src/calculations/financial.ts` exports `calculateFinancialSummary(profile,
neighborhoodId)` and `calculateFinancialSummaries(profile, neighborhoodIds)`.

`src/calculations/ranking.ts` exports `rankNeighborhoods(profile,
neighborhoodIds?)` returning a sorted array with a human-readable `reason`
string per neighborhood — this powers "Best places for you".

`src/calculations/taxes.ts` exports `calculateTaxes(input)` — a modular,
clearly-labeled-as-approximate federal/state/sales/property/vehicle tax
estimate. Every result carries an `assumptions: string[]` array meant to be
shown to the user (e.g. in a tooltip or footnote), never presented as
authoritative tax advice.

**Update (round 1):** the dataset was expanded from the original 6 seed
neighborhoods to 57 (35 Chicago community areas + 22 Chicagoland suburbs
across Cook, DuPage, Lake, Will, and Kane counties). Real, well-known facts
(official Chicago community area boundaries, county/municipality assignments,
actual CTA/Metra rail lines, Illinois' flat income tax and lack of local
income tax) are marked `"actual"`; harder-to-source figures (rents, home
prices, walk/transit scores, safety/lifestyle indices) remain informed
`"estimated"` placeholders calibrated to realistic relative differences
between areas, each with a `source` note naming the real dataset that should
replace it. `src/data/index.ts` also gained additive accessors
(`getCounties`, `getMunicipalities`, `getTaxJurisdictions`,
`getNeighborhoodsByCounty`, `getNeighborhoodsByMunicipality`,
`getNeighborhoodsByType`, `getNeighborhoodsByTaxJurisdiction`,
`getNeighborhoodHierarchy`) — none of the original 7 exported functions were
removed or had their signatures changed.

**Update (round 2):** the map's coverage gaps are fixed. The dataset now
covers all **77 official Chicago community areas** (up from 35) and **102
Chicagoland suburbs** across **6 counties** (Cook, DuPage, Lake, Will, Kane,
and new-this-round McHenry) — **179 neighborhoods** total. The 42 newly
added community areas and 80 newly added suburbs follow the same
`"actual"`/`"calculated"`/`"estimated"` discipline as round 1, calibrated
against the real round-1 data via a fitted regression (see
`scripts/data/lib.mjs`) so new figures land consistently on the existing
relative scale rather than being invented independently.

More importantly, `src/data/geo/neighborhoods.geojson` was regenerated
end-to-end: it's no longer 35 real polygons plus 22 illustrative squares with
huge gaps between them. It's now the 77 real Chicago polygons (unchanged,
still authoritative) plus a **Voronoi tessellation** of all 102 suburb
centroids — a computed partition where every location on the map belongs to
whichever town's centroid is nearest, clipped to a real 6-county extent and
carved around the real Chicago boundary — so the map is fully, contiguously
tiled with no gaps and no overlaps anywhere in the modeled region. This is
generated by a new one-time, dev-only script,
`scripts/generate-tessellation.mjs` (run via `npm run geo:generate`), using
two new **devDependencies-only** libraries, `d3-delaunay` and `@turf/turf` —
neither is imported anywhere under `src/`; the app still only ever loads a
static GeoJSON file, exactly as before. Every suburb feature is tagged
`properties.geometrySource: "voronoi-illustrative"` so it's never confused
with a real municipal boundary — see `docs/DATA_SOURCES.md` for the full
plain-language explanation of the methodology, its outer-boundary basis, and
its known limitations.

See `docs/DATA_SOURCES.md` for the full catalogue and a walkthrough for
adding more neighborhoods. The Frontend engineer should continue building
entirely against the accessor functions, not hardcoded IDs, so the UI scales
automatically as the dataset grows further.

## Non-negotiables (from the product spec)

- No backend, no database, no server API, no auth. Everything is static
  frontend data loaded at build time.
- Every non-trivial numeric claim traces back to a `DataSourceMeta` with
  `source`, `geographicLevel`, `year`, and `valueType` (`actual` |
  `calculated` | `estimated`). Never present an estimate as official.
- The core deliverable is "Estimated Annual Disposable Income" per
  neighborhood, clearly labeled as an MVP estimate.
