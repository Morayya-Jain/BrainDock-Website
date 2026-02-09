/**
 * Configuration page: combines blocklist (quick toggles, custom URLs/apps)
 * and detection (item type toggles) into a single settings view.
 * Both sections auto-save with debounce. Toggles render as clickable pills.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'
import { validateUrlPattern, validateAppPattern } from '../validators.js'
import { escapeHtml } from '../utils.js'
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
  { id: 'instagram', name: 'Instagram', icon: 'instagram', desc: 'Photo and video sharing social network by Meta.' },
  { id: 'youtube', name: 'YouTube', icon: 'youtube', desc: 'Video streaming and sharing platform by Google.' },
  { id: 'netflix', name: 'Netflix', icon: 'film', desc: 'Subscription streaming service for movies and TV shows.' },
  { id: 'reddit', name: 'Reddit', icon: 'message-circle', desc: 'Community-driven forum with thousands of topic boards.' },
  { id: 'tiktok', name: 'TikTok', icon: 'video', desc: 'Short-form video platform for entertainment and trends.' },
  { id: 'twitter', name: 'Twitter/X', icon: 'twitter', desc: 'Microblogging platform for posts, news, and discussions.' },
  { id: 'twitch', name: 'Twitch', icon: 'twitch', desc: 'Live streaming platform focused on gaming and entertainment.' },
  { id: 'discord', name: 'Discord', icon: 'message-square', desc: 'Voice, video, and text chat app for communities.' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook', desc: 'Social network for connecting with friends and groups.' },
  { id: 'snapchat', name: 'Snapchat', icon: 'zap', desc: 'Messaging app with disappearing photos and stories.' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin', desc: 'Professional networking and job search platform.' },
  { id: 'pinterest', name: 'Pinterest', icon: 'pin', desc: 'Visual discovery platform for ideas and inspiration.' },
  { id: 'amazon', name: 'Amazon', icon: 'shopping-cart', desc: 'Online shopping marketplace for just about everything.' },
  { id: 'spotify', name: 'Spotify', icon: 'headphones', desc: 'Music and podcast streaming service.' },
  { id: 'hulu', name: 'Hulu', icon: 'play-circle', desc: 'Streaming service for TV shows, movies, and originals.' },
  { id: 'disneyplus', name: 'Disney+', icon: 'play-circle', desc: 'Disney, Pixar, Marvel, and Star Wars streaming.' },
  { id: 'primevideo', name: 'Prime Video', icon: 'play-circle', desc: 'Amazon streaming service for movies and series.' },
  { id: 'whatsapp', name: 'WhatsApp Web', icon: 'message-circle', desc: 'Browser version of the WhatsApp messaging app.' },
  { id: 'telegram', name: 'Telegram', icon: 'message-square', desc: 'Cloud-based messaging app with channels and groups.' },
  { id: 'tumblr', name: 'Tumblr', icon: 'image', desc: 'Microblogging platform for creative and visual content.' },
  { id: 'threads', name: 'Threads', icon: 'globe', desc: 'Text-based social app by Meta, linked to Instagram.' },
  { id: 'news', name: 'News sites', icon: 'newspaper', desc: 'General news websites like CNN, BBC, and others.' },
]

const DEBOUNCE_MS = 800

// -- Detection constants --

const ITEM_PRESETS = [
  { id: 'phone', name: 'Phone', icon: 'smartphone', desc: 'Any smartphone - iPhone, Android, or similar 5-7 inch handheld device.' },
  { id: 'tablet', name: 'Tablet / iPad', icon: 'tablet', desc: 'Tablets and iPads - larger 8+ inch touchscreen devices.' },
  { id: 'controller', name: 'Game Controller', icon: 'gamepad-2', desc: 'Gaming controllers like PS5, Xbox, or generic Bluetooth gamepads.' },
  { id: 'tv', name: 'TV / Remote', icon: 'tv', desc: 'Television screen or a TV remote control in view.' },
  { id: 'nintendo_switch', name: 'Nintendo Switch', icon: 'gamepad', desc: 'Nintendo Switch console in handheld or tabletop mode.' },
  { id: 'smartwatch', name: 'Smartwatch', icon: 'watch', desc: 'Wrist-worn smart devices like Apple Watch, Fitbit, or Galaxy Watch.' },
  { id: 'laptop', name: 'Laptop', icon: 'laptop', desc: 'A secondary laptop or notebook visible alongside your main screen.' },
  { id: 'camera', name: 'Camera', icon: 'camera', desc: 'Standalone cameras - DSLR, mirrorless, or action cameras.' },
  { id: 'headphones', name: 'Headphones', icon: 'headphones', desc: 'Over-ear headphones or visible earbuds being worn.' },
  { id: 'food', name: 'Food / Snacks', icon: 'utensils-crossed', desc: 'Food, drinks, or snacks visible on your desk.' },
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
        <h2 class="dashboard-section-title" style="margin-bottom: var(--space-xs);">Items to Notify</h2>
        <p class="dashboard-meta" style="margin-bottom: var(--space-l);">Select items you want to add to your list.</p>
        <div class="pill-toggle-wrap">
          ${ITEM_PRESETS.map((g) => `
            <button type="button" class="pill-toggle ${itemSet.has(g.id) ? 'active' : ''}" data-item="${g.id}" data-desc="${escapeHtml(g.desc)}" data-name="${escapeHtml(g.name)}" aria-pressed="${itemSet.has(g.id)}">
              <i data-lucide="${g.icon}" class="pill-toggle-icon" aria-hidden="true"></i>
              <span>${escapeHtml(g.name)}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Blocklist: quick block pills -->
      <div class="dashboard-card">
        <h2 class="dashboard-section-title" style="margin-bottom: var(--space-xs);">Websites to Notify</h2>
        <p class="dashboard-meta" style="margin-bottom: var(--space-l);">Select websites you want to add to your list.</p>
        <div id="quick-blocks-container" class="pill-toggle-wrap"></div>
      </div>

      <!-- Custom URLs + Custom Apps side by side -->
      <div class="dashboard-card-row">
        <div class="dashboard-card">
          <h2 class="dashboard-section-title" style="margin-bottom: var(--space-xs);">Custom URLs</h2>
          <p class="dashboard-meta" style="margin-bottom: var(--space-m);">Add domains to your list.</p>
          <div class="dashboard-input-row">
            <input type="text" id="custom-url-input" class="dashboard-input dashboard-input--narrow" placeholder="example.com" maxlength="253">
            <button type="button" class="btn btn-secondary dashboard-btn-sm" id="custom-url-add">Add</button>
          </div>
          <p id="custom-url-hint" class="dashboard-input-hint" role="status" aria-live="polite"></p>
          <div id="custom-urls-list"></div>
        </div>

        <div class="dashboard-card">
          <h2 class="dashboard-section-title" style="margin-bottom: var(--space-xs);">Custom Apps</h2>
          <p class="dashboard-meta" style="margin-bottom: var(--space-m);">Add app names to your list.</p>
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
    <button type="button" class="pill-toggle ${state.quick_blocks[q.id] ? 'active' : ''}" data-quick="${q.id}" data-desc="${escapeHtml(q.desc)}" data-name="${escapeHtml(q.name)}" aria-pressed="${!!state.quick_blocks[q.id]}">
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
        const idx = state.custom_urls.indexOf(u)
        if (idx !== -1) state.custom_urls.splice(idx, 1)
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
        const idx = state.custom_apps.indexOf(a)
        if (idx !== -1) state.custom_apps.splice(idx, 1)
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

  // -- Pill hover description popup (shows after 2s hover, near the pill) --

  // Append overlay + modal to document.body so they cover the full viewport
  const overlay = document.createElement('div')
  overlay.className = 'pill-desc-overlay'
  overlay.setAttribute('aria-hidden', 'true')
  document.body.appendChild(overlay)

  const modal = document.createElement('div')
  modal.className = 'pill-desc-modal'
  modal.setAttribute('role', 'dialog')
  modal.innerHTML = `
    <h3 class="pill-desc-modal-title" id="pill-desc-title"></h3>
    <p class="pill-desc-modal-text" id="pill-desc-text"></p>
  `
  document.body.appendChild(modal)

  let hoverTimer = null

  /** Position the modal near the pill element and show it. */
  function showDescModal(pillEl, name, desc) {
    document.getElementById('pill-desc-title').textContent = name
    document.getElementById('pill-desc-text').textContent = desc

    // Get pill position and place modal just below it
    const rect = pillEl.getBoundingClientRect()
    const modalWidth = 300
    let left = rect.left + (rect.width / 2) - (modalWidth / 2)

    // Keep modal within viewport horizontally
    left = Math.max(12, Math.min(left, window.innerWidth - modalWidth - 12))

    modal.style.left = `${left}px`
    modal.style.top = `${rect.bottom + 8}px`
    modal.style.width = `${modalWidth}px`

    overlay.classList.add('active')
    modal.classList.add('active')
  }

  function hideDescModal() {
    overlay.classList.remove('active')
    modal.classList.remove('active')
  }

  // Attach hover and focus handlers to all pills with descriptions
  main.querySelectorAll('.pill-toggle[data-desc]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer)
      hoverTimer = setTimeout(() => {
        showDescModal(el, el.dataset.name, el.dataset.desc)
      }, 1000)
    })
    el.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer)
      hideDescModal()
    })
    // Show description on keyboard focus too (accessibility)
    el.addEventListener('focus', () => {
      clearTimeout(hoverTimer)
      hoverTimer = setTimeout(() => {
        showDescModal(el, el.dataset.name, el.dataset.desc)
      }, 1000)
    })
    el.addEventListener('blur', () => {
      clearTimeout(hoverTimer)
      hideDescModal()
    })
    // Clicking the pill toggles it - don't show modal on click
    el.addEventListener('click', () => {
      clearTimeout(hoverTimer)
    })
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
