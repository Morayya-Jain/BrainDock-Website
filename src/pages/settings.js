/**
 * General settings page: monitoring mode.
 * Reads/writes user_settings table.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'

const ALLOWED_MONITORING_MODES = ['camera_only', 'screen_only', 'both']

function escapeHtml(str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

async function loadSettings() {
  const { data, error } = await supabase.from('user_settings').select('*').single()
  if (error) throw error
  return data
}

async function saveSettings(userId, data) {
  const { error } = await supabase.from('user_settings').update(data).eq('user_id', userId)
  if (error) throw error
}

function render(main, settings, userId) {
  const mode = settings?.monitoring_mode || 'camera_only'

  main.innerHTML = `
    <h1 class="dashboard-page-title">General Settings</h1>
    <p style="font-family: var(--font-sans); color: var(--text-secondary); margin-bottom: var(--space-xl);">
      These defaults apply when you start a new session in the desktop app. You can still override the mode from the menu bar.
    </p>

    <div class="dashboard-card">
      <div class="dashboard-field">
        <span class="dashboard-field-label">Default monitoring mode</span>
        <div class="dashboard-radio-group">
          <label class="dashboard-radio-option">
            <input type="radio" name="monitoring_mode" value="camera_only" ${mode === 'camera_only' ? 'checked' : ''}>
            Camera only
          </label>
          <label class="dashboard-radio-option">
            <input type="radio" name="monitoring_mode" value="screen_only" ${mode === 'screen_only' ? 'checked' : ''}>
            Screen only
          </label>
          <label class="dashboard-radio-option">
            <input type="radio" name="monitoring_mode" value="both" ${mode === 'both' ? 'checked' : ''}>
            Both (camera + screen)
          </label>
        </div>
      </div>

      <div style="margin-top: var(--space-xl);">
        <button type="button" class="btn btn-primary" id="settings-save-btn">Save Changes</button>
        <span class="dashboard-saved" id="settings-saved-msg" style="display: none;">Saved</span>
      </div>
    </div>
  `

  const saveBtn = main.querySelector('#settings-save-btn')
  const savedMsg = main.querySelector('#settings-saved-msg')

  saveBtn.addEventListener('click', async () => {
    const newMode = main.querySelector('input[name="monitoring_mode"]:checked')?.value || 'camera_only'
    if (!ALLOWED_MONITORING_MODES.includes(newMode)) {
      alert('Invalid setting. Please try again.')
      return
    }
    saveBtn.disabled = true
    try {
      await saveSettings(userId, {
        monitoring_mode: newMode,
      })
      savedMsg.style.display = 'inline'
      setTimeout(() => { savedMsg.style.display = 'none' }, 2000)
    } catch (err) {
      console.error(err)
      alert('Failed to save. Please try again.')
    } finally {
      saveBtn.disabled = false
    }
  })
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  mainEl.innerHTML = '<div class="dashboard-loading"><div class="dashboard-spinner"></div><p>Loading settings...</p></div>'

  try {
    const settings = await loadSettings()
    render(mainEl, settings, result.user.id)
  } catch (err) {
    console.error(err)
    mainEl.innerHTML = `
      <div class="dashboard-empty">
        <p class="dashboard-empty-title">Could not load settings</p>
        <p>${escapeHtml(err.message || 'Please try again.')}</p>
      </div>
    `
  }
}

main()
