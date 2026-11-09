/**
 * Uji logika inti: statistik, validasi input, pengecekan kutipan, skema AI,
 * dan alur analisis lengkap memakai "OpenAI palsu" (tanpa biaya, tanpa internet).
 *
 * Jalankan: npm test
 */
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { computeDistribution, percentOf } from '../shared/stats.js'
import { extractJson } from '../server/aiClient.js'
import { runSpeechActAnalysis } from '../server/pipeline.js'
import { SEGMENTATION_SCHEMA, SUMMARY_SCHEMA, UTTERANCE_ANALYSIS_SCHEMA } from '../server/schemas.js'
import { validateAnalysisInput } from '../server/validation.js'
import { isVerbatimQuote } from '../server/verbatim.js'

describe('statistik distribusi', () => {
  test('persentase dibulatkan biasa ke satu desimal dan aman untuk total nol', () => {
    assert.equal(percentOf(9, 27), 33.3)
    assert.equal(percentOf(2, 3), 66.7)
    assert.equal(percentOf(1, 8), 12.5)
    assert.equal(percentOf(0, 0), 0)
  })

  test('menghitung jumlah, kategori dominan, dan jenis tindak tutur dari data', () => {
    const stats = computeDistribution([
      { category: 'directive', speech_act_type: 'indirect' },
      { category: 'directive', speech_act_type: 'direct' },
      { category: 'expressive', speech_act_type: 'direct' },
      { category: 'undetermined', speech_act_type: 'undetermined' },
    ])
    assert.equal(stats.total, 4)
    assert.equal(stats.counts.directive, 2)
    assert.deepEqual(stats.dominant, ['directive'])
    assert.deepEqual(stats.speechActTypes, { direct: 2, indirect: 1, undetermined: 1 })
    assert.equal(stats.rows.find((r) => r.key === 'directive').percentage, 50)
  })

  test('kategori dominan bisa lebih dari satu dan kosong bila tidak ada data', () => {
    assert.deepEqual(
      computeDistribution([{ category: 'assertive' }, { category: 'commissive' }]).dominant,
      ['assertive', 'commissive'],
    )
    assert.deepEqual(computeDistribution([]).dominant, [])
  })
})

describe('validasi input backend', () => {
  const valid = { title: 'Analisis film', dataSource: 'Film X', context: '', speakers: ['Ani', 'Budi'], dialogue: 'Ani: Halo, Budi.\nBudi: Hai.' }

  test('menerima data yang benar dan merapikan spasi', () => {
    const result = validateAnalysisInput({ ...valid, title: '  Analisis   film  ', speakers: ['Ani', ' Ani ', 'Budi', ''] })
    assert.equal(result.ok, true)
    assert.equal(result.value.title, 'Analisis film')
    assert.deepEqual(result.value.speakers, ['Ani', 'Budi'])
  })

  test('menolak judul pendek, dialog kosong, dan dialog terlalu panjang', () => {
    assert.ok(validateAnalysisInput({ ...valid, title: 'ab' }).errors.title)
    assert.ok(validateAnalysisInput({ ...valid, dialogue: '   ' }).errors.dialogue)
    assert.ok(validateAnalysisInput({ ...valid, dialogue: 'x'.repeat(20001) }).errors.dialogue)
    assert.ok(validateAnalysisInput({ ...valid, speakers: 'Ani' }).errors.speakers)
    assert.equal(validateAnalysisInput(null).ok, false)
    assert.equal(validateAnalysisInput([1, 2]).ok, false)
  })

  test('menghapus karakter kontrol berbahaya', () => {
    const result = validateAnalysisInput({ ...valid, dialogue: 'Ani:\u0000 Halo\r\nBudi: Hai juga' })
    assert.equal(result.value.dialogue, 'Ani: Halo\nBudi: Hai juga')
  })
})

describe('pengecekan kutipan', () => {
  test('mengenali kutipan persis meski spasi dan tanda kutip berbeda', () => {
    const source = 'Rina: “Bisa kamu   kerjakan malam ini?”\nDimas: Oke.'
    assert.equal(isVerbatimQuote('"Bisa kamu kerjakan malam ini?"', source), true)
    assert.equal(isVerbatimQuote('Bisakah kamu mengerjakannya malam ini?', source), false)
    assert.equal(isVerbatimQuote('', source), false)
  })
})

