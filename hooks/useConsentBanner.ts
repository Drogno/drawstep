import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Constants for localStorage keys
const CONSENT_STORAGE_KEY = 'drawstep_telemetry_consent'
const CONSENT_SHOWN_KEY = 'drawstep_consent_banner_shown'

interface ConsentState {
  /** Whether consent banner should be visible */
  showBanner: boolean
  /** Current consent status */
  hasConsented: boolean | null
  /** Whether consent decision has been made */
  hasDecided: boolean
  /** Current user */
  user: User | null
  /** Whether hook is still loading */
  isLoading: boolean
}

interface ConsentActions {
  /** Grant consent */
  grantConsent: () => Promise<void>
  /** Deny consent */
  denyConsent: () => Promise<void>
  /** Dismiss banner (navigate to settings) */
  dismissBanner: () => void
  /** Reset consent (for testing) */
  resetConsent: () => void
  /** Check current consent status */
  getConsentStatus: () => boolean | null
}

export const useConsentBanner = () => {
  const [state, setState] = useState<ConsentState>({
    showBanner: false,
    hasConsented: null,
    hasDecided: false,
    user: null,
    isLoading: true
  })

  const supabase = getSupabaseBrowserClient()

  // Get current consent status from localStorage
  const getLocalConsent = useCallback((): boolean | null => {
    try {
      const consent = localStorage.getItem(CONSENT_STORAGE_KEY)
      return consent === null ? null : consent === 'true'
    } catch {
      return null
    }
  }, [])

  // Check if banner should be shown
  const shouldShowBanner = useCallback((user: User | null): boolean => {
    if (!user) return false

    const hasConsented = getLocalConsent()
    const hasBeenShown = localStorage.getItem(CONSENT_SHOWN_KEY)

    // Don't show if already decided
    if (hasConsented !== null) return false

    // Show only once per browser session after login
    return !hasBeenShown
  }, [getLocalConsent])

  // Save consent decision
  const saveConsent = useCallback(async (consented: boolean) => {
    try {
      // Store in localStorage immediately
      localStorage.setItem(CONSENT_STORAGE_KEY, consented.toString())
      localStorage.setItem(CONSENT_SHOWN_KEY, 'true')

      // TODO: Store consent in database when user is logged in
      // For now, localStorage is sufficient

      // Update state
      setState(prev => ({
        ...prev,
        showBanner: false,
        hasConsented: consented,
        hasDecided: true
      }))

      console.log('Telemetry consent:', consented ? 'granted' : 'denied')
    } catch (err) {
      console.error('Error saving consent:', err)
      throw err
    }
  }, [state.user, supabase])

  // Actions
  const actions: ConsentActions = {
    grantConsent: () => saveConsent(true),

    denyConsent: () => saveConsent(false),

    dismissBanner: () => {
      localStorage.setItem(CONSENT_SHOWN_KEY, 'true')
      setState(prev => ({
        ...prev,
        showBanner: false
      }))
    },

    resetConsent: () => {
      try {
        localStorage.removeItem(CONSENT_STORAGE_KEY)
        localStorage.removeItem(CONSENT_SHOWN_KEY)

        setState(prev => ({
          ...prev,
          showBanner: shouldShowBanner(prev.user),
          hasConsented: null,
          hasDecided: false
        }))

        console.log('Consent state reset')
      } catch (err) {
        console.error('Error resetting consent:', err)
      }
    },

    getConsentStatus: () => getLocalConsent()
  }

  // Initialize and handle auth changes
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user || null

        // Get current consent status
        const consent = getLocalConsent()

        // Determine if banner should be shown
        const showBanner = shouldShowBanner(currentUser)

        setState({
          showBanner,
          hasConsented: consent,
          hasDecided: consent !== null,
          user: currentUser,
          isLoading: false
        })
      } catch (err) {
        console.error('Error initializing consent banner hook:', err)
        setState(prev => ({
          ...prev,
          isLoading: false
        }))
      }
    }

    initialize()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUser = session?.user || null

        setState(prev => {
          const newShowBanner = event === 'SIGNED_IN'
            ? shouldShowBanner(newUser)
            : false

          return {
            ...prev,
            user: newUser,
            showBanner: newShowBanner,
            isLoading: false
          }
        })

        // Log auth events for debugging
        if (event === 'SIGNED_IN') {
          console.log('User signed in, checking consent banner visibility')
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, hiding consent banner')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, shouldShowBanner, getLocalConsent])

  return {
    ...state,
    ...actions
  }
}

// Standalone utility functions for checking consent
export const getConsentStatus = (): boolean | null => {
  try {
    const consent = localStorage.getItem(CONSENT_STORAGE_KEY)
    return consent === null ? null : consent === 'true'
  } catch {
    return null
  }
}

export const hasUserConsented = (): boolean => {
  return getConsentStatus() === true
}

export const hasUserDecidedConsent = (): boolean => {
  return getConsentStatus() !== null
}

// Clear all consent data (for testing/admin)
export const clearConsentData = (): void => {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY)
    localStorage.removeItem(CONSENT_SHOWN_KEY)
    console.log('All consent data cleared')
  } catch (err) {
    console.error('Error clearing consent data:', err)
  }
}