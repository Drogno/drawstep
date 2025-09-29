import { createBrowserClient } from '@supabase/ssr'

export const createSupabaseBrowserClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton instance for browser usage
let supabaseBrowserInstance: ReturnType<typeof createBrowserClient> | null = null

export const getSupabaseBrowserClient = () => {
  if (!supabaseBrowserInstance) {
    supabaseBrowserInstance = createSupabaseBrowserClient()
  }
  return supabaseBrowserInstance
}

// Helper for client-side session management
export const handleSignOut = async () => {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
    throw error
  }

  // Force router refresh after sign out
  window.location.href = '/login'
}

// Helper for real-time auth state changes
export const onAuthStateChange = (callback: (session: any) => void) => {
  const supabase = getSupabaseBrowserClient()

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })

  return subscription
}