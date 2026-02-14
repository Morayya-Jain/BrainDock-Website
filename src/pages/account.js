/**
 * Account profile: display name and email. Reads/writes profiles table.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'
import { isValidName, sanitizeText, LIMITS } from '../validators.js'
import { escapeHtml, showInlineError } from '../utils.js'
import { t } from '../dashboard-i18n.js'
import { logError } from '../logger.js'

async function loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('id, display_name, email').eq('id', userId).single()
  if (error) throw error
  return data
}

async function updateProfile(userId, updates) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
}

function render(main, profile, userId) {
  const displayName = profile?.display_name ?? ''
  const email = profile?.email ?? ''

  main.innerHTML = `
    <h1 class="dashboard-page-title">${t('dashboard.account.title', 'Account')}</h1>
    <p class="dashboard-page-subtitle">
      ${t('dashboard.account.subtitle', 'Your profile information.')}
    </p>

    <div class="dashboard-card">
      <div class="dashboard-field">
        <label class="dashboard-field-label" for="display_name">${t('dashboard.account.displayName', 'Display name')}</label>
        <input type="text" id="display_name" class="dashboard-input dashboard-input--mid" value="${escapeHtml(displayName)}" placeholder="${t('dashboard.account.yourName', 'Your name')}" maxlength="${LIMITS.NAME_MAX}">
      </div>
      <div class="dashboard-field">
        <span class="dashboard-field-label">${t('dashboard.account.email', 'Email')}</span>
        <p class="dashboard-meta mt-xs">${escapeHtml(email)}</p>
        <p class="dashboard-meta-sub">${t('dashboard.account.emailManaged', 'Email is managed by your account provider and cannot be changed here.')}</p>
      </div>
      <div class="dashboard-form-actions">
        <button type="button" class="btn btn-primary" id="account-save-btn">${t('dashboard.actions.saveChanges', 'Save Changes')}</button>
        <span class="dashboard-saved" id="account-saved-msg" style="display: none;">${t('dashboard.actions.saved', 'Saved')}</span>
      </div>
    </div>
  `

  const saveBtn = main.querySelector('#account-save-btn')
  const savedMsg = main.querySelector('#account-saved-msg')
  const input = main.querySelector('#display_name')

  saveBtn.addEventListener('click', async () => {
    const name = sanitizeText(input.value, LIMITS.NAME_MAX)
    if (name && !isValidName(name)) {
      showInlineError(main, t('dashboard.account.nameValidation', `Display name must be 1-${LIMITS.NAME_MAX} characters and cannot contain < or >.`))
      return
    }
    saveBtn.disabled = true
    try {
      await updateProfile(userId, { display_name: name || null })
      savedMsg.style.display = 'inline'
      setTimeout(() => { savedMsg.style.display = 'none' }, 2000)
    } catch (err) {
      logError('Profile save failed:', err)
      showInlineError(main, t('dashboard.account.saveFailed', 'Failed to save. Please try again.'))
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

  mainEl.innerHTML = `<div class="dashboard-loading"><div class="dashboard-spinner"></div><p>${t('dashboard.account.loading', 'Loading account...')}</p></div>`

  try {
    const profile = await loadProfile(result.user.id)
    render(mainEl, profile, result.user.id)
  } catch (err) {
    logError('Account page load failed:', err)
    mainEl.innerHTML = `
      <div class="dashboard-empty">
        <p class="dashboard-empty-title">${t('dashboard.account.errorTitle', 'Could not load profile')}</p>
        <p>${t('dashboard.common.tryAgain', 'Please try again.')}</p>
      </div>
    `
  }
}

main()
