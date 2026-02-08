import { supabase } from '../supabase.js'
import {
  captureDesktopSource,
  handlePostAuthRedirect,
  showError,
  hideError,
  showLoading,
  hideLoading,
  friendlyError,
} from '../auth-helpers.js'
import '../auth.css'

// Persist ?source=desktop before it's lost to OAuth redirects
captureDesktopSource()

// If already logged in, skip the form and handle redirect immediately
// (e.g. desktop app opened login page but user is already authenticated)
;(async () => {
  // Wait for Supabase client to finish loading session from localStorage
  let session = null
  try {
    const res = await supabase.auth.getSession()
    session = res.data?.session ?? null
  } catch (_) { /* ignore */ }

  // If getSession didn't find one, wait for the client's INITIAL_SESSION event
  if (!session) {
    session = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 2000)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, sess) => {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
            clearTimeout(timeout)
            subscription.unsubscribe()
            resolve(sess)
          }
        }
      )
    })
  }

  if (session) {
    // Refresh to get a non-expired access token before generating linking code
    const { data: refreshed } = await supabase.auth.refreshSession()
    if (refreshed?.session) {
      await handlePostAuthRedirect(supabase, document.querySelector('.auth-card'))
    }
  }
  // If no session or refresh failed — just show the login form
})()

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
