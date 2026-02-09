/**
 * How to Use / Tutorial: static content with icons. No Supabase calls.
 */

import { initDashboardLayout } from '../dashboard-layout.js'

// Inline SVG icons (Lucide-style, 24x24 viewBox)
const ICONS = {
  download: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  play: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
  camera: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
  monitor: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  layers: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  shield: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>',
  fileText: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  lightbulb: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
  helpCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  appleSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
  windowsSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>',
}

function render(main) {
  const base = window.location.origin

  main.innerHTML = `
    <h1 class="dashboard-page-title">How to Use BrainDock</h1>
    <p class="dashboard-page-subtitle">A simple guide to get you started.</p>

    <div class="howto-stack">

      <!-- 1. Get Set Up -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--accent-highlight)">${ICONS.download}</div>
        <h2 class="dashboard-section-title">Get Set Up</h2>
        <div class="howto-step"><span class="howto-step-num">1</span><span>Download the app from the <a href="${base}/download/">Download</a> page.</span></div>
        <div class="howto-step"><span class="howto-step-num">2</span><span>Create an account or sign in on this website.</span></div>
        <div class="howto-step"><span class="howto-step-num">3</span><span>Open BrainDock and sign in with the same account (or use the login code from this site).</span></div>

        <hr class="howto-divider">
        <p class="dashboard-meta" style="margin-bottom: var(--space-s);">First launch on your platform:</p>
        <div class="howto-platform-tabs">
          <button type="button" class="howto-platform-tab active" data-platform="macos">${ICONS.appleSmall} macOS</button>
          <button type="button" class="howto-platform-tab" data-platform="windows">${ICONS.windowsSmall} Windows</button>
        </div>
        <div class="howto-platform-panel active" id="platform-macos">
          <div class="howto-step"><span class="howto-step-num">1</span><span><strong>Right-click</strong> (or Control-click) on BrainDock.app and choose <strong>Open</strong>.</span></div>
          <div class="howto-step"><span class="howto-step-num">2</span><span>Click "Open" in the dialog. This only happens once.</span></div>
          <div class="howto-step"><span class="howto-step-num">3</span><span>When asked for camera access, click <strong>OK</strong>.</span></div>
        </div>
        <div class="howto-platform-panel" id="platform-windows">
          <div class="howto-step"><span class="howto-step-num">1</span><span>Run <strong>BrainDock-Setup.exe</strong>. If SmartScreen appears, click <strong>More info</strong> then <strong>Run anyway</strong>.</span></div>
          <div class="howto-step"><span class="howto-step-num">2</span><span>Follow the installer. A desktop shortcut and Start Menu entry will be created.</span></div>
          <div class="howto-step"><span class="howto-step-num">3</span><span>When asked for camera access, click <strong>Allow</strong>.</span></div>
        </div>
      </div>

      <!-- 2. Start a Session -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--success)">${ICONS.play}</div>
        <h2 class="dashboard-section-title">Start a Session</h2>
        <div class="howto-step"><span class="howto-step-num">1</span><span>Click the BrainDock icon in the menu bar (macOS) or system tray (Windows).</span></div>
        <div class="howto-step"><span class="howto-step-num">2</span><span>Pick your mode: Camera, Screen, or Both.</span></div>
        <div class="howto-step"><span class="howto-step-num">3</span><span>Press "Start Session". Pause or stop any time from the menu.</span></div>
        <p class="dashboard-meta" style="margin-top: var(--space-m); margin-bottom: var(--space-s);">Status colours:</p>
        <div class="howto-status-row">
          <span class="howto-status-item"><span class="howto-dot" style="background: var(--success)"></span> Focussed</span>
          <span class="howto-status-item"><span class="howto-dot" style="background: var(--warning)"></span> Away</span>
          <span class="howto-status-item"><span class="howto-dot" style="background: var(--error)"></span> Gadget</span>
          <span class="howto-status-item"><span class="howto-dot" style="background: #7C3AED"></span> Screen</span>
        </div>
      </div>

      <!-- 3. Focus Modes + Tips -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--accent-highlight)">${ICONS.lightbulb}</div>
        <h2 class="dashboard-section-title">Focus Modes</h2>
        <div class="howto-modes">
          <div class="howto-mode-item" style="color: var(--accent-highlight)">
            ${ICONS.camera}
            <div class="howto-mode-label">Camera</div>
            <div class="howto-mode-desc">Uses AI to notice when you step away or pick up a phone/tablet. No video is saved.</div>
          </div>
          <div class="howto-mode-item" style="color: var(--accent-highlight)">
            ${ICONS.monitor}
            <div class="howto-mode-label">Screen</div>
            <div class="howto-mode-desc">Checks your active window against your blocklist. Works offline.</div>
          </div>
          <div class="howto-mode-item" style="color: var(--accent-highlight)">
            ${ICONS.layers}
            <div class="howto-mode-label">Both</div>
            <div class="howto-mode-desc">Camera and screen combined for full coverage.</div>
          </div>
        </div>

        <hr class="howto-divider">
        <p class="dashboard-meta" style="margin-bottom: var(--space-s);"><strong>Tips</strong></p>
        <div class="howto-tip">${ICONS.check}<span>Good lighting on your face helps accuracy.</span></div>
        <div class="howto-tip">${ICONS.check}<span>Sit facing the camera, within 1 to 2 metres.</span></div>
        <div class="howto-tip">${ICONS.check}<span>Keep one person in the frame at a time.</span></div>
        <div class="howto-tip">${ICONS.check}<span>Only active gadget use is flagged. A phone on the desk while you work is fine.</span></div>
      </div>

      <!-- 4. Your Blocklist -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--accent-highlight)">${ICONS.shield}</div>
        <h2 class="dashboard-section-title">Your Blocklist</h2>
        <p>Choose which sites and apps count as off-task in <a href="${base}/settings/blocklist/">Settings &rarr; Blocklist</a>.</p>
        <p>Use Quick Block for common sites, enable whole categories, or add your own URLs and app names. Changes sync to the app when you start your next session.</p>
      </div>

      <!-- 5. Your Reports -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--accent-highlight)">${ICONS.fileText}</div>
        <h2 class="dashboard-section-title">Your Reports</h2>
        <p>After each session a PDF is saved to your Downloads folder. It includes:</p>
        <div class="howto-tip">${ICONS.check}<span>Session duration and focus percentage</span></div>
        <div class="howto-tip">${ICONS.check}<span>Away time and gadget/screen events</span></div>
        <div class="howto-tip">${ICONS.check}<span>A visual timeline of your session</span></div>
        <div class="howto-tip">${ICONS.check}<span>AI-generated insights and personalised suggestions</span></div>
        <p style="margin-top: var(--space-m);">You can also view past sessions on the <a href="${base}/sessions/">Sessions</a> page.</p>
      </div>

      <!-- 6. FAQ -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--text-secondary)">${ICONS.helpCircle}</div>
        <h2 class="dashboard-section-title">FAQ</h2>

        <div class="howto-qa">
          <div class="howto-qa-q">How do I pause or stop a session?</div>
          <div class="howto-qa-a">Click the BrainDock icon in your menu bar or system tray, then choose Pause or Stop. You can resume a paused session at any time.</div>
        </div>

        <div class="howto-qa">
          <div class="howto-qa-q">How do I change my focus mode?</div>
          <div class="howto-qa-a">Open the BrainDock popup from the menu bar or system tray and pick Camera, Screen, or Both before starting a session.</div>
        </div>

        <div class="howto-qa">
          <div class="howto-qa-q">Where are my PDF reports saved?</div>
          <div class="howto-qa-a">Reports are automatically saved to your Downloads folder when a session ends. You can also view session history on the Sessions page of this website.</div>
        </div>

        <div class="howto-qa">
          <div class="howto-qa-q">How do I add a website or app to my blocklist?</div>
          <div class="howto-qa-a">Go to Settings &rarr; Blocklist on this website. You can toggle common sites, enable categories, or type in a custom URL or app name. Your changes sync to the desktop app automatically.</div>
        </div>

        <div class="howto-qa">
          <div class="howto-qa-q">Can I use BrainDock on more than one computer?</div>
          <div class="howto-qa-a">Yes. Install the app on each computer and sign in with the same account. Your settings and blocklist sync across all your devices.</div>
        </div>

        <div class="howto-qa">
          <div class="howto-qa-q">Does screen-only mode work without internet?</div>
          <div class="howto-qa-a">Yes. Screen-only mode runs entirely on your computer and does not need an internet connection. Camera mode needs internet for the AI.</div>
        </div>

        <div class="howto-qa">
          <div class="howto-qa-q">A phone on my desk was incorrectly flagged. Why?</div>
          <div class="howto-qa-a">BrainDock only flags active gadget use (e.g. scrolling or looking at a phone). If this still happens, try adjusting your camera angle or improving lighting. You can also turn off specific gadget types in Settings &rarr; Configuration.</div>
        </div>
      </div>

    </div>
  `

  // Platform tab toggle
  const tabs = main.querySelectorAll('.howto-platform-tab')
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const platform = tab.dataset.platform
      tabs.forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')
      main.querySelectorAll('.howto-platform-panel').forEach((p) => p.classList.remove('active'))
      const panel = main.querySelector(`#platform-${platform}`)
      if (panel) panel.classList.add('active')
    })
  })

  // 3D stacking scroll effect
  initStackEffect(main)
}

