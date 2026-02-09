/**
 * Supabase client for the frontend.
 * Security: The anon key is loaded from env and is safe to expose in the client bundle.
 * Supabase design treats the anon key as public; protection comes from RLS policies,
 * auth checks, and server-side Edge Functions that use the service role key in env only.
 */
import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variable. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
