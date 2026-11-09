import { supabase } from '../lib/supabase.js'

/** Ringkasan global (angka agregat saja). Ditolak database bila bukan admin. */
export async function getAdminOverview() {
  const { data, error } = await supabase.rpc('admin_overview')
  if (error) throw error
  return data
}

export async function listUsers() {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw error
  return data ?? []
}

/** Trigger database menolak bila bukan admin atau admin mengubah role dirinya sendiri. */
export async function setUserRole(userId, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) throw error
}

export async function listAllFeedback({ status = 'semua' } = {}) {
  let query = supabase
    .from('analysis_feedback')
    .select('id, rating, is_accurate, suggested_category, comment, utterance_snapshot, ai_category_snapshot, status, admin_note, created_at, reviewed_at, user:profiles!analysis_feedback_user_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (status !== 'semua') query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function reviewFeedback(id, { status, adminNote }) {
  const { error } = await supabase.from('analysis_feedback').update({ status, admin_note: adminNote.trim() }).eq('id', id)
  if (error) throw error
}
