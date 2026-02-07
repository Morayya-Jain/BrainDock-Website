import { supabase } from '../supabase.js'
import { showError } from '../auth-helpers.js'
import '../auth.css'

const card = document.querySelector('.auth-card')
const loadingState = document.getElementById('loading-state')
const fallbackLink = document.getElementById('fallback-link')

/**
 * Handle the OAuth callback.
 * Supabase JS automatically picks up the tokens from the URL hash
 * when the client is initialized. We listen for the auth state change
 * and redirect to the dashboard once a session is established.
 */
const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    subscription.unsubscribe()
    window.location.href = '/dashboard/'
  }
})

// Fallback: if no auth event fires within 8 seconds, show an error
setTimeout(() => {
  // Only show error if we haven't already redirected
  if (document.visibilityState !== 'hidden') {
    loadingState.hidden = true
    showError(card, 'Sign in could not be completed. The link may have expired.')
    fallbackLink.hidden = false
  }
}, 8000)
