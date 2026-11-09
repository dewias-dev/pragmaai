import { createClient } from '@supabase/supabase-js'

/**
 * Klien Supabase untuk browser.
 * Hanya memakai publishable/anon key yang memang aman dilihat publik;
 * keamanan data dijaga oleh Row Level Security (RLS) di database.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
