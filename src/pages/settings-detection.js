/**
 * Detection settings: which gadget types count as distractions.
 * Reads/writes user_settings.enabled_gadgets (JSON array).
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'

const GADGET_PRESETS = [
  { id: 'phone', name: 'Phone', description: 'Smartphones (5-7 inch devices)', defaultOn: true },
  { id: 'tablet', name: 'Tablet / iPad', description: 'Tablets and iPads (8+ inch)', defaultOn: false },
  { id: 'controller', name: 'Game Controller', description: 'PS5, Xbox, generic controllers', defaultOn: false },
  { id: 'tv', name: 'TV / TV Remote', description: 'Television and remote control usage', defaultOn: false },
  { id: 'nintendo_switch', name: 'Nintendo Switch', description: 'Nintendo Switch handheld/docked', defaultOn: false },
  { id: 'smartwatch', name: 'Smartwatch', description: 'Apple Watch, Fitbit, Galaxy Watch', defaultOn: false },
]

async function loadSettings() {
  const { data, error } = await supabase.from('user_settings').select('enabled_gadgets').single()
  if (error) throw error
  return data
}

async function saveSettings(userId, enabledGadgets) {
  const { error } = await supabase.from('user_settings').update({ enabled_gadgets: enabledGadgets }).eq('user_id', userId)
  if (error) throw error
}

function escapeHtml(str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function render(main, settings, userId) {
  const enabled = Array.isArray(settings?.enabled_gadgets) ? settings.enabled_gadgets : ['phone']
  const set = new Set(enabled)

  main.innerHTML = `
    <h1 class="dashboard-page-title">Detection</h1>
    <p style="font-family: var(--font-sans); color: var(--text-secondary); margin-bottom: var(--space-xl);">
      Choose which gadget types the camera should count as distractions. Only enabled types are detected.
    </p>

    <div class="dashboard-card">
      ${GADGET_PRESETS.map((g) => `
        <div class="dashboard-toggle">
          <div>
            <div class="dashboard-toggle-label">${escapeHtml(g.name)}</div>
            <div class="dashboard-toggle-desc">${escapeHtml(g.description)}</div>
          </div>
          <div class="dashboard-toggle-switch ${set.has(g.id) ? 'active' : ''}" data-gadget="${g.id}" role="button" tabindex="0" aria-pressed="${set.has(g.id)}"></div>
        </div>
      `).join('')}

      <div style="margin-top: var(--space-xl);">
        <button type="button" class="btn btn-primary" id="detection-save-btn">Save Changes</button>
        <span class="dashboard-saved" id="detection-saved-msg" style="display: none;">Saved</span>
      </div>
    </div>
  `

  const saveBtn = main.querySelector('#detection-save-btn')
  const savedMsg = main.querySelector('#detection-saved-msg')

  function getEnabled() {
    const arr = []
    main.querySelectorAll('.dashboard-toggle-switch[data-gadget].active').forEach((el) => {
      arr.push(el.dataset.gadget)
    })
    return arr
  }

  main.querySelectorAll('.dashboard-toggle-switch[data-gadget]').forEach((el) => {
    el.addEventListener('click', () => {
      el.classList.toggle('active')
      el.setAttribute('aria-pressed', el.classList.contains('active'))
    })
  })

  saveBtn.addEventListener('click', async () => {
    const enabledGadgets = getEnabled()
    saveBtn.disabled = true
    try {
      await saveSettings(userId, enabledGadgets)
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
