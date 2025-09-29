'use client'

import { useState, useTransition, useEffect } from 'react'
import { getConsentStatus } from '@/hooks/useConsentBanner'
import type { UserSettings } from './actions'

interface SettingsFormProps {
  settings: UserSettings
  updateAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

const SettingsForm = ({ settings, updateAction }: SettingsFormProps) => {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formSettings, setFormSettings] = useState(settings)
  const [telemetryConsent, setTelemetryConsent] = useState<boolean | null>(null)

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      setMessage(null)

      try {
        const result = await updateAction(formData)

        if (result.error) {
          setMessage({ type: 'error', text: result.error })
        } else {
          setMessage({ type: 'success', text: 'Settings updated successfully!' })
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'An unexpected error occurred' })
      }
    })
  }

  // Load telemetry consent status from localStorage
  useEffect(() => {
    const consentStatus = getConsentStatus()
    setTelemetryConsent(consentStatus)
  }, [])

  const handleCheckboxChange = (
    category: keyof UserSettings,
    field?: string,
    value?: boolean
  ) => {
    setFormSettings(prev => {
      if (typeof category === 'string' && field) {
        return {
          ...prev,
          [category]: {
            ...prev[category as 'notifications' | 'privacy'],
            [field]: value,
          },
        }
      } else {
        return {
          ...prev,
          [category]: value,
        }
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`text-sm ${
            message.type === 'success' ? 'text-green-700' : 'text-red-700'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Privacy & Data Section */}
      <div id="privacy" className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy & Data Collection</h3>

        <div className="space-y-4">
          {/* Detailed Hand Data */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="saveDetailedHandData"
                name="saveDetailedHandData"
                type="checkbox"
                defaultChecked={settings.saveDetailedHandData}
                onChange={(e) => handleCheckboxChange('saveDetailedHandData', undefined, e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                disabled={isPending}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="saveDetailedHandData" className="font-medium text-gray-700">
                Save detailed hand data (card names)
              </label>
              <p className="text-gray-500">
                When enabled, we'll save the specific card names you keep and mulligan.
                This helps improve your training analysis but uses more storage.
                When disabled, only hand sizes and decision counts are saved.
              </p>
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded">
                <div className="text-xs text-amber-700">
                  <strong>Privacy Note:</strong> Your card data is private and only visible to you.
                  We never share individual card choices with other users.
                </div>
              </div>
            </div>
          </div>

          {/* Share Stats */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="shareStats"
                name="shareStats"
                type="checkbox"
                defaultChecked={settings.privacy.shareStats}
                onChange={(e) => handleCheckboxChange('privacy', 'shareStats', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                disabled={isPending}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="shareStats" className="font-medium text-gray-700">
                Share anonymous statistics
              </label>
              <p className="text-gray-500">
                Help improve DRAWSTEP by sharing anonymous usage statistics and trends.
              </p>
            </div>
          </div>

          {/* Public Profile */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="publicProfile"
                name="publicProfile"
                type="checkbox"
                defaultChecked={settings.privacy.publicProfile}
                onChange={(e) => handleCheckboxChange('privacy', 'publicProfile', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                disabled={isPending}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="publicProfile" className="font-medium text-gray-700">
                Make profile publicly visible
              </label>
              <p className="text-gray-500">
                Allow other users to see your training progress and achievements.
              </p>
            </div>
          </div>

          {/* Telemetry Consent Status */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <div className={`w-4 h-4 rounded ${telemetryConsent === true ? 'bg-green-500' : telemetryConsent === false ? 'bg-red-500' : 'bg-gray-300'}`}></div>
            </div>
            <div className="ml-3 text-sm">
              <div className="font-medium text-gray-700">
                Telemetry consent status
              </div>
              <p className="text-gray-500">
                {telemetryConsent === true && "You have consented to telemetry data collection."}
                {telemetryConsent === false && "You have declined telemetry data collection."}
                {telemetryConsent === null && "Telemetry consent not yet provided."}
              </p>
              <div className="mt-2 text-xs text-gray-400">
                This setting is managed through the consent banner that appears after login.
                The detailed hand data setting above works independently of this consent.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div id="notifications" className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="emailNotifications"
                name="emailNotifications"
                type="checkbox"
                defaultChecked={settings.notifications.email}
                onChange={(e) => handleCheckboxChange('notifications', 'email', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                disabled={isPending}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                Email notifications
              </label>
              <p className="text-gray-500">
                Receive updates about new features and training tips via email.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="browserNotifications"
                name="browserNotifications"
                type="checkbox"
                defaultChecked={settings.notifications.browser}
                onChange={(e) => handleCheckboxChange('notifications', 'browser', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                disabled={isPending}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="browserNotifications" className="font-medium text-gray-700">
                Browser notifications
              </label>
              <p className="text-gray-500">
                Show browser notifications for training reminders and achievements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div id="appearance" className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
              Theme preference
            </label>
            <select
              id="theme"
              name="theme"
              defaultValue={settings.theme}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              disabled={isPending}
            >
              <option value="light">Light</option>
              <option value="dark">Dark (Coming Soon)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </form>
  )
}

export default SettingsForm