/**
 * Session detail page: stats, timeline, event log.
 * Session ID is read from pathname (/sessions/:id). Netlify rewrites to this page.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'

const EVENT_TYPE_TO_LABEL = {
  present: 'Focused',
  away: 'Away',
  gadget_suspected: 'Gadget',
  screen_distraction: 'Screen distraction',
  paused: 'Paused',
}

const EVENT_TYPE_TO_TIMELINE_CLASS = {
  present: 'focused',
  away: 'away',
  gadget_suspected: 'gadget',
  screen_distraction: 'screen',
  paused: 'paused',
}

function getSessionIdFromPath() {
  const path = window.location.pathname
  const segments = path.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  if (last === 'detail' || !last) return null
  return last
}

/** Format seconds as "X hour(s)", "X min(s)", or "X sec(s)" */
function formatDuration(seconds) {
  if (seconds == null || seconds < 0) return '0 sec'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h} ${h === 1 ? 'hour' : 'hours'}${m > 0 ? ` ${m} ${m === 1 ? 'min' : 'mins'}` : ''}`
  }
  if (m > 0) {
    return `${m} ${m === 1 ? 'min' : 'mins'}${s > 0 ? ` ${s} ${s === 1 ? 'sec' : 'secs'}` : ''}`
  }
  return `${s} ${s === 1 ? 'sec' : 'secs'}`
}

function formatTime(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
}

function modeLabel(mode) {
  if (mode === 'camera_only') return 'Camera Only'
  if (mode === 'screen_only') return 'Screen Only'
  if (mode === 'both') return 'Camera + Screen'
  return mode || '-'
}

function escapeHtml(str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

async function fetchSessionWithEvents(sessionId) {
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  if (sessionError) throw sessionError
  if (!session) return { session: null, events: [] }

  const { data: events, error: eventsError } = await supabase
    .from('session_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('start_time', { ascending: true })
  if (eventsError) throw eventsError

  return { session, events: events || [] }
}

/**
 * Build timeline segments from events. Each segment: { type, durationSeconds, class }.
 */
function buildTimelineSegments(events, totalSeconds) {
  if (!events.length || totalSeconds <= 0) return []
  const segments = []
  for (const e of events) {
    const dur = e.duration_seconds ?? 0
    if (dur <= 0) continue
    const type = e.event_type || 'present'
    segments.push({
      type,
      durationSeconds: dur,
      class: EVENT_TYPE_TO_TIMELINE_CLASS[type] || 'idle',
    })
  }
  return segments
}

function render(main, session, events) {
  const base = window.location.origin
  const summary = session.summary_stats || {}
  const presentSec = summary.present_seconds ?? 0
  const awaySec = summary.away_seconds ?? 0
  const gadgetSec = summary.gadget_seconds ?? 0
  const screenSec = summary.screen_distraction_seconds ?? 0
  const pausedSec = summary.paused_seconds ?? 0
  const totalActive = presentSec + awaySec + gadgetSec + screenSec
  const totalSec = totalActive + pausedSec
  const focusRate = totalActive > 0 ? Math.round((presentSec / totalActive) * 100) : 0

  const segments = buildTimelineSegments(events, totalSec)
  const segmentWidths = totalSec > 0 ? segments.map((s) => (s.durationSeconds / totalSec) * 100) : []

  const startDate = new Date(session.start_time)
  const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const name = session.session_name || `Session ${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`

  main.innerHTML = `
    <p style="margin-bottom: var(--space-m);">
      <a href="${base}/sessions/" style="font-size: 0.9375rem; color: var(--text-secondary);">Back to Sessions</a>
    </p>
    <h1 class="dashboard-page-title">${escapeHtml(name)}</h1>
    <p style="font-family: var(--font-sans); color: var(--text-secondary); margin-bottom: var(--space-xl);">
      ${dateStr} &middot; ${modeLabel(session.monitoring_mode)}
    </p>

    <div class="dashboard-stat-cards" style="grid-template-columns: repeat(2, 1fr);">
      <div class="dashboard-stat-card">
        <div class="dashboard-stat-card-label">Focus</div>
        <div class="dashboard-stat-card-value">${formatDuration(presentSec)}</div>
      </div>
      <div class="dashboard-stat-card">
        <div class="dashboard-stat-card-label">Away</div>
        <div class="dashboard-stat-card-value">${formatDuration(awaySec)}</div>
      </div>
      <div class="dashboard-stat-card">
        <div class="dashboard-stat-card-label">Gadgets</div>
        <div class="dashboard-stat-card-value">${formatDuration(gadgetSec)}</div>
      </div>
      <div class="dashboard-stat-card">
        <div class="dashboard-stat-card-label">Paused</div>
        <div class="dashboard-stat-card-value">${formatDuration(pausedSec)}</div>
      </div>
    </div>

    <div class="dashboard-section">
      <h2 class="dashboard-section-title">Focus Rate: ${focusRate}%</h2>
      <div class="dashboard-progress-wrap">
        <div class="dashboard-progress-bar">
          <div class="dashboard-progress-fill" style="width: ${focusRate}%;"></div>
        </div>
      </div>
    </div>

    <div class="dashboard-section">
      <h2 class="dashboard-section-title">Timeline</h2>
      <div class="dashboard-card">
        ${segments.length === 0
          ? '<p style="font-size: 0.875rem; color: var(--text-tertiary);">No event data for this session.</p>'
          : `
          <div class="dashboard-timeline-bar">
            ${segments.map((seg, i) => `
              <div class="dashboard-timeline-segment ${seg.class}" style="width: ${segmentWidths[i]}%;" title="${escapeHtml(seg.type)}"></div>
            `).join('')}
          </div>
          <div class="dashboard-timeline-legend">
            <span><i style="background: #059669;"></i> Focused</span>
            <span><i style="background: #C4841D;"></i> Away</span>
            <span><i style="background: #DC2626;"></i> Gadget</span>
            <span><i style="background: #7C3AED;"></i> Screen</span>
            <span><i style="background: #6B7280;"></i> Paused</span>
          </div>
          `}
      </div>
    </div>

    <div class="dashboard-section">
      <h2 class="dashboard-section-title">Event Log</h2>
      <div class="dashboard-table-wrap">
        ${events.length === 0
          ? '<p style="padding: var(--space-l); font-size: 0.875rem; color: var(--text-tertiary);">No events recorded.</p>'
          : `
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>Start</th>
                <th>End</th>
                <th>Type</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              ${events.map((e) => `
                <tr>
                  <td>${formatTime(e.start_time)}</td>
                  <td>${formatTime(e.end_time)}</td>
                  <td>${escapeHtml(EVENT_TYPE_TO_LABEL[e.event_type] || e.event_type)}</td>
                  <td>${formatDuration(e.duration_seconds)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          `}
      </div>
    </div>
  `
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const sessionId = getSessionIdFromPath()
  if (!sessionId) {
    window.location.href = '/sessions/'
    return
  }

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  mainEl.innerHTML = '<div class="dashboard-loading"><div class="dashboard-spinner"></div><p>Loading session...</p></div>'

  try {
    const { session, events } = await fetchSessionWithEvents(sessionId)
    if (!session) {
      mainEl.innerHTML = `
        <div class="dashboard-empty">
          <p class="dashboard-empty-title">Session not found</p>
          <p><a href="/sessions/">Back to Sessions</a></p>
        </div>
      `
      return
    }
    render(mainEl, session, events)
  } catch (err) {
    console.error(err)
    mainEl.innerHTML = `
      <div class="dashboard-empty">
        <p class="dashboard-empty-title">Could not load session</p>
        <p>${escapeHtml(err.message || 'Please try again.')}</p>
        <p><a href="/sessions/">Back to Sessions</a></p>
      </div>
    `
  }
}

main()
