/**
 * Configuration page: combines blocklist (quick toggles, custom URLs/apps)
 * and detection (item type toggles) into a single settings view.
 * Both sections auto-save with debounce. Toggles render as clickable pills.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'
import { validateUrlPattern, validateAppPattern } from '../validators.js'
import {
  createIcons,
  Smartphone,
  Tablet,
  Gamepad2,
  Gamepad,
  Tv,
  Watch,
  Laptop,
  UtensilsCrossed,
  Camera,
  Headphones,
  Instagram,
  Youtube,
  Film,
  MessageCircle,
  Video,
  Twitter,
  Twitch,
  MessageSquare,
  Facebook,
  Zap,
  Linkedin,
  ShoppingCart,
  Pin,
  Globe,
  Newspaper,
  PlayCircle,
  Image,
} from 'lucide/dist/cjs/lucide.js'

// Small inline SVG for remove (X) buttons on chips
const CROSS_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`

// -- Blocklist constants --

const QUICK_SITES = [
  { id: 'instagram', name: 'Instagram', icon: 'instagram' },
  { id: 'youtube', name: 'YouTube', icon: 'youtube' },
  { id: 'netflix', name: 'Netflix', icon: 'film' },
  { id: 'reddit', name: 'Reddit', icon: 'message-circle' },
  { id: 'tiktok', name: 'TikTok', icon: 'video' },
  { id: 'twitter', name: 'Twitter/X', icon: 'twitter' },
  { id: 'twitch', name: 'Twitch', icon: 'twitch' },
  { id: 'discord', name: 'Discord', icon: 'message-square' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook' },
  { id: 'snapchat', name: 'Snapchat', icon: 'zap' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin' },
  { id: 'pinterest', name: 'Pinterest', icon: 'pin' },
  { id: 'amazon', name: 'Amazon', icon: 'shopping-cart' },
  { id: 'spotify', name: 'Spotify', icon: 'headphones' },
  { id: 'hulu', name: 'Hulu', icon: 'play-circle' },
  { id: 'disneyplus', name: 'Disney+', icon: 'play-circle' },
  { id: 'primevideo', name: 'Prime Video', icon: 'play-circle' },
  { id: 'whatsapp', name: 'WhatsApp Web', icon: 'message-circle' },
  { id: 'telegram', name: 'Telegram', icon: 'message-square' },
  { id: 'tumblr', name: 'Tumblr', icon: 'image' },
  { id: 'threads', name: 'Threads', icon: 'globe' },
  { id: 'news', name: 'News sites', icon: 'newspaper' },
]

const DEBOUNCE_MS = 800

// -- Detection constants --

const ITEM_PRESETS = [
  { id: 'phone', name: 'Phone', icon: 'smartphone' },
  { id: 'tablet', name: 'Tablet / iPad', icon: 'tablet' },
  { id: 'controller', name: 'Game Controller', icon: 'gamepad-2' },
  { id: 'tv', name: 'TV / Remote', icon: 'tv' },
  { id: 'nintendo_switch', name: 'Nintendo Switch', icon: 'gamepad' },
  { id: 'smartwatch', name: 'Smartwatch', icon: 'watch' },
  { id: 'laptop', name: 'Laptop', icon: 'laptop' },
  { id: 'food', name: 'Food / Snacks', icon: 'utensils-crossed' },
  { id: 'camera', name: 'Camera', icon: 'camera' },
  { id: 'headphones', name: 'Headphones', icon: 'headphones' },
]

// Icons needed by createIcons after render
const PAGE_ICONS = {
  Smartphone, Tablet, Gamepad2, Gamepad, Tv, Watch, Laptop, UtensilsCrossed, Camera, Headphones,
  Instagram, Youtube, Film, MessageCircle, Video, Twitter, Twitch, MessageSquare, Facebook, Zap,
  Linkedin, ShoppingCart, Pin, Globe, Newspaper, PlayCircle, Image,
}

// -- Data helpers --

async function loadBlocklist() {
  /** Load blocklist config from Supabase. */
  const { data, error } = await supabase.from('blocklist_configs').select('*').single()
  if (error) throw error
  return data
}

