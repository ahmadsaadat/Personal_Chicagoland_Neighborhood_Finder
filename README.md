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

- An interactive Leaflet map of 57 Chicagoland neighborhoods (35 Chicago community areas
  + 22 suburbs across Cook, DuPage, Lake, Will, and Kane counties), color-coded by any of
  9 selectable metrics (disposable income, rent, home price, tax burden, walkability, etc.)
- A simple onboarding profile (income, family, rent/own, car, commute, spending) that
  drives every calculation, saved locally in your browser
- A neighborhood detail panel breaking down Housing / Taxes / Transportation / Cost of
  Living / Lifestyle for any area, with every estimate's assumptions surfaced in plain language
- Filters (max rent, max home price, min disposable income, max commute, car/transit
  preference, walkability, family-friendliness, property tax, neighborhood type)
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
  components/     UI components (layout, profile, filters, compare, neighborhood, common)
  pages/          Top-level views (LandingPage, ExplorePage)
  map/            Leaflet map, choropleth, legend, GeoJSON loading
  hooks/          React hooks (profile persistence, compare selection, derived entries)
  utils/          UI-only helpers (formatting, filtering, color scales, derived metrics)
  types/          Shared TypeScript contracts (geography, data, profile, finance)
  data/           Static datasets (JSON) + geo/ (GeoJSON) + index.ts (accessor functions)
  calculations/   calculateTaxes, calculateFinancialSummary, rankNeighborhoods
docs/
  CONTRACT.md       Internal team contract: file ownership + data interfaces
  DATA_SOURCES.md   Full data provenance catalogue + "add a neighborhood" walkthrough
```

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
| Geography | Chicago's 35 official community-area boundaries (City of Chicago Data Portal), real centroids, county/municipality assignments | 22 suburb boundary shapes (illustrative squares around real centroids) |
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

- **57 of 77+ possible Chicagoland areas** are modeled — a solid MVP cross-section, not
  full coverage.
- **Suburb map boundaries are illustrative shapes**, not real municipal boundaries (real
  centroids and county/municipality assignments are accurate). Chicago's 35 community-area
  boundaries are real, simplified for file size.
- **One tax jurisdiction per municipality** — real Illinois sales tax can vary by special
  taxing district within a municipality; this MVP doesn't model that granularity.
- **Federal tax brackets are pinned to 2024** and will drift from the current tax year
  over time; Illinois' January 2026 grocery-tax repeal is only partially modeled (see
  `src/calculations/taxes.ts`).
- **Home purchase price is applied uniformly** across neighborhoods when you choose
  "own," to keep property-tax-rate comparisons apples-to-apples — it does not scale to
  each area's typical home price. The app discloses this directly in the neighborhood
  detail panel and in the tax assumptions.
- This is **not** a tax filing tool, mortgage calculator, or financial advisory product.

## How to add new neighborhoods

Full step-by-step walkthrough (which files to touch, in what order) is in
[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md#how-to-add-a-new-neighborhood). In short:
add entries to `src/data/counties.json` → `municipalities.json` → `taxJurisdictions.json`
→ `neighborhoods.json` → the four per-category dataset files → a GeoJSON feature — then
run `npm run build` to confirm nothing broke.

## How this was built

Built by a 3-person team: a Frontend/UX engineer (React UI, map, design), a
Data/Geography engineer (dataset, geography model, tax/financial calculation engine),
and a QA/Product engineer (functional testing and acceptance review), coordinated by a
lead developer who defined the shared data contract up front and merged everyone's work.
See the final project report shared alongside this repo for team responsibilities,
sources, and recommended next steps.
