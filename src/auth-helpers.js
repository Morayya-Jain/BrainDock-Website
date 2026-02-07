/**
 * Shared auth utilities used across all auth pages.
 * Handles redirects, error/loading UI, and desktop deep-link flow.
 */

const DESKTOP_SOURCE_KEY = 'braindock_desktop'

/**
 * Determine where to redirect after successful auth.
 * Always goes to dashboard (unless desktop flow overrides — see handlePostAuthRedirect).
 */
export function getRedirectPath() {
  return '/dashboard/'
}

/**
 * Capture ?source=desktop from the URL and persist in sessionStorage.
 * Call this at the top of every auth page (login, signup).
 * sessionStorage survives the OAuth redirect round-trip within the same tab.
 */
export function captureDesktopSource() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('source') === 'desktop') {
    sessionStorage.setItem(DESKTOP_SOURCE_KEY, 'true')
  }
}

/**
 * Redirect after successful auth.
 * If the user came from the desktop app (?source=desktop), generates
 * a one-time linking code via Edge Function and redirects to
 * braindock://callback?code=... so the desktop app can log in.
 * Otherwise redirects to the web dashboard.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function handlePostAuthRedirect(supabase) {
  const isDesktop = sessionStorage.getItem(DESKTOP_SOURCE_KEY) === 'true'
  if (!isDesktop) {
    window.location.href = getRedirectPath()
    return
  }

  // Clear the flag so refreshing the page goes to dashboard normally
  sessionStorage.removeItem(DESKTOP_SOURCE_KEY)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = getRedirectPath()
      return
    }

    const { data, error } = await supabase.functions.invoke('generate-linking-code', {
      body: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      },
    })

    if (error || !data?.code) {
      console.error('Failed to generate linking code:', error || data)
      window.location.href = getRedirectPath()
      return
    }

    // Redirect to the desktop app via deep link
    window.location.href = `braindock://callback?code=${encodeURIComponent(data.code)}`
  } catch (err) {
    console.error('Desktop linking error:', err)
    window.location.href = getRedirectPath()
  }
}

/**
 * Build an auth page URL. Utility for inter-page links.
 */
export function buildAuthUrl(path) {
  return path
}

/**
 * Display an error message inside the given container element.
 * Reuses the existing .auth-error element or creates one.
 */
export function showError(container, message) {
  let el = container.querySelector('.auth-error')
  if (!el) {
    el = document.createElement('div')
    el.className = 'auth-error'
    el.setAttribute('role', 'alert')
    container.prepend(el)
  }
  el.textContent = message
  el.hidden = false
}

/** Hide the error message inside the container. */
export function hideError(container) {
  const el = container.querySelector('.auth-error')
  if (el) el.hidden = true
}

/**
 * Display a success message inside the given container element.
 */
export function showSuccess(container, message) {
  let el = container.querySelector('.auth-success')
  if (!el) {
    el = document.createElement('div')
    el.className = 'auth-success'
    el.setAttribute('role', 'status')
    container.prepend(el)
  }
  el.textContent = message
  el.hidden = false
}

/**
 * Set a button to its loading state (disabled + spinner text).
 * Stores original label so it can be restored.
 */
export function showLoading(button) {
  button.dataset.originalLabel = button.textContent
  button.textContent = 'Loading...'
  button.disabled = true
  button.classList.add('btn-loading')
}

/** Restore a button from its loading state. */
export function hideLoading(button) {
  button.textContent = button.dataset.originalLabel || button.textContent
  button.disabled = false
  button.classList.remove('btn-loading')
}

/**
 * Map common Supabase auth error messages to user-friendly strings.
 */
export function friendlyError(error) {
  const msg = error?.message || 'Something went wrong. Please try again.'

  if (msg.includes('Invalid login credentials')) {
    return 'Incorrect email or password. Please try again.'
  }
  if (msg.includes('User already registered')) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (msg.includes('Password should be at least')) {
    return 'Password must be at least 6 characters.'
  }
  if (msg.includes('Email rate limit exceeded')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (msg.includes('For security purposes')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  return msg
}
