'use client'

import UserName from '@/components/UserName'
import ProfileCard from '@/components/ProfileCard'

/**
 * UserName Component Usage Examples
 *
 * This component demonstrates all the different ways to use the UserName component
 * throughout the application. Copy these examples for consistent username display.
 */

const UserNameExamples = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">UserName Component Examples</h1>
        <p className="text-gray-600 mb-8">
          The UserName component provides consistent username display with automatic linking to /user.
          Here are all the different ways to use it:
        </p>
      </div>

      {/* Basic Usage */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Basic Usage</h2>
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Default (with link)</h3>
            <UserName />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Without link</h3>
            <UserName asLink={false} />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Custom fallback</h3>
            <UserName fallback="Anonymous User" />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Direct username (no DB fetch)</h3>
            <UserName username="DirectUsername123" />
          </div>
        </div>

        <div className="mt-4 bg-gray-100 rounded p-4">
          <h4 className="font-medium text-gray-800 mb-2">Code:</h4>
          <pre className="text-sm text-gray-600 overflow-x-auto">
{`// Default usage
<UserName />

// Without link
<UserName asLink={false} />

// Custom fallback
<UserName fallback="Anonymous User" />

// Direct username
<UserName username="DirectUsername123" />`}
          </pre>
        </div>
      </section>

      {/* Size Variants */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Size Variants</h2>
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Small</h3>
            <UserName size="sm" username="SmallUser" />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Medium (default)</h3>
            <UserName size="md" username="MediumUser" />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Large</h3>
            <UserName size="lg" username="LargeUser" />
          </div>
        </div>

        <div className="mt-4 bg-gray-100 rounded p-4">
          <h4 className="font-medium text-gray-800 mb-2">Code:</h4>
          <pre className="text-sm text-gray-600 overflow-x-auto">
{`<UserName size="sm" />
<UserName size="md" />  <!-- default -->
<UserName size="lg" />`}
          </pre>
        </div>
      </section>

      {/* Style Variants */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Style Variants</h2>
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Default</h3>
            <UserName variant="default" username="DefaultUser" />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Subtle</h3>
            <UserName variant="subtle" username="SubtleUser" />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Highlighted</h3>
            <UserName variant="highlighted" username="HighlightedUser" />
          </div>
        </div>

        <div className="mt-4 bg-gray-100 rounded p-4">
          <h4 className="font-medium text-gray-800 mb-2">Code:</h4>
          <pre className="text-sm text-gray-600 overflow-x-auto">
{`<UserName variant="default" />    <!-- default -->
<UserName variant="subtle" />
<UserName variant="highlighted" />`}
          </pre>
        </div>
      </section>

      {/* With Avatar */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">With Avatar</h2>
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Small with avatar</h3>
            <UserName showAvatar={true} size="sm" username="AvatarUser" />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Medium with avatar</h3>
            <UserName showAvatar={true} size="md" username="AvatarUser" />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Large with avatar</h3>
            <UserName showAvatar={true} size="lg" username="AvatarUser" />
          </div>
        </div>

        <div className="mt-4 bg-gray-100 rounded p-4">
          <h4 className="font-medium text-gray-800 mb-2">Code:</h4>
          <pre className="text-sm text-gray-600 overflow-x-auto">
{`<UserName showAvatar={true} size="sm" />
<UserName showAvatar={true} size="md" />
<UserName showAvatar={true} size="lg" />`}
          </pre>
        </div>
      </section>

      {/* Truncation */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Text Truncation</h2>
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Normal (no truncation)</h3>
            <UserName username="VeryLongUsernameExampleForTesting123" />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Truncated (max 15 chars)</h3>
            <UserName
              username="VeryLongUsernameExampleForTesting123"
              truncate={true}
              maxLength={15}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Truncated with tooltip</h3>
            <UserName
              username="VeryLongUsernameExampleForTesting123"
              truncate={true}
              maxLength={15}
              showTooltip={true}
            />
          </div>
        </div>

        <div className="mt-4 bg-gray-100 rounded p-4">
          <h4 className="font-medium text-gray-800 mb-2">Code:</h4>
          <pre className="text-sm text-gray-600 overflow-x-auto">
{`<!-- Normal -->
<UserName username="VeryLongUsername..." />

<!-- Truncated -->
<UserName
  username="VeryLongUsername..."
  truncate={true}
  maxLength={15}
/>

<!-- With tooltip on hover -->
<UserName
  username="VeryLongUsername..."
  truncate={true}
  maxLength={15}
  showTooltip={true}
/>`}
          </pre>
        </div>
      </section>

      {/* Custom Styling */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Custom Styling</h2>
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Custom CSS classes</h3>
            <UserName
              username="StyledUser"
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold"
              asLink={false}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Custom link destination</h3>
            <UserName
              username="ProfileUser"
              href="/user/settings"
              className="text-green-600 hover:text-green-800"
            />
          </div>
        </div>

        <div className="mt-4 bg-gray-100 rounded p-4">
          <h4 className="font-medium text-gray-800 mb-2">Code:</h4>
          <pre className="text-sm text-gray-600 overflow-x-auto">
{`<!-- Custom styling -->
<UserName
  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
  asLink={false}
/>

<!-- Custom link destination -->
<UserName
  href="/user/settings"
  className="text-green-600 hover:text-green-800"
/>`}
          </pre>
        </div>
      </section>

      {/* Real-world Examples */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Real-world Examples</h2>

        <div className="space-y-6">
          {/* Header Example */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Header Navigation</h3>
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-indigo-600">DRAWSTEP</div>
                <UserName
                  showAvatar={true}
                  size="sm"
                  className="px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                />
              </div>
            </div>
            <div className="mt-2 bg-gray-100 rounded p-3">
              <pre className="text-xs text-gray-600">
{`<UserName
  showAvatar={true}
  size="sm"
  className="px-3 py-2 hover:bg-gray-100 rounded-md"
/>`}
              </pre>
            </div>
          </div>

          {/* Welcome Message */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Welcome Message</h3>
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">Welcome,</h1>
                <UserName
                  size="lg"
                  variant="highlighted"
                  className="text-3xl font-bold"
                />
                <span className="text-3xl font-bold text-gray-900">!</span>
              </div>
              <p className="mt-2 text-gray-600">View your training progress and statistics</p>
            </div>
            <div className="mt-2 bg-gray-100 rounded p-3">
              <pre className="text-xs text-gray-600">
{`<div className="flex items-center space-x-3">
  <h1 className="text-3xl font-bold">Welcome,</h1>
  <UserName size="lg" variant="highlighted" className="text-3xl font-bold" />
  <span className="text-3xl font-bold">!</span>
</div>`}
              </pre>
            </div>
          </div>

          {/* Profile Card */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Profile Card</h3>
            <div className="bg-white border rounded-lg">
              <ProfileCard compact={true} />
            </div>
            <div className="mt-2 bg-gray-100 rounded p-3">
              <pre className="text-xs text-gray-600">
{`<ProfileCard compact={true} />`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Props Documentation */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Props Documentation</h2>
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">className</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">''</td>
                <td className="px-6 py-4 text-sm text-gray-500">Custom CSS classes</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">showSkeleton</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">boolean</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">true</td>
                <td className="px-6 py-4 text-sm text-gray-500">Show loading skeleton</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">fallback</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">'User'</td>
                <td className="px-6 py-4 text-sm text-gray-500">Text when username unavailable</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">username</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">undefined</td>
                <td className="px-6 py-4 text-sm text-gray-500">Direct username (bypasses DB)</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">asLink</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">boolean</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">true</td>
                <td className="px-6 py-4 text-sm text-gray-500">Render as clickable link</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">href</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">'/user'</td>
                <td className="px-6 py-4 text-sm text-gray-500">Link destination</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">showAvatar</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">boolean</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">false</td>
                <td className="px-6 py-4 text-sm text-gray-500">Show user avatar/initial</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">size</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">'sm' | 'md' | 'lg'</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">'md'</td>
                <td className="px-6 py-4 text-sm text-gray-500">Size variant</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">variant</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">'default' | 'subtle' | 'highlighted'</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">'default'</td>
                <td className="px-6 py-4 text-sm text-gray-500">Style variant</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">truncate</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">boolean</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">false</td>
                <td className="px-6 py-4 text-sm text-gray-500">Truncate long usernames</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">maxLength</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">number</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">20</td>
                <td className="px-6 py-4 text-sm text-gray-500">Max chars before truncation</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">showTooltip</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">boolean</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">false</td>
                <td className="px-6 py-4 text-sm text-gray-500">Tooltip on truncated text</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default UserNameExamples