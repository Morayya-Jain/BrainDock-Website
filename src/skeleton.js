/**
 * Skeleton screen HTML generators for each dashboard page.
 * Each function returns an HTML string that mirrors the page's content structure.
 * Replaces the old spinner-based loading states with content-shaped placeholders.
 */

import './skeleton.css'

/**
 * Dashboard home: 3 stat cards + recent sessions list + weekly chart.
 */
export function dashboardSkeleton() {
  return `
    <div aria-hidden="true">
      <div class="skeleton-bone skeleton-bone--title" style="width:40%;max-width:220px"></div>

      <div class="skeleton-stat-row">
        ${statCardBone()}
        ${statCardBone()}
        ${statCardBone()}
      </div>

      <div class="skeleton-section">
        <div class="skeleton-bone skeleton-bone--subtitle" style="width:35%;max-width:180px;margin-bottom:var(--space-m)"></div>
        <div class="skeleton-card">
          ${listItemBone(5)}
        </div>
      </div>

      <div class="skeleton-section">
        <div class="skeleton-bone skeleton-bone--subtitle" style="width:25%;max-width:140px;margin-bottom:var(--space-m)"></div>
        <div class="skeleton-card">
          <div class="skeleton-chart">
            ${chartBarBones(7)}
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Sessions list: paginated session rows.
 */
export function sessionsSkeleton() {
  return `
    <div aria-hidden="true">
      <div class="skeleton-bone skeleton-bone--title" style="width:45%;max-width:250px"></div>

      <div class="skeleton-card">
        ${sessionListItemBone(6)}
      </div>

      <div class="skeleton-pagination">
        <div class="skeleton-bone skeleton-bone--button" style="width:90px"></div>
        <div class="skeleton-bone skeleton-bone--text" style="width:80px"></div>
        <div class="skeleton-bone skeleton-bone--button" style="width:90px"></div>
      </div>
    </div>
  `
}

/**
 * Session detail: stats + progress + timeline + event table.
 */
export function sessionDetailSkeleton() {
  return `
    <div aria-hidden="true">
      <div class="skeleton-bone skeleton-bone--text" style="width:80px;margin-bottom:var(--space-m)"></div>
      <div class="skeleton-bone skeleton-bone--title" style="width:55%;max-width:320px"></div>
      <div class="skeleton-bone skeleton-bone--subtitle" style="width:35%;max-width:200px"></div>

      <div class="skeleton-stat-row skeleton-stat-row--2col">
        ${statCardBone()}
        ${statCardBone()}
        ${statCardBone()}
        ${statCardBone()}
      </div>

      <div class="skeleton-section">
        <div class="skeleton-bone skeleton-bone--progress" style="margin-bottom:var(--space-l)"></div>
        <div class="skeleton-bone skeleton-bone--timeline" style="margin-bottom:var(--space-m)"></div>
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-m);margin-bottom:var(--space-l)">
          <div class="skeleton-bone skeleton-bone--text" style="width:60px"></div>
          <div class="skeleton-bone skeleton-bone--text" style="width:50px"></div>
          <div class="skeleton-bone skeleton-bone--text" style="width:70px"></div>
          <div class="skeleton-bone skeleton-bone--text" style="width:55px"></div>
          <div class="skeleton-bone skeleton-bone--text" style="width:50px"></div>
        </div>
      </div>

      <div class="skeleton-card" style="padding:0">
        ${tableRowBone(6)}
      </div>
    </div>
  `
}

/**
 * Account profile: name input + email display + save button.
 */
export function accountSkeleton() {
  return `
    <div aria-hidden="true">
      <div class="skeleton-bone skeleton-bone--title" style="width:30%;max-width:160px"></div>
      <div class="skeleton-bone skeleton-bone--subtitle" style="width:45%;max-width:260px"></div>

      <div class="skeleton-card">
        <div style="margin-bottom:var(--space-l)">
          <div class="skeleton-bone skeleton-bone--text" style="width:100px;margin-bottom:var(--space-s)"></div>
          <div class="skeleton-bone skeleton-bone--input" style="width:100%;max-width:360px"></div>
        </div>
        <div style="margin-bottom:var(--space-l)">
          <div class="skeleton-bone skeleton-bone--text" style="width:60px;margin-bottom:var(--space-s)"></div>
          <div class="skeleton-bone skeleton-bone--text" style="width:200px"></div>
          <div class="skeleton-bone skeleton-bone--text" style="width:280px;margin-top:6px;height:12px"></div>
        </div>
        <div class="skeleton-bone skeleton-bone--button" style="width:130px"></div>
      </div>
    </div>
  `
}

/**
 * Billing & Usage: credits card + purchase history list.
 */
export function billingSkeleton() {
  return `
    <div aria-hidden="true">
      <div class="skeleton-bone skeleton-bone--title" style="width:40%;max-width:220px"></div>
      <div class="skeleton-bone skeleton-bone--subtitle" style="width:55%;max-width:320px"></div>

      <div class="skeleton-card" style="margin-bottom:var(--space-xl)">
        <div class="skeleton-bone skeleton-bone--text" style="width:60%;max-width:280px;height:22px;margin-bottom:var(--space-m)"></div>
        <div class="skeleton-bone skeleton-bone--text" style="width:140px;height:12px;margin-bottom:var(--space-l)"></div>
        <div class="skeleton-bone skeleton-bone--button" style="width:160px"></div>
      </div>

      <div class="skeleton-card">
        <div class="skeleton-bone skeleton-bone--subtitle" style="width:35%;max-width:180px;margin-bottom:var(--space-m)"></div>
        ${listItemBone(4)}
      </div>
    </div>
  `
}

/**
 * Configuration: distraction level + detection items + websites + custom inputs.
 */
export function configSkeleton() {
  return `
    <div aria-hidden="true">
      <div class="skeleton-bone skeleton-bone--title" style="width:40%;max-width:220px"></div>
      <div class="skeleton-bone skeleton-bone--subtitle" style="width:55%;max-width:320px"></div>

      <div style="display:flex;flex-direction:column;gap:clamp(16px,2vw,24px)">
        <div class="skeleton-card" style="margin-bottom:0">
          <div class="skeleton-bone skeleton-bone--subtitle" style="width:40%;max-width:180px;margin-bottom:var(--space-m)"></div>
          <div class="skeleton-level-row">
            <div class="skeleton-bone" style="height:48px;border-radius:12px"></div>
            <div class="skeleton-bone" style="height:48px;border-radius:12px"></div>
          </div>
        </div>

        <div class="skeleton-card" style="margin-bottom:0">
          <div class="skeleton-bone skeleton-bone--subtitle" style="width:35%;max-width:160px;margin-bottom:var(--space-m)"></div>
          <div class="skeleton-pill-wrap">
            ${pillBones([80, 70, 60, 90, 75, 65, 85, 55, 70, 80])}
          </div>
        </div>

        <div class="skeleton-card" style="margin-bottom:0">
          <div class="skeleton-bone skeleton-bone--subtitle" style="width:30%;max-width:140px;margin-bottom:var(--space-m)"></div>
          <div class="skeleton-pill-wrap">
            ${pillBones([85, 75, 95, 70, 80, 60, 90, 65, 75, 85, 70, 80, 95, 60])}
          </div>
        </div>

        <div class="skeleton-card-row">
          <div class="skeleton-card" style="margin-bottom:0">
            <div class="skeleton-bone skeleton-bone--subtitle" style="width:50%;max-width:140px;margin-bottom:var(--space-m)"></div>
            <div class="skeleton-bone skeleton-bone--input" style="width:100%;margin-bottom:var(--space-m)"></div>
            <div class="skeleton-pill-wrap">
              ${pillBones([100, 120, 90])}
            </div>
          </div>
          <div class="skeleton-card" style="margin-bottom:0">
            <div class="skeleton-bone skeleton-bone--subtitle" style="width:50%;max-width:140px;margin-bottom:var(--space-m)"></div>
            <div class="skeleton-bone skeleton-bone--input" style="width:100%;margin-bottom:var(--space-m)"></div>
            <div class="skeleton-pill-wrap">
              ${pillBones([110, 80, 100])}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Linked Devices: device list with OS icons.
 */
