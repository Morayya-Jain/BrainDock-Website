import { supabase } from '../supabase.js'
import {
  captureDesktopSource,
  getRedirectPath,
  handlePostAuthRedirect,
  showError,
  hideError,
  showSuccess,
  showLoading,
  hideLoading,
  friendlyError,
} from '../auth-helpers.js'
import '../auth.css'

// If already logged in, skip straight to dashboard
;(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) window.location.href = getRedirectPath()
})()

// Persist ?source=desktop before it's lost to OAuth redirects
captureDesktopSource()

const form = document.getElementById('signup-form')
const signupBtn = document.getElementById('signup-btn')
const googleBtn = document.getElementById('google-btn')
const card = document.querySelector('.auth-card')

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

  if (password.length < 6) {
    showError(card, 'Password must be at least 6 characters.')
    return
  }

  const termsCheckbox = document.getElementById('terms')
  if (!termsCheckbox?.checked) {
    showError(card, 'Please agree to the Terms of Service to continue.')
    return
  }

  showLoading(signupBtn)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${window.location.origin}/auth/callback/`,
    },
  })

  hideLoading(signupBtn)

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
    document.querySelector('.auth-divider').hidden = true
    googleBtn.hidden = true
    showSuccess(card, 'Check your email for a confirmation link. Once confirmed, you can log in.')
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

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback/`,
    },
  })

  if (error) {
    showError(card, friendlyError(error))
  }
})
