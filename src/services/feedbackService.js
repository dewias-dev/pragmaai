import { supabase } from '../lib/supabase.js'

export async function listFeedbackForAnalysis(analysisId) {
  const { data, error } = await supabase
    .from('analysis_feedback')
    .select('id, utterance_id, rating, is_accurate, suggested_category, comment, status, admin_note, created_at')
    .eq('analysis_id', analysisId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Umpan balik untuk analisis atau untuk satu tuturan. Salinan tuturan diisi oleh database. */
export async function submitFeedback({ analysisId, utteranceId = null, userId, rating = null, isAccurate = null, suggestedCategory = null, comment = '' }) {
  const { error } = await supabase.from('analysis_feedback').insert({
    analysis_id: analysisId,
    utterance_id: utteranceId,
    user_id: userId,
    rating,
    is_accurate: isAccurate,
    suggested_category: suggestedCategory || null,
    comment: comment.trim(),
  })
  if (error) throw error
}

export async function deleteFeedback(id) {
  const { error } = await supabase.from('analysis_feedback').delete().eq('id', id)
  if (error) throw error
}