export function devicesSkeleton() {
  return `
    <div aria-hidden="true">
      <div class="skeleton-bone skeleton-bone--title" style="width:40%;max-width:200px"></div>
      <div class="skeleton-bone skeleton-bone--subtitle" style="width:65%;max-width:400px"></div>

      <div class="skeleton-card">
        ${deviceItemBone(3)}
      </div>
    </div>
  `
}

/**
 * Pricing page: header + 3 pricing cards + FAQ.
 * Wrapped in pricing layout classes (no sidebar).
 */
export function pricingSkeleton() {
  return `
    <main class="pricing-main">
      <div class="container pricing-container" aria-hidden="true">
        <div style="text-align:center;margin-bottom:5vh">
          <div class="skeleton-bone skeleton-bone--title" style="width:30%;max-width:180px;margin:0 auto var(--space-m)"></div>
          <div class="skeleton-bone skeleton-bone--text" style="width:55%;max-width:360px;margin:0 auto var(--space-s)"></div>
          <div class="skeleton-bone skeleton-bone--text" style="width:45%;max-width:300px;margin:0 auto"></div>
        </div>

        <div class="skeleton-pricing-grid">
          ${pricingCardBone()}
          ${pricingCardBone()}
          ${pricingCardBone()}
        </div>

        <div style="margin-top:clamp(48px,6vh,80px)">
          <div class="skeleton-bone skeleton-bone--title" style="width:35%;max-width:240px;margin:0 auto var(--space-xl);text-align:center"></div>
          ${faqRowBone(5)}
        </div>
      </div>
    </main>
  `
}

