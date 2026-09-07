# Chicagoland — Team Contract

This is the shared interface both teammates build against so their work
integrates cleanly without stepping on each other's files. The lead developer
owns merging both branches into `main` at the end.

## File ownership (avoid touching the other side's files)

**Data/Geography Engineer owns:**
- `src/data/*.json` (all datasets)
- `src/data/geo/*.geojson`
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

There are currently only 6 seed neighborhoods (Logan Square, Lincoln Park,
Avondale, Pilsen, Evanston, Oak Park) with clearly-labeled `"estimated"`
placeholder figures. The Data/Geography engineer's job is to replace these
with real sourced data and expand coverage significantly (see their brief).
The Frontend engineer should build entirely against the accessor functions
above, not against the current 6 IDs, so the UI scales automatically as the
dataset grows.

## Non-negotiables (from the product spec)

- No backend, no database, no server API, no auth. Everything is static
  frontend data loaded at build time.
- Every non-trivial numeric claim traces back to a `DataSourceMeta` with
  `source`, `geographicLevel`, `year`, and `valueType` (`actual` |
  `calculated` | `estimated`). Never present an estimate as official.
- The core deliverable is "Estimated Annual Disposable Income" per
  neighborhood, clearly labeled as an MVP estimate.
