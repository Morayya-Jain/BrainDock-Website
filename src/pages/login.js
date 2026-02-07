import { supabase } from '../supabase.js'
import {
  getRedirectPath,
  showError,
  hideError,
  showLoading,
  hideLoading,
  friendlyError,
} from '../auth-helpers.js'
import '../auth.css'

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

  window.location.href = getRedirectPath()
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
