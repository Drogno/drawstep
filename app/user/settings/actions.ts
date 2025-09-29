'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface UserSettings {
  saveDetailedHandData: boolean
  theme: 'light' | 'dark'
  notifications: {
    email: boolean
    browser: boolean
  }
  privacy: {
    shareStats: boolean
    publicProfile: boolean
  }
}

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const supabase = createSupabaseServerClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user settings:', error)
      return null
    }

    // Return settings with defaults
    return {
      saveDetailedHandData: data.settings?.saveDetailedHandData ?? false,
      theme: data.settings?.theme ?? 'light',
      notifications: {
        email: data.settings?.notifications?.email ?? true,
        browser: data.settings?.notifications?.browser ?? false,
      },
      privacy: {
        shareStats: data.settings?.privacy?.shareStats ?? false,
        publicProfile: data.settings?.privacy?.publicProfile ?? false,
      },
    }
  } catch (err) {
    console.error('Error in getUserSettings:', err)
    return null
  }
}

export const updateUserSettings = async (formData: FormData) => {
  const supabase = createSupabaseServerClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: 'Not authenticated' }
    }

    // Extract form data
    const saveDetailedHandData = formData.get('saveDetailedHandData') === 'on'
    const theme = formData.get('theme') as 'light' | 'dark' || 'light'
    const emailNotifications = formData.get('emailNotifications') === 'on'
    const browserNotifications = formData.get('browserNotifications') === 'on'
    const shareStats = formData.get('shareStats') === 'on'
    const publicProfile = formData.get('publicProfile') === 'on'

    const newSettings: UserSettings = {
      saveDetailedHandData,
      theme,
      notifications: {
        email: emailNotifications,
        browser: browserNotifications,
      },
      privacy: {
        shareStats,
        publicProfile,
      },
    }

    const { error } = await supabase
      .from('profiles')
      .update({ settings: newSettings })
      .eq('id', session.user.id)

    if (error) {
      console.error('Error updating user settings:', error)
      return { error: 'Failed to update settings' }
    }

    revalidatePath('/user/settings')
    return { success: true }
  } catch (err) {
    console.error('Error in updateUserSettings:', err)
    return { error: 'An unexpected error occurred' }
  }
}

export const updateSingleSetting = async (
  settingPath: string,
  value: boolean | string
) => {
  const supabase = createSupabaseServerClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase.rpc('update_user_setting', {
      user_uuid: session.user.id,
      setting_path: settingPath,
      new_value: JSON.stringify(value)
    })

    if (error || !data) {
      console.error('Error updating single setting:', error)
      return { error: 'Failed to update setting' }
    }

    revalidatePath('/user/settings')
    return { success: true }
  } catch (err) {
    console.error('Error in updateSingleSetting:', err)
    return { error: 'An unexpected error occurred' }
  }
}