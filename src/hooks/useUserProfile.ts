import { useCallback, useState } from 'react'
import { DEFAULT_PROFILE, type UserProfile } from '../types'
import { hasOnboarded, loadProfile, markOnboarded, saveProfile } from '../utils/profileStorage'

export interface UseUserProfileResult {
  profile: UserProfile
  updateProfile: (next: UserProfile) => void
  resetProfile: () => void
  /** True once the user has saved a profile at least once (vs. still on DEFAULT_PROFILE). */
  isOnboarded: boolean
}

/** Loads/persists the UserProfile in localStorage so it survives a refresh. */
export function useUserProfile(): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile())
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => hasOnboarded())

  const updateProfile = useCallback((next: UserProfile) => {
    setProfile(next)
    saveProfile(next)
    markOnboarded()
    setIsOnboarded(true)
  }, [])

  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_PROFILE)
    saveProfile(DEFAULT_PROFILE)
  }, [])

  return { profile, updateProfile, resetProfile, isOnboarded }
}
