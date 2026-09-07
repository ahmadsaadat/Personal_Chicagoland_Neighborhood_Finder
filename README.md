# Chicagoland

**Find the right place to live.** Chicagoland is a static, client-only web app that helps
people compare Chicago-area neighborhoods by the real financial and lifestyle consequences
of living there — taxes, housing, transportation, and everyday cost of living — and
estimates an **Annual Disposable Income** for each area based on a simple personal profile.

It answers one question well: *given my income, family situation, and how I'd live,
which Chicagoland neighborhoods leave me with the most money and the best fit?*

This is an MVP. All tax and cost figures are clearly-labeled estimates for comparing
locations against each other — **not tax, legal, or financial advice.**

## What's inside

- A full-viewport interactive map of Chicagoland — all 77 official Chicago community areas
  plus 102 surrounding suburbs across 6 counties (Cook, DuPage, Lake, Will, Kane, McHenry),
  all using real municipal boundary geometry (U.S. Census TIGER/Line) — color-coded by any
  of 9 selectable metrics on a blue (better for you) to red (worse for you) diverging scale
- A live profile editor (income, rent, family, car, commute, spending) in the side panel —
  every number drives the map's calculations in real time, saved locally in your browser
- A neighborhood detail panel breaking down Housing / Taxes / Transportation / Cost of
  Living / Lifestyle for any area, with every estimate's assumptions surfaced in plain language
- Side-by-side comparison of up to 3 neighborhoods
- A "Best places for you" ranked list with a plain-language reason for each match

## Tech stack

React 19 + TypeScript + Vite + Tailwind CSS v4 + Leaflet/react-leaflet (OpenStreetMap
tiles, no API key required). **There is no backend, database, or server API of any kind.**
Every dataset ships as static JSON/GeoJSON inside the built app, and calculations run
entirely in the browser.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`). That's it — no
environment variables, no API keys, no external services to configure.

Other scripts:

```bash
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build locally
npm run lint      # ESLint
```

## Deploying as a static site

`npm run build` produces a fully static `dist/` folder (`vite.config.ts` uses a relative
`base: './'` so it works from any path, including a subdirectory). Deploy `dist/` to any
static host — Netlify, Vercel, GitHub Pages, Cloudflare Pages, or a plain S3/object-storage
bucket behind a CDN. No server-side rendering, functions, or backend infrastructure are
required.

## Project structure

```
src/
  components/     UI components (layout, profile, panel, compare, neighborhood, common)
  pages/          Top-level view (ExplorePage — the app opens directly onto the map)
  map/            Leaflet map, metric picker, GeoJSON loading
  hooks/          React hooks (profile persistence, compare selection, derived entries)
  utils/          UI-only helpers (formatting, color scales, derived metrics)
  types/          Shared TypeScript contracts (geography, data, profile, finance)
  data/           Static datasets (JSON) + geo/ (GeoJSON) + index.ts (accessor functions)
  calculations/   calculateTaxes, calculateFinancialSummary, rankNeighborhoods
docs/
  CONTRACT.md       Internal team contract: file ownership + data interfaces
  DATA_SOURCES.md   Full data provenance catalogue + "add a neighborhood" walkthrough
scripts/
  generate-dataset.mjs   One-time data-authoring script (`npm run data:generate`)
  generate-geometry.mjs  One-time boundary-fetching script (`npm run geo:generate`)
