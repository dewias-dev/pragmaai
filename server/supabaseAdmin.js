import { createClient } from '@supabase/supabase-js'
import { HttpError } from './http.js'

/**
 * Klien Supabase dengan service role / secret key.
 * Klien ini MELEWATI RLS, jadi hanya boleh dipakai di backend dan
 * selalu setelah identitas pengguna diverifikasi.
 */
export function createSupabaseAdmin(config) {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

/** Memverifikasi token login dan mengembalikan pengguna beserta profilnya. */
export async function authenticateUser(supabaseAdmin, token) {
  if (!token) throw new HttpError(401, 'Anda harus login untuk menjalankan analisis.')

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) {
    throw new HttpError(401, 'Sesi login tidak valid atau sudah berakhir. Silakan login ulang.')
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[auth] gagal membaca profil', profileError)
    throw new HttpError(500, 'Gagal membaca profil pengguna. Pastikan supabase/schema.sql sudah dijalankan.')
  }
  if (!profile) {
    throw new HttpError(403, 'Profil pengguna belum tersedia. Pastikan supabase/schema.sql sudah dijalankan.')
  }
  return { user: data.user, profile }
}

/** Membatasi jumlah analisis per 24 jam untuk mengendalikan biaya OpenAI. */
export async function enforceDailyLimit(supabaseAdmin, profile, limit) {
  if (profile.role === 'admin') return
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count, error } = await supabaseAdmin
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .gte('created_at', since)

  if (error) {
    console.error('[limit] gagal menghitung kuota', error)
    throw new HttpError(500, 'Gagal memeriksa kuota analisis.')
  }
  if ((count ?? 0) >= limit) {
    throw new HttpError(429, `Batas ${limit} analisis per 24 jam sudah tercapai. Silakan coba lagi nanti.`)
  }
}
