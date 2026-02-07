import { supabase } from '../supabase.js'
import {
  captureDesktopSource,
  getRedirectPath,
  handlePostAuthRedirect,
  showError,
  hideError,
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

const form = document.getElementById('login-form')
const loginBtn = document.getElementById('login-btn')
const googleBtn = document.getElementById('google-btn')
const card = document.querySelector('.auth-card')

// Email + password login
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  hideError(card)

  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  if (!email || !password) {
    showError(card, 'Please enter your email and password.')
    return
  }

  showLoading(loginBtn)

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    hideLoading(loginBtn)
    showError(card, friendlyError(error))
    return
  }

  await handlePostAuthRedirect(supabase, card)
})

// Google OAuth login
googleBtn.addEventListener('click', async () => {
  hideError(card)

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
