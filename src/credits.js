/**
 * Shared credit-fetching logic used by dashboard-layout, dashboard page,
 * and billing page. Single source of truth for querying user_credits.
 */

import { supabase } from './supabase.js'
import { logError } from './logger.js'

/**
 * Fetch user credit balance from user_credits table.
 * Returns { total_purchased_seconds, total_used_seconds, remaining_seconds }.
 * Returns zeroed object on error instead of throwing.
 */
export async function fetchUserCredits() {
  const empty = { total_purchased_seconds: 0, total_used_seconds: 0, remaining_seconds: 0 }
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('total_purchased_seconds, total_used_seconds')
      .single()
    if (error) {
      if (error.code !== 'PGRST116') logError('Credits fetch error:', error)
      return empty
    }
    const purchased = data?.total_purchased_seconds ?? 0
    const used = data?.total_used_seconds ?? 0
    return {
      total_purchased_seconds: purchased,
      total_used_seconds: used,
      remaining_seconds: Math.max(0, purchased - used),
    }
  } catch (_) {
    return empty
  }
}

/**
 * Convenience: fetch just the remaining seconds (used by the sidebar pill).
 */
export async function fetchRemainingSeconds() {
  const credits = await fetchUserCredits()
  return credits.remaining_seconds
}
