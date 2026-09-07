/**
 * Chicagoland geographic hierarchy.
 *
 * Different datasets legitimately use different geographic units (property
 * tax uses parcels aggregated to jurisdictions, rent uses ZIP/neighborhood,
 * schools use districts, etc). This file models the hierarchy explicitly so
 * the app never has to pretend a ZIP code is a neighborhood or a tax
 * jurisdiction.
 */

export type GeoLevel =
  | 'county'
  | 'municipality'
  | 'neighborhood'
  | 'zip'
  | 'tract'
  | 'school-district'
  | 'police-district'
  | 'tax-jurisdiction'

/** Every derived/estimated number in the app must carry this. */
export interface DataSourceMeta {
  /** Human-readable source, e.g. "U.S. Census ACS 5-Year Estimates". */
  source: string
  /** Optional link to the underlying dataset or documentation. */
  sourceUrl?: string
  /** Geographic level the underlying figure was published at. */
  geographicLevel: GeoLevel | string
  /** Year or vintage of the underlying figure. */
  year: number | string
  /**
   * actual     – taken directly from a cited public dataset
   * calculated – deterministically derived from one or more `actual` values
   * estimated  – illustrative/MVP placeholder, not sourced from an official dataset
   */
  valueType: 'actual' | 'calculated' | 'estimated'
  notes?: string
}

export interface County {
  id: string
  name: string
  state: 'IL'
}

export interface Municipality {
  id: string
  name: string
  countyId: string
  /** Chicago itself is one municipality containing many community areas. */
  isChicago: boolean
}

/**
 * A tax jurisdiction is NOT the same thing as a municipality or ZIP code.
 * Illinois sales tax is stacked (state + county + RTA + home-rule municipal +
 * special district), so the same municipality can contain more than one
 * effective combined rate. For the MVP we model one dominant jurisdiction per
 * neighborhood, sourced from the Illinois Department of Revenue's published
 * combined rates.
 */
export interface TaxJurisdiction {
  id: string
  name: string
  countyId: string
  /** Combined state + county + RTA + home-rule sales tax rate, e.g. 0.1025 */
  combinedSalesTaxRate: number
  /** Additional Chicago-style restaurant/food & beverage tax on top of sales tax, if any */
  restaurantTaxRate?: number
  meta: DataSourceMeta
}

export type NeighborhoodType =
  | 'chicago-community-area'
  | 'suburb'

export type SettlementPattern =
  | 'urban-core'
  | 'urban'
  | 'streetcar-suburb'
  | 'suburban'
  | 'transit-suburb'

/**
 * The consumer-facing unit of the whole app. Chicago's 77 official
 * "community areas" are treated as neighborhoods; surrounding municipalities
 * are treated as neighborhoods too (a suburb IS its own neighborhood for our
 * purposes, since that's how consumers think about it).
 */
export interface Neighborhood {
  id: string
  name: string
  type: NeighborhoodType
  countyId: string
  municipalityId: string
  taxJurisdictionId: string
  /** [longitude, latitude] */
  centroid: [number, number]
  settlementPattern: SettlementPattern
  /** Matches a `properties.id` in src/data/geo/*.geojson */
  geoFeatureId: string
  schoolDistrictName?: string
}
