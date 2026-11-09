/**
 * GET /api/health
 *
 * Mengecek apakah backend berjalan dan environment variable sudah diisi,
 * serta memberi tahu form analisis model AI mana yang sedang dipakai.
 * Hanya menampilkan ADA/TIDAK ADA, tidak pernah menampilkan nilai rahasia.
 */
import { PROVIDERS, findMissingConfig, getServerConfig } from '../server/config.js'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Gunakan metode GET.' })
  }

  const config = getServerConfig()
  const missing = findMissingConfig(config)
  const keyName = PROVIDERS[config.provider]?.keyName ?? 'API key AI'

  return res.status(200).json({
    ok: missing.length === 0,
    message: missing.length === 0 ? 'Backend siap digunakan.' : `Environment variable belum diisi: ${missing.join(', ')}`,
    provider: config.provider,
    providerLabel: config.providerLabel,
    model: config.aiModel,
    isFreeModel: config.isFreeModel,
    maxUtterances: config.maxUtterances,
    checks: {
      SUPABASE_URL: Boolean(config.supabaseUrl),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(config.supabaseServiceKey),
      [keyName]: Boolean(config.aiApiKey),
    },
  })
}
