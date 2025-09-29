import Link from 'next/link'
import { getSessionOrRedirect } from '@/lib/supabase/server'
import { getUserSettings, updateUserSettings } from './actions'
import SettingsForm from './SettingsForm'
import DataManagement from '@/components/DataManagement'

const UserSettingsPage = async () => {
  const { session, user } = await getSessionOrRedirect()
  const userSettings = await getUserSettings(user.id)

  // Fallback to defaults if settings couldn't be loaded
  const settings = userSettings || {
    saveDetailedHandData: false,
    theme: 'light' as const,
    notifications: {
      email: true,
      browser: false,
    },
    privacy: {
      shareStats: false,
      publicProfile: false,
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/user"
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage your privacy preferences and application settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              <a
                href="#privacy"
                className="bg-indigo-50 border-indigo-500 text-indigo-700 border-l-4 px-3 py-2 block text-sm font-medium"
              >
                Privacy & Data
              </a>
              <a
                href="#notifications"
                className="border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-l-4 px-3 py-2 block text-sm font-medium"
              >
                Notifications
              </a>
              <a
                href="#appearance"
                className="border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-l-4 px-3 py-2 block text-sm font-medium"
              >
                Appearance
              </a>
              <a
                href="#data"
                className="border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-l-4 px-3 py-2 block text-sm font-medium"
              >
                Data Management
              </a>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <SettingsForm
              settings={settings}
              updateAction={updateUserSettings}
            />

            {/* Data Management Section */}
            <div id="data" className="mt-8">
              <DataManagement />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSettingsPage