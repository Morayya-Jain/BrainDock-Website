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
  apple: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
  windows: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>',
  helpCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
}

function render(main) {
  const base = window.location.origin

  main.innerHTML = `
    <h1 class="dashboard-page-title">How to Use BrainDock</h1>
    <p class="dashboard-page-subtitle">A simple guide to get you started.</p>

    <div class="dashboard-card-stack">

      <!-- Getting Started -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--accent-highlight)">${ICONS.download}</div>
        <h2 class="dashboard-section-title">Getting Started</h2>
        <div class="howto-step"><span class="howto-step-num">1</span><span>Download the app from the <a href="${base}/download/">Download</a> page.</span></div>
        <div class="howto-step"><span class="howto-step-num">2</span><span>Create an account or sign in on this website.</span></div>
        <div class="howto-step"><span class="howto-step-num">3</span><span>Open BrainDock and sign in with the same account (or use the login code from this site).</span></div>
      </div>

      <!-- Starting a Session -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--success)">${ICONS.play}</div>
        <h2 class="dashboard-section-title">Starting a Session</h2>
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

      <!-- Focus Modes -->
      <div class="dashboard-card">
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
      </div>

      <!-- Your Blocklist -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--accent-highlight)">${ICONS.shield}</div>
        <h2 class="dashboard-section-title">Your Blocklist</h2>
        <p>Choose which sites and apps count as off-task in <a href="${base}/settings/blocklist/">Settings &rarr; Blocklist</a>.</p>
        <p>Use Quick Block for common sites, enable whole categories, or add your own URLs and app names. Changes sync to the app when you start your next session.</p>
      </div>

      <!-- Your Reports -->
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

      <!-- Tips for Best Results -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--warning)">${ICONS.lightbulb}</div>
        <h2 class="dashboard-section-title">Tips for Best Results</h2>
        <div class="howto-tip">${ICONS.check}<span>Good lighting on your face helps accuracy.</span></div>
        <div class="howto-tip">${ICONS.check}<span>Sit facing the camera, within 1 to 2 metres.</span></div>
        <div class="howto-tip">${ICONS.check}<span>Keep one person in the frame at a time.</span></div>
        <div class="howto-tip">${ICONS.check}<span>Only active gadget use is flagged. A phone on the desk while you work is fine.</span></div>
      </div>

      <!-- First Launch (macOS) -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--text-primary)">${ICONS.apple}</div>
        <h2 class="dashboard-section-title">First Launch (macOS)</h2>
        <p>macOS may show a security warning for apps from independent developers. To open BrainDock:</p>
        <div class="howto-step"><span class="howto-step-num">1</span><span><strong>Right-click</strong> (or Control-click) on BrainDock.app and choose <strong>Open</strong>.</span></div>
        <div class="howto-step"><span class="howto-step-num">2</span><span>Click "Open" in the dialog. This only happens once.</span></div>
        <div class="howto-step"><span class="howto-step-num">3</span><span>When asked for camera access, click <strong>OK</strong> so BrainDock can help you stay focussed.</span></div>
      </div>

      <!-- First Launch (Windows) -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--text-primary)">${ICONS.windows}</div>
        <h2 class="dashboard-section-title">First Launch (Windows)</h2>
        <p>Windows SmartScreen may show a warning for apps from independent developers. To install BrainDock:</p>
        <div class="howto-step"><span class="howto-step-num">1</span><span>Run <strong>BrainDock-Setup.exe</strong>. If SmartScreen appears, click <strong>More info</strong> then <strong>Run anyway</strong>.</span></div>
        <div class="howto-step"><span class="howto-step-num">2</span><span>Follow the installer. A desktop shortcut and Start Menu entry will be created.</span></div>
        <div class="howto-step"><span class="howto-step-num">3</span><span>When asked for camera access, click <strong>Allow</strong> so BrainDock can help you stay focussed.</span></div>
      </div>

      <!-- FAQ -->
      <div class="dashboard-card">
        <div class="howto-icon" style="color: var(--text-secondary)">${ICONS.helpCircle}</div>
        <h2 class="dashboard-section-title">FAQ</h2>

        <details class="howto-faq">
          <summary>How do I pause or stop a session?</summary>
          <p>Click the BrainDock icon in your menu bar or system tray, then choose Pause or Stop. You can resume a paused session at any time.</p>
        </details>

        <details class="howto-faq">
          <summary>How do I change my focus mode?</summary>
          <p>Open the BrainDock popup from the menu bar or system tray and pick Camera, Screen, or Both before starting a session.</p>
        </details>

        <details class="howto-faq">
          <summary>Where are my PDF reports saved?</summary>
          <p>Reports are automatically saved to your Downloads folder when a session ends. You can also view session history on the Sessions page of this website.</p>
        </details>

        <details class="howto-faq">
          <summary>How do I add a website or app to my blocklist?</summary>
          <p>Go to Settings &rarr; Blocklist on this website. You can toggle common sites, enable categories, or type in a custom URL or app name. Your changes sync to the desktop app automatically.</p>
        </details>

        <details class="howto-faq">
          <summary>Can I use BrainDock on more than one computer?</summary>
          <p>Yes. Install the app on each computer and sign in with the same account. Your settings and blocklist sync across all your devices.</p>
        </details>

        <details class="howto-faq">
          <summary>Does screen-only mode work without internet?</summary>
          <p>Yes. Screen-only mode runs entirely on your computer and does not need an internet connection. Camera mode needs internet for the AI.</p>
        </details>

        <details class="howto-faq">
          <summary>A phone on my desk was incorrectly flagged. Why?</summary>
          <p>BrainDock only flags active gadget use (e.g. scrolling or looking at a phone). If this still happens, try adjusting your camera angle or improving lighting. You can also turn off specific gadget types in Settings &rarr; Detection.</p>
        </details>

      </div>

    </div>
  `
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  render(mainEl)
}

main()
