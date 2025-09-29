/**
 * Computes the duration of a session based on start/end times and last event
 *
 * @param startedAt - Session start timestamp (ISO string or Date)
 * @param endedAt - Session end timestamp (ISO string, Date, or null/undefined)
 * @param lastEventAt - Last event timestamp (ISO string, Date, or null/undefined)
 * @returns Duration in milliseconds, or 0 if invalid input
 */
export const computeSessionDuration = (
  startedAt: string | Date | null | undefined,
  endedAt: string | Date | null | undefined,
  lastEventAt: string | Date | null | undefined
): number => {
  // Validate startedAt
  if (!startedAt) return 0

  const startTime = new Date(startedAt)
  if (isNaN(startTime.getTime())) return 0

  // If session has explicit end time, use it
  if (endedAt) {
    const endTime = new Date(endedAt)
    if (!isNaN(endTime.getTime())) {
      const duration = endTime.getTime() - startTime.getTime()
      return Math.max(0, duration)
    }
  }

  // Otherwise, use last event time as approximation
  if (lastEventAt) {
    const lastEventTime = new Date(lastEventAt)
    if (!isNaN(lastEventTime.getTime())) {
      const duration = lastEventTime.getTime() - startTime.getTime()
      return Math.max(0, duration)
    }
  }

  // No valid end time available
  return 0
}

/**
 * Formats duration in milliseconds to human-readable format
 *
 * @param milliseconds - Duration in milliseconds
 * @param format - Output format: 'hh:mm:ss' | 'hh:mm' | 'short'
 * @returns Formatted duration string
 */
export const formatDuration = (
  milliseconds: number,
  format: 'hh:mm:ss' | 'hh:mm' | 'short' = 'hh:mm:ss'
): string => {
  if (typeof milliseconds !== 'number' || milliseconds < 0 || !isFinite(milliseconds)) {
    return format === 'hh:mm:ss' ? '00:00:00' :
           format === 'hh:mm' ? '00:00' : '0s'
  }

  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  switch (format) {
    case 'hh:mm:ss':
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    case 'hh:mm':
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

    case 'short':
      if (hours > 0) {
        return `${hours}h ${minutes}m`
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`
      } else {
        return `${seconds}s`
      }

    default:
      return '00:00:00'
  }
}

/**
 * Parses a duration string back to milliseconds
 * Supports formats: "hh:mm:ss", "hh:mm", "1h 30m", "45m 30s", "30s"
 *
 * @param durationStr - Duration string to parse
 * @returns Duration in milliseconds, or 0 if invalid
 */
export const parseDuration = (durationStr: string): number => {
  if (!durationStr || typeof durationStr !== 'string') return 0

  const trimmed = durationStr.trim()

  // Try colon format first (hh:mm:ss or hh:mm)
  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (colonMatch) {
    const hours = parseInt(colonMatch[1], 10)
    const minutes = parseInt(colonMatch[2], 10)
    const seconds = colonMatch[3] ? parseInt(colonMatch[3], 10) : 0

    if (hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
      return 0
    }

    return (hours * 3600 + minutes * 60 + seconds) * 1000
  }

  // Try short format (1h 30m 45s, 30m, 45s, etc.)
  let totalMs = 0

  const hoursMatch = trimmed.match(/(\d+)h/)
  if (hoursMatch) {
    totalMs += parseInt(hoursMatch[1], 10) * 3600 * 1000
  }

  const minutesMatch = trimmed.match(/(\d+)m/)
  if (minutesMatch) {
    totalMs += parseInt(minutesMatch[1], 10) * 60 * 1000
  }

  const secondsMatch = trimmed.match(/(\d+)s/)
  if (secondsMatch) {
    totalMs += parseInt(secondsMatch[1], 10) * 1000
  }

  return totalMs
}

/**
 * Adds two durations in milliseconds safely
 *
 * @param duration1 - First duration in milliseconds
 * @param duration2 - Second duration in milliseconds
 * @returns Sum of durations, or 0 if invalid input
 */
export const addDurations = (duration1: number, duration2: number): number => {
  if (typeof duration1 !== 'number' || typeof duration2 !== 'number') return 0
  if (!isFinite(duration1) || !isFinite(duration2)) return 0
  if (duration1 < 0 || duration2 < 0) return 0

  return duration1 + duration2
}

/**
 * Calculates average duration from an array of durations
 *
 * @param durations - Array of durations in milliseconds
 * @returns Average duration in milliseconds, or 0 if empty array
 */
export const averageDuration = (durations: number[]): number => {
  if (!Array.isArray(durations) || durations.length === 0) return 0

  const validDurations = durations.filter(d =>
    typeof d === 'number' && isFinite(d) && d >= 0
  )

  if (validDurations.length === 0) return 0

  const sum = validDurations.reduce((acc, duration) => acc + duration, 0)
  return Math.round(sum / validDurations.length)
}