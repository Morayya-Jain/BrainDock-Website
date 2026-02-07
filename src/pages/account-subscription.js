/**
 * Subscription status: current plan from subscriptions + subscription_tiers.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'

async function loadSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, subscription_tiers(*)')
    .eq('user_id', userId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

function escapeHtml(str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function formatDate(iso) {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function render(main, subscription) {
  const base = window.location.origin
  const tier = subscription?.subscription_tiers
  const hasActive = subscription && (subscription.status === 'active' || subscription.status === 'trialing')
  const tierName = tier?.display_name || tier?.name || '–'
  const periodStart = subscription?.current_period_start
  const periodEnd = subscription?.current_period_end

  main.innerHTML = `
    <h1 class="dashboard-page-title">Subscription</h1>
    <p style="font-family: var(--font-sans); color: var(--text-secondary); margin-bottom: var(--space-xl);">
      Your current plan and billing.
    </p>

    <div class="dashboard-card">
      ${hasActive
        ? `
        <p style="margin-bottom: var(--space-s);"><strong>Plan</strong> ${escapeHtml(tierName)}</p>
        <p style="margin-bottom: var(--space-s); font-size: 0.9375rem; color: var(--text-secondary);">Status: ${escapeHtml(subscription.status)}</p>
        ${periodStart ? `<p style="font-size: 0.875rem; color: var(--text-tertiary);">Current period: ${formatDate(periodStart)}${periodEnd ? ` to ${formatDate(periodEnd)}` : ''}</p>` : ''}
        <a href="${base}/pricing/" class="btn btn-secondary" style="margin-top: var(--space-l);">Change plan</a>
        `
        : `
        <p style="margin-bottom: var(--space-m);">You don't have an active subscription.</p>
        <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: var(--space-l);">Upgrade to unlock full features.</p>
        <a href="${base}/pricing/" class="btn btn-primary">Upgrade</a>
        `}
    </div>
  `
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  mainEl.innerHTML = '<div class="dashboard-loading"><div class="dashboard-spinner"></div><p>Loading subscription...</p></div>'

  try {
    const subscription = await loadSubscription(result.user.id)
    render(mainEl, subscription)
  } catch (err) {
    console.error(err)
    mainEl.innerHTML = `
      <div class="dashboard-empty">
        <p class="dashboard-empty-title">Could not load subscription</p>
        <p>${escapeHtml(err.message || 'Please try again.')}</p>
      </div>
    `
  }
}

main()
