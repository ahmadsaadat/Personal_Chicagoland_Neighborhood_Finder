import { getAllNeighborhoodProfiles } from '../data'
import type { UserProfile } from '../types'
import { calculateFinancialSummary } from './financial'

export interface RankedNeighborhood {
  neighborhoodId: string
  score: number
  disposableIncome: number
  commuteMinutes: number
  rent2BR: number
  reason: string
}

/**
 * Ranks neighborhoods for "Best places for you" using a simple, explainable
 * weighted score: disposable income matters most, then commute time, then
 * overall lifestyle fit (walkability + transit +, for families, the family
 * friendliness score). This is intentionally transparent rather than a black
 * box — the weights are visible right here and the UI surfaces the top
 * contributing factors in plain language.
 */
export function rankNeighborhoods(
  profile: UserProfile,
  neighborhoodIds?: string[],
): RankedNeighborhood[] {
  const all = getAllNeighborhoodProfiles()
  const candidates = neighborhoodIds
    ? all.filter((entry) => neighborhoodIds.includes(entry.neighborhood.id))
    : all

  const summaries = candidates
    .map(({ neighborhood, profile: nProfile }) => {
      const summary = calculateFinancialSummary(profile, neighborhood.id)
      if (!summary) return undefined
      return { neighborhood, nProfile, summary }
    })
    .filter((e): e is NonNullable<typeof e> => Boolean(e))

  if (summaries.length === 0) return []

  const maxIncome = Math.max(...summaries.map((s) => s.summary.estimatedDisposableIncome))
  const minIncome = Math.min(...summaries.map((s) => s.summary.estimatedDisposableIncome))
  const incomeRange = maxIncome - minIncome || 1

  const maxCommute = Math.max(...summaries.map((s) => s.nProfile.transportation.avgCommuteMinutesToLoop))
  const minCommute = Math.min(...summaries.map((s) => s.nProfile.transportation.avgCommuteMinutesToLoop))
  const commuteRange = maxCommute - minCommute || 1

  const ranked = summaries.map(({ neighborhood, nProfile, summary }) => {
    const incomeScore = (summary.estimatedDisposableIncome - minIncome) / incomeRange
    const commuteScore =
      1 - (nProfile.transportation.avgCommuteMinutesToLoop - minCommute) / commuteRange
    const lifestyleScore =
      (nProfile.lifestyle.walkability +
        nProfile.lifestyle.transitAccess +
        (profile.numChildren > 0 ? nProfile.lifestyle.familyFriendliness : nProfile.lifestyle.restaurantDensity)) /
      300

    const score = incomeScore * 0.5 + commuteScore * 0.3 + lifestyleScore * 0.2

    const strengths: string[] = []
    if (incomeScore > 0.6) strengths.push('relatively low overall cost for your income')
    if (commuteScore > 0.6) strengths.push('a short commute')
    if (nProfile.lifestyle.transitAccess > 75) strengths.push('strong transit access')
    if (profile.numChildren > 0 && nProfile.lifestyle.familyFriendliness > 75) {
      strengths.push('family-friendly surroundings')
    }
    if (strengths.length === 0) strengths.push('a solid balance of cost, commute, and lifestyle')

    const reason = `${neighborhood.name} ranks highly because it combines ${strengths.join(' and ')}.`

    return {
      neighborhoodId: neighborhood.id,
      score,
      disposableIncome: summary.estimatedDisposableIncome,
      commuteMinutes: nProfile.transportation.avgCommuteMinutesToLoop,
      rent2BR: nProfile.housing.medianRent2BR,
      reason,
    }
  })

  return ranked.sort((a, b) => b.score - a.score)
}
