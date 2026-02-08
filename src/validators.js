/**
 * Shared input validation and sanitization for security (length limits, format checks).
 * Used across auth and dashboard pages to reject invalid or oversized input before sending to Supabase.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_MAX = 254
const NAME_MAX = 200
const PASSWORD_MIN = 6
const PASSWORD_MAX = 128
const APP_NAME_MAX = 100

/**
 * Basic email format and length. Does not replace server-side validation.
 */
export function isValidEmail(str) {
  if (typeof str !== 'string') return false
  const s = str.trim()
  if (s.length === 0 || s.length > EMAIL_MAX) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

/**
 * Display or full name: non-empty, max length, no angle brackets (simple HTML check).
 */
export function isValidName(str) {
  if (typeof str !== 'string') return false
  const s = str.trim()
  if (s.length === 0 || s.length > NAME_MAX) return false
  return !/[<>]/.test(s)
}

/**
 * Password length only. Complexity is enforced by Supabase/auth policy as needed.
 */
export function isValidPassword(str) {
  if (typeof str !== 'string') return false
  const len = str.length
  return len >= PASSWORD_MIN && len <= PASSWORD_MAX
}

/**
 * Custom app name for blocklist: non-empty, max length, no angle brackets.
 */
export function isValidAppName(str) {
  if (typeof str !== 'string') return false
  const s = str.trim()
  if (s.length === 0 || s.length > APP_NAME_MAX) return false
  return !/[<>]/.test(s)
}

/**
 * UUID v4 format (e.g. package_id, tier_id).
 */
export function isValidUuid(str) {
  if (typeof str !== 'string') return false
  return UUID_REGEX.test(str.trim())
}

/**
 * Trim and truncate to maxLength. Returns string safe for display/storage.
 */
export function sanitizeText(str, maxLength = 200) {
  if (str == null) return ''
  const s = String(str).trim()
  if (s.length <= maxLength) return s
  return s.slice(0, maxLength)
}

export const LIMITS = {
  EMAIL_MAX,
  NAME_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
  APP_NAME_MAX,
}
