import { supabase } from '../lib/supabase.js'

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, institution, role, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Pengguna hanya dapat mengubah nama dan institusi (role & email dijaga database). */
export async function updateOwnProfile(userId, { fullName, institution }) {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim(), institution: institution.trim() })
    .eq('id', userId)
  if (error) throw error
}

export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
