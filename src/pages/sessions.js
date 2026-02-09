/**
 * Session history list: paginated (20 per page), newest first.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'
import { escapeHtml, formatDuration, modeLabel } from '../utils.js'

const PAGE_SIZE = 20

async function fetchSessionsWithCount(page) {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, error, count } = await supabase
    .from('sessions')
    .select('id, session_name, start_time, end_time, monitoring_mode, summary_stats', { count: 'exact', head: false })
    .order('start_time', { ascending: false })
    .range(from, to)
  if (error) throw error
  return { sessions: data || [], total: count ?? 0 }
}

function render(main, sessions, page, total, goToPage) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const base = window.location.origin

  main.innerHTML = `
    <h1 class="dashboard-page-title">Session History</h1>

    <div class="dashboard-card">
      ${sessions.length === 0
        ? `
        <div class="dashboard-empty">
          <p class="dashboard-empty-title">No sessions yet</p>
          <p>Complete a session with the BrainDock desktop app to see your history here.</p>
        </div>
        `
        : `
        <ul class="dashboard-list">
          ${sessions.map((s) => {
            const summary = s.summary_stats || {}
            const duration = summary.present_seconds ?? 0
            const pct = summary.focus_percentage ?? 0
            const gadgets = summary.gadget_count ?? 0
            const screen = summary.screen_distraction_count ?? 0
            const start = new Date(s.start_time)
            const dateStr = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            const name = s.session_name || `Session ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
            const activeSec = s.active_seconds ?? (summary.present_seconds ?? 0) + (summary.away_seconds ?? 0) + (summary.gadget_seconds ?? 0) + (summary.screen_distraction_seconds ?? 0)
            return `
              <li class="dashboard-list-item">
                <div>
                  <strong>${escapeHtml(name)}</strong><br>
                  <span class="dashboard-meta">${dateStr}</span><br>
                  <span class="dashboard-meta">${modeLabel(s.monitoring_mode)} &middot; ${formatDuration(activeSec)} active &middot; ${Math.round(pct)}% focus</span><br>
                  <span class="dashboard-meta-sub">${gadgets} gadgets &middot; ${screen} screen distractions</span>
                </div>
                <a href="${base}/sessions/${escapeHtml(s.id)}" class="btn btn-secondary dashboard-btn-sm">View</a>
              </li>
            `
          }).join('')}
        </ul>

        <div class="dashboard-pagination">
          <button type="button" id="sessions-prev" ${page <= 1 ? 'disabled' : ''}>Previous</button>
          <span>Page ${page} of ${totalPages}</span>
          <button type="button" id="sessions-next" ${page >= totalPages ? 'disabled' : ''}>Next</button>
        </div>
        `}
    </div>
  `

  const prevBtn = main.querySelector('#sessions-prev')
  const nextBtn = main.querySelector('#sessions-next')
  if (prevBtn) prevBtn.addEventListener('click', () => goToPage(page - 1))
  if (nextBtn) nextBtn.addEventListener('click', () => goToPage(page + 1))
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  let currentPage = 1

  async function loadPage(page) {
    currentPage = page
    mainEl.innerHTML = '<div class="dashboard-loading"><div class="dashboard-spinner"></div><p>Loading sessions...</p></div>'
    try {
      const { sessions, total } = await fetchSessionsWithCount(page)
      render(mainEl, sessions, page, total, loadPage)
    } catch (err) {
      console.error(err)
      mainEl.innerHTML = `
        <div class="dashboard-empty">
          <p class="dashboard-empty-title">Could not load sessions</p>
          <p>${escapeHtml(err.message || 'Please try again.')}</p>
        </div>
      `
    }
  }

  await loadPage(1)
}

main()
