/**
 * Shared utility functions used across dashboard pages.
 */

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
  if (seconds == null || seconds < 0) return compact ? '0m' : '0 sec'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (compact) {
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  if (h > 0) {
    return `${h} ${h === 1 ? 'hour' : 'hours'}${m > 0 ? ` ${m} ${m === 1 ? 'min' : 'mins'}` : ''}`
  }
  if (m > 0) {
    return `${m} ${m === 1 ? 'min' : 'mins'}${s > 0 ? ` ${s} ${s === 1 ? 'sec' : 'secs'}` : ''}`
  }
  return `${s} ${s === 1 ? 'sec' : 'secs'}`
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
  banner.style.background = 'rgba(255, 59, 48, 0.1)'
  banner.style.color = 'var(--text-primary)'
  banner.style.border = '1px solid rgba(255, 59, 48, 0.3)'
  banner.textContent = message
  container.prepend(banner)

  setTimeout(() => banner.remove(), durationMs)
}

/**
 * Human-readable label for a monitoring mode value.
 * Short: "Camera", "Screen", "Both" (for compact displays).
 * Full: "Camera Only", "Screen Only", "Camera + Screen".
 */
export function modeLabel(mode, short = false) {
  if (short) {
    if (mode === 'camera_only') return 'Camera'
    if (mode === 'screen_only') return 'Screen'
    if (mode === 'both') return 'Both'
  } else {
    if (mode === 'camera_only') return 'Camera Only'
    if (mode === 'screen_only') return 'Screen Only'
    if (mode === 'both') return 'Camera + Screen'
  }
  return mode || '-'
}
