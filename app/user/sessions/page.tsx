import Link from 'next/link'
import AuthenticatedMulliLink from '@/components/AuthenticatedMulliLink'
import { getSessionOrRedirect, createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/guards'
import { formatDuration } from '@/lib/duration'
import type { SessionRow } from '@/lib/guards'

// Server action to get user's sessions with proper filtering
const getUserSessions = async (): Promise<SessionRow[]> => {
  'use server'

  const supabase = createSupabaseServerClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('mulligan_sessions')
    .select('*')
    .eq('user_id', userId) // ✅ Always filter by user_id
    .order('started_at', { ascending: false })
    .limit(50) // Reasonable pagination

  if (error) {
    console.error('Error fetching user sessions:', error)
    return []
  }

  return data || []
}

const UserSessionsPage = async () => {
  // Ensure user is authenticated
  await getSessionOrRedirect()

  // Get user's sessions with ownership filtering
  const sessions = await getUserSessions()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/user"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Sessions</h1>
              <p className="text-gray-600">
                View your mulligan training history and detailed session data
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Showing {sessions.length} sessions
          </div>
        </div>

        {/* Sessions List */}
        {sessions.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {sessions.map((session) => {
                const startTime = new Date(session.started_at)
                const endTime = session.ended_at ? new Date(session.ended_at) : null
                const duration = endTime
                  ? endTime.getTime() - startTime.getTime()
                  : Date.now() - startTime.getTime()
                const isActive = !session.ended_at

                return (
                  <Link
                    key={session.id}
                    href={`/user/sessions/${session.id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {session.deck_name || 'Unknown Deck'}
                              </h3>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-sm text-gray-500">
                                  {startTime.toLocaleDateString()} at {startTime.toLocaleTimeString()}
                                </p>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {isActive ? 'Active' : 'Completed'}
                                </div>
                                {session.device && (
                                  <div className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                                    {session.device}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDuration(duration)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Duration
                            </div>
                          </div>

                          {session.client_version && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900 font-mono">
                                {session.client_version}
                              </div>
                              <div className="text-sm text-gray-500">
                                Version
                              </div>
                            </div>
                          )}

                          <div className="text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-12">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No training sessions yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start practicing with the mulligan trainer to see your sessions here.
              </p>
              <AuthenticatedMulliLink className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                Start Training
              </AuthenticatedMulliLink>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserSessionsPage