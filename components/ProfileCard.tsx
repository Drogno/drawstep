'use client'

import { useState, useEffect } from 'react'
import UserName from './UserName'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface ProfileCardProps {
  user?: User | null
  className?: string
  showStats?: boolean
  compact?: boolean
}

interface UserStats {
  totalSessions: number
  totalHands: number
  joinedDate: string
}

const ProfileCard = ({
  user: providedUser,
  className = '',
  showStats = true,
  compact = false
}: ProfileCardProps) => {
  const [user, setUser] = useState<User | null>(providedUser || null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(!providedUser)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchUserAndStats = async () => {
      try {
        let userToUse = providedUser

        if (!userToUse) {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.user) {
            setIsLoading(false)
            return
          }
          userToUse = session.user
          setUser(userToUse)
        }

        if (showStats) {
          // Fetch user stats
          const { data: statsData } = await supabase
            .rpc('fn_user_stats', { uid: userToUse.id } as any)
            .single()

          if (statsData) {
            const stats = statsData as any
            setStats({
              totalSessions: stats.total_sessions || 0,
              totalHands: stats.total_events || 0,
              joinedDate: userToUse.created_at || ''
            })
          }
        }
      } catch (err) {
        console.error('Error fetching user stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndStats()

    // Listen for auth changes if no user provided
    if (!providedUser) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user || null)
          if (session?.user && showStats) {
            // Re-fetch stats for new user
            fetchUserAndStats()
          } else {
            setStats(null)
          }
        }
      )

      return () => subscription.unsubscribe()
    }
  }, [supabase, providedUser, showStats])

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
        {!compact && (
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-gray-300 rounded w-full"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          </div>
        )}
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>Please sign in to view your profile</p>
        </div>
      </div>
    )
  }

  const joinedDate = stats?.joinedDate
    ? new Date(stats.joinedDate).toLocaleDateString()
    : null

  if (compact) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <UserName
            user={user}
            showAvatar={true}
            size="md"
            asLink={false}
          />
          {stats && (
            <div className="text-sm text-gray-500">
              {stats.totalSessions} sessions
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <UserName
          user={user}
          showAvatar={true}
          size="lg"
          asLink={true}
          className="text-xl font-semibold"
        />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Email</span>
          <span className="text-sm text-gray-900">{user.email}</span>
        </div>

        {joinedDate && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Joined</span>
            <span className="text-sm text-gray-900">{joinedDate}</span>
          </div>
        )}

        {stats && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Sessions</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.totalSessions}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Hands</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.totalHands}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <a
          href="/user/settings"
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          View Settings →
        </a>
      </div>
    </div>
  )
}

export default ProfileCard