/**
 * Smooth 3D stacking effect. As the next card scrolls over a stuck card,
 * the stuck card scales down and fades, creating depth.
 *
 * Works on both desktop (dashboard-main scrolls) and mobile (document scrolls)
 * by detecting the actual scroll container at init time.
 */
function initStackEffect(main) {
  const cards = Array.from(main.querySelectorAll('.howto-stack > .dashboard-card'))
  if (cards.length === 0) return

  // Detect the real scroll container: on desktop (>=768px) it's .dashboard-main,
  // on mobile the page itself scrolls (document/window).
  function getScrollParent() {
    const dm = main.closest('.dashboard-main')
    if (dm) {
      const style = getComputedStyle(dm)
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') return dm
    }
    return null // null means document/window is the scroller
  }

  let scrollEl = getScrollParent()

  // Cache each card's sticky top offset (read from CSS, changes on resize)
  let stickyTops = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0)

  // Tuning
  const COVER_PX = 250
  const SCALE_MIN = 0.93
  const OPACITY_MIN = 0.5

  let ticking = false

  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(update)
  }

  function update() {
    ticking = false

    // The reference Y: top of the scroll container's viewport
    // On desktop: dashboard-main's bounding top
    // On mobile: 0 (document viewport top)
    const refTop = scrollEl ? scrollEl.getBoundingClientRect().top : 0

    for (let i = 0; i < cards.length; i++) {
      const next = cards[i + 1]
      if (!next) {
        cards[i].style.transform = ''
        cards[i].style.opacity = ''
        cards[i].style.boxShadow = ''
        continue
      }

      // Where this card's top edge sits when stuck
      const myStuckY = refTop + stickyTops[i]
      const myBottom = myStuckY + cards[i].offsetHeight
      const nextTop = next.getBoundingClientRect().top

      // How far the next card has overlapped into this card
      const overlap = myBottom - nextTop
      const t = Math.max(0, Math.min(1, overlap / COVER_PX))

      if (t > 0.001) {
        const s = 1 - (1 - SCALE_MIN) * t
        const o = 1 - (1 - OPACITY_MIN) * t
        cards[i].style.transform = `scale(${s})`
        cards[i].style.opacity = o
        cards[i].style.boxShadow = `0 2px ${8 + 16 * t}px rgba(0,0,0,${0.05 + 0.08 * t})`
      } else {
        cards[i].style.transform = ''
        cards[i].style.opacity = ''
        cards[i].style.boxShadow = ''
      }
    }
  }

  function recache() {
    scrollEl = getScrollParent()
    stickyTops = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0)
    update()
  }

  // Attach to the correct scroll target + always listen on window for mobile
  if (scrollEl) scrollEl.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  // Recache on resize and orientation change (sticky tops + scroll container may change)
  window.addEventListener('resize', recache)
  window.addEventListener('orientationchange', recache)
  update()
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  render(mainEl)
}

main()
