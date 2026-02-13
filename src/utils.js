/**
 * Shared utility functions used across dashboard pages.
 */

import { t } from './dashboard-i18n.js'

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/**
 * Escape HTML special characters to prevent XSS.
 * Uses a regex-based approach (faster than DOM-based).
 */
export function escapeHtml(str) {
  if (str == null) return ''
  return String(str).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch])
}

/**
 * Format seconds into human-readable duration.
 * Compact: "2h 30m" or "45m" (for dashboard cards).
 * Verbose: "2 hours 30 mins" or "45 mins 10 secs" (for session lists).
 */
export function formatDuration(seconds, compact = false) {
  if (seconds == null || seconds < 0) return compact ? `0${t('dashboard.time.m', 'm')}` : `0 ${t('dashboard.time.sec', 'sec')}`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (compact) {
    if (h > 0) return `${h}${t('dashboard.time.h', 'h')} ${m}${t('dashboard.time.m', 'm')}`
    return `${m}${t('dashboard.time.m', 'm')}`
  }

  if (h > 0) {
    return `${h} ${h === 1 ? t('dashboard.time.hour', 'hour') : t('dashboard.time.hours', 'hours')}${m > 0 ? ` ${m} ${m === 1 ? t('dashboard.time.min', 'min') : t('dashboard.time.mins', 'mins')}` : ''}`
  }
  if (m > 0) {
    return `${m} ${m === 1 ? t('dashboard.time.min', 'min') : t('dashboard.time.mins', 'mins')}${s > 0 ? ` ${s} ${s === 1 ? t('dashboard.time.sec', 'sec') : t('dashboard.time.secs', 'secs')}` : ''}`
  }
  return `${s} ${s === 1 ? t('dashboard.time.sec', 'sec') : t('dashboard.time.secs', 'secs')}`
}

/**
 * Show a temporary inline error/info banner at the top of the main content area.
 * Auto-dismisses after a few seconds. Replaces disruptive alert() calls.
 */
export function showInlineError(container, message, durationMs = 5000) {
  // Remove any existing inline error in this container
  const existing = container.querySelector('.dashboard-inline-error')
  if (existing) existing.remove()

  const banner = document.createElement('div')
  banner.className = 'dashboard-banner dashboard-inline-error'
  banner.setAttribute('role', 'alert')
  banner.textContent = message
  container.prepend(banner)

  setTimeout(() => banner.remove(), durationMs)
}

/**
 * Format price in cents to a human-readable string.
 * Defaults to AUD. Handles other currencies with a simple $ prefix.
 */
export function formatPrice(cents, currency = 'aud') {
  if (cents == null || isNaN(cents)) return 'A$0.00'
  const c = (currency || 'aud').toLowerCase()
  if (c === 'aud') return `A$${(cents / 100).toFixed(2)}`
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Human-readable label for a monitoring mode value.
 * Short: "Camera", "Screen", "Both" (for compact displays).
 * Full: "Camera Only", "Screen Only", "Camera + Screen".
 */
export function modeLabel(mode, short = false) {
  if (short) {
    if (mode === 'camera_only') return t('dashboard.modes.camera', 'Camera')
    if (mode === 'screen_only') return t('dashboard.modes.screen', 'Screen')
    if (mode === 'both') return t('dashboard.modes.both', 'Both')
  } else {
    if (mode === 'camera_only') return t('dashboard.modes.cameraOnly', 'Camera Only')
    if (mode === 'screen_only') return t('dashboard.modes.screenOnly', 'Screen Only')
    if (mode === 'both') return t('dashboard.modes.cameraPlusScreen', 'Camera + Screen')
  }
  // Escape fallback to prevent XSS if an unknown mode value comes from the database
  return escapeHtml(mode) || '-'
}

/**
 * Return a CSS class suffix based on focus percentage.
 * 80%+ = high (green), 50-79% = mid (amber), <50% = low (red).
 */
export function focusLevelClass(pct) {
  if (pct == null || isNaN(pct) || pct < 50) return 'dashboard-list-item--focus-low'
  if (pct >= 80) return 'dashboard-list-item--focus-high'
  return 'dashboard-list-item--focus-mid'
}
