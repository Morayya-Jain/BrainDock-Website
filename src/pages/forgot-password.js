import { supabase } from '../supabase.js'
import {
  showError,
  hideError,
  showSuccess,
  showLoading,
  hideLoading,
  friendlyError,
} from '../auth-helpers.js'
import '../auth.css'

const form = document.getElementById('forgot-form')
const resetBtn = document.getElementById('reset-btn')
const card = document.querySelector('.auth-card')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  hideError(card)

  const email = document.getElementById('email').value.trim()

  if (!email) {
    showError(card, 'Please enter your email address.')
    return
  }

  showLoading(resetBtn)

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/login/`,
  })

  hideLoading(resetBtn)

  if (error) {
    showError(card, friendlyError(error))
    return
  }

  // Hide the form and show success message
  form.hidden = true
  showSuccess(card, 'Check your email for a password reset link. It may take a minute to arrive.')
})
