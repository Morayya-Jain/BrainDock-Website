/**
 * How to Use / Tutorial: static content. No Supabase calls.
 */

import { initDashboardLayout } from '../dashboard-layout.js'

function render(main) {
  const base = window.location.origin

  main.innerHTML = `
    <h1 class="dashboard-page-title">How to Use BrainDock</h1>

    <div class="dashboard-card-stack">
      <div class="dashboard-card">
        <h2 class="dashboard-section-title">Getting Started</h2>
        <p>1. Download the desktop app from the <a href="${base}/download/">Download</a> page.</p>
        <p>2. Create an account or sign in on this website.</p>
        <p>3. Open BrainDock and link your device (sign in with the same account, or use the login code from the website).</p>
      </div>

      <div class="dashboard-card">
        <h2 class="dashboard-section-title">Starting a Session</h2>
        <p>1. Click the BrainDock icon in the menu bar (macOS) or system tray (Windows).</p>
        <p>2. Choose your mode: Camera, Screen, or Both.</p>
        <p>3. Click "Start Session". BrainDock runs in the background. Pause or stop anytime from the menu.</p>
      </div>

      <div class="dashboard-card">
        <h2 class="dashboard-section-title">Monitoring Modes Explained</h2>
        <p><strong>Camera</strong> - Detects when you are present at your desk and when you use gadgets (phone, tablet, etc.) via the webcam. Uses AI; no video is stored.</p>
        <p><strong>Screen</strong> - Monitors your active window or browser tab and checks it against your blocklist (distracting sites and apps). Runs locally and works offline.</p>
        <p><strong>Both</strong> - Combines camera and screen monitoring for full coverage.</p>
      </div>

      <div class="dashboard-card">
        <h2 class="dashboard-section-title">Configuring Your Blocklist</h2>
        <p>Go to <a href="${base}/settings/blocklist/">Settings → Blocklist</a> to choose which sites and apps count as distractions during screen monitoring.</p>
        <p>Use Quick Block toggles for common sites (e.g. Instagram, YouTube). Enable whole categories (Social Media, Video Streaming, etc.) or add custom URLs and app names.</p>
        <p>Changes sync to the desktop app when you start your next session.</p>
      </div>

      <div class="dashboard-card">
        <h2 class="dashboard-section-title">Understanding Your Reports</h2>
        <p><strong>Focus time</strong> - Time spent at your desk with no distractions.</p>
        <p><strong>Away</strong> - Time away from the desk (e.g. stepped away).</p>
        <p><strong>Gadget / Screen distraction</strong> - Time spent on phones, tablets, or blocklisted sites.</p>
        <p><strong>Focus rate</strong> - Focus time as a percentage of active (non-paused) time.</p>
        <p>After each session you can download a PDF report from the desktop app and view session history here on the dashboard.</p>
      </div>

      <div class="dashboard-card">
        <h2 class="dashboard-section-title">FAQ</h2>
        <p><strong>Privacy: What does BrainDock see?</strong> Frames are analyzed by AI and never stored. No facial recognition; we only detect presence and gadget use.</p>
        <p><strong>Cost: How much does the AI detection cost?</strong> With Gemini (the default), detection typically costs around $0.01-0.03 per minute. You can switch to OpenAI in the desktop app if you prefer.</p>
        <p><strong>Accuracy: Why was X detected or not detected?</strong> Detection depends on lighting, camera angle, and the AI model. You can turn off specific gadget types in Settings → Detection to reduce false positives.</p>
        <p><strong>Offline: What happens without internet?</strong> Screen-only mode works fully offline. Camera modes need internet for the vision API. Session data is uploaded when the session ends and you are back online.</p>
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
