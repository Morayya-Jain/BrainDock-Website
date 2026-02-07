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

// Persist ?source=desktop FIRST (synchronous, before any async work)
captureDesktopSource()

/**
 * Check localStorage directly for a Supabase session token.
 * This is synchronous and works instantly, before the Supabase client
 * finishes its async initialization. Avoids all race conditions.
 */
function hasStoredSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed?.access_token) return true
        }
      }
    }
  } catch (_) { /* ignore parse errors */ }
  return false
}

// If already logged in, handle redirect (including desktop linking flow).
// We first check localStorage directly (synchronous, no race condition),
// then retry getSession() until the Supabase client finishes initializing.
if (hasStoredSession()) {
  ;(async () => {
    let session = null
    // Retry getSession() with small delays until the client catches up
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const res = await supabase.auth.getSession()
        session = res.data?.session ?? null
      } catch (_) { /* ignore */ }
      if (session) break
      await new Promise((r) => setTimeout(r, 300))
    }
    if (session) {
      await handlePostAuthRedirect(supabase)
    }
  })()
}

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
