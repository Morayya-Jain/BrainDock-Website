/**
 * Dashboard page: today's stats, recent sessions, weekly chart.
 * Uses sessions table and summary_stats JSONB.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'
import { escapeHtml, formatDuration, modeLabel, focusLevelClass } from '../utils.js'
import { t } from '../dashboard-i18n.js'

/** Format date for display (e.g. "Today, Feb 7 2026") */
function formatDateLabel(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  if (d.getTime() === today.getTime()) return t('dashboard.common.today', 'Today')
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.getTime() === yesterday.getTime()) return t('dashboard.common.yesterday', 'Yesterday')
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
    today: { focusSeconds: 0, distractionSeconds: 0, focusPercentageSum: 0, durationSum: 0, count: 0 },
    yesterday: { focusSeconds: 0, distractionSeconds: 0, focusPercentageSum: 0, durationSum: 0, count: 0 },
  }

  for (const s of sessions) {
    const start = new Date(s.start_time).getTime()
    const end = s.end_time ? new Date(s.end_time).getTime() : start
    const durationSec = Math.max(0, (end - start) / 1000)
    const summary = s.summary_stats || {}
    const present = summary.present_seconds ?? 0
    const gadgetSec = summary.gadget_seconds ?? 0
    const screenSec = summary.screen_distraction_seconds ?? 0
    const focusPct = summary.focus_percentage ?? 0

    if (start >= todayStart && start <= todayEnd) {
      stats.today.focusSeconds += present
      stats.today.distractionSeconds += gadgetSec + screenSec
      stats.today.focusPercentageSum += focusPct * durationSec
      stats.today.durationSum += durationSec
      stats.today.count += 1
    } else if (start >= yesterdayStart && start <= yesterdayEnd) {
      stats.yesterday.focusSeconds += present
      stats.yesterday.distractionSeconds += gadgetSec + screenSec
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
  const remainingSec = credits?.remaining_seconds ?? 0
  const hasCredits = remainingSec > 0

  const todayFocusRate = stats.today.durationSum > 0
    ? Math.round(stats.today.focusPercentageSum / stats.today.durationSum)
    : 0

  const recentSessions = sessions.slice(0, 5)
  const hasSessions = sessions.length > 0

  main.innerHTML = `
    <h1 class="dashboard-page-title">${t('dashboard.home.title', 'Dashboard')}</h1>

    ${hasCredits && !hasSessions ? `
    <div class="dashboard-card dashboard-card--accent mb-xl">
      <h2 class="dashboard-section-title mb-s">${t('dashboard.home.allSetTitle', "You're all set! Download BrainDock")}</h2>
      <p class="dashboard-meta mb-l">${t('dashboard.home.allSetDesc', 'You have hours available. Download the desktop app and sign in with the same account to start tracking your focus.')}</p>
      <div class="download-buttons">
        <a href="https://github.com/Morayya-Jain/BrainDock/releases/latest/download/BrainDock-macOS.dmg" class="btn btn-primary btn-download">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          ${t('dashboard.home.downloadMac', 'macOS')}
        </a>
        <a href="https://github.com/Morayya-Jain/BrainDock/releases/latest/download/BrainDock-Setup.exe" class="btn btn-primary btn-download">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
          </svg>
          ${t('dashboard.home.downloadWin', 'Windows')}
        </a>
      </div>
    </div>
    ` : ''}

    <div class="dashboard-stat-cards">
      <div class="dashboard-stat-card">
        <div class="dashboard-stat-card-label">${t('dashboard.home.dailyFocusTime', 'Daily Focus Time')}</div>
        <div class="dashboard-stat-card-value">${formatDuration(stats.today.focusSeconds)}</div>
      </div>
      <div class="dashboard-stat-card">
        <div class="dashboard-stat-card-label">${t('dashboard.home.dailyDistractionTime', 'Daily Distraction Time')}</div>
        <div class="dashboard-stat-card-value">${formatDuration(stats.today.distractionSeconds)}</div>
      </div>
      <div class="dashboard-stat-card">
        <div class="dashboard-stat-card-label">${t('dashboard.home.dailyFocusRate', 'Daily Focus Rate')}</div>
        <div class="dashboard-stat-card-value">${todayFocusRate}%</div>
      </div>
    </div>

    <div class="dashboard-section">
      <div class="dashboard-section-header">
        <h2 class="dashboard-section-title">${t('dashboard.home.recentSessions', 'Recent Sessions')}</h2>
        ${hasSessions ? `<a href="/sessions/" class="btn btn-secondary dashboard-btn-sm">${t('dashboard.actions.viewAll', 'View All')}</a>` : ''}
      </div>
      <div class="dashboard-card">
        ${!hasSessions
          ? `
          <div class="dashboard-empty">
            <p class="dashboard-empty-title">${t('dashboard.home.noSessionsTitle', 'No sessions yet')}</p>
            <p>${t('dashboard.home.noSessionsDesc', 'Start tracking with the BrainDock app to see your focus stats here.')}</p>
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
                  <li class="dashboard-list-item ${focusLevelClass(Math.round(pct))}">
                    <div>
                      <strong>${escapeHtml(s.session_name || t('dashboard.common.session', 'Session'))}</strong><br>
                      <span class="dashboard-meta">${dayStr} ${timeStr} &middot; ${modeLabel(s.monitoring_mode, true)} &middot; ${formatDuration(duration, true)} ${t('dashboard.common.active', 'active')} &middot; ${Math.round(pct)}% ${t('dashboard.common.focus', 'focus')}</span><br>
                      <span class="dashboard-meta-sub">${gadgets} ${t('dashboard.common.gadgets', 'gadgets')} &middot; ${screen} ${t('dashboard.common.screenDistractions', 'screen distractions')}</span>
                    </div>
                    <a href="/sessions/${escapeHtml(s.id)}" class="btn btn-secondary dashboard-btn-sm">${t('dashboard.actions.view', 'View')}</a>
                  </li>
                `
              })
              .join('')}
          </ul>
          `}
      </div>
    </div>

    <div class="dashboard-section">
      <h2 class="dashboard-section-title">${t('dashboard.home.thisWeek', 'This Week')}</h2>
      <div class="dashboard-card">
        ${!hasSessions
          ? `
          <div class="dashboard-empty">
            <p class="dashboard-empty-title">${t('dashboard.home.noDataTitle', 'No data yet')}</p>
            <p>${t('dashboard.home.noDataDesc', 'Complete a session with the desktop app to see your weekly focus.')}</p>
          </div>
          `
          : `
          <div class="dashboard-chart">
            ${weeklyData
              .map(
                (d) => `
              <div class="dashboard-chart-bar-wrap">
                ${d.focusSeconds > 0 ? `<span class="dashboard-chart-value">${formatDuration(d.focusSeconds, true)}</span>` : ''}
                <div class="dashboard-chart-bar" style="height: ${d.heightPct}%;"></div>
                <span class="dashboard-chart-label">${escapeHtml(d.label)}</span>
              </div>
            `
              )
              .join('')}
          </div>
          <p class="dashboard-chart-caption">${t('dashboard.home.focusTimeByDay', 'Focus time by day')}</p>
          `}
      </div>
    </div>
  `
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  mainEl.innerHTML = `
    <div class="dashboard-loading">
      <div class="dashboard-spinner"></div>
      <p>${t('dashboard.home.loading', 'Loading dashboard...')}</p>
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
        <p class="dashboard-empty-title">${t('dashboard.common.somethingWentWrong', 'Something went wrong')}</p>
        <p>${escapeHtml(err.message || 'Failed to load dashboard.')}</p>
      </div>
    `
  }
}

main()
