/**
 * Blocklist settings: quick toggles, categories, custom URLs and apps.
 * Reads/writes blocklist_configs table. Auto-save with debounce.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'

const QUICK_SITES = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'netflix', name: 'Netflix' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'twitter', name: 'Twitter/X' },
]

const PRESET_CATEGORIES = [
  { id: 'social_media', name: 'Social Media', sites: 'Instagram, Facebook, Twitter, TikTok, Snapchat, etc.' },
  { id: 'video_streaming', name: 'Video Streaming', sites: 'YouTube, Netflix, Disney+, Twitch, etc.' },
  { id: 'gaming', name: 'Gaming', sites: 'Steam, Epic Games, Roblox, Discord, etc.' },
  { id: 'messaging', name: 'Messaging', sites: 'Discord, WhatsApp Web, Telegram, etc.' },
  { id: 'news_entertainment', name: 'News & Entertainment', sites: 'Reddit, BuzzFeed, 9GAG, etc.' },
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
    <p style="font-family: var(--font-sans); color: var(--text-secondary); margin-bottom: var(--space-xl);">
      Choose which sites and apps count as distractions during screen monitoring. The desktop app loads these settings when you start a session.
    </p>

    <div class="dashboard-card">
      <h2 class="dashboard-section-title" style="margin-bottom: var(--space-m);">Quick Block</h2>
      <div id="quick-blocks-container"></div>
    </div>

    <div class="dashboard-card" style="margin-top: var(--space-l);">
      <h2 class="dashboard-section-title" style="margin-bottom: var(--space-m);">Categories</h2>
      <div id="categories-container"></div>
    </div>

    <div class="dashboard-card" style="margin-top: var(--space-l);">
      <h2 class="dashboard-section-title" style="margin-bottom: var(--space-m);">Custom URLs</h2>
      <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-m);">Add domains to block (e.g. example.com)</p>
      <div style="display: flex; gap: var(--space-s); flex-wrap: wrap; margin-bottom: var(--space-m);">
        <input type="text" id="custom-url-input" class="auth-input" placeholder="example.com" style="max-width: 200px;">
        <button type="button" class="btn btn-secondary dashboard-btn-sm" id="custom-url-add">Add</button>
      </div>
      <div id="custom-urls-list"></div>
    </div>

    <div class="dashboard-card" style="margin-top: var(--space-l);">
      <h2 class="dashboard-section-title" style="margin-bottom: var(--space-m);">Custom Apps</h2>
      <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-m);">Add app names to block (e.g. Discord)</p>
      <div style="display: flex; gap: var(--space-s); flex-wrap: wrap; margin-bottom: var(--space-m);">
        <input type="text" id="custom-app-input" class="auth-input" placeholder="App name" style="max-width: 200px;">
        <button type="button" class="btn btn-secondary dashboard-btn-sm" id="custom-app-add">Add</button>
      </div>
      <div id="custom-apps-list"></div>
    </div>

    <p style="margin-top: var(--space-l); font-size: 0.875rem; color: var(--text-tertiary);">
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

  const catContainer = main.querySelector('#categories-container')
  catContainer.innerHTML = PRESET_CATEGORIES.map((c) => `
    <div class="dashboard-toggle">
      <div>
        <div class="dashboard-toggle-label">${escapeHtml(c.name)}</div>
        <div class="dashboard-toggle-desc">${escapeHtml(c.sites)}</div>
      </div>
      <div class="dashboard-toggle-switch ${state.categories[c.id] ? 'active' : ''}" data-cat="${c.id}" role="button" tabindex="0" aria-pressed="${!!state.categories[c.id]}"></div>
    </div>
  `).join('')

  catContainer.querySelectorAll('.dashboard-toggle-switch').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.cat
      const next = !el.classList.contains('active')
      el.classList.toggle('active', next)
      el.setAttribute('aria-pressed', next)
      state.categories[id] = next
      scheduleSave()
    })
  })

  function renderCustomUrls() {
    const list = main.querySelector('#custom-urls-list')
    list.innerHTML = state.custom_urls.length === 0
      ? '<p style="font-size: 0.875rem; color: var(--text-tertiary);">No custom URLs added.</p>'
      : state.custom_urls.map((u) => `
          <span style="display: inline-flex; align-items: center; gap: var(--space-s); margin: var(--space-xs) var(--space-xs) var(--space-xs) 0; padding: 6px 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 0.875rem;">
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
      ? '<p style="font-size: 0.875rem; color: var(--text-tertiary);">No custom apps added.</p>'
      : state.custom_apps.map((a) => `
          <span style="display: inline-flex; align-items: center; gap: var(--space-s); margin: var(--space-xs) var(--space-xs) var(--space-xs) 0; padding: 6px 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 0.875rem;">
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