/* --------------------------------------------------------------------------
   Helper bone generators
   -------------------------------------------------------------------------- */

function statCardBone() {
  return `
    <div class="skeleton-bone skeleton-bone--card" style="height:auto;padding:var(--space-l)">
      <div class="skeleton-bone skeleton-bone--text" style="width:70%;margin-bottom:var(--space-s)"></div>
      <div class="skeleton-bone" style="width:50%;height:24px;border-radius:6px"></div>
    </div>
  `
}

function listItemBone(count) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-list-item">
      <div style="flex:1;display:flex;flex-direction:column;gap:6px">
        <div class="skeleton-bone skeleton-bone--text" style="width:60%"></div>
        <div class="skeleton-bone skeleton-bone--text" style="width:85%;height:12px"></div>
        <div class="skeleton-bone skeleton-bone--text" style="width:40%;height:11px"></div>
      </div>
      <div class="skeleton-bone skeleton-bone--button" style="width:60px;height:32px;flex-shrink:0"></div>
    </div>
  `).join('')
}

function sessionListItemBone(count) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-list-item">
      <div style="flex:1;display:flex;flex-direction:column;gap:6px">
        <div class="skeleton-bone skeleton-bone--text" style="width:55%"></div>
        <div class="skeleton-bone skeleton-bone--text" style="width:30%;height:12px"></div>
        <div class="skeleton-bone skeleton-bone--text" style="width:70%;height:12px"></div>
        <div class="skeleton-bone skeleton-bone--text" style="width:45%;height:11px"></div>
      </div>
      <div class="skeleton-bone skeleton-bone--button" style="width:60px;height:32px;flex-shrink:0"></div>
    </div>
  `).join('')
}

function chartBarBones(count) {
  const heights = [35, 60, 45, 80, 55, 70, 50]
  return Array.from({ length: count }, (_, i) => `
    <div class="skeleton-chart-bar-wrap">
      <div class="skeleton-bone skeleton-bone--bar" style="height:${heights[i % heights.length]}%"></div>
      <div class="skeleton-bone skeleton-bone--text" style="width:28px;height:10px;margin-top:var(--space-xs)"></div>
    </div>
  `).join('')
}

function tableRowBone(count) {
  return Array.from({ length: count }, () => `
    <div style="display:flex;align-items:center;gap:var(--space-m);padding:var(--space-m);border-bottom:1px solid rgba(0,0,0,0.04)">
      <div class="skeleton-bone skeleton-bone--text" style="width:70px"></div>
      <div class="skeleton-bone skeleton-bone--text" style="width:70px"></div>
      <div class="skeleton-bone skeleton-bone--text" style="width:90px"></div>
      <div class="skeleton-bone skeleton-bone--text" style="flex:1"></div>
    </div>
  `).join('')
}

function pillBones(widths) {
  return widths.map((w) =>
    `<div class="skeleton-bone skeleton-bone--pill" style="width:${w}px"></div>`
  ).join('')
}

function deviceItemBone(count) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-device-item">
      <div class="skeleton-bone skeleton-bone--circle" style="width:36px;height:36px"></div>
      <div class="skeleton-device-info">
        <div class="skeleton-bone skeleton-bone--text" style="width:55%"></div>
        <div class="skeleton-bone skeleton-bone--text" style="width:75%;height:12px"></div>
        <div class="skeleton-bone skeleton-bone--text" style="width:40%;height:11px"></div>
      </div>
      <div class="skeleton-bone skeleton-bone--button" style="width:70px;height:32px;flex-shrink:0"></div>
    </div>
  `).join('')
}

function pricingCardBone() {
  return `
    <div class="skeleton-card skeleton-pricing-card">
      <div class="skeleton-bone skeleton-bone--text" style="width:50%;height:18px;margin-bottom:var(--space-s)"></div>
      <div class="skeleton-bone" style="width:60%;height:32px;border-radius:6px;margin-bottom:var(--space-s)"></div>
      <div class="skeleton-bone skeleton-bone--text" style="width:40%;height:14px;margin-bottom:var(--space-m)"></div>
      <div class="skeleton-bone skeleton-bone--text" style="width:90%;height:12px;margin-bottom:6px"></div>
      <div class="skeleton-bone skeleton-bone--text" style="width:75%;height:12px;margin-bottom:var(--space-l)"></div>
      <div style="margin-top:auto">
        <div class="skeleton-bone skeleton-bone--button" style="width:100%"></div>
      </div>
    </div>
  `
}

function faqRowBone(count) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-faq-row">
      <div class="skeleton-bone skeleton-bone--text" style="width:65%;height:16px"></div>
    </div>
  `).join('')
}
