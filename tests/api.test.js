/**
 * Uji endpoint /api/analyze dan /api/health tanpa internet:
 * Supabase dan OpenAI diganti dengan versi palsu.
 *
 * Jalankan: npm test
 */
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createAnalyzeHandler } from '../api/analyze.js'
import healthHandler from '../api/health.js'

function fakeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.body = data
      return this
    },
  }
}

const goodConfig = {
  supabaseUrl: 'https://contoh.supabase.co',
  supabaseServiceKey: 'secret',
  provider: 'openrouter',
  providerLabel: 'OpenRouter',
  aiApiKey: 'sk-or-test',
  aiModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  isFreeModel: true,
  reasoningEffort: 'low',
  dailyLimit: 2,
  timeoutMs: 280000,
}

/** Supabase palsu: token "token-sah" milik user-1; kuota dihitung dari recentCount. */
function fakeSupabase({ recentCount = 0, role = 'user' } = {}) {
  return {
    auth: {
      async getUser(token) {
        if (token === 'token-sah') return { data: { user: { id: 'user-1' } }, error: null }
        return { data: { user: null }, error: { message: 'invalid' } }
      },
    },
    from(table) {
      const query = {
        select: () => query,
        eq: () => query,
        gte: async () => ({ count: recentCount, error: null }),
        maybeSingle: async () => ({ data: table === 'profiles' ? { id: 'user-1', role, full_name: 'Uji' } : null, error: null }),
      }
      return query
    },
  }
}

const validBody = { title: 'Analisis uji', dataSource: '', context: '', speakers: [], dialogue: 'Ani: Tolong tutup pintunya.\nBudi: Baik.' }

function makeHandler(overrides = {}) {
  const calls = { analyze: 0, save: 0 }
  const handler = createAnalyzeHandler({
    getConfig: () => goodConfig,
    createSupabase: () => fakeSupabase(overrides.supabase),
    createOpenAI: () => ({}),
    analyze: async () => {
      calls.analyze += 1
      if (overrides.analyzeError) throw overrides.analyzeError
      return { stats: { total: 2 } }
    },
    save: async (_supabase, { userId }) => {
      calls.save += 1
      assert.equal(userId, 'user-1')
      return 'analysis-123'
    },
    ...overrides.deps,
  })
  return { handler, calls }
}

describe('POST /api/analyze', () => {
  test('menolak metode selain POST', async () => {
    const { handler } = makeHandler()
    const res = fakeResponse()
    await handler({ method: 'GET', headers: {} }, res)
    assert.equal(res.statusCode, 405)
    assert.equal(res.headers.allow, 'POST')
  })

  test('memberi tahu environment variable yang belum diisi (tanpa membocorkan nilai)', async () => {
    const { handler } = makeHandler({ deps: { getConfig: () => ({ ...goodConfig, aiApiKey: '' }) } })
    const res = fakeResponse()
    await handler({ method: 'POST', headers: {}, body: validBody }, res)
    assert.equal(res.statusCode, 500)
    assert.match(res.body.error, /OPENROUTER_API_KEY/)
  })

  test('menolak permintaan tanpa login atau dengan token palsu', async () => {
    const { handler, calls } = makeHandler()
    for (const headers of [{}, { authorization: 'Bearer token-palsu' }]) {
      const res = fakeResponse()
      await handler({ method: 'POST', headers, body: validBody }, res)
      assert.equal(res.statusCode, 401)
    }
    assert.equal(calls.analyze, 0)
  })

  test('menolak input tidak valid dengan pesan per kolom', async () => {
    const { handler, calls } = makeHandler()
    const res = fakeResponse()
    await handler({ method: 'POST', headers: { authorization: 'Bearer token-sah' }, body: { ...validBody, title: 'x' } }, res)
    assert.equal(res.statusCode, 400)
    assert.ok(res.body.details.title)
    assert.equal(calls.analyze, 0)
  })

  test('menerapkan batas analisis harian, kecuali untuk admin', async () => {
    const limited = makeHandler({ supabase: { recentCount: 2 } })
    const res = fakeResponse()
    await limited.handler({ method: 'POST', headers: { authorization: 'Bearer token-sah' }, body: validBody }, res)
    assert.equal(res.statusCode, 429)
    assert.equal(limited.calls.analyze, 0)

    const admin = makeHandler({ supabase: { recentCount: 99, role: 'admin' } })
    const adminRes = fakeResponse()
    await admin.handler({ method: 'POST', headers: { authorization: 'Bearer token-sah' }, body: validBody }, adminRes)
    assert.equal(adminRes.statusCode, 201)
  })

  test('menjalankan analisis, menyimpan dengan user dari token, dan mengembalikan id', async () => {
    const { handler, calls } = makeHandler()
    const res = fakeResponse()
    await handler({ method: 'POST', headers: { authorization: 'Bearer token-sah' }, body: { ...validBody, userId: 'penyusup' } }, res)
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.id, 'analysis-123')
    assert.deepEqual(calls, { analyze: 1, save: 1 })
  })

  test('error tak terduga tidak membocorkan detail internal', async () => {
    const { handler } = makeHandler({ analyzeError: new Error('rahasia internal: stack trace') })
    const res = fakeResponse()
    const originalError = console.error
    console.error = () => {}
    try {
      await handler({ method: 'POST', headers: { authorization: 'Bearer token-sah' }, body: validBody }, res)
    } finally {
      console.error = originalError
    }
    assert.equal(res.statusCode, 500)
    assert.doesNotMatch(res.body.error, /rahasia/)
  })
})

describe('GET /api/health', () => {
  test('melaporkan status konfigurasi tanpa menampilkan nilai rahasia', async () => {
    const previous = { ...process.env }
    process.env.OPENAI_API_KEY = 'sk-sangat-rahasia'
    process.env.SUPABASE_URL = 'https://contoh.supabase.co'
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_SECRET_KEY
    delete process.env.OPENROUTER_API_KEY
    delete process.env.AI_PROVIDER
    try {
      const res = fakeResponse()
      healthHandler({ method: 'GET' }, res)
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.ok, false)
      assert.equal(res.body.checks.OPENAI_API_KEY, true)
      assert.equal(res.body.checks.SUPABASE_SERVICE_ROLE_KEY, false)
      assert.doesNotMatch(JSON.stringify(res.body), /sangat-rahasia/)
    } finally {
      process.env = previous
    }
  })

  test('memakai OpenRouter dan model gratis Nemotron bila OPENROUTER_API_KEY diisi', async () => {
    const previous = { ...process.env }
    for (const key of ['AI_PROVIDER', 'OPENROUTER_MODEL', 'OPENAI_API_KEY', 'ANALYSIS_MAX_UTTERANCES']) delete process.env[key]
    process.env.OPENROUTER_API_KEY = 'sk-or-rahasia'
    process.env.SUPABASE_URL = 'https://contoh.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_rahasia'
    try {
      const res = fakeResponse()
      healthHandler({ method: 'GET' }, res)
      assert.equal(res.body.ok, true)
      assert.equal(res.body.provider, 'openrouter')
      assert.equal(res.body.model, 'nvidia/nemotron-3-ultra-550b-a55b:free')
      assert.equal(res.body.isFreeModel, true)
      assert.equal(res.body.maxUtterances, 40)
      assert.equal(res.body.checks.OPENROUTER_API_KEY, true)
      assert.doesNotMatch(JSON.stringify(res.body), /rahasia/)
    } finally {
      process.env = previous
    }
  })
})
