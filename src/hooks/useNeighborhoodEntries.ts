import { useMemo } from 'react'
import { getAllNeighborhoodProfiles } from '../data'
import { calculateFinancialSummary } from '../calculations/financial'
import type { UserProfile } from '../types'
import type { NeighborhoodEntry } from '../utils/metrics'

/**
 * Joins every neighborhood + its profile with a freshly computed
 * FinancialSummary for the current user profile. This is the single place
 * the frontend combines data + calculations, so the rest of the UI never
 * has to know about getAllNeighborhoodProfiles() or calculateFinancialSummary()
 * directly. Recomputes only when the profile changes.
 */
export function useNeighborhoodEntries(profile: UserProfile): NeighborhoodEntry[] {
  return useMemo(() => {
    const base = getAllNeighborhoodProfiles()
    const entries: NeighborhoodEntry[] = []
    for (const { neighborhood, profile: nProfile } of base) {
      const summary = calculateFinancialSummary(profile, neighborhood.id)
      if (!summary) continue
      entries.push({ neighborhood, profile: nProfile, summary })
    }
    return entries
  }, [profile])
}
