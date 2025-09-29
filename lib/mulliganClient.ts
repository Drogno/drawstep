import { getSupabaseBrowserClient } from './supabase/client'

interface UserSettings {
  saveDetailedHandData: boolean
  [key: string]: any
}

interface StartSessionParams {
  deckName: string
  device: 'WEB' | 'MOBILE'
  clientVersion: string
}

interface TrackEventParams {
  sessionId: string
  type: 'START_HAND' | 'MULLIGAN' | 'NEW_HAND' | 'END_SESSION'
  handSize?: number
  keptCards?: string[]
  mulliganedCards?: string[]
  durationMs?: number
}

class MulliganClient {
  private supabase = getSupabaseBrowserClient()
  private userSettings: UserSettings | null = null

  // Cache user settings for the session
  private async getUserSettings(): Promise<UserSettings | null> {
    if (this.userSettings) return this.userSettings

    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session?.user) return null

      const { data, error } = await this.supabase
        .from('profiles')
        .select('settings')
        .eq('id', session.user.id)
        .single()

      if (error || !data) {
        console.warn('Could not fetch user settings:', error)
        return null
      }

      const userData = data as any
      this.userSettings = {
        saveDetailedHandData: userData.settings?.saveDetailedHandData ?? false,
        ...userData.settings
      }

      return this.userSettings
    } catch (err) {
      console.warn('Error fetching user settings:', err)
      return null
    }
  }

  // Clear cached settings (useful when settings change)
  private clearSettingsCache(): void {
    this.userSettings = null
  }

  private async withRetry<T>(operation: () => Promise<T>, maxRetries: number = 1): Promise<T> {
    let lastError: Error = new Error('Unknown error')

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error)

        if (attempt < maxRetries) {
          // Wait briefly before retry
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }

    // Log final failure
    console.error('Operation failed after all retries:', lastError)
    throw lastError
  }

  async startSession({ deckName, device, clientVersion }: StartSessionParams): Promise<string> {
    return this.withRetry(async () => {
      const { data: { session } } = await this.supabase.auth.getSession()

      if (!session?.user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await this.supabase
        .from('mulligan_sessions')
        .insert([
          {
            user_id: session.user.id,
            deck_name: deckName,
            device: device,
            client_version: clientVersion,
            started_at: new Date().toISOString()
          }
        ])
        .select('id')
        .single()

      if (error) {
        console.error('Failed to start session:', error)
        throw new Error(`Failed to start session: ${error.message}`)
      }

      if (!data?.id) {
        throw new Error('Session created but no ID returned')
      }

      console.log('Session started:', data.id)
      return data.id
    })
  }

  async trackEvent({
    sessionId,
    type,
    handSize,
    keptCards,
    mulliganedCards,
    durationMs
  }: TrackEventParams): Promise<void> {
    return this.withRetry(async () => {
      const { data: { session } } = await this.supabase.auth.getSession()

      if (!session?.user) {
        throw new Error('User not authenticated')
      }

      // Check user settings for detailed data collection
      const settings = await this.getUserSettings()
      const saveDetailedData = settings?.saveDetailedHandData ?? false

      const eventData = {
        session_id: sessionId,
        user_id: session.user.id,
        type: type,
        hand_size: handSize || null,
        // Only save card names if user has opted in to detailed data collection
        kept_cards: saveDetailedData ? (keptCards || null) : null,
        mulliganed_cards: saveDetailedData ? (mulliganedCards || null) : null,
        duration_ms: durationMs || null,
        created_at: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('mulligan_events')
        .insert([eventData])

      if (error) {
        console.error('Failed to track event:', error, { eventData })
        throw new Error(`Failed to track event: ${error.message}`)
      }

      console.log('Event tracked:', {
        sessionId,
        type,
        detailedData: saveDetailedData,
        cardDataSaved: saveDetailedData && (keptCards || mulliganedCards)
      })
    })
  }

  async endSession(sessionId: string): Promise<void> {
    return this.withRetry(async () => {
      const { data: { session } } = await this.supabase.auth.getSession()

      if (!session?.user) {
        throw new Error('User not authenticated')
      }

      const { error } = await this.supabase
        .from('mulligan_sessions')
        .update({
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', session.user.id) // Ensure user can only end their own sessions

      if (error) {
        console.error('Failed to end session:', error)
        throw new Error(`Failed to end session: ${error.message}`)
      }

      console.log('Session ended:', sessionId)
    })
  }

  // Helper method to check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      return !!session?.user
    } catch (error) {
      console.error('Failed to check authentication:', error)
      return false
    }
  }

  // Helper method to get current user ID
  async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      return session?.user?.id || null
    } catch (error) {
      console.error('Failed to get current user ID:', error)
      return null
    }
  }

  // Batch event tracking for better performance
  async trackEvents(events: TrackEventParams[]): Promise<void> {
    return this.withRetry(async () => {
      const { data: { session } } = await this.supabase.auth.getSession()

      if (!session?.user) {
        throw new Error('User not authenticated')
      }

      // Check user settings for detailed data collection
      const settings = await this.getUserSettings()
      const saveDetailedData = settings?.saveDetailedHandData ?? false

      const eventData = events.map(event => ({
        session_id: event.sessionId,
        user_id: session.user.id,
        type: event.type,
        hand_size: event.handSize || null,
        // Only save card names if user has opted in to detailed data collection
        kept_cards: saveDetailedData ? (event.keptCards || null) : null,
        mulliganed_cards: saveDetailedData ? (event.mulliganedCards || null) : null,
        duration_ms: event.durationMs || null,
        created_at: new Date().toISOString()
      }))

      const { error } = await this.supabase
        .from('mulligan_events')
        .insert(eventData)

      if (error) {
        console.error('Failed to track batch events:', error, { eventData })
        throw new Error(`Failed to track batch events: ${error.message}`)
      }

      console.log('Batch events tracked:', {
        count: events.length,
        detailedData: saveDetailedData
      })
    })
  }

  // Force refresh user settings (call after settings update)
  async refreshSettings(): Promise<void> {
    this.clearSettingsCache()
    await this.getUserSettings()
  }
}

// Singleton instance
const mulliganClient = new MulliganClient()

export default mulliganClient
export { type StartSessionParams, type TrackEventParams }