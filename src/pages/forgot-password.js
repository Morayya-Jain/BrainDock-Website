import { supabase } from '../supabase.js'
import {
  showError,
  hideError,
  showSuccess,
  showLoading,
  hideLoading,
  friendlyError,
} from '../auth-helpers.js'
import { isValidEmail } from '../validators.js'
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
  if (!isValidEmail(email)) {
    showError(card, 'Please enter a valid email address.')
    return
  }

  showLoading(resetBtn)

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password/`,
    })

    if (error) {
      showError(card, friendlyError(error))
      return
    }
  } catch (err) {
    showError(card, 'Network error. Please check your connection and try again.')
    return
  } finally {
    hideLoading(resetBtn)
  }

  // Hide the form and show success message
  form.hidden = true
  showSuccess(card, 'Check your email for a password reset link. It may take a minute to arrive.')
})
