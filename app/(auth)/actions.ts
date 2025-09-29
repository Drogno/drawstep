'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const handleLogin = async (formData: FormData) => {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/user')
}

export const handleRegister = async (formData: FormData) => {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!email || !password || !username) {
    return { error: 'Email, password and username are required' }
  }

  if (username.length < 3) {
    return { error: 'Username must be at least 3 characters long' }
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { error: 'Username can only contain letters, numbers, hyphens and underscores' }
  }

  const supabase = createSupabaseServerClient()

  // Check if username already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single()

  if (existingProfile) {
    return { error: 'Username already taken' }
  }

  // Register user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Registration failed' }
  }

  // Create profile using service role client to bypass RLS
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: profileError } = await serviceSupabase
    .from('profiles')
    .insert([
      {
        id: data.user.id,
        username: username,
      }
    ])

  if (profileError) {
    console.error('Profile creation error:', profileError)
    return { error: `Failed to create user profile: ${profileError.message}` }
  }

  revalidatePath('/', 'layout')
  redirect('/user')
}

export const handleLogout = async () => {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
    // For form actions, we can't return errors easily, so we redirect with error
    redirect('/login?error=logout_failed')
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}