/**
 * Shared input validation and sanitization for security (length limits, format checks).
 * Used across auth and dashboard pages to reject invalid or oversized input before sending to Supabase.
 * Blocklist URL/app validation matches desktop app behaviour (TLD check, DNS lookup, KNOWN_APPS).
 */

import { supabaseAnonKey } from './supabase.js'

// Blocklist data (VALID_TLDS, KNOWN_APPS) is large (~1,378 entries).
// Lazy-loaded on first use so pages that only need basic validators don't pay the bundle cost.
let _blocklistData = null
async function getBlocklistData() {
  if (!_blocklistData) {
    _blocklistData = await import('./blocklist-data.js')
  }
  return _blocklistData
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const URL_FORMAT_REGEX = /^[a-z0-9:][a-z0-9._\-:/]*[a-z0-9]$/
const APP_CHAR_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9\s\-+'":&()]*[a-zA-Z0-9+'()]?$/
const GENERIC_TERMS = new Set(['app', 'web', 'the', 'new', 'my', 'get', 'go'])
const DNS_FETCH_TIMEOUT_MS = 3000
const EMAIL_MAX = 254
const NAME_MAX = 200
const PASSWORD_MIN = 8
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

/**
 * Call the validate-domain edge function to check if a domain resolves (DNS).
 * Returns { exists: boolean, message: string }. On timeout or error, returns exists: true (graceful fallback).
 */
export async function checkDomainDns(domain) {
  const baseUrl = import.meta.env?.VITE_SUPABASE_URL
  if (!baseUrl) return { exists: true, message: 'Could not verify (config missing)' }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DNS_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`${baseUrl}/functions/v1/validate-domain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ domain }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const data = await res.json().catch(() => ({}))
    return { exists: data.exists !== false, message: data.message || '' }
  } catch (e) {
    clearTimeout(timeoutId)
    return { exists: true, message: 'Could not verify (network unavailable) - accepted based on format' }
  }
}

/**
 * Validate a custom URL/domain pattern (blocklist). TLD check + optional DNS lookup.
 * Returns { valid: boolean, message: string, isWarning: boolean }.
 * isWarning true means valid but show warning (e.g. unknown TLD, DNS failed).
 */
export async function validateUrlPattern(url) {
  try {
    const u = String(url).trim().toLowerCase()
    if (u.length < 3) return { valid: false, message: `'${u}' is too short (min 3 characters)`, isWarning: false }
    if (u.length > 253) return { valid: false, message: `'${u}' is too long (max 253 characters)`, isWarning: false }
    if (!URL_FORMAT_REGEX.test(u)) return { valid: false, message: `'${u}' contains invalid characters for a URL`, isWarning: false }
    if (!u.includes('.')) return { valid: false, message: `'${u}' doesn't look like a URL - needs a domain extension (e.g. .com)`, isWarning: false }

    const { VALID_TLDS } = await getBlocklistData()

    let domain = u
    if (domain.includes('://')) domain = domain.split('://').pop()
    if (domain.includes('/')) domain = domain.split('/')[0]
    const parts = domain.split('.')
    if (parts.length >= 2) {
      const potentialCompound = parts.slice(-2).join('.')
      const tld = parts[parts.length - 1]
      if (!VALID_TLDS.has(potentialCompound) && !VALID_TLDS.has(tld)) {
        return { valid: false, message: `'${u}' has invalid domain extension '.${tld}'`, isWarning: false }
      }
    }

    const domainName = parts[0] || ''
    if (GENERIC_TERMS.has(domainName)) {
      return { valid: true, message: `'${u}' is generic and may cause false positives`, isWarning: true }
    }

    const dns = await checkDomainDns(domain)
    if (!dns.exists) return { valid: true, message: dns.message, isWarning: true }
    return { valid: true, message: '', isWarning: false }
  } catch (e) {
    return { valid: false, message: `Validation error: ${e.message}`, isWarning: false }
  }
}

/**
 * Validate a custom app name pattern (blocklist). Character check + KNOWN_APPS whitelist.
 * Returns { valid: boolean, message: string, isWarning: boolean }.
 */
export async function validateAppPattern(appName) {
  try {
    const app = String(appName).trim()
    if (app.length < 3) return { valid: false, message: `'${app}' is too short (min 3 characters)`, isWarning: false }
    if (app.length > 50) return { valid: false, message: `'${app}' is too long (max 50 characters)`, isWarning: false }

    const { VALID_TLDS, KNOWN_APPS } = await getBlocklistData()

    if (app.includes('.') && app.split('.').length <= 3) {
      const lowerParts = app.toLowerCase().split('.')
      if (lowerParts.length >= 2 && VALID_TLDS.has(lowerParts[lowerParts.length - 1])) {
        return { valid: false, message: `'${app}' looks like a URL - add it to the URLs field instead`, isWarning: false }
      }
    }

    if (!APP_CHAR_REGEX.test(app)) {
      return { valid: false, message: `'${app}' contains invalid characters - only letters, numbers, spaces, and common symbols (- + ' : & ( )) allowed`, isWarning: false }
    }

    if (['.com', '.org', '.net', '.io'].some((s) => app.toLowerCase().endsWith(s))) {
      return { valid: true, message: `'${app}' looks like it might be a URL`, isWarning: true }
    }

    const appLower = app.toLowerCase()
    if (KNOWN_APPS.has(appLower)) return { valid: true, message: '', isWarning: false }
    return { valid: false, message: `'${app}' is not a recognised app - please check the name`, isWarning: false }
  } catch (e) {
    return { valid: false, message: `Validation error: ${e.message}`, isWarning: false }
  }
}

export const LIMITS = {
  EMAIL_MAX,
  NAME_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
  APP_NAME_MAX,
}
