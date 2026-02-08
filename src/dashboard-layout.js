/**
 * Shared dashboard layout: auth guard, sidebar navigation, content wrapper.
 * Import from any authenticated dashboard page. Ensures user is logged in,
 * injects sidebar + main area, moves page content into main, returns user.
 */

import { supabase } from './supabase.js'
import './dashboard.css'

const LOGIN_PATH = '/auth/login/'
const DASHBOARD_PATH = '/dashboard/'

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
  const settingsActive = currentPath.startsWith('/settings')
  const accountActive = currentPath.startsWith('/account')

  return `
    <a href="${base}/" class="dashboard-sidebar-logo" aria-label="BrainDock home">
      <img src="/assets/logo_with_text.png" alt="BrainDock">
    </a>
    <nav class="dashboard-sidebar-nav" aria-label="Dashboard navigation">
      <ul class="dashboard-sidebar-list">
        <li>
          <a href="${base}${DASHBOARD_PATH}" class="dashboard-sidebar-link ${currentPath === '/dashboard' ? 'active' : ''}">Dashboard</a>
        </li>
        <li>
          <a href="${base}/sessions/" class="dashboard-sidebar-link ${currentPath.startsWith('/sessions') ? 'active' : ''}">Sessions</a>
        </li>
        <li class="dashboard-sidebar-group">
          <button type="button" class="dashboard-sidebar-link dashboard-sidebar-expand ${settingsActive ? 'active' : ''}" aria-expanded="${settingsActive}" data-expands="settings-sub">Settings</button>
          <ul id="settings-sub" class="dashboard-sidebar-sublist" ${settingsActive ? '' : 'hidden'}>
            <li><a href="${base}/settings/" class="dashboard-sidebar-link ${currentPath === '/settings' ? 'active' : ''}">General</a></li>
            <li><a href="${base}/settings/blocklist/" class="dashboard-sidebar-link ${currentPath === '/settings/blocklist' ? 'active' : ''}">Blocklist</a></li>
            <li><a href="${base}/settings/detection/" class="dashboard-sidebar-link ${currentPath === '/settings/detection' ? 'active' : ''}">Detection</a></li>
            <li><a href="${base}/settings/devices/" class="dashboard-sidebar-link ${currentPath === '/settings/devices' ? 'active' : ''}">Devices</a></li>
          </ul>
        </li>
        <li>
          <a href="${base}/account/" class="dashboard-sidebar-link ${currentPath === '/account' ? 'active' : ''}">Account</a>
        </li>
        <li>
          <a href="${base}/account/subscription/" class="dashboard-sidebar-link ${currentPath === '/account/subscription' ? 'active' : ''}">Credits</a>
        </li>
        <li>
          <a href="${base}/how-to-use/" class="dashboard-sidebar-link ${currentPath === '/how-to-use' ? 'active' : ''}">How to Use</a>
        </li>
      </ul>
    </nav>
    <div class="dashboard-sidebar-footer">
      <p class="dashboard-sidebar-user" id="dashboard-sidebar-user-email"></p>
      <button type="button" class="dashboard-sidebar-signout" id="dashboard-sidebar-signout">Sign Out</button>
    </div>
  `
}

/**
 * Initialize sidebar expand/collapse and sign out.
 */
function initSidebarBehavior() {
  const expandBtn = document.querySelector('.dashboard-sidebar-expand')
  const sublist = document.getElementById('settings-sub')
  if (expandBtn && sublist) {
    expandBtn.addEventListener('click', () => {
      const expanded = sublist.hidden
      sublist.hidden = !expanded
      expandBtn.setAttribute('aria-expanded', expanded)
    })
  }

  const signoutBtn = document.getElementById('dashboard-sidebar-signout')
  if (signoutBtn) {
    signoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut()
      window.location.href = '/'
    })
  }

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
      const timeout = setTimeout(() => resolve(null), 3000)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, sess) => {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
            clearTimeout(timeout)
            subscription.unsubscribe()
            resolve(sess)
          }
        }
      )
      // If the listener doesn't fire within 3s, resolve null
    })
  }

  if (!session?.user) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.href = `${LOGIN_PATH}?redirect=${returnTo}`
    return null
  }

  const user = session.user
  const currentPath = getCurrentPath()

  const app = document.createElement('div')
  app.className = 'dashboard-app'

  const sidebar = document.createElement('aside')
  sidebar.className = 'dashboard-sidebar'
  sidebar.setAttribute('aria-label', 'Navigation')
  sidebar.innerHTML = buildSidebarHTML(currentPath)

  const userEmailEl = sidebar.querySelector('#dashboard-sidebar-user-email')
  if (userEmailEl) {
    const email = user.email || ''
    const name = user.user_metadata?.full_name || ''
    userEmailEl.textContent = name || email || 'Signed in'
  }

  const main = document.createElement('main')
  main.className = 'dashboard-main'
  main.setAttribute('role', 'main')

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

  initSidebarBehavior()

  return { user }
}
