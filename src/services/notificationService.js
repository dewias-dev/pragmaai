import { supabase } from '../lib/supabase.js'

/**
 * Menyusun notifikasi dari data nyata di database:
 *  - analisis yang baru selesai
 *  - umpan balik pengguna yang sudah ditinjau admin
 *  - (admin) jumlah umpan balik baru yang menunggu tinjauan
 */
export async function loadNotifications({ userId, isAdmin }) {
  const [analyses, reviewed, openFeedback] = await Promise.all([
    supabase.from('analyses').select('id, title, total_utterances, created_at').order('created_at', { ascending: false }).limit(3),
    supabase
      .from('analysis_feedback')
      .select('id, analysis_id, status, admin_note, reviewed_at')
      .eq('user_id', userId)
      .neq('status', 'baru')
      .not('reviewed_at', 'is', null)
      .order('reviewed_at', { ascending: false })
      .limit(3),
    isAdmin
      ? supabase.from('analysis_feedback').select('id', { count: 'exact', head: true }).eq('status', 'baru')
      : Promise.resolve({ count: 0 }),
  ])

  const items = []

  if (isAdmin && openFeedback.count > 0) {
    items.push({
      id: 'admin-feedback',
      tone: 'coral',
      icon: 'alert',
      title: `${openFeedback.count} umpan balik baru menunggu tinjauan`,
      detail: 'Buka halaman umpan balik',
      to: '/admin/umpan-balik',
      time: new Date().toISOString(),
      important: true,
    })
  }

  for (const fb of reviewed.data ?? []) {
    items.push({
      id: `fb-${fb.id}`,
      tone: 'green',
      icon: 'check',
      title: fb.status === 'selesai' ? 'Umpan balik Anda selesai ditinjau admin' : 'Umpan balik Anda sedang ditinjau admin',
      detail: fb.admin_note || 'Lihat di halaman hasil analisis',
      to: `/analisis/${fb.analysis_id}`,
      time: fb.reviewed_at,
    })
  }

  for (const analysis of analyses.data ?? []) {
    items.push({
      id: `an-${analysis.id}`,
      tone: 'amber',
      icon: 'file',
      title: `Analisis “${analysis.title}” selesai`,
      detail: `${analysis.total_utterances} tuturan dianalisis`,
      to: `/analisis/${analysis.id}`,
      time: analysis.created_at,
    })
  }

  return items.sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0) || new Date(b.time) - new Date(a.time)).slice(0, 5)
}
