import { DEFAULT_PROFILE, type UserProfile } from '../types'

const STORAGE_KEY = 'chicagoland.userProfile.v1'
const ONBOARDED_KEY = 'chicagoland.hasOnboarded.v1'

/**
 * Only validates the fields that predate the salary/hourly split — a
 * profile saved before that change won't have incomeType/hourlyRate/
 * hoursPerWeek, and the merge with DEFAULT_PROFILE below fills those in
 * rather than rejecting the whole saved profile over missing new fields.
 */
function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.annualIncome === 'number' &&
    (v.maritalStatus === 'single' || v.maritalStatus === 'married') &&
    typeof v.numChildren === 'number' &&
    (v.housingChoice === 'rent' || v.housingChoice === 'own') &&
    typeof v.bedrooms === 'number' &&
    typeof v.ownsCar === 'boolean' &&
    typeof v.annualMilesDriven === 'number' &&
    typeof v.commuteDestination === 'string'
  )
}

export function loadProfile(): UserProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed: unknown = JSON.parse(raw)
    if (isUserProfile(parsed)) return { ...DEFAULT_PROFILE, ...parsed }
  } catch {
    // Corrupt or inaccessible storage — fall back to defaults silently.
  }
  return DEFAULT_PROFILE
}

export function saveProfile(profile: UserProfile): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // Storage may be unavailable (private browsing, quota). Non-fatal.
  }
}

export function hasOnboarded(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDED_KEY) === 'true'
  } catch {
    return false
  }
}

export function markOnboarded(): void {
  try {
    window.localStorage.setItem(ONBOARDED_KEY, 'true')
  } catch {
    // Non-fatal.
  }
}
