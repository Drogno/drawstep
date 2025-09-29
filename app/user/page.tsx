import Link from 'next/link'
import { getSessionOrRedirect, createSupabaseServerClient } from '@/lib/supabase/server'
import UserName from '@/components/UserName'
// Temporarily commented out until database functions are created
// import HandsByDayChart from '@/components/charts/HandsByDayChart'
// import SessionsByWeekChart from '@/components/charts/SessionsByWeekChart'
// import TopDecksBar from '@/components/charts/TopDecksBar'

interface UserStats {
  total_sessions: number
  total_events: number
  total_duration_ms: number
  avg_session_duration_ms: number
  first_session_date: string | null
  last_session_date: string | null
  sessions_this_week: number
  sessions_this_month: number
}

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

const KPICard = ({
  title,
  value,
  icon,
  description
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
}) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-lg font-medium text-gray-900">
              {value}
            </dd>
            {description && (
              <dd className="text-xs text-gray-400 mt-1">
                {description}
              </dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  </div>
)


const UserPage = async () => {
  const { session, user } = await getSessionOrRedirect()
  const supabase = createSupabaseServerClient()

  // Fetch user statistics
  let userStats: UserStats | null = null
  try {
    const { data, error } = await supabase.rpc('fn_user_stats', {
      uid: user.id
    }).single()

    if (error) {
      console.error('Error fetching user stats:', error)
    } else {
      userStats = data as UserStats
    }
  } catch (error) {
    console.error('Error calling fn_user_stats:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Welcome,</h1>
            <UserName
              user={user}
              size="lg"
              variant="highlighted"
              showAvatar={false}
              className="text-3xl font-bold"
              fallback="User"
            />
            <span className="text-3xl font-bold text-gray-900">!</span>
          </div>
          <p className="mt-2 text-gray-600">
            View your training progress and statistics
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <KPICard
            title="Total Sessions"
            value={userStats?.total_sessions || 0}
            description={`Avg ${userStats?.total_events && userStats?.total_sessions ? (userStats.total_events / userStats.total_sessions).toFixed(1) : 0} events per session`}
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          <KPICard
            title="Total Events"
            value={userStats?.total_events || 0}
            description="Practiced mulligans"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
            }
          />

          <KPICard
            title="Training Time"
            value={formatDuration(userStats?.total_duration_ms || 0)}
            description={`Avg ${formatDuration(userStats?.avg_session_duration_ms || 0)} per session`}
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Charts temporarily disabled until database functions are created */}
          <div className="bg-gray-100 p-8 rounded-lg text-center text-gray-500">
            Charts coming soon...
          </div>
        </div>

        {/* Weekly Sessions Chart */}
        <div className="mb-8">
          <div className="bg-gray-100 p-8 rounded-lg text-center text-gray-500">
            Weekly sessions chart coming soon...
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/user/sessions"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View My Sessions
            </Link>

            <Link
              href="/user/settings"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>

            <Link
              href="/logout"
              className="inline-flex items-center px-6 py-3 border border-red-300 text-base font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserPage