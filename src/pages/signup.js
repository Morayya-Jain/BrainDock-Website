import { supabase } from '../supabase.js'
import {
  captureDesktopSource,
  captureRedirect,
  hasStoredSession,
  REDIRECT_STORAGE_KEY,
  handlePostAuthRedirect,
  showError,
  hideError,
  showSuccess,
  showLoading,
  hideLoading,
  friendlyError,
} from '../auth-helpers.js'
import { isValidName, isValidEmail, isValidPassword, LIMITS } from '../validators.js'
import '../auth.css'

// Persist ?source=desktop and ?redirect= FIRST (synchronous, before any async work)
captureDesktopSource()
captureRedirect()

const RELOAD_BAIL_KEY = 'braindock_signup_reload_bail'

// If we bailed out of reload loop (corrupt token), clear the flag and show form
const wasBailed = !!sessionStorage.getItem(RELOAD_BAIL_KEY)
if (wasBailed) {
  sessionStorage.removeItem(RELOAD_BAIL_KEY)
}

// DOM elements used by both the auto-login check and form handlers
const form = document.getElementById('signup-form')
const signupBtn = document.getElementById('signup-btn')
const googleBtn = document.getElementById('google-btn')
const card = document.querySelector('.auth-card')

// If already logged in (and not recovering from a bail), hide the form and show loading
const reloadCountKey = 'braindock_signup_reload_count'
let spinnerWrap = null
if (hasStoredSession() && !wasBailed) {
  // Hide form elements (don't destroy them - keeps DOM intact for event listeners)
  if (form) form.style.display = 'none'
  const divider = card?.querySelector('.auth-divider')
  if (divider) divider.style.display = 'none'
  if (googleBtn) googleBtn.style.display = 'none'
  const footer = card?.querySelector('.auth-footer')
  if (footer) footer.style.display = 'none'

  // Show spinner
  if (card) {
    spinnerWrap = document.createElement('div')
    spinnerWrap.className = 'auth-loading'
    spinnerWrap.innerHTML = '<div class="auth-spinner"></div><p class="auth-loading-text">Signing you in...</p>'
    card.appendChild(spinnerWrap)
  }

  ;(async () => {
    let session = null
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const res = await supabase.auth.getSession()
        session = res.data?.session ?? null
      } catch (_) { /* ignore */ }
      if (session) break
      await new Promise((r) => setTimeout(r, 100))
    }
    if (session) {
      await handlePostAuthRedirect(supabase, card)
    } else {
      // Stale/corrupt token in localStorage - sign out to clear it and show the form
      try { await supabase.auth.signOut() } catch (_) { /* ignore */ }
      sessionStorage.removeItem(reloadCountKey)
      // Restore the signup form
      if (spinnerWrap) { spinnerWrap.remove(); spinnerWrap = null }
      if (form) form.style.display = ''
      if (divider) divider.style.display = ''
      if (googleBtn) googleBtn.style.display = ''
      if (footer) footer.style.display = ''
    }
  })()
}

// Email + password signup
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  hideError(card)

  const name = document.getElementById('name').value.trim()
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  if (!name || !email || !password) {
    showError(card, 'Please fill in all fields.')
    return
  }
  if (!isValidName(name)) {
    showError(card, `Name must be 1-${LIMITS.NAME_MAX} characters and cannot contain < or >.`)
    return
  }
  if (!isValidEmail(email)) {
    showError(card, 'Please enter a valid email address.')
    return
  }
  if (!isValidPassword(password)) {
    showError(card, `Password must be ${LIMITS.PASSWORD_MIN}-${LIMITS.PASSWORD_MAX} characters.`)
    return
  }

  const termsCheckbox = document.getElementById('terms')
  if (!termsCheckbox?.checked) {
    showError(card, 'Please agree to the Terms of Service to continue.')
    return
  }

  showLoading(signupBtn)

  try {
    const redirectParam = new URLSearchParams(window.location.search).get('redirect') ||
      sessionStorage.getItem(REDIRECT_STORAGE_KEY) ||
      ''
    // Preserve desktop source in the email redirect URL so it survives
    // opening in a new tab (sessionStorage is per-tab and would be lost)
    const isDesktop = sessionStorage.getItem('braindock_desktop') === 'true'
    const callbackParams = new URLSearchParams()
    if (redirectParam) callbackParams.set('redirect', redirectParam)
    if (isDesktop) callbackParams.set('source', 'desktop')
    const qs = callbackParams.toString()
    const callbackUrl = `${window.location.origin}/auth/callback/${qs ? '?' + qs : ''}`

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: callbackUrl,
      },
    })

    if (error) {
      showError(card, friendlyError(error))
      return
    }

    // Supabase returns a user with an empty identities array when the email
    // is already registered (instead of an error, for security reasons).
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      showError(card, 'An account with this email already exists. Try logging in instead.')
      return
    }

    // If Supabase returned a session, the user is auto-confirmed (go to dashboard).
    // If no session, email confirmation is required (show message).
    if (data.session) {
      await handlePostAuthRedirect(supabase, card)
      return
    } else {
      form.hidden = true
      const authDivider = document.querySelector('.auth-divider')
      if (authDivider) authDivider.hidden = true
      googleBtn.hidden = true
      showSuccess(card, 'Check your email for a confirmation link. Once confirmed, you can log in.')
    }
  } catch (err) {
    showError(card, 'Network error. Please check your connection and try again.')
  } finally {
    hideLoading(signupBtn)
  }
})

// Google OAuth signup
googleBtn.addEventListener('click', async () => {
  hideError(card)

  const termsCheckbox = document.getElementById('terms')
  if (!termsCheckbox?.checked) {
    showError(card, 'Please agree to the Terms of Service to continue.')
    return
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback/`,
      },
    })

    if (error) {
      showError(card, friendlyError(error))
    }
  } catch (err) {
    showError(card, 'Network error. Please check your connection and try again.')
  }
})
