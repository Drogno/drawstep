import { useEffect, useRef, useCallback, useState } from 'react'
import mulliganClient from '@/lib/mulliganClient'

interface UseMulliganTelemetryProps {
  deckName: string
  device?: 'WEB' | 'MOBILE'
  clientVersion: string
  autoStart?: boolean
}

interface MulliganEventData {
  handSize: number
  keptCards: string[]
  mulliganedCards: string[]
}

interface UseMulliganTelemetryReturn {
  sessionId: string | null
  isActive: boolean
  isLoading: boolean
  error: string | null
  start: () => Promise<void>
  onStartHand: (handSize: number) => Promise<void>
  onMulligan: (data: MulliganEventData) => Promise<void>
  onNewHand: (handSize: number) => Promise<void>
  end: () => Promise<void>
}

export const useMulliganTelemetry = ({
  deckName,
  device = 'WEB',
  clientVersion,
  autoStart = true
}: UseMulliganTelemetryProps): UseMulliganTelemetryReturn => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(0)

  const hasEnded = useRef<boolean>(false)
  const isMountedRef = useRef<boolean>(true)

  const handleError = useCallback((err: Error, context: string) => {
    console.error(`Mulligan telemetry error in ${context}:`, err)
    setError(`${context}: ${err.message}`)
  }, [])

  const start = useCallback(async () => {
    if (sessionId || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const newSessionId = await mulliganClient.startSession({
        deckName,
        device,
        clientVersion
      })

      if (isMountedRef.current) {
        setSessionId(newSessionId)
        setIsActive(true)
        setStartTime(Date.now())
        hasEnded.current = false
      }
    } catch (err) {
      if (isMountedRef.current) {
        handleError(err as Error, 'Start session')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [deckName, device, clientVersion, sessionId, isLoading, handleError])

  const onStartHand = useCallback(async (handSize: number) => {
    if (!sessionId || !isActive) {
      console.warn('Cannot track start hand: No active session')
      return
    }

    try {
      await mulliganClient.trackEvent({
        sessionId,
        type: 'START_HAND',
        handSize,
        durationMs: Date.now() - startTime
      })
    } catch (err) {
      handleError(err as Error, 'Track start hand')
    }
  }, [sessionId, isActive, startTime, handleError])

  const onMulligan = useCallback(async ({
    handSize,
    keptCards,
    mulliganedCards
  }: MulliganEventData) => {
    if (!sessionId || !isActive) {
      console.warn('Cannot track mulligan: No active session')
      return
    }

    try {
      await mulliganClient.trackEvent({
        sessionId,
        type: 'MULLIGAN',
        handSize,
        keptCards,
        mulliganedCards,
        durationMs: Date.now() - startTime
      })
    } catch (err) {
      handleError(err as Error, 'Track mulligan')
    }
  }, [sessionId, isActive, startTime, handleError])

  const onNewHand = useCallback(async (handSize: number) => {
    if (!sessionId || !isActive) {
      console.warn('Cannot track new hand: No active session')
      return
    }

    try {
      await mulliganClient.trackEvent({
        sessionId,
        type: 'NEW_HAND',
        handSize,
        durationMs: Date.now() - startTime
      })
    } catch (err) {
      handleError(err as Error, 'Track new hand')
    }
  }, [sessionId, isActive, startTime, handleError])

  const end = useCallback(async () => {
    if (!sessionId || !isActive || hasEnded.current) {
      return
    }

    hasEnded.current = true
    setIsActive(false)

    try {
      // Track end session event
      await mulliganClient.trackEvent({
        sessionId,
        type: 'END_SESSION',
        durationMs: Date.now() - startTime
      })

      // End the session
      await mulliganClient.endSession(sessionId)

      if (isMountedRef.current) {
        setSessionId(null)
        setStartTime(0)
      }
    } catch (err) {
      handleError(err as Error, 'End session')
    }
  }, [sessionId, isActive, startTime, handleError])

  // Auto-start session on mount
  useEffect(() => {
    if (autoStart) {
      start()
    }
  }, [autoStart, start])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false

      if (sessionId && isActive && !hasEnded.current) {
        // Fire and forget - don't await in cleanup
        end().catch(err => {
          console.error('Failed to cleanup session on unmount:', err)
        })
      }
    }
  }, [sessionId, isActive, end])

  return {
    sessionId,
    isActive,
    isLoading,
    error,
    start,
    onStartHand,
    onMulligan,
    onNewHand,
    end
  }
}