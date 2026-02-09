/**
 * Shared dashboard layout: auth guard, sidebar navigation, content wrapper.
 * Import from any authenticated dashboard page. Ensures user is logged in,
 * injects sidebar + main area, moves page content into main, returns user.
 */

import { supabase } from './supabase.js'
import { escapeHtml } from './utils.js'
import {
  createIcons,
  LayoutDashboard,
  Clock,
  Settings,
  ChevronDown,
  Smartphone,
  CreditCard,
  BookOpen,
  Hourglass,
} from 'lucide/dist/cjs/lucide.js'
import './dashboard.css'

const LOGIN_PATH = '/auth/login/'
const DASHBOARD_PATH = '/dashboard/'

/**
 * Fetch remaining credit seconds from user_credits table.
 */
async function fetchRemainingSeconds() {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('total_purchased_seconds, total_used_seconds')
      .single()
    if (error) return 0
    const purchased = data?.total_purchased_seconds ?? 0
    const used = data?.total_used_seconds ?? 0
    return Math.max(0, purchased - used)
  } catch (_) {
    return 0
  }
}

/**
 * Format seconds into human-readable duration for the pill display.
 * Examples: "2 hours", "45 min", "0 sec"
 */
function formatPillDuration(seconds) {
  if (seconds == null || seconds < 0) return '0 sec'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h} ${h === 1 ? 'hour' : 'hours'}`
  if (m > 0) return `${m} min`
  return `${s} sec`
}

/**
 * Get current path for sidebar active state (e.g. /settings/blocklist).
 */
function getCurrentPath() {
  const path = window.location.pathname
  // Strip trailing slash for consistent matching (except for root)
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path
}

/**
 * Build sidebar HTML with active state for current path.
 */
function buildSidebarHTML(currentPath) {
  const base = window.location.origin

  return `
    <a href="${base}/" class="dashboard-sidebar-logo" aria-label="BrainDock home">
      <img src="/assets/logo_with_text.png" alt="BrainDock">
    </a>
    <nav class="dashboard-sidebar-nav" aria-label="Dashboard navigation">
      <ul class="dashboard-sidebar-list">
        <li>
          <a href="${base}/settings/blocklist/" class="dashboard-sidebar-link ${currentPath === '/settings/blocklist' ? 'active' : ''}">
            <i data-lucide="settings" class="dashboard-sidebar-icon" aria-hidden="true"></i>
            <span>Configuration</span>
          </a>
        </li>
        <li>
          <a href="${base}/how-to-use/" class="dashboard-sidebar-link ${currentPath === '/how-to-use' ? 'active' : ''}">
            <i data-lucide="book-open" class="dashboard-sidebar-icon" aria-hidden="true"></i>
            <span>How to Use</span>
          </a>
        </li>
        <li>
          <a href="${base}${DASHBOARD_PATH}" class="dashboard-sidebar-link ${currentPath === '/dashboard' ? 'active' : ''}">
            <i data-lucide="layout-dashboard" class="dashboard-sidebar-icon" aria-hidden="true"></i>
            <span>Dashboard</span>
          </a>
        </li>
        <li>
          <a href="${base}/sessions/" class="dashboard-sidebar-link ${currentPath.startsWith('/sessions') ? 'active' : ''}">
            <i data-lucide="clock" class="dashboard-sidebar-icon" aria-hidden="true"></i>
            <span>Sessions</span>
          </a>
        </li>
        <li>
          <a href="${base}/account/subscription/" class="dashboard-sidebar-link ${currentPath === '/account/subscription' ? 'active' : ''}">
            <i data-lucide="credit-card" class="dashboard-sidebar-icon" aria-hidden="true"></i>
            <span>Billing & Usage</span>
          </a>
        </li>
        <li>
          <a href="${base}/settings/devices/" class="dashboard-sidebar-link ${currentPath === '/settings/devices' ? 'active' : ''}">
            <i data-lucide="smartphone" class="dashboard-sidebar-icon" aria-hidden="true"></i>
            <span>Linked Devices</span>
          </a>
        </li>
      </ul>
    </nav>
    <div class="dashboard-sidebar-footer">
      <button type="button" class="dashboard-sidebar-footer-trigger" id="dashboard-sidebar-footer-trigger" aria-expanded="false" aria-haspopup="true">
        <span class="dashboard-avatar dashboard-avatar-footer" id="dashboard-sidebar-avatar" aria-hidden="true"></span>
        <span class="dashboard-sidebar-user-info">
          <span class="dashboard-sidebar-user-name" id="dashboard-sidebar-user-name"></span>
          <span class="dashboard-sidebar-user-email" id="dashboard-sidebar-user-email"></span>
        </span>
      </button>
      <div class="dashboard-sidebar-popup" id="dashboard-sidebar-popup" hidden>
        <a href="${base}/" class="dashboard-sidebar-popup-link">Back to Website</a>
        <button type="button" class="dashboard-sidebar-popup-signout" id="dashboard-sidebar-signout">Sign Out</button>
      </div>
    </div>
  `
}

/**
 * Get user avatar URL from metadata (OAuth providers like Google provide this).
 */
function getUserAvatarUrl(user) {
  return user.user_metadata?.avatar_url || user.user_metadata?.picture || null
}

/**
 * Get user initials for avatar (first letter of name or email).
 */
function getUserInitials(user) {
  const name = user.user_metadata?.full_name || ''
  const email = user.email || ''
  if (name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
    }
    return name.trim().slice(0, 2).toUpperCase()
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return '?'
}

/**
 * Render avatar element (image if URL exists, otherwise initials).
 */
function renderAvatar(avatarUrl, initials) {
  if (avatarUrl) {
    return `<img src="${escapeHtml(avatarUrl)}" alt="" class="dashboard-avatar-img" referrerpolicy="no-referrer" aria-hidden="true" onerror="this.style.display='none';this.parentElement.textContent='${escapeHtml(initials)}'">`
  }
  return escapeHtml(initials)
}

/**
 * Initialize sidebar sign out, footer popup, and mobile menu.
 */
function initSidebarBehavior() {
  const signoutBtn = document.getElementById('dashboard-sidebar-signout')
  if (signoutBtn) {
    signoutBtn.addEventListener('click', handleSignOut)
  }

  // Sidebar footer popup (click profile to toggle)
  initSidebarFooterPopup()

  // Mobile: toggle sidebar and close on overlay click
  const sidebarToggle = document.getElementById('dashboard-sidebar-toggle')
  const sidebar = document.querySelector('.dashboard-sidebar')
  const overlay = document.querySelector('.dashboard-sidebar-overlay')
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open')
    })
  }
  if (overlay && sidebar) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open')
    })
  }
}

/**
 * Initialize sidebar footer popup: toggle on profile click, close on outside click.
 */
function initSidebarFooterPopup() {
  const trigger = document.getElementById('dashboard-sidebar-footer-trigger')
  const popup = document.getElementById('dashboard-sidebar-popup')
  if (!trigger || !popup) return

  trigger.addEventListener('click', (e) => {
    e.stopPropagation()
    const open = popup.hidden
    popup.hidden = !open
    trigger.setAttribute('aria-expanded', !open)
  })

  // Close popup when clicking outside
  document.addEventListener('click', () => {
    if (!popup.hidden) {
      popup.hidden = true
      trigger.setAttribute('aria-expanded', 'false')
    }
  })

  popup.addEventListener('click', (e) => e.stopPropagation())
}

async function handleSignOut() {
  try {
    await supabase.auth.signOut()
  } catch (_) {
    // Redirect even if signOut fails (e.g. network error) so user is not stuck
  }
  window.location.href = '/'
}

/**
 * Initialize dashboard layout: check auth, inject sidebar and wrap content.
 * Returns the current user or null (after redirect).
 *
 * @param {Object} [options]
 * @param {string} [options.contentSelector] - Selector for element whose contents to move into main. Default: '#dashboard-content' or body content.
 * @returns {Promise<{ user: import('@supabase/supabase-js').User } | null>}
 */
export async function initDashboardLayout(options = {}) {
  // Try getSession first (reads localStorage, instant). If that fails,
  // wait for onAuthStateChange which fires once the client finishes init.
  let session = null
  try {
    const res = await supabase.auth.getSession()
    session = res.data?.session ?? null
  } catch (_) { /* ignore */ }

  // If getSession returned nothing, give the client a moment to initialize
  // and listen for the INITIAL_SESSION event (covers OAuth callback + refresh).
  if (!session) {
    session = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        subscription.unsubscribe()
        resolve(null)
      }, 3000)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, sess) => {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
            clearTimeout(timeout)
            subscription.unsubscribe()
            resolve(sess)
          }
        }
      )
    })
  }

  if (!session?.user) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.href = `${LOGIN_PATH}?redirect=${returnTo}`
    return null
  }

  const user = session.user
  const currentPath = getCurrentPath()
  const base = window.location.origin
  const avatarUrl = getUserAvatarUrl(user)
  const initials = getUserInitials(user)
  const displayName = user.user_metadata?.full_name || user.email || 'Signed in'

  const app = document.createElement('div')
  app.className = 'dashboard-app'

  const sidebar = document.createElement('aside')
  sidebar.className = 'dashboard-sidebar'
  sidebar.setAttribute('aria-label', 'Navigation')
  sidebar.innerHTML = buildSidebarHTML(currentPath)

  const userNameEl = sidebar.querySelector('#dashboard-sidebar-user-name')
  const userEmailEl = sidebar.querySelector('#dashboard-sidebar-user-email')
  const sidebarAvatarEl = sidebar.querySelector('#dashboard-sidebar-avatar')
  // Show full name as primary, email as secondary
  const fullName = user.user_metadata?.full_name || ''
  if (userNameEl) userNameEl.textContent = fullName || user.email || 'Signed in'
  if (userEmailEl) userEmailEl.textContent = fullName ? (user.email || '') : ''
  if (sidebarAvatarEl) {
    sidebarAvatarEl.innerHTML = renderAvatar(avatarUrl, initials)
  }

  const main = document.createElement('main')
  main.className = 'dashboard-main'

  // Fetch remaining credits for the pill (non-blocking, updates when ready)
  const remainingPromise = fetchRemainingSeconds()

  // Top-right header (desktop): remaining pill + download button + profile dropdown
  const headerWrap = document.createElement('div')
  headerWrap.className = 'dashboard-header-wrap'
  headerWrap.innerHTML = `
    <a href="${base}/account/subscription/" class="dashboard-remaining-pill" id="dashboard-remaining-pill" title="Remaining session time">
      <i data-lucide="hourglass" class="dashboard-remaining-pill-icon" aria-hidden="true"></i>
      <span id="dashboard-remaining-text">...</span>
    </a>
    <a href="${base}/download/" class="dashboard-download-btn">
      <span>Download</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </a>
    <div class="dashboard-profile-wrap">
      <button type="button" class="dashboard-profile-trigger" id="dashboard-profile-trigger" aria-expanded="false" aria-haspopup="true" aria-label="Account menu">
        <span class="dashboard-avatar dashboard-avatar-md" id="dashboard-profile-avatar"></span>
      </button>
      <div class="dashboard-profile-dropdown" id="dashboard-profile-dropdown" hidden>
        <p class="dashboard-profile-email" id="dashboard-profile-email">${escapeHtml(displayName)}</p>
        <a href="${base}/" class="dashboard-profile-link">Back to Website</a>
        <button type="button" class="dashboard-profile-signout" id="dashboard-profile-signout">Sign Out</button>
      </div>
    </div>
  `
  main.appendChild(headerWrap)

  const contentSelector = options.contentSelector || '#dashboard-content'
  const source = document.querySelector(contentSelector)
  if (source) {
    while (source.firstChild) {
      main.appendChild(source.firstChild)
    }
  } else {
    const body = document.body
    const scripts = []
    const toMove = []
    for (const child of body.childNodes) {
      if (child.tagName === 'SCRIPT') {
        scripts.push(child)
      } else if (child.nodeType === Node.ELEMENT_NODE && child.id !== 'dashboard-layout-mount') {
        toMove.push(child)
      }
    }
    toMove.forEach((el) => main.appendChild(el))
  }

  const header = document.createElement('header')
  header.className = 'dashboard-mobile-header'
  header.innerHTML = `
    <button type="button" class="dashboard-mobile-menu-btn" id="dashboard-sidebar-toggle" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
    <a href="${window.location.origin}/" class="dashboard-mobile-logo">
      <img src="/assets/logo_with_text.png" alt="BrainDock">
    </a>
  `

  const overlay = document.createElement('div')
  overlay.className = 'dashboard-sidebar-overlay'
  overlay.setAttribute('aria-hidden', 'true')

  app.appendChild(header)
  app.appendChild(sidebar)
  app.appendChild(overlay)
  app.appendChild(main)

  // Remove boot loading screen if present
  const boot = document.getElementById('dashboard-boot')
  if (boot) boot.remove()

  const mount = document.getElementById('dashboard-layout-mount')
  if (mount) {
    mount.appendChild(app)
  } else {
    document.body.appendChild(app)
  }

  createIcons({
    icons: { LayoutDashboard, Clock, Settings, ChevronDown, Smartphone, CreditCard, BookOpen, Hourglass },
    attrs: { class: 'dashboard-sidebar-icon' },
    root: app,
  })

  // Set profile avatar (top-right)
  const profileAvatarEl = document.getElementById('dashboard-profile-avatar')
  if (profileAvatarEl) {
    profileAvatarEl.innerHTML = renderAvatar(avatarUrl, initials)
  }

  initSidebarBehavior()
  initProfileDropdown()

  // Populate remaining-time pill once credits load
  remainingPromise.then((seconds) => {
    const textEl = document.getElementById('dashboard-remaining-text')
    if (textEl) textEl.textContent = formatPillDuration(seconds)
  })

  return { user }
}

/**
 * Initialize top-right profile dropdown: toggle on trigger click, close on outside click.
 */
function initProfileDropdown() {
  const trigger = document.getElementById('dashboard-profile-trigger')
  const dropdown = document.getElementById('dashboard-profile-dropdown')
  const signoutBtn = document.getElementById('dashboard-profile-signout')
  if (!trigger || !dropdown) return

  trigger.addEventListener('click', (e) => {
    e.stopPropagation()
    const open = dropdown.hidden
    dropdown.hidden = !open
    trigger.setAttribute('aria-expanded', !open)
  })

  signoutBtn?.addEventListener('click', handleSignOut)

  document.addEventListener('click', () => {
    if (!dropdown.hidden) {
      dropdown.hidden = true
      trigger.setAttribute('aria-expanded', 'false')
    }
  })

  dropdown.addEventListener('click', (e) => e.stopPropagation())
}
