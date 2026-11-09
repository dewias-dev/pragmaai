/**
 * Membaca konfigurasi backend dari environment variable.
 * Nilai rahasia hanya dibaca di sini (server), tidak pernah dikirim ke browser.
 *
 * Penyedia AI yang didukung:
 *  - openrouter : OpenRouter (bisa memakai model gratis, misalnya Nemotron 3 Ultra)
 *  - openai     : OpenAI langsung
 * Jika AI_PROVIDER kosong, OpenRouter dipakai bila OPENROUTER_API_KEY diisi.
 */
export const PROVIDERS = {
  openrouter: { label: 'OpenRouter', keyName: 'OPENROUTER_API_KEY', defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free' },
  openai: { label: 'OpenAI', keyName: 'OPENAI_API_KEY', defaultModel: 'gpt-5.4-mini' },
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getServerConfig() {
  const env = process.env
  const rawProvider = (env.AI_PROVIDER || '').trim().toLowerCase()
  const provider = rawProvider || ((env.OPENROUTER_API_KEY || '').trim() ? 'openrouter' : 'openai')
  const isOpenRouter = provider === 'openrouter'

  const aiModel = ((isOpenRouter ? env.OPENROUTER_MODEL : env.OPENAI_MODEL) || PROVIDERS[provider]?.defaultModel || '').trim()
  const isFreeModel = aiModel.endsWith(':free')
  const reasoningSetting = isOpenRouter ? env.OPENROUTER_REASONING_EFFORT : env.OPENAI_REASONING_EFFORT
  const timeoutMs = positiveInt(env.ANALYSIS_TIMEOUT_MS, 280000)

  return {
    provider,
    providerLabel: PROVIDERS[provider]?.label ?? provider,
    aiApiKey: ((isOpenRouter ? env.OPENROUTER_API_KEY : env.OPENAI_API_KEY) || '').trim(),
    aiModel,
    isFreeModel,
    // OpenRouter: penalaran dimatikan ("none") agar model gratis yang lambat tetap selesai tepat waktu.
    reasoningEffort: (reasoningSetting ?? (isOpenRouter ? 'none' : 'low')).trim().toLowerCase(),
    // Model gratis: kelompok sedikit lebih kecil dan dialog lebih pendek supaya muat dalam batas waktu & kuota.
    batchSize: positiveInt(env.AI_BATCH_SIZE, isOpenRouter ? 5 : 8),
    concurrency: positiveInt(env.AI_CONCURRENCY, isOpenRouter ? 4 : 6),
    maxUtterances: Math.min(positiveInt(env.ANALYSIS_MAX_UTTERANCES, isFreeModel ? 40 : 120), 150),
    appUrl: (env.APP_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:5173')).trim(),
    supabaseUrl: (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim(),
    supabaseServiceKey: (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || '').trim(),
    dailyLimit: positiveInt(env.ANALYSIS_DAILY_LIMIT, 20),
    timeoutMs: timeoutMs > 10000 ? timeoutMs : 280000,
  }
}

/** Mengembalikan daftar NAMA variabel yang belum diisi atau salah (bukan nilainya). */
export function findMissingConfig(config) {
  const missing = []
  if (!config.supabaseUrl) missing.push('SUPABASE_URL')
  if (!config.supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!PROVIDERS[config.provider]) missing.push('AI_PROVIDER (isi openrouter atau openai)')
  else if (!config.aiApiKey) missing.push(PROVIDERS[config.provider].keyName)
  return missing
}
