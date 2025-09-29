'use client'

import { useState } from 'react'
import ConsentBanner from '@/components/ConsentBanner'
import { useConsentBanner, clearConsentData } from '@/hooks/useConsentBanner'

/**
 * ConsentBanner Component Usage Examples
 *
 * This component demonstrates how to use the ConsentBanner component
 * and useConsentBanner hook in different scenarios.
 */

const ConsentBannerExample = () => {
  const [forceShow, setForceShow] = useState(false)
  const {
    showBanner,
    hasConsented,
    hasDecided,
    user,
    isLoading,
    grantConsent,
    denyConsent,
    dismissBanner,
    resetConsent,
    getConsentStatus
  } = useConsentBanner()

  const handleToggleDemo = () => {
    setForceShow(!forceShow)
  }

  const handleResetConsent = () => {
    clearConsentData()
    resetConsent()
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">ConsentBanner Component Examples</h1>
        <p className="text-gray-600 mb-8">
          The ConsentBanner shows users a telemetry consent notice after login and persists their decision
          in both localStorage and the database.
        </p>
      </div>

      {/* Hook State Display */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Current Consent State</h2>
        <div className="bg-white rounded-lg border p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">User Status</dt>
              <dd className="text-sm text-gray-900">
                {isLoading ? 'Loading...' : user ? `Logged in: ${user.email}` : 'Not logged in'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Banner Visible</dt>
              <dd className="text-sm text-gray-900">
                {showBanner ? '✅ Yes' : '❌ No'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Has Consented</dt>
              <dd className="text-sm text-gray-900">
                {hasConsented === null ? 'Not decided' : hasConsented ? '✅ Yes' : '❌ No'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Has Decided</dt>
              <dd className="text-sm text-gray-900">
                {hasDecided ? '✅ Yes' : '❌ No'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Current Consent (localStorage)</dt>
              <dd className="text-sm text-gray-900 font-mono">
                {getConsentStatus()?.toString() || 'null'}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Demo Controls */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Demo Controls</h2>
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleToggleDemo}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {forceShow ? 'Hide Demo Banner' : 'Show Demo Banner'}
            </button>

            <button
              onClick={handleResetConsent}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              Reset Consent State
            </button>

            <button
              onClick={() => grantConsent()}
              disabled={!user}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Grant Consent
            </button>

            <button
              onClick={() => denyConsent()}
              disabled={!user}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Deny Consent
            </button>

            <button
              onClick={dismissBanner}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Dismiss Banner
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Note:</strong> Some actions require being logged in.</p>
            <p><strong>Reset:</strong> Clears both localStorage and resets hook state for testing.</p>
            <p><strong>Grant/Deny:</strong> Saves decision to localStorage and database (if logged in).</p>
            <p><strong>Dismiss:</strong> Hides banner without making a consent decision (sends user to settings).</p>
          </div>
        </div>
      </section>

      {/* Different Banner Positions */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Banner Positions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Bottom Position (Default)</h3>
            <div className="relative bg-gray-100 rounded-lg p-4 min-h-[200px]">
              <p className="text-gray-600 text-center py-8">Page content area</p>
              {forceShow && (
                <ConsentBanner
                  forceShow={true}
                  position="bottom"
                  className="relative"
                />
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Top Position</h3>
            <div className="relative bg-gray-100 rounded-lg p-4 min-h-[200px]">
              {forceShow && (
                <ConsentBanner
                  forceShow={true}
                  position="top"
                  className="relative"
                />
              )}
              <p className="text-gray-600 text-center py-8">Page content area</p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Messages */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Custom Messages</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Default Message</h3>
            <div className="relative bg-gray-100 rounded-lg p-4">
              <ConsentBanner
                forceShow={true}
                className="relative"
                onConsent={(consented) => console.log('Custom consent:', consented)}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Custom Message</h3>
            <div className="relative bg-gray-100 rounded-lg p-4">
              <ConsentBanner
                forceShow={true}
                className="relative"
                message="This is a custom consent message for demonstration purposes. We use cookies and telemetry to improve your experience."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Integration Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Integration Code Examples</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Layout Integration</h3>
            <div className="bg-gray-100 rounded p-4">
              <pre className="text-sm text-gray-600 overflow-x-auto">
{`// app/layout.tsx
import ConsentBanner from '@/components/ConsentBanner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <ConsentBanner />
      </body>
    </html>
  )
}`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Hook Usage</h3>
            <div className="bg-gray-100 rounded p-4">
              <pre className="text-sm text-gray-600 overflow-x-auto">
{`// components/MyComponent.tsx
import { useConsentBanner } from '@/hooks/useConsentBanner'

const MyComponent = () => {
  const {
    showBanner,
    hasConsented,
    grantConsent,
    denyConsent,
    getConsentStatus
  } = useConsentBanner()

  const handleDataCollection = () => {
    if (hasConsented) {
      // Collect telemetry data
    } else {
      // Skip data collection
    }
  }

  return (
    <div>
      <p>Consent status: {getConsentStatus()}</p>
      {showBanner && <p>Banner is visible</p>}
    </div>
  )
}`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Utility Functions</h3>
            <div className="bg-gray-100 rounded p-4">
              <pre className="text-sm text-gray-600 overflow-x-auto">
{`import {
  getConsentStatus,
  hasUserConsented,
  hasUserDecidedConsent,
  clearConsentData
} from '@/hooks/useConsentBanner'

// Check consent status anywhere
const consentStatus = getConsentStatus() // true | false | null
const hasConsent = hasUserConsented() // boolean
const hasDecided = hasUserDecidedConsent() // boolean

// Clear consent data (for testing)
clearConsentData()`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Settings Integration */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Settings Page Integration</h2>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-600 mb-4">
            The consent status is automatically displayed in the user settings page:
          </p>

          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className={`w-4 h-4 rounded mt-0.5 ${
              hasConsented === true ? 'bg-green-500' :
              hasConsented === false ? 'bg-red-500' : 'bg-gray-300'
            }`}></div>
            <div>
              <div className="font-medium text-gray-700 text-sm">
                Telemetry consent status
              </div>
              <p className="text-gray-500 text-sm">
                {hasConsented === true && "You have consented to telemetry data collection."}
                {hasConsented === false && "You have declined telemetry data collection."}
                {hasConsented === null && "Telemetry consent not yet provided."}
              </p>
              <div className="mt-1 text-xs text-gray-400">
                This setting is managed through the consent banner that appears after login.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ConsentBannerExample