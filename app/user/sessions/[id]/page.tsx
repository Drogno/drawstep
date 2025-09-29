import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionOrRedirect } from '@/lib/supabase/server'
import { ensureOwnRow, getCurrentUserId } from '@/lib/guards'
import { formatDuration } from '@/lib/duration'
import type { SessionRow, EventRow } from '@/lib/guards'

interface SessionDetailsProps {
  params: {
    id: string
  }
}

// Server action to get session events with ownership verification
const getSessionEvents = async (sessionId: string): Promise<EventRow[]> => {
  'use server'

  const { createSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = createSupabaseServerClient()

  // Verify session ownership first
  await ensureOwnRow<SessionRow>('mulligan_sessions', sessionId)

  // Get current user ID for double-verification
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('mulligan_events')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId) // ✅ Always filter by user_id
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching session events:', error)
    return []
  }

  return data || []
}

const SessionDetailsPage = async ({ params }: SessionDetailsProps) => {
  // Ensure user is authenticated
  await getSessionOrRedirect()

  // Verify ownership and get session data
  // This will throw notFound() if session doesn't belong to user
  const session = await ensureOwnRow<SessionRow>('mulligan_sessions', params.id)

  // Get all events for this session (also ownership-verified)
  const events = await getSessionEvents(params.id)

  // Calculate session statistics
  const sessionDuration = session.ended_at
    ? new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
    : Date.now() - new Date(session.started_at).getTime()

  const handEvents = events.filter(e => ['START_HAND', 'NEW_HAND'].includes(e.type))
  const mulliganEvents = events.filter(e => e.type === 'MULLIGAN')

  const stats = {
    duration: sessionDuration,
    totalHands: handEvents.length,
    totalMulligans: mulliganEvents.length,
    avgHandSize: handEvents.length > 0
      ? Math.round(handEvents.reduce((sum, e) => sum + (e.hand_size || 0), 0) / handEvents.length)
      : 0,
    isActive: !session.ended_at
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/user/sessions"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Session</h1>
              <p className="text-sm text-gray-500 font-mono">{session.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              stats.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {stats.isActive ? 'Active Session' : 'Completed'}
            </div>
            <div className="text-sm text-gray-600">
              Started: {new Date(session.started_at).toLocaleString()}
            </div>
            {session.ended_at && (
              <div className="text-sm text-gray-600">
                Ended: {new Date(session.ended_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Session Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Session Overview</h2>

              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Deck</dt>
                  <dd className="text-sm text-gray-900">
                    {session.deck_name || 'Unknown Deck'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Device</dt>
                  <dd className="text-sm text-gray-900">
                    {session.device || 'Unknown'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Client Version</dt>
                  <dd className="text-sm text-gray-900 font-mono">
                    {session.client_version || 'Unknown'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDuration(stats.duration)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Hands</dt>
                  <dd className="text-sm text-gray-900">
                    {stats.totalHands}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Mulligans</dt>
                  <dd className="text-sm text-gray-900">
                    {stats.totalMulligans}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Avg Hand Size</dt>
                  <dd className="text-sm text-gray-900">
                    {stats.avgHandSize} cards
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Event Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Event Timeline</h2>

              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event, index) => {
                    const eventTime = new Date(event.created_at)
                    const relativeTime = event.duration_ms
                      ? formatDuration(event.duration_ms)
                      : 'Unknown'

                    return (
                      <div key={event.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className={`w-3 h-3 rounded-full mt-1 ${
                          event.type === 'START_HAND' ? 'bg-blue-500' :
                          event.type === 'MULLIGAN' ? 'bg-orange-500' :
                          event.type === 'NEW_HAND' ? 'bg-green-500' :
                          'bg-gray-500'
                        }`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                              {event.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </h3>
                            <div className="text-xs text-gray-500">
                              +{relativeTime}
                            </div>
                          </div>

                          <div className="mt-1 space-y-1">
                            {event.hand_size && (
                              <p className="text-sm text-gray-600">
                                Hand size: {event.hand_size} cards
                              </p>
                            )}

                            {event.kept_cards && event.kept_cards.length > 0 && (
                              <p className="text-sm text-gray-600">
                                Kept: {event.kept_cards.join(', ')}
                              </p>
                            )}

                            {event.mulliganed_cards && event.mulliganed_cards.length > 0 && (
                              <p className="text-sm text-gray-600">
                                Mulliganed: {event.mulliganed_cards.join(', ')}
                              </p>
                            )}
                          </div>

                          <div className="mt-1 text-xs text-gray-400">
                            {eventTime.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No events recorded for this session</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionDetailsPage