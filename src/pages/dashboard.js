/**
 * Dashboard page: today's stats, recent sessions, weekly chart.
 * Uses sessions table and summary_stats JSONB.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'

/** Format seconds as "Xh Ym" or "Xm" */
function formatDuration(seconds) {
  if (seconds == null || seconds < 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/** Format date for display (e.g. "Today, Feb 7 2026") */
function formatDateLabel(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  if (d.getTime() === today.getTime()) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** Get start of day in local time as ISO string for Supabase */
function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/** Get end of day in local time */
function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

/**
 * Fetch sessions from the last N days for dashboard stats and chart.
 */
async function fetchSessionsForDashboard() {
  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - 14)
  const { data, error } = await supabase
    .from('sessions')
    .select('id, session_name, start_time, end_time, monitoring_mode, summary_stats')
    .gte('start_time', from.toISOString())
    .order('start_time', { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

/**
 * Compute today's and yesterday's stats from session list.
 */
function computeDailyStats(sessions) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStart = today.getTime()
  const todayEnd = today.getTime() + 24 * 60 * 60 * 1000 - 1
  const yesterdayStart = yesterday.getTime()
  const yesterdayEnd = yesterdayStart + 24 * 60 * 60 * 1000 - 1

  const stats = {
    today: { focusSeconds: 0, distractions: 0, focusPercentageSum: 0, durationSum: 0, count: 0 },
    yesterday: { focusSeconds: 0, distractions: 0, focusPercentageSum: 0, durationSum: 0, count: 0 },
  }

  for (const s of sessions) {
    const start = new Date(s.start_time).getTime()
    const end = s.end_time ? new Date(s.end_time).getTime() : start
    const durationSec = Math.max(0, (end - start) / 1000)
    const summary = s.summary_stats || {}
    const present = summary.present_seconds ?? 0
    const gadgets = summary.gadget_count ?? 0
    const screen = summary.screen_distraction_count ?? 0
    const focusPct = summary.focus_percentage ?? 0

    if (start >= todayStart && start < todayEnd) {
      stats.today.focusSeconds += present
      stats.today.distractions += gadgets + screen
      stats.today.focusPercentageSum += focusPct * durationSec
      stats.today.durationSum += durationSec
      stats.today.count += 1
    } else if (start >= yesterdayStart && start < yesterdayEnd) {
      stats.yesterday.focusSeconds += present
      stats.yesterday.distractions += gadgets + screen
      stats.yesterday.focusPercentageSum += focusPct * durationSec
      stats.yesterday.durationSum += durationSec
      stats.yesterday.count += 1
    }
  }

  return stats
}

/**
 * Build weekly chart data: last 7 days, each day total focus seconds.
 */
function buildWeeklyChartData(sessions) {
  const days = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const start = d.getTime()
    const end = next.getTime()
    let focusSeconds = 0
    for (const s of sessions) {
      const t = new Date(s.start_time).getTime()
      if (t >= start && t < end) {
        focusSeconds += (s.summary_stats?.present_seconds ?? 0)
      }
    }
    days.push({
      label: formatDateLabel(d),
      focusSeconds,
      date: d,
    })
  }
  const maxSec = Math.max(1, ...days.map((x) => x.focusSeconds))
  days.forEach((d) => {
    d.heightPct = maxSec > 0 ? (d.focusSeconds / maxSec) * 100 : 0
  })
  return days
}

/**
 * Fetch user's credit balance from user_credits.
 */
async function fetchUserCredits() {
  const { data, error } = await supabase
    .from('user_credits')
    .select('total_purchased_seconds, total_used_seconds')
    .single()
  if (error) {
    if (error.code === 'PGRST116') return { total_purchased_seconds: 0, total_used_seconds: 0, remaining_seconds: 0 }
    console.error('Credits fetch error:', error)
    return { total_purchased_seconds: 0, total_used_seconds: 0, remaining_seconds: 0 }
  }
  const purchased = data?.total_purchased_seconds ?? 0
  const used = data?.total_used_seconds ?? 0
  return {
    total_purchased_seconds: purchased,
    total_used_seconds: used,
    remaining_seconds: Math.max(0, purchased - used),
  }
}

/**
 * Render the dashboard into main.
 */
function render(main, user, sessions, stats, weeklyData, credits) {
  const name = user?.user_metadata?.full_name || user?.email || 'there'
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
  const remainingSec = credits?.remaining_seconds ?? 0
  const hasCredits = remainingSec > 0

  const todayFocusRate = stats.today.durationSum > 0
    ? Math.round(stats.today.focusPercentageSum / stats.today.durationSum)
    : 0
  const yesterdayFocusRate = stats.yesterday.durationSum > 0
    ? Math.round(stats.yesterday.focusPercentageSum / stats.yesterday.durationSum)
    : 0

  // Comparison vs yesterday (assigned to stats to prevent tree-shaking)
  stats._focusDiff = stats.today.focusSeconds - stats.yesterday.focusSeconds
  stats._focusDiffStr = stats._focusDiff >= 0 ? `+${formatDuration(stats._focusDiff)}` : `-${formatDuration(Math.abs(stats._focusDiff))}`
  stats._distDiff = stats.today.distractions - stats.yesterday.distractions
  stats._distDiffStr = stats._distDiff > 0 ? `+${stats._distDiff}` : stats._distDiff < 0 ? `${stats._distDiff}` : '0'
  stats._rateDiff = todayFocusRate - yesterdayFocusRate
  stats._rateDiffStr = stats._rateDiff > 0 ? `+${stats._rateDiff}%` : stats._rateDiff < 0 ? `${stats._rateDiff}%` : '0%'

  const recentSessions = sessions.slice(0, 5)
  const hasSessions = sessions.length > 0

  const modeLabel = (mode) => {
    if (mode === 'camera_only') return 'Camera'
    if (mode === 'screen_only') return 'Screen'
    if (mode === 'both') return 'Both'
    return mode || '–'
  }

  // Credits widget: show remaining hours; if zero, show Buy Hours CTA
  const creditsWidget = `
    <div class="dashboard-card" style="margin-bottom: var(--space-xl);">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-m);">
        <div>
          <h2 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; margin-bottom: var(--space-xs);">Hours remaining</h2>
          <p style="font-size: 1.5rem; font-weight: 600; color: var(--text-primary);">${formatDuration(remainingSec)}</p>
        </div>
        ${!hasCredits
    ? `<a href="/pricing/" class="btn btn-primary">Buy Hours</a>`
    : `<a href="/pricing/" class="btn btn-secondary">Get more hours</a>`}
      </div>
    </div>
  `

  main.innerHTML = `
    <div class="dashboard-section">
      <h1 class="dashboard-page-title">Dashboard</h1>
      <p style="font-family: var(--font-sans); color: var(--text-secondary); margin-bottom: var(--space-xl);">
        Welcome back, ${escapeHtml(name)} &middot; ${todayStr}
      </p>
    </div>

    ${creditsWidget}
    ${hasCredits && !hasSessions ? `
    <div class="dashboard-card" style="border-left: 4px solid var(--success); margin-bottom: var(--space-xl);">
      <h2 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; margin-bottom: var(--space-s);">You're all set! Download BrainDock</h2>
      <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: var(--space-l);">You have hours available. Download the desktop app and sign in with the same account to start tracking your focus.</p>
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-m);">
        <a href="https://github.com/Morayya-Jain/BrainDock/releases/latest/download/BrainDock-macOS.dmg" class="btn btn-primary">Download for macOS</a>
        <a href="https://github.com/Morayya-Jain/BrainDock/releases/latest/download/BrainDock-Setup.exe" class="btn btn-secondary">Download for Windows</a>
      </div>
    </div>
    ` : ''}

    <div class="dashboard-stat-cards">
      <div class="dashboard-stat-card">
        <div class="dashboard-stat-card-label">Today's Focus</div>
        <div class="dashboard-stat-card-value">${formatDuration(stats.today.focusSeconds)}</div>
        <div class="dashboard-stat-card-sub">${stats._focusDiffStr} vs yesterday</div>
      </div>
      <div class="dashboard-stat-card">
        <div class="dashboard-stat-card-label">Today's Distractions</div>
        <div class="dashboard-stat-card-value">${stats.today.distractions}</div>
        <div class="dashboard-stat-card-sub">${stats._distDiffStr} vs yesterday</div>
      </div>
      <div class="dashboard-stat-card">
        <div class="dashboard-stat-card-label">Focus Rate</div>
        <div class="dashboard-stat-card-value">${todayFocusRate}%</div>
        <div class="dashboard-stat-card-sub">${stats._rateDiffStr} vs yesterday</div>
      </div>
    </div>

    <div class="dashboard-section">
      <div class="dashboard-section-header">
        <h2 class="dashboard-section-title">Recent Sessions</h2>
        ${hasSessions ? '<a href="/sessions/" class="btn btn-secondary dashboard-btn-sm">View All</a>' : ''}
      </div>
      <div class="dashboard-card">
        ${!hasSessions
          ? `
          <div class="dashboard-empty">
            <p class="dashboard-empty-title">No sessions yet</p>
            <p>Start tracking with the BrainDock app to see your focus stats here.</p>
          </div>
          `
          : `
          <ul class="dashboard-list">
            ${recentSessions
              .map((s) => {
                const summary = s.summary_stats || {}
                const duration = summary.present_seconds ?? 0
                const pct = summary.focus_percentage ?? 0
                const gadgets = summary.gadget_count ?? 0
                const screen = summary.screen_distraction_count ?? 0
                const start = new Date(s.start_time)
                const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                const dayStr = formatDateLabel(s.start_time)
                return `
                  <li class="dashboard-list-item">
                    <div>
                      <strong>${escapeHtml(s.session_name || 'Session')}</strong><br>
                      <span style="font-size: 0.875rem; color: var(--text-secondary);">${dayStr} ${timeStr} &middot; ${modeLabel(s.monitoring_mode)} &middot; ${formatDuration(duration)} active &middot; ${Math.round(pct)}% focus</span><br>
                      <span style="font-size: 0.8125rem; color: var(--text-tertiary);">${gadgets} gadgets &middot; ${screen} screen distractions</span>
                    </div>
                    <a href="/sessions/${escapeHtml(s.id)}" class="btn btn-secondary dashboard-btn-sm">View</a>
                  </li>
                `
              })
              .join('')}
          </ul>
          `}
      </div>
    </div>

    <div class="dashboard-section">
      <h2 class="dashboard-section-title">This Week</h2>
      <div class="dashboard-card">
        ${!hasSessions
          ? `
          <div class="dashboard-empty">
            <p class="dashboard-empty-title">No data yet</p>
            <p>Complete a session with the desktop app to see your weekly focus.</p>
          </div>
          `
          : `
          <div class="dashboard-chart">
            ${weeklyData
              .map(
                (d) => `
              <div class="dashboard-chart-bar-wrap">
                <div class="dashboard-chart-bar" style="height: ${d.heightPct}%;"></div>
                <span class="dashboard-chart-label">${escapeHtml(d.label)}</span>
              </div>
            `
              )
              .join('')}
          </div>
          <p style="font-size: 0.8125rem; color: var(--text-tertiary); text-align: center; margin-top: var(--space-s);">Focus time by day</p>
          `}
      </div>
    </div>
  `
}

function escapeHtml(str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  mainEl.innerHTML = `
    <div class="dashboard-loading">
      <div class="dashboard-spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  `

  try {
    const [sessions, credits] = await Promise.all([
      fetchSessionsForDashboard(),
      fetchUserCredits(),
    ])
    const stats = computeDailyStats(sessions)
    const weeklyData = buildWeeklyChartData(sessions)
    render(mainEl, result.user, sessions, stats, weeklyData, credits)
  } catch (err) {
    console.error(err)
    mainEl.innerHTML = `
      <div class="dashboard-empty">
        <p class="dashboard-empty-title">Something went wrong</p>
        <p>${escapeHtml(err.message || 'Failed to load dashboard.')}</p>
      </div>
    `
  }
}

main()
