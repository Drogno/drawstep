'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthenticatedMulliLinkProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const AuthenticatedMulliLink = ({ children, className, onClick }: AuthenticatedMulliLinkProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()

    // Call the optional onClick callback (e.g., to close mobile menu)
    if (onClick) {
      onClick()
    }

    // Build URL with authentication parameter if user is logged in
    let url = 'http://localhost:3003/mulli'

    if (user) {
      try {
        // Store user info in localStorage for cross-server communication
        localStorage.setItem('drawstep_temp_user', JSON.stringify({
          email: user.email,
          id: user.id,
          timestamp: Date.now()
        }))

        // Get the current session with access token
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          url += `?authenticated=true&token=${encodeURIComponent(session.access_token)}`
          console.log('Redirecting authenticated user with token to:', url)
        } else {
          url += '?authenticated=true'
          console.log('Redirecting authenticated user without token to:', url)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        url += '?authenticated=true'
      }
    } else {
      console.log('Redirecting guest user to:', url)
    }

    window.location.href = url
  }

  if (isLoading) {
    return (
      <button className={className} disabled>
        Loading...
      </button>
    )
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}

export default AuthenticatedMulliLink