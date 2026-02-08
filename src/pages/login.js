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
const loginForm = document.getElementById('login-form')
const authCard = document.querySelector('.auth-card')

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
    // Show the same spinner used across the website (dashboard-boot style)
    loginForm.style.display = 'none'
    authCard.querySelector('.auth-title').textContent = 'Signing you in...'
    authCard.querySelector('.auth-subtitle').textContent = ''
    const spinnerWrap = document.createElement('div')
    spinnerWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:16px;padding:2rem 0;color:rgba(60,60,67,0.6);'
    spinnerWrap.innerHTML = `
      <div style="width:36px;height:36px;border:3px solid #E5E5EA;border-top-color:#D4A373;border-radius:50%;animation:dbspin 0.8s linear infinite;"></div>
      <style>@keyframes dbspin{to{transform:rotate(360deg)}}</style>
    `
    authCard.appendChild(spinnerWrap)

    // Refresh to get a non-expired access token before generating linking code
    const { data: refreshed } = await supabase.auth.refreshSession()
    if (refreshed?.session) {
      await handlePostAuthRedirect(supabase, authCard)
      return
    }
    // Refresh failed — show the login form
    loginForm.style.display = ''
    authCard.querySelector('.auth-title').textContent = 'Welcome back'
    authCard.querySelector('.auth-subtitle').textContent = 'Log in to your BrainDock account'
    spinnerWrap.remove()
  }
})()

const loginBtn = document.getElementById('login-btn')
const googleBtn = document.getElementById('google-btn')

// Email + password login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  hideError(authCard)

  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  if (!email || !password) {
    showError(authCard, 'Please enter your email and password.')
    return
  }

  showLoading(loginBtn)

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    hideLoading(loginBtn)
    showError(authCard, friendlyError(error))
    return
  }

  await handlePostAuthRedirect(supabase, authCard)
})

// Google OAuth login
googleBtn.addEventListener('click', async () => {
  hideError(authCard)

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback/`,
    },
  })

  if (error) {
    showError(authCard, friendlyError(error))
  }
})