describe('skema Structured Outputs', () => {
  // OpenAI strict mode: setiap object wajib additionalProperties:false dan semua properti required.
  function assertStrict(schema, path = 'root') {
    if (schema.type === 'object') {
      assert.equal(schema.additionalProperties, false, `${path} harus additionalProperties:false`)
      assert.deepEqual([...schema.required].sort(), Object.keys(schema.properties).sort(), `${path} harus require semua properti`)
      for (const [key, value] of Object.entries(schema.properties)) assertStrict(value, `${path}.${key}`)
    }
    if (schema.type === 'array') assertStrict(schema.items, `${path}[]`)
  }

  test('ketiga skema memenuhi syarat strict mode', () => {
    assertStrict(SEGMENTATION_SCHEMA)
    assertStrict(UTTERANCE_ANALYSIS_SCHEMA)
    assertStrict(SUMMARY_SCHEMA)
  })
})

describe('alur analisis dengan OpenAI palsu', () => {
  const dialogue = 'Rina: Makalah kita belum ada daftar pustakanya.\nDimas: Maaf, aku lupa.\nRina: Bisa kamu kerjakan malam ini?'
  const input = { title: 'Uji', dataSource: '', context: 'Kerja kelompok', speakers: ['Rina', 'Dimas'], dialogue }

  function analysisFor(number, category, type = 'direct') {
    const felicity = { status: 'terpenuhi', explanation: 'Ada dasar dalam data.' }
    return {
      number,
      category,
      specific_act: 'contoh',
      confidence: 'tinggi',
      classification_note: '',
      alternative_category: 'tidak_ada',
      illocutionary_point: 'contoh',
      propositional_content: 'contoh',
      fp_formula: '!↑W (Dimas mengerjakan)',
      ifids: ['bisa'],
      linguistic_evidence: ['bisa'],
      direction_of_fit: 'world_to_word',
      psychological_state: 'keinginan',
      felicity: { propositional_content: felicity, preparatory: felicity, sincerity: felicity, essential: felicity },
      speech_act_type: type,
      literal_force: '',
      academic_explanation: 'akademik',
      simple_explanation: 'sederhana',
    }
  }

  function fakeOpenAI({ skipNumberOnce } = {}) {
    const calls = []
    let skipped = false
    return {
      calls,
      responses: {
        async create(request) {
          calls.push(request)
          const name = request.text.format.name
          let payload
          if (name === 'segmentasi_tuturan') {
            payload = {
              context_sufficiency: 'memadai',
              context_note: 'Konteks jelas.',
              participants: ['Rina', 'Dimas'],
              utterances: [
                { speaker: 'Rina', addressee: 'Dimas', text: 'Makalah kita belum ada daftar pustakanya.' },
                { speaker: 'Dimas', addressee: 'Rina', text: 'Maaf, aku lupa.' },
                { speaker: 'Rina', addressee: 'Dimas', text: 'Bisakah kamu mengerjakannya?' },
              ],
            }
          } else if (name === 'analisis_tindak_tutur') {
            const wanted = JSON.parse(request.input).tuturan_yang_dianalisis.map((u) => u.number)
            const map = { 1: analysisFor(1, 'assertive'), 2: analysisFor(2, 'expressive'), 3: analysisFor(3, 'directive', 'indirect') }
            payload = {
              analyses: wanted
                .filter((n) => {
                  if (n === skipNumberOnce && !skipped) {
                    skipped = true
                    return false
                  }
                  return true
                })
                .map((n) => map[n]),
            }
          } else {
            payload = { academic_conclusion: 'A', simple_conclusion: 'S', dominant_findings: ['F1'], limitations: 'L' }
          }
          return { status: 'completed', output: [], output_text: JSON.stringify(payload) }
        },
      },
    }
  }

  const config = { provider: 'openai', providerLabel: 'OpenAI', aiModel: 'gpt-5.4-mini', reasoningEffort: 'low' }

  test('menghasilkan tuturan, statistik, dan kesimpulan', async () => {
    const openai = fakeOpenAI()
    const result = await runSpeechActAnalysis(openai, config, input)
    assert.equal(result.utterances.length, 3)
    assert.deepEqual(result.utterances.map((u) => u.category), ['assertive', 'expressive', 'directive'])
    assert.equal(result.stats.total, 3)
    assert.equal(result.stats.speechActTypes.indirect, 1)
    assert.equal(result.summary.academic_conclusion, 'A')
    // Tuturan 3 sengaja diubah AI palsu → harus ditandai bukan kutipan persis.
    assert.deepEqual(result.utterances.map((u) => u.quote_verified), [true, true, false])
    // Setiap panggilan memakai strict JSON schema, tidak disimpan di OpenAI, dan memakai reasoning.
    for (const call of openai.calls) {
      assert.equal(call.text.format.strict, true)
      assert.equal(call.store, false)
      assert.deepEqual(call.reasoning, { effort: 'low' })
    }
  })

  test('mengulang tuturan yang terlewat oleh AI', async () => {
    const openai = fakeOpenAI({ skipNumberOnce: 2 })
    const result = await runSpeechActAnalysis(openai, config, input)
    assert.equal(result.utterances[1].category, 'expressive')
    assert.equal(openai.calls.filter((c) => c.text.format.name === 'analisis_tindak_tutur').length, 2)
  })

  test('tidak mengirim parameter reasoning untuk model non-reasoning', async () => {
    const openai = fakeOpenAI()
    await runSpeechActAnalysis(openai, { ...config, aiModel: 'gpt-4.1-mini' }, input)
    assert.equal(openai.calls[0].reasoning, undefined)
  })

  test('jawaban tidak lengkap karena batas token menghasilkan pesan yang jelas', async () => {
    const openai = { responses: { create: async () => ({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }) } }
    await assert.rejects(runSpeechActAnalysis(openai, config, input), /terlalu panjang/)
  })
})