```

The two `scripts/*.mjs` files are dev-only tooling that produce the static files in
`src/data/**` — they never run as part of `npm run dev`/`npm run build`, and their
geometry library (`@turf/turf`) is a devDependency only, never shipped to the browser.

The app only ever touches data through the functions exported from `src/data/index.ts`
and `src/calculations/*` — no component hardcodes neighborhood data, so the dataset can
grow without UI changes.

## How the data is structured

Chicagoland geography isn't flat, so the data model isn't either:

```
County → Municipality → Tax Jurisdiction → Neighborhood
```

A ZIP code is treated as neither a neighborhood nor a tax jurisdiction — different
datasets legitimately use different geographic units (property tax aggregates by
jurisdiction, rent by neighborhood, transit by proximity), and the types in
`src/types/geo.ts` model that explicitly instead of flattening everything to ZIP.

Every non-trivial numeric value carries a `DataSourceMeta`:

```ts
{
  source: string          // e.g. "City of Chicago Data Portal"
  geographicLevel: string // e.g. "neighborhood", "tax-jurisdiction"
  year: number | string
  valueType: 'actual' | 'calculated' | 'estimated'
  notes?: string
}
```

`actual` means pulled from or directly reflecting a cited public dataset; `calculated`
means deterministically derived from actual data; `estimated` means an informed MVP
placeholder, calibrated to realistic relative differences between areas but not sourced
from a live feed. **The app never presents an estimate as authoritative** — the
neighborhood detail panel's "How we estimate this" disclosure surfaces the underlying
assumptions in plain language.

## Data sources

See **[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md)** for the complete, field-by-field
catalogue. Summary:

| Category | Real / actual | Estimated (MVP placeholder) |
|---|---|---|
| Geography | All 77 official Chicago community-area boundaries (City of Chicago Data Portal) and all 102 suburb municipal boundaries (Census TIGER/Line "Places"), real centroids, county/municipality assignments | — |
| Taxes | IL flat 4.95% income tax, no local income tax, 2024 federal bracket structure | Combined sales tax rates, federal bracket *vintage* (drifts yearly), vehicle fees |
| Transportation | CTA/Metra lines actually serving each area | Transit/walk scores, commute times, parking cost |
| Housing | — | Median rent/home price, effective property tax rate |
| Cost of living | — | Groceries, utilities, restaurants, healthcare, other |
| Lifestyle | — | Walkability, transit access, safety indicator (explicitly **not** a crime stat), family-friendliness |

Production-ready replacements for every estimated field are named in
`docs/DATA_SOURCES.md` (Zillow ZORI/ZHVI, County Assessors, Census ACS, Walk Score API,
Chicago Data Portal crime/park data, BLS Consumer Expenditure Survey, IL Dept. of
Revenue rate tables, Census TIGER/Line).

## Known limitations

- **179 neighborhoods modeled** (all 77 official Chicago community areas + 102 suburbs
  across 6 counties) — a large but still finite slice of Chicagoland, not literally every
  town in the metro area.
- **Real boundaries don't tile edge-to-edge.** Both Chicago's 77 community areas and all
  102 suburbs now use real municipal boundary geometry, simplified only for file size. That
  means the map shows genuine gaps where unincorporated land sits between towns (and along
  parts of Chicago's own edge) — that's geographically accurate, not a bug, and it's
  explained in `docs/DATA_SOURCES.md`.
- **One tax jurisdiction per municipality** — real Illinois sales tax can vary by special
  taxing district within a municipality; this MVP doesn't model that granularity.
- **Federal tax brackets are pinned to 2024** and will drift from the current tax year
  over time; Illinois' January 2026 grocery-tax repeal is only partially modeled (see
  `src/calculations/taxes.ts`).
- **The profile assumes renting.** There's no "buy" option in the UI — every estimate is
  built around a monthly rent figure you enter yourself.
- This is **not** a tax filing tool, mortgage calculator, or financial advisory product.

## How to add new neighborhoods

Full step-by-step walkthrough (which files to touch, in what order) is in
[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md#how-to-add-a-new-neighborhood). In short:
add entries to `src/data/counties.json` → `municipalities.json` → `taxJurisdictions.json`
→ `neighborhoods.json` → the four per-category dataset files, then either add a GeoJSON
feature by hand or — for a new suburb — just re-run `npm run geo:generate` to fetch its
real municipal boundary from the Census TIGERweb service. Run `npm run build` afterward
to confirm nothing broke.

## How this was built

Built by a 3-person team: a Frontend/UX engineer (React UI, map, design), a
Data/Geography engineer (dataset, geography model, tax/financial calculation engine),
and a QA/Product engineer (functional testing and acceptance review), coordinated by a
lead developer who defined the shared data contract up front and merged everyone's work.
See the final project report shared alongside this repo for team responsibilities,
sources, and recommended next steps.
