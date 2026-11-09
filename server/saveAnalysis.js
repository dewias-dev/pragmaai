import { HttpError } from './http.js'

/**
 * Menyimpan hasil analisis ke Supabase (tabel analyses + utterances).
 * user_id SELALU diambil dari token yang sudah diverifikasi, bukan dari data browser.
 */
export async function saveAnalysis(supabaseAdmin, { userId, input, result, model }) {
  const countsByCategory = Object.fromEntries(result.stats.rows.map((row) => [row.key, row.count]))

  const { data: analysis, error } = await supabaseAdmin
    .from('analyses')
    .insert({
      user_id: userId,
      title: input.title,
      data_source: input.dataSource,
      conversation_context: input.context,
      speakers: input.speakers,
      dialogue_text: input.dialogue,
      context_sufficiency: result.contextSufficiency,
      context_note: result.contextNote,
      total_utterances: result.stats.total,
      category_counts: countsByCategory,
      dominant_categories: result.stats.dominant,
      academic_conclusion: result.summary.academic_conclusion,
      simple_conclusion: result.summary.simple_conclusion,
      dominant_findings: result.summary.dominant_findings,
      limitations: result.summary.limitations,
      ai_model: model,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[save] gagal menyimpan analisis', error)
    throw new HttpError(500, 'Analisis selesai, tetapi gagal disimpan ke database. Pastikan supabase/schema.sql sudah dijalankan.')
  }

  const rows = result.utterances.map((u) => ({
    analysis_id: analysis.id,
    utterance_number: u.number,
    speaker: u.speaker,
    addressee: u.addressee,
    utterance_text: u.text,
    quote_verified: u.quote_verified,
    category: u.category,
    specific_act: u.specific_act,
    confidence: u.confidence,
    classification_note: u.classification_note,
    alternative_category: u.alternative_category,
    illocutionary_point: u.illocutionary_point,
    propositional_content: u.propositional_content,
    fp_formula: u.fp_formula,
    ifids: u.ifids,
    linguistic_evidence: u.linguistic_evidence,
    direction_of_fit: u.direction_of_fit,
    psychological_state: u.psychological_state,
    felicity_conditions: u.felicity,
    speech_act_type: u.speech_act_type,
    literal_force: u.literal_force,
    academic_explanation: u.academic_explanation,
    simple_explanation: u.simple_explanation,
  }))

  const { error: utterancesError } = await supabaseAdmin.from('utterances').insert(rows)
  if (utterancesError) {
    console.error('[save] gagal menyimpan tuturan', utterancesError)
    // Hapus analisis yang setengah jadi agar data tetap konsisten.
    await supabaseAdmin.from('analyses').delete().eq('id', analysis.id)
    throw new HttpError(500, 'Analisis selesai, tetapi detail tuturan gagal disimpan. Silakan coba lagi.')
  }

  return analysis.id
}