describe('OpenRouter (model gratis tanpa jaminan format JSON)', () => {
  const dialogue = 'Rina: Bisa kamu kerjakan malam ini?\nDimas: Oke, nanti malam aku selesaikan.'
  const input = { title: 'Uji OpenRouter', dataSource: '', context: '', speakers: [], dialogue }
  const config = {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    aiModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    isFreeModel: true,
    reasoningEffort: 'none',
    batchSize: 5,
    concurrency: 4,
    maxUtterances: 40,
  }

  const felicity = { status: 'tidak_dapat_dinilai', explanation: 'Informasi tidak cukup: tidak ada data.' }
  const analysis = (number, category) => ({
    number: String(number), // model gratis kadang mengirim angka sebagai teks
    category,
    specific_act: 'contoh',
    confidence: 'sedang',
    felicity: { propositional_content: felicity, preparatory: felicity, sincerity: felicity, essential: felicity },
    speech_act_type: 'direct',
  })

  /** Chat Completions palsu: jawaban pertama setiap jenis bisa dibuat rusak. */
  function fakeOpenRouter({ brokenFirst = [], rejectReasoningOnce = false } = {}) {
    const calls = []
    const broken = new Set(brokenFirst)
    let reasoningRejected = false
    return {
      calls,
      chat: {
        completions: {
          async create(body) {
            calls.push(structuredClone(body))
            if (rejectReasoningOnce && body.reasoning && !reasoningRejected) {
              reasoningRejected = true
              const { BadRequestError } = await import('openai')
              throw new BadRequestError(400, { message: 'Reasoning is mandatory for this endpoint' }, 'Reasoning is mandatory', new Headers())
            }
            const name = body.response_format.json_schema.name
            if (broken.has(name)) {
              broken.delete(name)
              return { choices: [{ finish_reason: 'stop', message: { content: 'Maaf, berikut analisisnya: (bukan JSON)' } }] }
            }
            let payload
            if (name === 'segmentasi_tuturan') {
              payload = {
                context_sufficiency: 'terbatas',
                context_note: 'Konteks minim.',
                participants: ['Rina', 'Dimas'],
                utterances: [
                  { speaker: 'Rina', addressee: 'Dimas', text: 'Bisa kamu kerjakan malam ini?' },
                  { speaker: 'Dimas', addressee: 'Rina', text: 'Oke, nanti malam aku selesaikan.' },
                ],
              }
            } else if (name === 'analisis_tindak_tutur') {
              payload = { analyses: [analysis(1, 'directive'), analysis(2, 'commissive')] }
            } else {
              payload = { academic_conclusion: 'A', simple_conclusion: 'S', dominant_findings: ['F'], limitations: 'L' }
            }
            // Jawaban dibungkus <think> dan pagar kode, seperti yang sering dilakukan model gratis.
            const content = '<think>menimbang kategori</think>\n```json\n' + JSON.stringify(payload, null, 2) + '\n```'
            return { choices: [{ finish_reason: 'stop', message: { content } }] }
          },
        },
      },
    }
  }

  test('mengambil JSON dari jawaban yang berisi <think>, pagar kode, atau koma berlebih', () => {
    assert.deepEqual(extractJson('<think>x</think>```json\n{"a":1}\n```'), { a: 1 })
    assert.deepEqual(extractJson('Berikut hasilnya: {"a":[1,2,],} terima kasih'), { a: [1, 2] })
    assert.equal(extractJson('tidak ada json'), null)
    assert.equal(extractJson('[1,2]'), null)
  })

  test('menjalankan analisis lengkap lewat Chat Completions dengan penalaran dimatikan', async () => {
    const ai = fakeOpenRouter()
    const result = await runSpeechActAnalysis(ai, config, input)
    assert.deepEqual(result.utterances.map((u) => u.category), ['directive', 'commissive'])
    assert.equal(result.utterances[0].confidence, 'sedang')
    assert.equal(result.utterances[0].ifids.length, 0)
    assert.equal(result.summary.academic_conclusion, 'A')
    for (const call of ai.calls) {
      assert.equal(call.model, 'nvidia/nemotron-3-ultra-550b-a55b:free')
      assert.equal(call.response_format.type, 'json_schema')
      assert.deepEqual(call.reasoning, { effort: 'none', exclude: true })
      assert.match(call.messages[0].content, /JSON Schema/)
      assert.equal(call.store, undefined)
    }
  })

  test('meminta ulang sekali bila jawaban bukan JSON', async () => {
    const ai = fakeOpenRouter({ brokenFirst: ['segmentasi_tuturan', 'analisis_tindak_tutur'] })
    const result = await runSpeechActAnalysis(ai, config, input)
    assert.equal(result.utterances.length, 2)
    const retry = ai.calls.find((c) => c.messages.length === 4)
    assert.ok(retry, 'percobaan ulang menyertakan jawaban sebelumnya dan permintaan perbaikan')
    assert.match(retry.messages[3].content, /JSON valid/)
  })

  test('mengulang tanpa pengaturan penalaran bila model menolaknya', async () => {
    const ai = fakeOpenRouter({ rejectReasoningOnce: true })
    const result = await runSpeechActAnalysis(ai, config, input)
    assert.equal(result.utterances.length, 2)
    assert.ok(ai.calls.some((c) => c.reasoning === undefined))
  })

  test('menolak dialog yang melebihi batas tuturan model gratis', async () => {
    const ai = fakeOpenRouter()
    await assert.rejects(runSpeechActAnalysis(ai, { ...config, maxUtterances: 1 }, input), /melebihi batas 1/)
  })

  test('pesan jelas untuk batas pemakaian dan error di dalam respons 200', async () => {
    const { RateLimitError } = await import('openai')
    const limited = {
      chat: { completions: { create: async () => { throw new RateLimitError(429, { message: 'Rate limit exceeded' }, 'Rate limit', new Headers()) } } },
    }
    const originalError = console.error
    console.error = () => {}
    try {
      await assert.rejects(runSpeechActAnalysis(limited, config, input), /50 per hari/)
      const bodyError = { chat: { completions: { create: async () => ({ error: { code: 402, message: 'Insufficient credits' } }) } } }
      await assert.rejects(runSpeechActAnalysis(bodyError, config, input), /Saldo OpenRouter/)
    } finally {
      console.error = originalError
    }
  })
})
