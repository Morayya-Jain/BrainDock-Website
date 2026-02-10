/**
 * Billing & Usage: current balance from user_credits and purchase history from credit_purchases.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'
import { escapeHtml, formatDuration } from '../utils.js'
import { t } from '../dashboard-i18n.js'

function formatPrice(cents) {
  return `A$${(cents / 100).toFixed(2)}`
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
    <h1 class="dashboard-page-title">${t('dashboard.billing.title', 'Billing & Usage')}</h1>
    <p class="dashboard-page-subtitle">
      ${t('dashboard.billing.subtitle', 'Your remaining hours and purchase history.')}
    </p>

    <div class="dashboard-card dashboard-credits-card">
      <div class="dashboard-credits-widget">
        <div>
          <h2 class="dashboard-credits-widget-heading">${t('dashboard.common.hoursRemaining', 'Hours remaining')}</h2>
          <p class="dashboard-credits-widget-value">${formatDuration(remaining)}</p>
        </div>
        <a href="${base}/pricing/" target="_blank" rel="noopener" class="btn btn-primary">${t('dashboard.actions.buyMoreHours', 'Buy more hours')}</a>
      </div>
    </div>

    <div class="dashboard-card">
      <h2 class="dashboard-section-title">${t('dashboard.billing.purchaseHistory', 'Purchase history')}</h2>
      ${purchases.length === 0
    ? `
        <div class="dashboard-empty">
          <p class="dashboard-empty-title">${t('dashboard.billing.noPurchasesTitle', 'No purchases yet')}</p>
          <p>${t('dashboard.billing.noPurchasesBefore', 'Buy hour packs from the')} <a href="${base}/pricing/" target="_blank" rel="noopener">${t('dashboard.billing.pricingPage', 'pricing page')}</a> ${t('dashboard.billing.noPurchasesAfter', 'to get started.')}</p>
        </div>
      `
    : `
        <ul class="dashboard-list" id="purchase-history-list">
          ${purchases.map((p) => {
    const pkg = p.credit_packages
    const name = pkg?.display_name || `${(p.seconds_added / 3600)} hours`
    const hours = p.seconds_added ? (p.seconds_added / 3600) : 0
    return `
            <li class="dashboard-list-item dashboard-list-item--clickable billing-purchase-row" tabindex="0" role="button" aria-expanded="false" data-purchase-id="${escapeHtml(p.id)}">
              <div style="flex: 1;">
                <div class="dashboard-credits-widget">
                  <strong>${escapeHtml(name)}</strong>
                  <span class="dashboard-meta">${formatPrice(p.amount_cents)}</span>
                </div>
                <span class="dashboard-meta-sub">${formatDate(p.purchased_at)}</span>
                <div class="billing-purchase-detail" id="detail-${escapeHtml(p.id)}" hidden>
                  <div class="billing-purchase-detail-grid">
                    <span class="billing-detail-label">${t('dashboard.billing.package', 'Package')}</span>
                    <span>${escapeHtml(name)}</span>
                    <span class="billing-detail-label">${t('dashboard.billing.hoursAdded', 'Hours added')}</span>
                    <span>${hours} ${hours === 1 ? t('dashboard.time.hour', 'hour') : t('dashboard.time.hours', 'hours')}</span>
                    <span class="billing-detail-label">${t('dashboard.billing.amount', 'Amount')}</span>
                    <span>${formatPrice(p.amount_cents)}</span>
                    <span class="billing-detail-label">${t('dashboard.billing.date', 'Date')}</span>
                    <span>${formatDate(p.purchased_at)}</span>
                    <span class="billing-detail-label">${t('dashboard.billing.receipt', 'Receipt')}</span>
                    <span>${t('dashboard.billing.sentToEmail', 'Sent to your email')}</span>
                  </div>
                </div>
              </div>
            </li>
          `
  }).join('')}
        </ul>
      `}
    </div>

  `

  // Make purchase rows expandable on click and keyboard
  main.querySelectorAll('.billing-purchase-row').forEach((row) => {
    function toggleRow() {
      const id = row.dataset.purchaseId
      const detail = document.getElementById(`detail-${id}`)
      if (!detail) return
      const isOpen = !detail.hidden
      // Close all other open details first
      main.querySelectorAll('.billing-purchase-detail').forEach((d) => { d.hidden = true })
      main.querySelectorAll('.billing-purchase-row').forEach((r) => { r.setAttribute('aria-expanded', 'false') })
      detail.hidden = isOpen
      row.setAttribute('aria-expanded', String(!isOpen))
    }
    row.addEventListener('click', toggleRow)
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleRow()
      }
    })
  })
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  mainEl.innerHTML = `<div class="dashboard-loading"><div class="dashboard-spinner"></div><p>${t('dashboard.billing.loading', 'Loading billing...')}</p></div>`

  try {
    const [credits, purchases] = await Promise.all([loadCredits(), loadPurchaseHistory()])
    render(mainEl, credits, purchases)

    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      window.history.replaceState({}, '', window.location.pathname)
      const banner = document.createElement('div')
      banner.className = 'dashboard-banner dashboard-banner-success'
      banner.setAttribute('role', 'status')
      banner.textContent = t('dashboard.billing.paymentSuccess', 'Payment successful. Your hours have been added.')
      mainEl.prepend(banner)
    }
  } catch (err) {
    console.error(err)
    mainEl.innerHTML = `
      <div class="dashboard-empty">
        <p class="dashboard-empty-title">${t('dashboard.billing.errorTitle', 'Could not load billing')}</p>
        <p>${escapeHtml(err.message || t('dashboard.common.tryAgain', 'Please try again.'))}</p>
      </div>
    `
  }
}

main()
