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
        <div style="display: flex; align-items: center; gap: var(--space-s); margin-bottom: var(--space-m);">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--success);"></span>
          <strong style="font-size: 1.125rem;">${escapeHtml(tierName)}</strong>
          <span style="font-size: 0.875rem; color: var(--success); font-weight: 500;">Active</span>
        </div>
        ${periodStart ? `<p style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: var(--space-l);">Since ${formatDate(periodStart)}</p>` : ''}
        `
        : `
        <h2 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; margin-bottom: var(--space-s);">No active subscription</h2>
        <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: var(--space-l);">Upgrade to get full access to the BrainDock desktop app. One-time payment of A$1.99.</p>
        <a href="${base}/pricing/" class="btn btn-primary">Upgrade Now</a>
        `}
    </div>

    ${hasActive ? `
    <div class="dashboard-card" style="margin-top: var(--space-l); border-left: 4px solid var(--success);">
      <h2 style="font-family: var(--font-serif); font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-s);">Download BrainDock</h2>
      <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: var(--space-l);">Download the desktop app and sign in with the same account to start using your paid features.</p>
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-m);">
        <a href="https://github.com/Morayya-Jain/BrainDock/releases/latest/download/BrainDock-macOS.dmg" class="btn btn-primary">Download for macOS</a>
        <a href="https://github.com/Morayya-Jain/BrainDock/releases/latest/download/BrainDock-Setup.exe" class="btn btn-secondary">Download for Windows</a>
      </div>
    </div>
    ` : ''}
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
