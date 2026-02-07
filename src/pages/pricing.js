/**
 * Public pricing page: lists tiers from subscription_tiers, Get Started creates Stripe Checkout.
 * No auth required to view; auth required to checkout.
 */

import { supabase, supabaseUrl, supabaseAnonKey } from '../supabase.js'
import '../dashboard.css'

async function fetchTiers() {
  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

async function createCheckoutSession(tierId) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { url: null, error: 'Not signed in' }
  const resp = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ tier_id: tierId }),
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

function render(root, tiers, hasUser, alreadyPaid) {
  const defaultTiers = tiers.length > 0 ? tiers : [
    { id: 'starter', name: 'starter', display_name: 'BrainDock Starter', price_cents: 199, currency: 'aud', billing_interval: 'one_time', features: { camera_monitoring: true, screen_monitoring: true, pdf_reports: true, max_daily_hours: 2 } },
  ]

  root.innerHTML = `
    <div class="auth-page">
      <div class="auth-container" style="max-width: 800px;">
        <a href="/" class="auth-logo">
          <img src="/assets/logo_with_text.png" alt="BrainDock">
        </a>
        <div style="text-align: center; margin-bottom: var(--space-xl);">
          <h1 class="auth-title">Pricing</h1>
          <p class="auth-subtitle">Simple, transparent pricing</p>
        </div>
        <div style="display: grid; gap: var(--space-l); grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
          ${defaultTiers.map((t) => {
            const feats = t.features || {}
            const featList = []
            if (feats.camera_monitoring) featList.push('Camera tracking')
            if (feats.screen_monitoring) featList.push('Screen tracking')
            if (feats.pdf_reports) featList.push('PDF reports')
            if (feats.max_daily_hours) featList.push(`${feats.max_daily_hours}hr daily limit`)
            return `
              <div class="dashboard-card">
                <h3 style="font-family: var(--font-serif); font-size: 1.25rem; margin-bottom: var(--space-s);">${escapeHtml(t.display_name || t.name)}</h3>
                <p style="font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-m);">${formatPrice(t.price_cents, t.currency)}</p>
                <p style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: var(--space-l);">${t.billing_interval === 'one_time' ? 'One-time payment' : escapeHtml(t.billing_interval || '')}</p>
                <ul style="list-style: none; padding: 0; margin: 0 0 var(--space-xl);">
                  ${featList.map((f) => `<li style="padding: var(--space-xs) 0; font-size: 0.9375rem;">${escapeHtml(f)}</li>`).join('')}
                </ul>
                ${alreadyPaid
                  ? `<a href="/dashboard/" class="btn btn-secondary" style="width: 100%; text-align: center;">Already subscribed</a>`
                  : hasUser
                    ? `<button type="button" class="btn btn-primary" data-tier-id="${escapeHtml(t.id)}" style="width: 100%;">Get Started</button>`
                    : `<a href="/auth/signup/" class="btn btn-primary" style="width: 100%; text-align: center;">Get Started</a>`}
              </div>
            `
          }).join('')}
        </div>
        <p style="text-align: center; margin-top: var(--space-xl); font-size: 0.875rem; color: var(--text-tertiary);">More plans coming soon.</p>
        <p style="text-align: center; margin-top: var(--space-m);">
          ${hasUser ? '<a href="/dashboard/">Go to Dashboard</a>' : '<a href="/auth/login/">Log in</a>'}
        </p>
      </div>
    </div>
  `

  root.querySelectorAll('[data-tier-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tierId = btn.dataset.tierId
      btn.disabled = true
      btn.textContent = 'Loading...'
      const { url, error } = await createCheckoutSession(tierId)
      if (error) {
        btn.disabled = false
        btn.textContent = 'Get Started'
        alert(error)
        return
      }
      if (url) window.location.href = url
    })
  })
}

async function main() {
  const root = document.getElementById('pricing-root')
  if (!root) return

  root.innerHTML = '<div class="auth-page"><div class="auth-container"><p>Loading pricing...</p></div></div>'

  const { data: { session } } = await supabase.auth.getSession()

  let tiers = []
  let alreadyPaid = false
  try {
    tiers = await fetchTiers()
    if (session) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, status')
        .in('status', ['active', 'trialing'])
        .maybeSingle()
      alreadyPaid = !!sub
    }
  } catch (err) {
    console.error(err)
  }
  render(root, tiers, !!session, alreadyPaid)
}

main()
