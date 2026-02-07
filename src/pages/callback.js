import { supabase } from '../supabase.js'
import { showError, handlePostAuthRedirect } from '../auth-helpers.js'
import '../auth.css'

const card = document.querySelector('.auth-card')
const loadingState = document.getElementById('loading-state')
const fallbackLink = document.getElementById('fallback-link')

/**
 * Check the URL for OAuth error parameters.
 * When a user cancels Google sign-in, Supabase redirects back
 * with an error in the URL hash (e.g. #error=access_denied).
 */
function checkForOAuthError() {
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)

  const error = params.get('error')
  const errorDescription = params.get('error_description')

  if (error) {
    return errorDescription
      ? errorDescription.replace(/\+/g, ' ')
      : 'Sign in was cancelled.'
  }

  // Also check query params (some providers use these instead)
  const query = new URLSearchParams(window.location.search)
  if (query.get('error')) {
    return query.get('error_description')?.replace(/\+/g, ' ') || 'Sign in was cancelled.'
  }

  return null
}

/** Show an error state with a back link. */
function showFailure(message) {
  loadingState.hidden = true
  showError(card, message)
  fallbackLink.hidden = false
}

// Check for errors immediately (user cancelled or something went wrong)
const oauthError = checkForOAuthError()
if (oauthError) {
  showFailure(oauthError)
} else {
  // Listen for successful sign-in
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
    if (event === 'SIGNED_IN') {
      subscription.unsubscribe()
      await handlePostAuthRedirect(supabase)
    }
  })

  // Fallback: if no auth event fires within 5 seconds, show an error
  setTimeout(() => {
    if (document.visibilityState !== 'hidden' && !loadingState.hidden) {
      showFailure('Sign in could not be completed. Please try again.')
    }
  }, 5000)
}
