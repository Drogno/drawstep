'use client'

import { useState } from 'react'
import { useMulliganTelemetry } from '@/hooks/useMulliganTelemetry'

const MulliganTrainerExample = () => {
  const [currentHand, setCurrentHand] = useState<string[]>([])
  const [selectedCards, setSelectedCards] = useState<string[]>([])

  const telemetry = useMulliganTelemetry({
    deckName: 'Ruby Sapphire Aggro',
    device: 'WEB',
    clientVersion: '1.0.0',
    autoStart: true
  })

  const handleDrawHand = async () => {
    // Simulate drawing 7 cards
    const newHand = [
      'Mickey Mouse - Brave Little Tailor',
      'Elsa - Snow Queen',
      'Ruby',
      'Sapphire',
      'Be Prepared',
      'Steal from the Rich',
      'A Whole New World'
    ]

    setCurrentHand(newHand)
    setSelectedCards([])

    // Track start hand event
    await telemetry.onStartHand(newHand.length)
  }

  const handleToggleCard = (cardName: string) => {
    setSelectedCards(prev =>
      prev.includes(cardName)
        ? prev.filter(card => card !== cardName)
        : [...prev, cardName]
    )
  }

  const handleMulligan = async () => {
    if (selectedCards.length === 0) return

    const keptCards = currentHand.filter(card => !selectedCards.includes(card))
    const mulliganedCards = selectedCards

    // Track mulligan event
    await telemetry.onMulligan({
      handSize: currentHand.length,
      keptCards,
      mulliganedCards
    })

    // Simulate drawing new cards
    const newCards = Array(selectedCards.length).fill(null).map((_, i) =>
      `New Card ${i + 1}`
    )

    const newHand = [...keptCards, ...newCards]
    setCurrentHand(newHand)
    setSelectedCards([])

    // Track new hand event
    await telemetry.onNewHand(newHand.length)
  }

  const handleEndSession = async () => {
    await telemetry.end()
    setCurrentHand([])
    setSelectedCards([])
  }

  const handleStartNewSession = async () => {
    await telemetry.start()
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Mulligan Trainer Example
        </h2>

        {/* Session Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Session ID:</span>
              <div className="font-mono text-xs break-all">
                {telemetry.sessionId || 'None'}
              </div>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <div className={`font-semibold ${
                telemetry.isActive ? 'text-green-600' :
                telemetry.isLoading ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {telemetry.isLoading ? 'Starting...' :
                 telemetry.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <span className="font-medium">Hand Size:</span>
              <div>{currentHand.length}</div>
            </div>
            <div>
              <span className="font-medium">Selected:</span>
              <div>{selectedCards.length}</div>
            </div>
          </div>

          {telemetry.error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <div className="text-sm text-red-700">
                <strong>Error:</strong> {telemetry.error}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={handleDrawHand}
            disabled={!telemetry.isActive || telemetry.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Draw New Hand
          </button>

          <button
            onClick={handleMulligan}
            disabled={!telemetry.isActive || selectedCards.length === 0}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mulligan ({selectedCards.length})
          </button>

          <button
            onClick={handleEndSession}
            disabled={!telemetry.isActive || telemetry.isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            End Session
          </button>

          <button
            onClick={handleStartNewSession}
            disabled={telemetry.isActive || telemetry.isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start New Session
          </button>
        </div>

        {/* Current Hand */}
        {currentHand.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Current Hand (Select cards to mulligan)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentHand.map((cardName, index) => {
                const isSelected = selectedCards.includes(cardName)
                return (
                  <div
                    key={`${cardName}-${index}`}
                    onClick={() => handleToggleCard(cardName)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{cardName}</div>
                    {isSelected && (
                      <div className="text-xs text-orange-600 mt-1">
                        Selected for mulligan
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {currentHand.length === 0 && telemetry.isActive && (
          <div className="text-center py-8 text-gray-500">
            Click "Draw New Hand" to start practicing mulligans
          </div>
        )}
      </div>
    </div>
  )
}

export default MulliganTrainerExample