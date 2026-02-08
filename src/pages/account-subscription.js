/**
 * Billing & Usage: current balance from user_credits and purchase history from credit_purchases.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'

/** Format seconds as "X hour(s)", "X min(s)", or "X sec(s)" */
function formatDuration(seconds) {
  if (seconds == null || seconds < 0) return '0 sec'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h} ${h === 1 ? 'hour' : 'hours'}${m > 0 ? ` ${m} ${m === 1 ? 'min' : 'mins'}` : ''}`
  }
  if (m > 0) {
    return `${m} ${m === 1 ? 'min' : 'mins'}${s > 0 ? ` ${s} ${s === 1 ? 'sec' : 'secs'}` : ''}`
  }
  return `${s} ${s === 1 ? 'sec' : 'secs'}`
}

function formatPrice(cents) {
  return `A$${(cents / 100).toFixed(2)}`
}

function formatDate(iso) {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function escapeHtml(str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

async function loadCredits() {
  const { data, error } = await supabase
    .from('user_credits')
    .select('total_purchased_seconds, total_used_seconds')
    .single()
  if (error) {
    if (error.code === 'PGRST116') return { total_purchased_seconds: 0, total_used_seconds: 0, remaining_seconds: 0 }
    throw error
  }
  const purchased = data?.total_purchased_seconds ?? 0
  const used = data?.total_used_seconds ?? 0
  return { total_purchased_seconds: purchased, total_used_seconds: used, remaining_seconds: Math.max(0, purchased - used) }
}

async function loadPurchaseHistory() {
  const { data, error } = await supabase
    .from('credit_purchases')
    .select('id, seconds_added, amount_cents, purchased_at, credit_packages(display_name, hours)')
    .order('purchased_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data || []
}

function render(main, credits, purchases) {
  const base = window.location.origin
  const remaining = credits?.remaining_seconds ?? 0

  main.innerHTML = `
    <h1 class="dashboard-page-title">Billing & Usage</h1>
    <p style="font-family: var(--font-sans); color: var(--text-secondary); margin-bottom: var(--space-xl);">
      Your remaining hours and purchase history.
    </p>

    <div class="dashboard-card" style="margin-bottom: var(--space-xl);">
      <h2 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; margin-bottom: var(--space-s);">Hours remaining</h2>
      <p class="dashboard-stat-card-value" style="margin-bottom: var(--space-m);">${formatDuration(remaining)}</p>
      <a href="${base}/pricing/" class="btn btn-primary">Buy more hours</a>
    </div>

    <div class="dashboard-card">
      <h2 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; margin-bottom: var(--space-m);">Purchase history</h2>
      ${purchases.length === 0
    ? `
        <div class="dashboard-empty">
          <p class="dashboard-empty-title">No purchases yet</p>
          <p>Buy hour packs from the <a href="${base}/pricing/">pricing page</a> to get started.</p>
        </div>
      `
    : `
        <ul class="dashboard-list" id="purchase-history-list">
          ${purchases.map((p) => {
    const pkg = p.credit_packages
    const name = pkg?.display_name || `${(p.seconds_added / 3600)} hours`
    const hours = p.seconds_added ? (p.seconds_added / 3600) : 0
    return `
            <li class="dashboard-list-item billing-purchase-row" data-purchase-id="${escapeHtml(p.id)}" style="cursor: pointer;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-m);">
                  <strong>${escapeHtml(name)}</strong>
                  <span style="font-size: 0.875rem; color: var(--text-secondary);">${formatPrice(p.amount_cents)}</span>
                </div>
                <span style="font-size: 0.8125rem; color: var(--text-tertiary);">${formatDate(p.purchased_at)}</span>
                <div class="billing-purchase-detail" id="detail-${escapeHtml(p.id)}" hidden style="margin-top: var(--space-m); padding-top: var(--space-m); border-top: 1px solid var(--border-subtle); font-family: var(--font-sans); font-size: 0.875rem; color: var(--text-secondary);">
                  <div style="display: grid; grid-template-columns: auto 1fr; gap: var(--space-xs) var(--space-l);">
                    <span style="color: var(--text-tertiary);">Package</span>
                    <span>${escapeHtml(name)}</span>
                    <span style="color: var(--text-tertiary);">Hours added</span>
                    <span>${hours} ${hours === 1 ? 'hour' : 'hours'}</span>
                    <span style="color: var(--text-tertiary);">Amount</span>
                    <span>${formatPrice(p.amount_cents)}</span>
                    <span style="color: var(--text-tertiary);">Date</span>
                    <span>${formatDate(p.purchased_at)}</span>
                    <span style="color: var(--text-tertiary);">Receipt</span>
                    <span>Sent to your email</span>
                  </div>
                </div>
              </div>
            </li>
          `
  }).join('')}
        </ul>
      `}
    </div>

    <div class="dashboard-card" style="margin-top: var(--space-l); border-left: 4px solid var(--success);">
      <h2 style="font-family: var(--font-serif); font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-s);">Download BrainDock</h2>
      <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: var(--space-l);">Download the desktop app and sign in with the same account to use your hours.</p>
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-m);">
        <a href="https://github.com/Morayya-Jain/BrainDock/releases/latest/download/BrainDock-macOS.dmg" class="btn btn-primary">Download for macOS</a>
        <a href="https://github.com/Morayya-Jain/BrainDock/releases/latest/download/BrainDock-Setup.exe" class="btn btn-secondary">Download for Windows</a>
      </div>
    </div>
  `

  // Make purchase rows expandable on click
  main.querySelectorAll('.billing-purchase-row').forEach((row) => {
    row.addEventListener('click', () => {
      const id = row.dataset.purchaseId
      const detail = document.getElementById(`detail-${id}`)
      if (!detail) return
      const isOpen = !detail.hidden
      // Close all other open details first
      main.querySelectorAll('.billing-purchase-detail').forEach((d) => { d.hidden = true })
      detail.hidden = isOpen
    })
  })
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  mainEl.innerHTML = '<div class="dashboard-loading"><div class="dashboard-spinner"></div><p>Loading billing...</p></div>'

  try {
    const [credits, purchases] = await Promise.all([loadCredits(), loadPurchaseHistory()])
    render(mainEl, credits, purchases)
  } catch (err) {
    console.error(err)
    mainEl.innerHTML = `
      <div class="dashboard-empty">
        <p class="dashboard-empty-title">Could not load billing</p>
        <p>${escapeHtml(err.message || 'Please try again.')}</p>
      </div>
    `
  }
}

main()
