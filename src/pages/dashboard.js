import { supabase } from '../supabase.js'
import '../auth.css'

const userInfo = document.getElementById('user-info')
const signoutBtn = document.getElementById('signout-btn')

/**
 * Check for an active session. Redirect to login if not authenticated.
 */
async function init() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    window.location.href = '/auth/login/'
    return
  }

  // Show user info
  const user = session.user
  const name = user.user_metadata?.full_name || ''
  const email = user.email || ''
  userInfo.textContent = name ? `Signed in as ${name} (${email})` : `Signed in as ${email}`
}

// Sign out
signoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.href = '/'
})

init()
