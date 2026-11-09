/**
 * POST /api/analyze
 *
 * Vercel Serverless Function yang menjalankan analisis tindak tutur Searle.
 * API key AI (OpenRouter/OpenAI) dan Supabase service role key HANYA dipakai di sini (server).
 *
 * Alur:
 *  1. Cek konfigurasi environment variable.
 *  2. Verifikasi token login pengguna (Supabase Auth).
 *  3. Validasi input form.
 *  4. Cek batas jumlah analisis harian.
 *  5. Jalankan analisis AI (segmentasi → klasifikasi → statistik → kesimpulan).
 *  6. Simpan ke database, lalu kembalikan id analisis.
 */
import { findMissingConfig, getServerConfig } from '../server/config.js'
import { HttpError, getBearerToken, sendError, sendJson } from '../server/http.js'
import { createAIClient } from '../server/aiClient.js'
import { runSpeechActAnalysis } from '../server/pipeline.js'
import { saveAnalysis } from '../server/saveAnalysis.js'
import { authenticateUser, createSupabaseAdmin, enforceDailyLimit } from '../server/supabaseAdmin.js'
import { validateAnalysisInput } from '../server/validation.js'

/** Membuat handler. Dependensi bisa diganti saat pengujian (lihat tests/api.test.js). */
export function createAnalyzeHandler(deps = {}) {
  const {
    getConfig = getServerConfig,
    createSupabase = createSupabaseAdmin,
    createAI = createAIClient,
    analyze = runSpeechActAnalysis,
    save = saveAnalysis,
  } = deps

  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return sendJson(res, 405, { error: 'Gunakan metode POST.' })
    }

    const startedAt = Date.now()
    try {
      const config = getConfig()
      const missing = findMissingConfig(config)
      if (missing.length > 0) {
        console.error('[analyze] environment variable belum diisi:', missing.join(', '))
        throw new HttpError(500, `Server belum dikonfigurasi. Isi environment variable: ${missing.join(', ')}.`)
      }

      const supabaseAdmin = createSupabase(config)
      const { profile } = await authenticateUser(supabaseAdmin, getBearerToken(req))

      const validation = validateAnalysisInput(req.body)
      if (!validation.ok) {
        throw new HttpError(400, 'Data form belum valid.', validation.errors)
      }
      const input = validation.value

      await enforceDailyLimit(supabaseAdmin, profile, config.dailyLimit)

      // Batas waktu total agar tidak melewati batas durasi Vercel (300 detik).
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), config.timeoutMs)
      let result
      try {
        result = await analyze(createAI(config), config, input, {
          signal: controller.signal,
          log: (message) => console.log(`[analyze] ${message} (${Math.round((Date.now() - startedAt) / 1000)} dtk)`),
        })
      } finally {
        clearTimeout(timer)
      }

      const id = await save(supabaseAdmin, { userId: profile.id, input, result, model: config.aiModel })

      return sendJson(res, 201, {
        id,
        totalUtterances: result.stats.total,
        durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      })
    } catch (error) {
      return sendError(res, error, 'analyze')
    }
  }
}

export default createAnalyzeHandler()
