import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from './supabase/server'

/**
 * Server-side guard utility to ensure row ownership and prevent unauthorized access
 */

export type TableName =
  | 'profiles'
  | 'mulligan_sessions'
  | 'mulligan_events'

interface OwnershipConfig {
  userIdColumn: string
  primaryKeyColumn: string
}

// Configuration for each table's ownership structure
const TABLE_CONFIG: Record<TableName, OwnershipConfig> = {
  profiles: {
    userIdColumn: 'id', // profiles.id IS the user_id
    primaryKeyColumn: 'id'
  },
  mulligan_sessions: {
    userIdColumn: 'user_id',
    primaryKeyColumn: 'id'
  },
  mulligan_events: {
    userIdColumn: 'user_id',
    primaryKeyColumn: 'id'
  }
}

/**
 * Ensures that a row belongs to the current authenticated user
 * Throws notFound() if row doesn't exist or doesn't belong to user
 *
 * @param table - Table name to check
 * @param rowId - ID of the row to verify ownership
 * @param userId - User ID to check ownership against (if not provided, gets from session)
 * @returns The row data if ownership is verified
 */
export const ensureOwnRow = async <T = any>(
  table: TableName,
  rowId: string,
  userId?: string
): Promise<T> => {
  const supabase = createSupabaseServerClient()

  // Get current user ID if not provided
  let currentUserId = userId
  if (!currentUserId) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      notFound()
    }
    currentUserId = session.user.id
  }

  const config = TABLE_CONFIG[table]
  if (!config) {
    throw new Error(`Unknown table: ${table}`)
  }

  // Query the row with ownership check
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq(config.primaryKeyColumn, rowId)
    .eq(config.userIdColumn, currentUserId)
    .single()

  // If no data or error, the row either doesn't exist or doesn't belong to user
  if (error || !data) {
    console.warn(`Row access denied or not found: ${table}/${rowId} for user ${currentUserId}`)
    notFound()
  }

  return data as T
}

/**
 * Ensures that multiple rows belong to the current authenticated user
 * Returns only the rows that belong to the user (empty array if none match)
 *
 * @param table - Table name to check
 * @param rowIds - Array of row IDs to verify ownership
 * @param userId - User ID to check ownership against (if not provided, gets from session)
 * @returns Array of rows that belong to the user
 */
export const ensureOwnRows = async <T = any>(
  table: TableName,
  rowIds: string[],
  userId?: string
): Promise<T[]> => {
  if (rowIds.length === 0) return []

  const supabase = createSupabaseServerClient()

  // Get current user ID if not provided
  let currentUserId = userId
  if (!currentUserId) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return []
    }
    currentUserId = session.user.id
  }

  const config = TABLE_CONFIG[table]
  if (!config) {
    throw new Error(`Unknown table: ${table}`)
  }

  // Query all rows with ownership check
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .in(config.primaryKeyColumn, rowIds)
    .eq(config.userIdColumn, currentUserId)

  if (error) {
    console.error(`Error fetching owned rows from ${table}:`, error)
    return []
  }

  return (data || []) as T[]
}

/**
 * Checks if a row belongs to the current user without throwing
 *
 * @param table - Table name to check
 * @param rowId - ID of the row to verify ownership
 * @param userId - User ID to check ownership against (if not provided, gets from session)
 * @returns true if row belongs to user, false otherwise
 */
export const checkOwnRow = async (
  table: TableName,
  rowId: string,
  userId?: string
): Promise<boolean> => {
  try {
    await ensureOwnRow(table, rowId, userId)
    return true
  } catch {
    return false
  }
}

/**
 * Helper to get current user ID from session
 * Throws notFound() if no authenticated user
 */
export const getCurrentUserId = async (): Promise<string> => {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user?.id) {
    notFound()
  }

  return session.user.id
}

/**
 * Helper to create a Supabase query builder with automatic user filtering
 *
 * @param table - Table name
 * @param userId - User ID (if not provided, gets from session)
 * @returns Supabase query builder with user filter applied
 */
export const createUserQuery = async (table: TableName, userId?: string) => {
  const supabase = createSupabaseServerClient()

  let currentUserId = userId
  if (!currentUserId) {
    currentUserId = await getCurrentUserId()
  }

  const config = TABLE_CONFIG[table]
  if (!config) {
    throw new Error(`Unknown table: ${table}`)
  }

  return supabase
    .from(table)
    .select()
    .eq(config.userIdColumn, currentUserId)
}

// Type-safe interfaces for common queries
export interface SessionRow {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  deck_name: string | null
  device: 'WEB' | 'MOBILE' | null
  client_version: string | null
  created_at: string
}

export interface EventRow {
  id: string
  session_id: string
  user_id: string
  type: 'START_HAND' | 'MULLIGAN' | 'NEW_HAND' | 'END_SESSION'
  hand_size: number | null
  kept_cards: string[] | null
  mulliganed_cards: string[] | null
  duration_ms: number | null
  created_at: string
}

export interface ProfileRow {
  id: string
  username: string
  settings: any
  created_at: string
}