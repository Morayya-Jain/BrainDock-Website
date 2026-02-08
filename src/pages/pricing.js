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

function render(root, packages, hasUser) {
  const defaultPackages = packages.length > 0 ? packages : [
    { id: '1', name: '1_hour', display_name: '1 Hour', hours: 1, price_cents: 199, currency: 'aud' },
    { id: '2', name: '10_hours', display_name: '10 Hours', hours: 10, price_cents: 1499, currency: 'aud' },
    { id: '3', name: '30_hours', display_name: '30 Hours', hours: 30, price_cents: 3499, currency: 'aud' },
  ]

  root.innerHTML = `
    <div class="auth-page pricing-page">
      <div class="auth-container pricing-container">
        <a href="/" class="auth-logo pricing-logo">
          <img src="/assets/logo_with_text.png" alt="BrainDock">
        </a>
        <div class="pricing-header">
          <h1 class="auth-title">Pricing</h1>
          <p class="auth-subtitle">Use camera or screen sessions - time is deducted from your balance. Top up anytime.</p>
        </div>
        <div class="pricing-grid">
          ${defaultPackages.map((pkg) => {
            const isPopular = pkg.hours === 10
            const perHour = pricePerHour(pkg.price_cents, pkg.hours)
            const tierName = tierDisplayName(pkg.hours) || escapeHtml(pkg.display_name || pkg.name)
            return `
              <div class="dashboard-card pricing-card" style="position: relative; ${isPopular ? 'border: 2px solid var(--accent-primary, #0d9488);' : ''}">
                ${isPopular ? '<span class="pricing-badge">Most Popular</span>' : ''}
                <h3 class="pricing-card-title">${tierName}</h3>
                <p class="pricing-card-price">${formatPrice(pkg.price_cents, pkg.currency)}</p>
                ${perHour ? `<p class="pricing-card-per-hour">A$${perHour} per hour</p>` : '<p class="pricing-card-per-hour"></p>'}
                <p class="pricing-card-desc">${pkg.hours} hour${pkg.hours === 1 ? '' : 's'} of BrainDock - camera, screen, or both.</p>
                ${hasUser
                  ? `<button type="button" class="btn btn-primary" data-package-id="${escapeHtml(pkg.id)}">Buy Now</button>`
                  : `<a href="/auth/signup/" class="btn btn-primary">Sign up to buy</a>`}
              </div>
            `
          }).join('')}
        </div>
        <p class="pricing-footer-note">One-time purchase. Hours never expire.</p>
        <p class="pricing-footer-link">
          ${hasUser ? '<a href="/dashboard/">Go to Dashboard</a>' : '<a href="/auth/login/">Log in</a>'}
        </p>
      </div>
    </div>
  `

  root.querySelectorAll('[data-package-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const packageId = btn.dataset.packageId
      btn.disabled = true
      btn.textContent = 'Loading...'
      try {
        const { url, error } = await createCheckoutSession(packageId)
        if (error) {
          btn.disabled = false
          btn.textContent = 'Buy Now'
          alert(error)
          return
        }
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
      } catch (err) {
        btn.disabled = false
        btn.textContent = 'Buy Now'
        alert('Network error. Please check your connection and try again.')
      }
    })
  })
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
