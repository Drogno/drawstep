'use client'

import { useState, useTransition } from 'react'
import { exportUserData, deleteUserData, getUserDataSummary } from '@/app/user/settings/data-actions'
import { formatDuration } from '@/lib/duration'

interface DataSummary {
  sessions: number
  events: number
  totalDuration: number
  oldestSession: string | null
  newestSession: string | null
}

const DataManagement = () => {
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1)
  const [confirmationText, setConfirmationText] = useState('')
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleExportData = () => {
    startTransition(async () => {
      setMessage(null)

      try {
        const result = await exportUserData()

        if (result.error) {
          setMessage({ type: 'error', text: result.error })
          return
        }

        if (result.data && result.filename) {
          // Create and download the file
          const blob = new Blob([JSON.stringify(result.data, null, 2)], {
            type: 'application/json'
          })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = result.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          setMessage({
            type: 'success',
            text: `Data exported successfully! Downloaded ${result.filename}`
          })
        }
      } catch (err) {
        setMessage({
          type: 'error',
          text: 'Failed to export data. Please try again.'
        })
      }
    })
  }

  const handleDeleteDataStart = () => {
    startTransition(async () => {
      try {
        const summary = await getUserDataSummary()

        if (summary.error) {
          setMessage({ type: 'error', text: summary.error })
          return
        }

        setDataSummary(summary)
        setShowDeleteConfirmation(true)
        setDeleteStep(1)
      } catch (err) {
        setMessage({
          type: 'error',
          text: 'Failed to load data summary. Please try again.'
        })
      }
    })
  }

  const handleDeleteDataConfirm = () => {
    startTransition(async () => {
      setMessage(null)

      try {
        const result = await deleteUserData(confirmationText)

        if (result.error) {
          setMessage({ type: 'error', text: result.error })
          return
        }

        if (result.success) {
          setMessage({
            type: 'success',
            text: 'All your training data has been successfully deleted. Your profile and settings remain intact.'
          })
          setShowDeleteConfirmation(false)
          setDeleteStep(1)
          setConfirmationText('')
          setDataSummary(null)
        }
      } catch (err) {
        setMessage({
          type: 'error',
          text: 'Failed to delete data. Please try again.'
        })
      }
    })
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false)
    setDeleteStep(1)
    setConfirmationText('')
    setDataSummary(null)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
      <p className="text-sm text-gray-600 mb-6">
        Export or delete your training data. Your profile and settings will remain intact.
      </p>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
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

      {/* Action Buttons */}
      {!showDeleteConfirmation && (
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">Export Your Data</h4>
            <p className="text-sm text-gray-600 mb-3">
              Download all your training sessions and events as a JSON file.
              This includes all session details, mulligan decisions, and timestamps.
            </p>
            <button
              onClick={handleExportData}
              disabled={isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Preparing Export...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Data
                </>
              )}
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-800 mb-2">Delete Your Data</h4>
            <p className="text-sm text-gray-600 mb-3">
              Permanently delete all your training sessions and events.
              This action cannot be undone. Your profile and settings will remain intact.
            </p>
            <button
              onClick={handleDeleteDataStart}
              disabled={isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Data
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && dataSummary && (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          {deleteStep === 1 && (
            <div>
              <h4 className="text-lg font-medium text-red-800 mb-3">
                ⚠️ Confirm Data Deletion
              </h4>
              <p className="text-sm text-red-700 mb-4">
                You are about to permanently delete all your training data. This action cannot be undone.
              </p>

              <div className="bg-white border border-red-200 rounded p-3 mb-4">
                <h5 className="font-medium text-gray-800 mb-2">Data to be deleted:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>{dataSummary.sessions}</strong> training sessions</li>
                  <li>• <strong>{dataSummary.events}</strong> mulligan events</li>
                  <li>• <strong>{formatDuration(dataSummary.totalDuration)}</strong> total training time</li>
                  {dataSummary.oldestSession && (
                    <li>• Data from <strong>{new Date(dataSummary.oldestSession).toLocaleDateString()}</strong> to <strong>{dataSummary.newestSession ? new Date(dataSummary.newestSession).toLocaleDateString() : 'now'}</strong></li>
                  )}
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Your profile, username, and settings will remain intact.
                  Only your training session data will be deleted.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteStep(2)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Continue to Confirmation
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div>
              <h4 className="text-lg font-medium text-red-800 mb-3">
                🔒 Final Confirmation
              </h4>
              <p className="text-sm text-red-700 mb-4">
                To confirm deletion, please type <strong>"DELETE MY DATA"</strong> (without quotes) in the field below:
              </p>

              <div className="mb-4">
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type: DELETE MY DATA"
                  className="w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  disabled={isPending}
                />
                {confirmationText && confirmationText !== 'DELETE MY DATA' && (
                  <p className="mt-1 text-sm text-red-600">
                    Text must match exactly: "DELETE MY DATA"
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteDataConfirm}
                  disabled={isPending || confirmationText !== 'DELETE MY DATA'}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting Data...
                    </>
                  ) : (
                    'Delete My Data Permanently'
                  )}
                </button>
                <button
                  onClick={handleCancelDelete}
                  disabled={isPending}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DataManagement