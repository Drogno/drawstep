'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface ConsentBannerProps {
  /** Force show the banner (for testing) */
  forceShow?: boolean
  /** Custom CSS classes */
  className?: string
  /** Position of the banner */
  position?: 'top' | 'bottom'
  /** Custom consent message */
  message?: string
  /** Callback when consent is given */
  onConsent?: (consented: boolean) => void
}

// Constants for localStorage keys
const CONSENT_STORAGE_KEY = 'drawstep_telemetry_consent'
const CONSENT_SHOWN_KEY = 'drawstep_consent_banner_shown'

const ConsentBanner = ({
  forceShow = false,
  className = '',
  position = 'bottom',
  message,
  onConsent
}: ConsentBannerProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const supabase = getSupabaseBrowserClient()

  // Check if consent banner should be shown
  const shouldShowBanner = useCallback(() => {
    if (forceShow) return true

    // Don't show if user hasn't logged in
    if (!user) return false

    // Check if already consented or explicitly dismissed
    const hasConsented = localStorage.getItem(CONSENT_STORAGE_KEY)
    const hasBeenShown = localStorage.getItem(CONSENT_SHOWN_KEY)

    // Don't show if already handled
    if (hasConsented === 'true' || hasConsented === 'false') {
      return false
    }

    // Show only once per browser session after login
    return !hasBeenShown
  }, [forceShow, user])

  // Handle consent decision
  const handleConsent = useCallback(async (consented: boolean) => {
    setIsLoading(true)

    try {
      // Store in localStorage immediately
      localStorage.setItem(CONSENT_STORAGE_KEY, consented.toString())
      localStorage.setItem(CONSENT_SHOWN_KEY, 'true')

      // TODO: Store consent in database when user is logged in
      // For now, localStorage is sufficient

      // Hide banner
      setIsVisible(false)

      // Call optional callback
      if (onConsent) {
        onConsent(consented)
      }

      console.log('Telemetry consent:', consented ? 'granted' : 'denied')
    } catch (err) {
      console.error('Error saving consent:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase, onConsent])

  // Handle settings navigation
  const handleOpenSettings = useCallback(() => {
    // Mark as shown to prevent re-appearance
    localStorage.setItem(CONSENT_SHOWN_KEY, 'true')
    setIsVisible(false)
  }, [])

  // Initialize component
  useEffect(() => {
    const initializeBanner = async () => {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)

        // Check if banner should be shown
        if (session?.user && shouldShowBanner()) {
          setIsVisible(true)
        }
      } catch (err) {
        console.error('Error initializing consent banner:', err)
      }
    }

    initializeBanner()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUser = session?.user || null
        setUser(newUser)

        // Show banner on login if not already handled
        if (event === 'SIGNED_IN' && newUser && shouldShowBanner()) {
          // Small delay to let the UI settle
          setTimeout(() => {
            setIsVisible(true)
          }, 1000)
        } else if (event === 'SIGNED_OUT') {
          setIsVisible(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, shouldShowBanner])

  // Don't render if not visible
  if (!isVisible) return null

  const defaultMessage = "We collect data from your mulligan training sessions to display your personal statistics and improve your training experience."

  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0'
  }

  return (
    <div className={`fixed left-0 right-0 z-50 ${positionClasses[position]} ${className}`}>
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Message */}
            <div className="flex-1">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    {message || defaultMessage}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Your data is private and only visible to you. You can change this setting anytime.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                href="/user/settings"
                onClick={handleOpenSettings}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Settings
              </Link>

              <button
                onClick={() => handleConsent(true)}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Accept'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsentBanner