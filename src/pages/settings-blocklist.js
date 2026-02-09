/**
 * Blocklist settings: quick toggles, categories, custom URLs and apps.
 * Reads/writes blocklist_configs table. Auto-save with debounce.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'
import { isValidAppName, LIMITS } from '../validators.js'

const QUICK_SITES = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'netflix', name: 'Netflix' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'twitter', name: 'Twitter/X' },
]

const DEBOUNCE_MS = 800

async function loadBlocklist() {
  const { data, error } = await supabase.from('blocklist_configs').select('*').single()
  if (error) throw error
  return data
}

async function saveBlocklist(userId, payload) {
  const { error } = await supabase.from('blocklist_configs').update(payload).eq('user_id', userId)
  if (error) throw error
}

/** Validate domain: allow example.com or sub.example.com */
function isValidDomain(input) {
  const s = input.trim().toLowerCase()
  if (!s) return false
  const part = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]*[a-z0-9])?\.?$/
  return part.test(s) && s.length < 200
}

function escapeHtml(str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function render(main, config, userId) {
  const state = {
    quick_blocks: { ...(config?.quick_blocks || {}) },
    categories: { ...(config?.categories || {}) },
    custom_urls: Array.isArray(config?.custom_urls) ? [...config.custom_urls] : [],
    custom_apps: Array.isArray(config?.custom_apps) ? [...config.custom_apps] : [],
  }

  let saveTimeout = null
  function scheduleSave() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
      try {
        await saveBlocklist(userId, {
          quick_blocks: state.quick_blocks,
          categories: state.categories,
          custom_urls: state.custom_urls,
          custom_apps: state.custom_apps,
        })
        const msg = main.querySelector('#blocklist-saved-msg')
        if (msg) {
          msg.style.display = 'inline'
          setTimeout(() => { msg.style.display = 'none' }, 2000)
        }
      } catch (err) {
        console.error(err)
      }
    }, DEBOUNCE_MS)
  }

  main.innerHTML = `
    <h1 class="dashboard-page-title">Blocklist</h1>
    <p class="dashboard-page-subtitle">
      Choose which sites and apps count as distractions during screen monitoring. The desktop app loads these settings when you start a session.
    </p>

    <div class="dashboard-card-stack">
      <div class="dashboard-card">
        <h2 class="dashboard-section-title">Quick Block</h2>
        <div id="quick-blocks-container"></div>
      </div>

      <div class="dashboard-card">
        <h2 class="dashboard-section-title">Custom URLs</h2>
        <p class="dashboard-meta" style="margin-bottom: var(--space-m);">Add domains to block (e.g. example.com)</p>
        <div class="dashboard-input-row">
          <input type="text" id="custom-url-input" class="dashboard-input dashboard-input--narrow" placeholder="example.com" maxlength="200">
          <button type="button" class="btn btn-secondary dashboard-btn-sm" id="custom-url-add">Add</button>
        </div>
        <div id="custom-urls-list"></div>
      </div>

      <div class="dashboard-card">
        <h2 class="dashboard-section-title">Custom Apps</h2>
        <p class="dashboard-meta" style="margin-bottom: var(--space-m);">Add app names to block (e.g. Discord)</p>
        <div class="dashboard-input-row">
          <input type="text" id="custom-app-input" class="dashboard-input dashboard-input--narrow" placeholder="App name" maxlength="${LIMITS.APP_NAME_MAX}">
          <button type="button" class="btn btn-secondary dashboard-btn-sm" id="custom-app-add">Add</button>
        </div>
        <div id="custom-apps-list"></div>
      </div>
    </div>

    <p class="dashboard-meta-sub" style="margin-top: var(--space-l);">
      <span class="dashboard-saved" id="blocklist-saved-msg" style="display: none;">Saved</span>
    </p>
  `

  const quickContainer = main.querySelector('#quick-blocks-container')
  quickContainer.innerHTML = QUICK_SITES.map((q) => `
    <div class="dashboard-toggle">
      <div>
        <div class="dashboard-toggle-label">${escapeHtml(q.name)}</div>
      </div>
      <div class="dashboard-toggle-switch ${state.quick_blocks[q.id] ? 'active' : ''}" data-quick="${q.id}" role="button" tabindex="0" aria-pressed="${!!state.quick_blocks[q.id]}"></div>
    </div>
  `).join('')

  quickContainer.querySelectorAll('.dashboard-toggle-switch').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.quick
      const next = !el.classList.contains('active')
      el.classList.toggle('active', next)
      el.setAttribute('aria-pressed', next)
      state.quick_blocks[id] = next
      scheduleSave()
    })
  })

  function renderCustomUrls() {
    const list = main.querySelector('#custom-urls-list')
    list.innerHTML = state.custom_urls.length === 0
      ? '<p class="dashboard-meta-sub">No custom URLs added.</p>'
      : state.custom_urls.map((u) => `
          <span class="dashboard-chip">
            ${escapeHtml(u)}
            <button type="button" class="dashboard-remove-btn" data-url="${escapeHtml(u)}" aria-label="Remove">Remove</button>
          </span>
        `).join('')
    list.querySelectorAll('.dashboard-remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const u = btn.dataset.url
        state.custom_urls.splice(state.custom_urls.indexOf(u), 1)
        renderCustomUrls()
        scheduleSave()
      })
    })
  }

  function renderCustomApps() {
    const list = main.querySelector('#custom-apps-list')
    list.innerHTML = state.custom_apps.length === 0
      ? '<p class="dashboard-meta-sub">No custom apps added.</p>'
      : state.custom_apps.map((a) => `
          <span class="dashboard-chip">
            ${escapeHtml(a)}
            <button type="button" class="dashboard-remove-btn" data-app="${escapeHtml(a)}" aria-label="Remove">Remove</button>
          </span>
        `).join('')
    list.querySelectorAll('.dashboard-remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.app
        state.custom_apps.splice(state.custom_apps.indexOf(a), 1)
        renderCustomApps()
        scheduleSave()
      })
    })
  }

  renderCustomUrls()
  renderCustomApps()

  main.querySelector('#custom-url-add').addEventListener('click', () => {
    const input = main.querySelector('#custom-url-input')
    const val = input.value.trim()
    if (!val) return
    if (!isValidDomain(val)) {
      alert('Please enter a valid domain (e.g. example.com).')
      return
    }
    const normalized = val.toLowerCase()
    if (state.custom_urls.includes(normalized)) return
    state.custom_urls.push(normalized)
    input.value = ''
    renderCustomUrls()
    scheduleSave()
  })

  main.querySelector('#custom-app-add').addEventListener('click', () => {
    const input = main.querySelector('#custom-app-input')
    const val = input.value.trim()
    if (!val) return
    if (!isValidAppName(val)) {
      alert(`App name must be 1-${LIMITS.APP_NAME_MAX} characters and cannot contain < or >.`)
      return
    }
    if (state.custom_apps.includes(val)) return
    state.custom_apps.push(val)
    input.value = ''
    renderCustomApps()
    scheduleSave()
  })
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  mainEl.innerHTML = '<div class="dashboard-loading"><div class="dashboard-spinner"></div><p>Loading blocklist...</p></div>'

  try {
    const config = await loadBlocklist()
    render(mainEl, config, result.user.id)
  } catch (err) {
    console.error(err)
    mainEl.innerHTML = `
      <div class="dashboard-empty">
        <p class="dashboard-empty-title">Could not load blocklist</p>
        <p>${escapeHtml(err.message || 'Please try again.')}</p>
      </div>
    `
  }
}

main()
