import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const createSupabaseServerClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors in Server Components
            console.warn('Cookie setting failed:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal errors in Server Components
            console.warn('Cookie removal failed:', error)
          }
        },
      },
    }
  )
}

export const getSessionOrRedirect = async (redirectTo: string = '/login') => {
  const supabase = createSupabaseServerClient()

  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error || !session) {
    redirect(redirectTo)
  }

  return { session, user: session.user }
}

export const getSessionOptional = async () => {
  const supabase = createSupabaseServerClient()

  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Session fetch error:', error)
    return { session: null, user: null, error }
  }

  return { session, user: session?.user || null, error: null }
}