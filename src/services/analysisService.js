import { supabase } from '../lib/supabase.js'

/**
 * Mengirim dialog ke backend (/api/analyze) untuk dianalisis AI.
 * Token login ikut dikirim agar backend tahu siapa penggunanya.
 */
export async function createAnalysis(payload) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sesi login berakhir. Silakan login ulang.')

  let response
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Tidak dapat terhubung ke server analisis. Periksa koneksi internet Anda.')
  }

  let body = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    const error = new Error(body?.error || messageForStatus(response.status))
    error.status = response.status
    error.details = body?.details
    throw error
  }
  return body
}

function messageForStatus(status) {
  if (status === 404) return 'Endpoint /api/analyze tidak ditemukan. Jalankan aplikasi dengan "npm run dev" atau deploy ke Vercel.'
  if (status === 413) return 'Teks dialog terlalu besar untuk dikirim.'
  if (status === 504) return 'Waktu analisis habis (batas server 5 menit). Bagi dialog menjadi beberapa bagian, lalu coba lagi.'
  return `Server mengembalikan kesalahan (${status}). Silakan coba lagi.`
}

/** Informasi backend: model AI yang dipakai dan batas tuturan. null bila backend tidak dapat dihubungi. */
export async function getBackendInfo() {
  try {
    const response = await fetch('/api/health')
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

/** Daftar analisis milik pengguna dengan pencarian judul, urutan, dan halaman. */
export async function listAnalyses({ search = '', sort = 'newest', page = 1, pageSize = 10 } = {}) {
  const from = (page - 1) * pageSize
  let query = supabase
    .from('analyses')
    .select('id, title, data_source, total_utterances, dominant_categories, context_sufficiency, created_at', { count: 'exact' })

  const term = search.trim().replace(/[%_\\]/g, (c) => `\\${c}`)
  if (term) query = query.ilike('title', `%${term}%`)

  if (sort === 'title') query = query.order('title', { ascending: true })
  else query = query.order('created_at', { ascending: sort === 'oldest' })

  const { data, error, count } = await query.range(from, from + pageSize - 1)
  if (error) throw error
  return { items: data ?? [], total: count ?? 0 }
}

export async function listRecentAnalyses(limit = 5) {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, title, data_source, total_utterances, dominant_categories, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

/** Satu analisis lengkap beserta seluruh tuturannya. */
export async function getAnalysis(id) {
  const [{ data: analysis, error }, { data: utterances, error: utterancesError }] = await Promise.all([
    supabase.from('analyses').select('*').eq('id', id).maybeSingle(),
    supabase.from('utterances').select('*').eq('analysis_id', id).order('utterance_number', { ascending: true }),
  ])
  if (error) throw error
  if (utterancesError) throw utterancesError
  if (!analysis) return null
  return { analysis, utterances: utterances ?? [] }
}

export async function deleteAnalysis(id) {
  const { error, count } = await supabase.from('analyses').delete({ count: 'exact' }).eq('id', id)
  if (error) throw error
  if (count === 0) throw new Error('Analisis tidak ditemukan atau sudah dihapus.')
}

/** Statistik dashboard (dihitung oleh fungsi database get_my_stats). */
export async function getMyStats() {
  const { data, error } = await supabase.rpc('get_my_stats')
  if (error) throw error
  return data
}
