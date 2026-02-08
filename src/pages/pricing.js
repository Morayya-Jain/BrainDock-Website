/**
 * Public pricing page: lists credit packages (hour packs) from credit_packages.
 * No auth required to view; auth required to checkout.
 */

import { supabase, supabaseUrl, supabaseAnonKey } from '../supabase.js'
import '../auth.css'
import '../dashboard.css'

async function fetchCreditPackages() {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

async function createCheckoutSession(packageId) {
  // Refresh to get a non-expired access token (getSession returns stale/cached tokens)
  const { data: refreshed } = await supabase.auth.refreshSession()
  const session = refreshed?.session
  if (!session) return { url: null, error: 'Not signed in' }
  const resp = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ package_id: packageId }),
  })
  const result = await resp.json().catch(() => ({}))
  if (!resp.ok) return { url: null, error: result?.error || result?.message || `HTTP ${resp.status}` }
  return { url: result?.url || null, error: result?.url ? null : 'No checkout URL returned' }
}

function formatPrice(cents, currency) {
  const c = (currency || 'aud').toLowerCase()
  if (c === 'aud') return `A$${(cents / 100).toFixed(2)}`
  return `$${(cents / 100).toFixed(2)}`
}

function escapeHtml(str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function pricePerHour(cents, hours) {
  if (!hours || hours < 1) return null
  return (cents / 100 / hours).toFixed(2)
}

/** Tier label for display: 1 -> Pro, 10 -> Ultra, 30 -> Max */
function tierDisplayName(hours) {
  if (hours === 1) return 'BrainDock Pro'
  if (hours === 10) return 'BrainDock Ultra'
  if (hours === 30) return 'BrainDock Max'
  return null
}

/** CTA button label per tier */
function tierButtonLabel(hours) {
  if (hours === 1) return 'Get Pro'
  if (hours === 10) return 'Get Ultra'
  if (hours === 30) return 'Get Max'
  return 'Buy Now'
}

function render(root, packages, hasUser) {
  const defaultPackages = packages.length > 0 ? packages : [
    { id: '1', name: '1_hour', display_name: '1 Hour', hours: 1, price_cents: 199, currency: 'aud' },
    { id: '2', name: '10_hours', display_name: '10 Hours', hours: 10, price_cents: 1499, currency: 'aud' },
    { id: '3', name: '30_hours', display_name: '30 Hours', hours: 30, price_cents: 3499, currency: 'aud' },
  ]

  const origin = window.location.origin

  root.innerHTML = `
    <!-- Header (same as main website, without Sign Up) -->
    <nav class="nav">
      <div class="container nav-container">
        <a href="${origin}/" class="nav-logo" target="_blank" rel="noopener">
          <img src="/assets/logo_with_text.png" alt="BrainDock">
        </a>
        <div class="nav-center">
          <div class="nav-links">
            <a href="${origin}/#why-braindock" target="_blank" rel="noopener">Why Use BrainDock</a>
            <a href="${origin}/#features" target="_blank" rel="noopener">Features</a>
            <a href="${origin}/#how-it-works" target="_blank" rel="noopener">How It Works</a>
            <a href="${origin}/#contact" target="_blank" rel="noopener">Contact Us</a>
          </div>
        </div>
        <div class="nav-actions">
          <a href="${origin}/#download" class="btn btn-primary nav-cta" target="_blank" rel="noopener">
            <span>Download</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>
        </div>
        <button class="nav-toggle" id="pricing-nav-toggle" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="nav-mobile" id="pricing-nav-mobile">
        <a href="${origin}/#why-braindock" target="_blank" rel="noopener">Why Use BrainDock</a>
        <a href="${origin}/#features" target="_blank" rel="noopener">Features</a>
        <a href="${origin}/#how-it-works" target="_blank" rel="noopener">How It Works</a>
        <a href="${origin}/#contact" target="_blank" rel="noopener">Contact Us</a>
        <a href="${origin}/#download" target="_blank" rel="noopener">Download</a>
      </div>
    </nav>

    <!-- Pricing content -->
    <main class="pricing-main">
      <div class="container pricing-container">
        <div class="pricing-header">
          <h1 class="pricing-title">Pricing</h1>
          <p class="pricing-subtitle">Use camera or screen sessions - time is deducted from your balance. Top up anytime.</p>
        </div>
        <div class="pricing-grid">
          ${defaultPackages.map((pkg) => {
            const isPopular = pkg.hours === 10
            const perHour = pricePerHour(pkg.price_cents, pkg.hours)
            const tierName = tierDisplayName(pkg.hours) || escapeHtml(pkg.display_name || pkg.name)
            const btnLabel = tierButtonLabel(pkg.hours)
            return `
              <div class="dashboard-card pricing-card" style="position: relative; ${isPopular ? 'border: 2px solid var(--accent-primary, #0d9488);' : ''}">
                ${isPopular ? '<span class="pricing-badge">Most Popular</span>' : ''}
                <h3 class="pricing-card-title">${tierName}</h3>
                <p class="pricing-card-price">${formatPrice(pkg.price_cents, pkg.currency)}</p>
                ${perHour ? `<p class="pricing-card-per-hour">A$${perHour} per hour</p>` : '<p class="pricing-card-per-hour"></p>'}
                <p class="pricing-card-desc">${pkg.hours} hour${pkg.hours === 1 ? '' : 's'} of BrainDock - camera, screen, or both.</p>
                ${hasUser
                  ? `<button type="button" class="btn btn-primary" data-package-id="${escapeHtml(pkg.id)}">${btnLabel}</button>`
                  : `<a href="/auth/signup/" class="btn btn-primary">${btnLabel}</a>`}
              </div>
            `
          }).join('')}
        </div>
      </div>
    </main>

    <!-- Footer (same as main website) -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <img src="/assets/logo_with_text.png" alt="BrainDock" loading="lazy">
            <p>AI-powered focus assistant that helps you build better habits.</p>
          </div>
          <div class="footer-links">
            <h4>Legal</h4>
            <a href="${origin}/privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a href="${origin}/terms.html" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>
          </div>
          <div class="footer-contact">
            <h4>Contact</h4>
            <a href="mailto:morayya@thebraindock.com">morayya@thebraindock.com</a>
            <a href="mailto:help.thebraindock@gmail.com">help.thebraindock@gmail.com</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 BrainDock. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `

  root.querySelectorAll('[data-package-id]').forEach((btn) => {
    const originalLabel = btn.textContent
    btn.addEventListener('click', async () => {
      const packageId = btn.dataset.packageId
      btn.disabled = true
      btn.textContent = 'Loading...'
      try {
        const { url, error } = await createCheckoutSession(packageId)
        if (error) {
          btn.disabled = false
          btn.textContent = originalLabel
          alert(error)
          return
        }
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
        btn.disabled = false
        btn.textContent = originalLabel
      } catch (err) {
        btn.disabled = false
        btn.textContent = originalLabel
        alert('Network error. Please check your connection and try again.')
      }
    })
  })

  // Mobile nav toggle
  const navToggle = document.getElementById('pricing-nav-toggle')
  const navMobile = document.getElementById('pricing-nav-mobile')
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true'
      navToggle.setAttribute('aria-expanded', !expanded)
      navMobile.classList.toggle('active')
    })
  }
}

async function main() {
  const root = document.getElementById('pricing-root')
  if (!root) return

  root.innerHTML = '<div class="auth-page"><div class="auth-container"><p>Loading pricing...</p></div></div>'

  const { data: { session } } = await supabase.auth.getSession()

  let packages = []
  try {
    packages = await fetchCreditPackages()
  } catch (err) {
    console.error(err)
  }
  render(root, packages, !!session)
}

main()
