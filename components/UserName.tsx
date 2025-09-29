'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Profile {
  username: string
}

interface UserNameProps {
  /** Custom CSS classes to apply */
  className?: string
  /** Show loading skeleton while fetching username */
  showSkeleton?: boolean
  /** Fallback text when username is not available */
  fallback?: string
  /** Optional user object to avoid re-fetching */
  user?: User | null
  /** Optional username to display directly (bypasses database fetch) */
  username?: string
  /** Whether to render as a link (default: true) */
  asLink?: boolean
  /** Custom link destination (default: /user) */
  href?: string
  /** Show user avatar/initial alongside name */
  showAvatar?: boolean
  /** Size variant for different use cases */
  size?: 'sm' | 'md' | 'lg'
  /** Style variant */
  variant?: 'default' | 'subtle' | 'highlighted'
  /** Truncate long usernames */
  truncate?: boolean
  /** Maximum length before truncation */
  maxLength?: number
  /** Show tooltip with full username on hover when truncated */
  showTooltip?: boolean
}

const UserName = ({
  className = '',
  showSkeleton = true,
  fallback = 'User',
  user,
  username: providedUsername,
  asLink = true,
  href = '/user',
  showAvatar = false,
  size = 'md',
  variant = 'default',
  truncate = false,
  maxLength = 20,
  showTooltip = false
}: UserNameProps) => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(user || null)
  const [isLoading, setIsLoading] = useState(!providedUsername && !user)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    // If username is provided directly, no need to fetch
    if (providedUsername) {
      setProfile({ username: providedUsername })
      setIsLoading(false)
      return
    }

    const fetchUserAndProfile = async () => {
      try {
        let userToUse = user

        // Get current user if not provided
        if (!userToUse) {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.user) {
            setIsLoading(false)
            return
          }
          userToUse = session.user
          setCurrentUser(userToUse)
        }

        // Fetch user profile
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userToUse.id)
          .single()

        if (error) {
          console.warn('Error fetching user profile:', error)
          setError('Failed to load username')
          setProfile({ username: fallback })
        } else if (profileData) {
          setProfile(profileData)
        } else {
          setProfile({ username: fallback })
        }
      } catch (err) {
        console.error('Error in fetchUserAndProfile:', err)
        setError('Failed to load username')
        setProfile({ username: fallback })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndProfile()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setCurrentUser(session.user)
          setIsLoading(true)
          // Re-fetch profile for new user
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single()

          if (profileData) {
            setProfile(profileData)
          } else {
            setProfile({ username: fallback })
          }
          setIsLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null)
          setProfile(null)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, user, providedUsername, fallback])

  // Generate size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  // Generate variant classes
  const variantClasses = {
    default: 'text-gray-900 hover:text-indigo-600',
    subtle: 'text-gray-600 hover:text-gray-800',
    highlighted: 'text-indigo-600 hover:text-indigo-700'
  }

  // Generate avatar size classes
  const avatarSizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }

  const displayName = profile?.username || fallback
  const shouldTruncate = truncate && displayName.length > maxLength
  const truncatedName = shouldTruncate
    ? displayName.substring(0, maxLength) + '...'
    : displayName

  // Loading skeleton
  if (isLoading && showSkeleton) {
    return (
      <div className={`animate-pulse flex items-center space-x-2 ${className}`}>
        {showAvatar && (
          <div className={`bg-gray-300 rounded-full ${avatarSizeClasses[size]}`}></div>
        )}
        <div className={`bg-gray-300 rounded h-4 w-16 ${sizeClasses[size]}`}></div>
      </div>
    )
  }

  // Error state
  if (error && !profile) {
    return (
      <span className={`text-gray-400 ${sizeClasses[size]} ${className}`}>
        {fallback}
      </span>
    )
  }

  // Avatar component
  const Avatar = showAvatar ? (
    <div className={`bg-indigo-600 rounded-full flex items-center justify-center ${avatarSizeClasses[size]}`}>
      <span className="font-bold text-white">
        {displayName.charAt(0).toUpperCase()}
      </span>
    </div>
  ) : null

  // Username content
  const usernameContent = (
    <>
      {Avatar}
      <span
        className={shouldTruncate && showTooltip ? 'cursor-help' : ''}
        title={shouldTruncate && showTooltip ? displayName : undefined}
      >
        {truncatedName}
      </span>
    </>
  )

  // Render as link or plain text
  if (asLink && (currentUser || providedUsername)) {
    return (
      <Link
        href={href}
        className={`inline-flex items-center space-x-2 font-medium transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        {usernameContent}
      </Link>
    )
  }

  return (
    <div className={`inline-flex items-center space-x-2 ${sizeClasses[size]} ${className}`}>
      {usernameContent}
    </div>
  )
}

export default UserName

// Export type for external use
export type { UserNameProps }