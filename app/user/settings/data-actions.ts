'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/guards'
import { formatDuration } from '@/lib/duration'

interface ExportSession {
  id: string
  started_at: string
  ended_at: string | null
  deck_name: string | null
  device: string | null
  client_version: string | null
  duration_ms: number
  events: ExportEvent[]
}

interface ExportEvent {
  id: string
  type: 'START_HAND' | 'MULLIGAN' | 'NEW_HAND' | 'END_SESSION'
  hand_size: number | null
  kept_cards: string[] | null
  mulliganed_cards: string[] | null
  duration_ms: number | null
  created_at: string
}

interface ExportData {
  user_id: string
  username: string
  export_date: string
  total_sessions: number
  total_events: number
  total_training_time_ms: number
  sessions: ExportSession[]
}

export const exportUserData = async (): Promise<{ data?: ExportData; error?: string; filename?: string }> => {
  try {
    const supabase = createSupabaseServerClient()
    const userId = await getCurrentUserId()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return { error: 'Failed to fetch user profile' }
    }

    // Get all user sessions with their events
    const { data: sessions, error: sessionsError } = await supabase
      .from('mulligan_sessions')
      .select(`
        *,
        mulligan_events (*)
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return { error: 'Failed to fetch session data' }
    }

    // Process and format the data
    const exportSessions: ExportSession[] = (sessions || []).map(session => {
      const sessionStart = new Date(session.started_at).getTime()
      const sessionEnd = session.ended_at ? new Date(session.ended_at).getTime() : null
      const duration = sessionEnd ? sessionEnd - sessionStart : 0

      const events: ExportEvent[] = (session.mulligan_events || [])
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((event: any) => ({
          id: event.id,
          type: event.type,
          hand_size: event.hand_size,
          kept_cards: event.kept_cards,
          mulliganed_cards: event.mulliganed_cards,
          duration_ms: event.duration_ms,
          created_at: event.created_at
        }))

      return {
        id: session.id,
        started_at: session.started_at,
        ended_at: session.ended_at,
        deck_name: session.deck_name,
        device: session.device,
        client_version: session.client_version,
        duration_ms: duration,
        events
      }
    })

    // Calculate totals
    const totalSessions = exportSessions.length
    const totalEvents = exportSessions.reduce((sum, session) => sum + session.events.length, 0)
    const totalTrainingTime = exportSessions.reduce((sum, session) => sum + session.duration_ms, 0)

    const exportData: ExportData = {
      user_id: userId,
      username: profile.username,
      export_date: new Date().toISOString(),
      total_sessions: totalSessions,
      total_events: totalEvents,
      total_training_time_ms: totalTrainingTime,
      sessions: exportSessions
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const filename = `drawstep_data_${profile.username}_${timestamp}.json`

    return {
      data: exportData,
      filename
    }
  } catch (err) {
    console.error('Error in exportUserData:', err)
    return { error: 'An unexpected error occurred during export' }
  }
}

export const deleteUserData = async (confirmationText: string): Promise<{ success?: boolean; error?: string }> => {
  try {
    const supabase = createSupabaseServerClient()
    const userId = await getCurrentUserId()

    // Verify confirmation text
    if (confirmationText !== 'DELETE MY DATA') {
      return { error: 'Confirmation text does not match. Please type "DELETE MY DATA" exactly.' }
    }

    // Get user profile to verify identity
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return { error: 'Failed to verify user identity' }
    }

    console.log(`Starting data deletion for user: ${profile.username} (${userId})`)

    // Count data before deletion for logging
    const { count: sessionsCount } = await supabase
      .from('mulligan_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const { count: eventsCount } = await supabase
      .from('mulligan_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    console.log(`Found ${sessionsCount} sessions and ${eventsCount} events to delete`)

    // Delete events first (foreign key constraint)
    const { error: eventsError } = await supabase
      .from('mulligan_events')
      .delete()
      .eq('user_id', userId)

    if (eventsError) {
      console.error('Error deleting events:', eventsError)
      return { error: 'Failed to delete event data' }
    }

    // Delete sessions
    const { error: sessionsError } = await supabase
      .from('mulligan_sessions')
      .delete()
      .eq('user_id', userId)

    if (sessionsError) {
      console.error('Error deleting sessions:', sessionsError)
      return { error: 'Failed to delete session data' }
    }

    console.log(`Successfully deleted ${eventsCount} events and ${sessionsCount} sessions for user ${userId}`)

    // Revalidate relevant pages
    revalidatePath('/user')
    revalidatePath('/user/sessions')
    revalidatePath('/user/settings')

    return { success: true }
  } catch (err) {
    console.error('Error in deleteUserData:', err)
    return { error: 'An unexpected error occurred during deletion' }
  }
}

// Helper function to generate a deletion summary before actual deletion
export const getUserDataSummary = async (): Promise<{
  sessions: number
  events: number
  totalDuration: number
  oldestSession: string | null
  newestSession: string | null
  error?: string
}> => {
  try {
    const supabase = createSupabaseServerClient()
    const userId = await getCurrentUserId()

    // Get session count and date range
    const { data: sessions, error: sessionsError } = await supabase
      .from('mulligan_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: true })

    if (sessionsError) {
      console.error('Error fetching sessions summary:', sessionsError)
      return { error: 'Failed to fetch data summary', sessions: 0, events: 0, totalDuration: 0, oldestSession: null, newestSession: null }
    }

    // Get events count
    const { count: eventsCount } = await supabase
      .from('mulligan_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get total duration from user stats
    const { data: stats } = await supabase
      .rpc('fn_user_stats', { uid: userId })
      .single()

    const sessionsList = sessions || []
    const oldestSession = sessionsList.length > 0 ? sessionsList[0].started_at : null
    const newestSession = sessionsList.length > 0 ? sessionsList[sessionsList.length - 1].started_at : null

    return {
      sessions: sessionsList.length,
      events: eventsCount || 0,
      totalDuration: (stats as any)?.total_duration_ms || 0,
      oldestSession,
      newestSession
    }
  } catch (err) {
    console.error('Error in getUserDataSummary:', err)
    return {
      error: 'Failed to generate data summary',
      sessions: 0,
      events: 0,
      totalDuration: 0,
      oldestSession: null,
      newestSession: null
    }
  }
}