async function saveBlocklist(userId, payload) {
  /** Persist blocklist changes. */
  const { error } = await supabase.from('blocklist_configs').update(payload).eq('user_id', userId)
  if (error) throw error
}

async function loadDetectionSettings() {
  /** Load detection item settings from Supabase. */
  const { data, error } = await supabase.from('user_settings').select('enabled_gadgets').single()
  if (error) throw error
  return data
}

async function saveDetectionSettings(userId, enabledItems) {
  /** Persist detection item changes. */
  const { error } = await supabase.from('user_settings').update({ enabled_gadgets: enabledItems }).eq('user_id', userId)
  if (error) throw error
}

function escapeHtml(str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// -- Render --

function render(main, blocklistConfig, detectionSettings, userId) {
  // Blocklist state
  const state = {
    quick_blocks: { ...(blocklistConfig?.quick_blocks || {}) },
    categories: { ...(blocklistConfig?.categories || {}) },
    custom_urls: Array.isArray(blocklistConfig?.custom_urls) ? [...blocklistConfig.custom_urls] : [],
    custom_apps: Array.isArray(blocklistConfig?.custom_apps) ? [...blocklistConfig.custom_apps] : [],
  }

  // Detection state
  const enabledItems = Array.isArray(detectionSettings?.enabled_gadgets)
    ? detectionSettings.enabled_gadgets
    : ['phone']
  const itemSet = new Set(enabledItems)

  // Auto-save blocklist with debounce
  let blocklistSaveTimeout = null
  function scheduleBlocklistSave() {
    clearTimeout(blocklistSaveTimeout)
    blocklistSaveTimeout = setTimeout(async () => {
      try {
        await saveBlocklist(userId, {
          quick_blocks: state.quick_blocks,
          categories: state.categories,
          custom_urls: state.custom_urls,
          custom_apps: state.custom_apps,
        })
      } catch (err) {
        console.error(err)
      }
    }, DEBOUNCE_MS)
  }

  // Auto-save detection with debounce
  let detectionSaveTimeout = null
  function scheduleDetectionSave() {
    clearTimeout(detectionSaveTimeout)
    detectionSaveTimeout = setTimeout(async () => {
      try {
        const enabled = getEnabledItems()
        await saveDetectionSettings(userId, enabled)
      } catch (err) {
        console.error(err)
      }
    }, DEBOUNCE_MS)
  }

  /** Read currently-active item pills. */
  function getEnabledItems() {
    const arr = []
    main.querySelectorAll('.pill-toggle.active[data-item]').forEach((el) => {
      arr.push(el.dataset.item)
    })
    return arr
  }

  main.innerHTML = `
    <h1 class="dashboard-page-title">Configuration</h1>
    <p class="dashboard-page-subtitle">
      Configure what counts as a distraction. These settings are loaded by the desktop app when you start a session.
    </p>

    <div class="dashboard-card-grid">

      <!-- Detection: item pills -->
      <div class="dashboard-card">
        <h2 class="dashboard-section-title">Item Detection</h2>
        <p class="dashboard-meta" style="margin-bottom: var(--space-s);">Tap to block. Camera detects these as distractions.</p>
        <div class="pill-toggle-wrap">
          ${ITEM_PRESETS.map((g) => `
            <button type="button" class="pill-toggle ${itemSet.has(g.id) ? 'active' : ''}" data-item="${g.id}" aria-pressed="${itemSet.has(g.id)}">
              <i data-lucide="${g.icon}" class="pill-toggle-icon" aria-hidden="true"></i>
              <span>${escapeHtml(g.name)}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Blocklist: quick block pills -->
      <div class="dashboard-card">
        <h2 class="dashboard-section-title">Quick Block</h2>
        <p class="dashboard-meta" style="margin-bottom: var(--space-s);">Tap to block a site.</p>
        <div id="quick-blocks-container" class="pill-toggle-wrap"></div>
      </div>

      <!-- Custom URLs + Custom Apps side by side -->
      <div class="dashboard-card-row">
        <div class="dashboard-card">
          <h2 class="dashboard-section-title">Custom URLs</h2>
          <p class="dashboard-meta" style="margin-bottom: var(--space-s);">Add domains to block (e.g. example.com)</p>
          <div class="dashboard-input-row">
            <input type="text" id="custom-url-input" class="dashboard-input dashboard-input--narrow" placeholder="example.com" maxlength="253">
            <button type="button" class="btn btn-secondary dashboard-btn-sm" id="custom-url-add">Add</button>
          </div>
          <p id="custom-url-hint" class="dashboard-input-hint" role="status" aria-live="polite"></p>
          <div id="custom-urls-list"></div>
        </div>

        <div class="dashboard-card">
          <h2 class="dashboard-section-title">Custom Apps</h2>
          <p class="dashboard-meta" style="margin-bottom: var(--space-s);">Add app names to block (e.g. Discord)</p>
          <div class="dashboard-input-row">
            <input type="text" id="custom-app-input" class="dashboard-input dashboard-input--narrow" placeholder="App name" maxlength="50">
            <button type="button" class="btn btn-secondary dashboard-btn-sm" id="custom-app-add">Add</button>
          </div>
          <p id="custom-app-hint" class="dashboard-input-hint" role="status" aria-live="polite"></p>
          <div id="custom-apps-list"></div>
        </div>
      </div>
    </div>
  `

  // -- Detection interactivity (pill click toggles + auto-save) --

  main.querySelectorAll('.pill-toggle[data-item]').forEach((el) => {
    el.addEventListener('click', () => {
      el.classList.toggle('active')
      el.setAttribute('aria-pressed', el.classList.contains('active'))
      scheduleDetectionSave()
    })
  })

  // -- Blocklist: quick block pills --

  const quickContainer = main.querySelector('#quick-blocks-container')
  quickContainer.innerHTML = QUICK_SITES.map((q) => `
    <button type="button" class="pill-toggle ${state.quick_blocks[q.id] ? 'active' : ''}" data-quick="${q.id}" aria-pressed="${!!state.quick_blocks[q.id]}">
      <i data-lucide="${q.icon}" class="pill-toggle-icon" aria-hidden="true"></i>
      <span>${escapeHtml(q.name)}</span>
    </button>
  `).join('')

  quickContainer.querySelectorAll('.pill-toggle[data-quick]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.quick
      const next = !el.classList.contains('active')
      el.classList.toggle('active', next)
      el.setAttribute('aria-pressed', next)
      state.quick_blocks[id] = next
      scheduleBlocklistSave()
    })
  })

  // -- Blocklist: custom URL list --

  function renderCustomUrls() {
    const list = main.querySelector('#custom-urls-list')
    list.innerHTML = state.custom_urls.length === 0
      ? '<p class="dashboard-meta-sub">No custom URLs added.</p>'
      : state.custom_urls.map((u) => `
          <span class="dashboard-chip">
            ${escapeHtml(u)}
            <button type="button" class="dashboard-remove-btn" data-url="${escapeHtml(u)}" aria-label="Remove ${escapeHtml(u)}">${CROSS_SVG}</button>
          </span>
        `).join('')
    list.querySelectorAll('.dashboard-remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const u = btn.dataset.url
        state.custom_urls.splice(state.custom_urls.indexOf(u), 1)
        renderCustomUrls()
        scheduleBlocklistSave()
      })
    })
  }

  // -- Blocklist: custom app list --

  function renderCustomApps() {
    const list = main.querySelector('#custom-apps-list')
    list.innerHTML = state.custom_apps.length === 0
      ? '<p class="dashboard-meta-sub">No custom apps added.</p>'
      : state.custom_apps.map((a) => `
          <span class="dashboard-chip">
            ${escapeHtml(a)}
            <button type="button" class="dashboard-remove-btn" data-app="${escapeHtml(a)}" aria-label="Remove ${escapeHtml(a)}">${CROSS_SVG}</button>
          </span>
        `).join('')
    list.querySelectorAll('.dashboard-remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.app
        state.custom_apps.splice(state.custom_apps.indexOf(a), 1)
        renderCustomApps()
        scheduleBlocklistSave()
      })
    })
  }

  renderCustomUrls()
  renderCustomApps()

  // -- Blocklist: add helpers --

  function setHint(hintEl, message, type) {
    if (!hintEl) return
    hintEl.textContent = message || ''
    hintEl.className = 'dashboard-input-hint' + (type ? ` dashboard-input-hint--${type}` : '')
  }

  async function addCustomUrl() {
    const input = main.querySelector('#custom-url-input')
    const hintEl = main.querySelector('#custom-url-hint')
    const val = input.value.trim()
    if (!val) {
      setHint(hintEl, '', '')
      return
    }
    setHint(hintEl, 'Checking...', '')
    const result = await validateUrlPattern(val)
    if (!result.valid) {
      setHint(hintEl, result.message, 'error')
      return
    }
    const normalized = val.toLowerCase()
    if (state.custom_urls.includes(normalized)) {
      setHint(hintEl, '', '')
      return
    }
    state.custom_urls.push(normalized)
    input.value = ''
    setHint(hintEl, result.isWarning ? result.message : 'Added.', result.isWarning ? 'warning' : 'success')
    setTimeout(() => setHint(hintEl, '', ''), 3000)
    renderCustomUrls()
    scheduleBlocklistSave()
  }

  function addCustomApp() {
    const input = main.querySelector('#custom-app-input')
    const hintEl = main.querySelector('#custom-app-hint')
    const val = input.value.trim()
    if (!val) {
      setHint(hintEl, '', '')
      return
    }
    const result = validateAppPattern(val)
    if (!result.valid) {
      setHint(hintEl, result.message, 'error')
      return
    }
    if (state.custom_apps.includes(val)) {
      setHint(hintEl, '', '')
      return
    }
    state.custom_apps.push(val)
    input.value = ''
    setHint(hintEl, result.isWarning ? result.message : 'Added.', result.isWarning ? 'warning' : 'success')
    setTimeout(() => setHint(hintEl, '', ''), 3000)
    renderCustomApps()
    scheduleBlocklistSave()
  }

  main.querySelector('#custom-url-add').addEventListener('click', addCustomUrl)
  main.querySelector('#custom-app-add').addEventListener('click', addCustomApp)

  main.querySelector('#custom-url-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addCustomUrl() }
  })
  main.querySelector('#custom-app-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addCustomApp() }
  })

  // Clear error hints when the user empties the input
  main.querySelector('#custom-url-input').addEventListener('input', (e) => {
    if (!e.target.value.trim()) {
      setHint(main.querySelector('#custom-url-hint'), '', '')
    }
  })
  main.querySelector('#custom-app-input').addEventListener('input', (e) => {
    if (!e.target.value.trim()) {
      setHint(main.querySelector('#custom-app-hint'), '', '')
    }
  })

  // Render Lucide icons inside the page content
  createIcons({ icons: PAGE_ICONS, root: main })
}

// -- Entry point --

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  mainEl.innerHTML = '<div class="dashboard-loading"><div class="dashboard-spinner"></div><p>Loading configuration...</p></div>'

  try {
    // Load blocklist and detection data in parallel
    const [blocklistConfig, detectionSettings] = await Promise.all([
      loadBlocklist(),
      loadDetectionSettings(),
    ])
    render(mainEl, blocklistConfig, detectionSettings, result.user.id)
  } catch (err) {
    console.error(err)
    mainEl.innerHTML = `
      <div class="dashboard-empty">
        <p class="dashboard-empty-title">Could not load configuration</p>
        <p>${escapeHtml(err.message || 'Please try again.')}</p>
      </div>
    `
  }
}

main()
