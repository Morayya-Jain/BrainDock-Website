/**
 * Account profile: display name and email. Reads/writes profiles table.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'
import { isValidName, sanitizeText, LIMITS } from '../validators.js'

async function loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

async function updateProfile(userId, updates) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
}

function escapeHtml(str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function render(main, profile, userId) {
  const displayName = profile?.display_name ?? ''
  const email = profile?.email ?? ''

  main.innerHTML = `
    <h1 class="dashboard-page-title">Account</h1>
    <p style="font-family: var(--font-sans); color: var(--text-secondary); margin-bottom: var(--space-xl);">
      Your profile information.
    </p>

    <div class="dashboard-card">
      <div class="dashboard-field">
        <label class="dashboard-field-label" for="display_name">Display name</label>
        <input type="text" id="display_name" class="dashboard-input" value="${escapeHtml(displayName)}" placeholder="Your name" maxlength="${LIMITS.NAME_MAX}" style="max-width: 320px;">
      </div>
      <div class="dashboard-field">
        <span class="dashboard-field-label">Email</span>
        <p style="font-family: var(--font-sans); color: var(--text-secondary); margin-top: var(--space-xs);">${escapeHtml(email)}</p>
        <p style="font-size: 0.8125rem; color: var(--text-tertiary);">Email is managed by your account provider and cannot be changed here.</p>
      </div>
      <div style="margin-top: var(--space-xl);">
        <button type="button" class="btn btn-primary" id="account-save-btn">Save Changes</button>
        <span class="dashboard-saved" id="account-saved-msg" style="display: none;">Saved</span>
      </div>
    </div>
  `

  const saveBtn = main.querySelector('#account-save-btn')
  const savedMsg = main.querySelector('#account-saved-msg')
  const input = main.querySelector('#display_name')

  saveBtn.addEventListener('click', async () => {
    const name = sanitizeText(input.value, LIMITS.NAME_MAX)
    if (name && !isValidName(name)) {
      alert(`Display name must be 1-${LIMITS.NAME_MAX} characters and cannot contain < or >.`)
      return
    }
    saveBtn.disabled = true
    try {
      await updateProfile(userId, { display_name: name || null })
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

  mainEl.innerHTML = '<div class="dashboard-loading"><div class="dashboard-spinner"></div><p>Loading account...</p></div>'

  try {
    const profile = await loadProfile(result.user.id)
    render(mainEl, profile, result.user.id)
  } catch (err) {
    console.error(err)
    mainEl.innerHTML = `
      <div class="dashboard-empty">
        <p class="dashboard-empty-title">Could not load profile</p>
        <p>${escapeHtml(err.message || 'Please try again.')}</p>
      </div>
    `
  }
}

main()
