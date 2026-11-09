import OpenAI, { APIConnectionTimeoutError, APIError, APIUserAbortError } from 'openai'
import { HttpError } from './http.js'

/**
 * Klien AI. OpenRouter memakai format API yang sama dengan OpenAI,
 * jadi library "openai" bisa dipakai untuk keduanya; bedanya hanya baseURL.
 */
export function createAIClient(config) {
  if (config.provider === 'openrouter') {
    return new OpenAI({
      apiKey: config.aiApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      timeout: 240_000,
      maxRetries: 1,
      // Identitas aplikasi (opsional) yang tampil di dasbor OpenRouter.
      defaultHeaders: { 'HTTP-Referer': config.appUrl, 'X-Title': 'PragmaAI' },
    })
  }
  return new OpenAI({ apiKey: config.aiApiKey, timeout: 150_000, maxRetries: 1 })
}

/**
 * Meminta jawaban berformat JSON sesuai skema, lalu mengembalikannya sebagai objek.
 * validate(data) boleh mengembalikan pesan kesalahan untuk memicu satu kali percobaan ulang.
 */
export async function callStructured(client, config, request) {
  if (config.provider === 'openrouter') return callOpenRouter(client, config, request)
  return callOpenAI(client, config, request)
}

// ---------------------------------------------------------------------------
// OpenAI: Responses API + Structured Outputs (format dijamin oleh OpenAI)
// ---------------------------------------------------------------------------

function supportsOpenAIReasoning(model) {
  return /^(gpt-5|o\d)/i.test(model)
}

async function callOpenAI(client, config, { name, instructions, input, schema, maxOutputTokens, signal, validate }) {
  const effort = config.reasoningEffort
  const request = {
    model: config.aiModel,
    instructions,
    input,
    max_output_tokens: maxOutputTokens,
    store: false, // data penelitian pengguna tidak disimpan di OpenAI
    text: { format: { type: 'json_schema', name, schema, strict: true } },
  }
  if (effort && effort !== 'off' && effort !== 'none' && supportsOpenAIReasoning(config.aiModel)) {
    request.reasoning = { effort }
  }

  let response
  try {
    response = await client.responses.create(request, { signal })
  } catch (error) {
    throw toHttpError(error, config)
  }

  if (response.status === 'incomplete') {
    const reason = response.incomplete_details?.reason
    if (reason === 'max_output_tokens') throw tooLongError()
    if (reason === 'content_filter') throw new HttpError(422, 'Penyedia AI menolak memproses sebagian isi dialog karena kebijakan konten.')
    throw new HttpError(502, 'Jawaban AI tidak lengkap. Silakan coba lagi.')
  }

  const refusal = response.output?.flatMap((item) => item.content ?? []).find((part) => part.type === 'refusal')
  if (refusal) throw new HttpError(422, 'AI menolak menganalisis dialog ini. Periksa kembali isi dialog.')

  const data = extractJson(response.output_text)
  if (!data) throw new HttpError(502, 'Format jawaban AI tidak dapat dibaca. Silakan coba lagi.')
  const problem = validate?.(data)
  if (problem) throw new HttpError(502, `Jawaban AI tidak lengkap: ${problem}. Silakan coba lagi.`)
  return data
}

// ---------------------------------------------------------------------------
// OpenRouter: Chat Completions. Model gratis tidak selalu mematuhi skema JSON,
// jadi jawaban dibersihkan, diperiksa, dan diminta ulang satu kali bila rusak.
// ---------------------------------------------------------------------------

async function callOpenRouter(client, config, { name, instructions, input, schema, maxOutputTokens, signal, validate }) {
  const system = `${instructions}

FORMAT JAWABAN (WAJIB):
Jawab HANYA dengan satu objek JSON yang valid dan sesuai JSON Schema di bawah ini. Isi semua properti yang diminta.
Jangan menulis teks lain, penjelasan, atau blok kode markdown di luar objek JSON.
JSON Schema:
${JSON.stringify(schema)}`

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: input },
  ]
  const effort = config.reasoningEffort
  let sendReasoning = Boolean(effort) && effort !== 'off'

  for (let attempt = 1; attempt <= 2; attempt++) {
    const body = {
      model: config.aiModel,
      messages,
      max_tokens: maxOutputTokens,
      temperature: 0.2,
      response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } },
    }
    if (sendReasoning) body.reasoning = { effort, exclude: true }

    let completion
    try {
      completion = await client.chat.completions.create(body, { signal })
    } catch (error) {
      // Beberapa model menolak pengaturan penalaran tertentu; ulangi tanpa pengaturan itu.
      if (sendReasoning && error instanceof APIError && error.status === 400 && /reason/i.test(error.message)) {
        sendReasoning = false
        attempt -= 1
        continue
      }
      throw toHttpError(error, config)
    }

    // OpenRouter kadang mengirim error di dalam respons berstatus 200.
    if (completion?.error) throw toHttpError(bodyError(completion.error), config)

    const choice = completion?.choices?.[0]
    if (choice?.finish_reason === 'length') throw tooLongError()
    const content = typeof choice?.message?.content === 'string' ? choice.message.content : ''

    const data = extractJson(content)
    const problem = data ? validate?.(data) : 'jawaban bukan JSON yang valid'
    if (data && !problem) return data

    if (attempt === 1) {
      console.warn(`[ai] jawaban ${name} tidak valid (${problem}); meminta ulang`)
      messages.push(
        { role: 'assistant', content: content.slice(0, 6000) || '(kosong)' },
        {
          role: 'user',
          content: `Jawaban sebelumnya tidak dapat dipakai (${problem}). Ulangi jawaban HANYA berupa satu objek JSON valid sesuai skema, tanpa teks lain.`,
        },
      )
    }
  }

  throw new HttpError(
    502,
    `Model ${config.aiModel} tidak mengembalikan data dengan format yang benar. Coba lagi, atau ganti OPENROUTER_MODEL ke model lain.`,
  )
}

/** Mengubah objek error dari dalam respons OpenRouter menjadi error biasa. */
function bodyError(error) {
  const status = Number(error?.code) || 502
  const err = new Error(error?.message || 'Kesalahan dari penyedia model')
  err.status = status
  return err
}

/**
 * Mengambil objek JSON dari teks jawaban model: membuang blok <think>,
 * pagar kode ```json, dan teks di luar kurung kurawal, lalu mem-parse-nya.
 */
export function extractJson(text) {
  if (!text || typeof text !== 'string') return null
  let candidate = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(candidate)
  if (fenced) candidate = fenced[1].trim()

  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  candidate = candidate.slice(start, end + 1)

  for (const attempt of [candidate, candidate.replace(/,\s*([}\]])/g, '$1')]) {
    try {
      const parsed = JSON.parse(attempt)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    } catch {
      // coba versi berikutnya
    }
  }
  return null
}

function tooLongError() {
  return new HttpError(422, 'Dialog terlalu panjang untuk diproses sekaligus. Bagi dialog menjadi beberapa analisis yang lebih pendek.')
}

/** Menerjemahkan error penyedia AI menjadi pesan yang jelas bagi pengguna. */
export function toHttpError(error, config) {
  if (error instanceof HttpError) return error
  if (error instanceof APIUserAbortError || error?.name === 'AbortError') {
    return new HttpError(504, 'Analisis melebihi batas waktu server. Bagi dialog menjadi beberapa bagian, lalu coba lagi.')
  }
  if (error instanceof APIConnectionTimeoutError) {
    return new HttpError(504, `${config.providerLabel} terlalu lama merespons. Silakan coba lagi.`)
  }

  const status = error?.status
  if (typeof status !== 'number') {
    console.error('[ai] error tak terduga', error)
    return new HttpError(502, `Gagal terhubung ke ${config.providerLabel}. Silakan coba lagi.`)
  }

  console.error('[ai]', config.provider, status, error.message)
  const isOpenRouter = config.provider === 'openrouter'
  const keyName = isOpenRouter ? 'OPENROUTER_API_KEY' : 'OPENAI_API_KEY'
  const modelName = isOpenRouter ? 'OPENROUTER_MODEL' : 'OPENAI_MODEL'

  switch (status) {
    case 400:
      return new HttpError(502, `Permintaan ke ${config.providerLabel} ditolak: ${error.message}. Periksa ${modelName}.`)
    case 401:
      return new HttpError(502, `${keyName} tidak valid. Periksa kembali API key di environment variable.`)
    case 402:
      return new HttpError(
        503,
        isOpenRouter
          ? 'Saldo OpenRouter habis atau minus. Buka openrouter.ai, bagian Credits, lalu isi ulang.'
          : 'Saldo OpenAI habis. Periksa billing akun OpenAI.',
      )
    case 403:
      return new HttpError(502, `Akun ${config.providerLabel} tidak diizinkan memakai model "${config.aiModel}".`)
    case 404:
      return new HttpError(502, `Model "${config.aiModel}" tidak ditemukan atau sudah tidak tersedia. Periksa ${modelName}.`)
    case 408:
      return new HttpError(504, `${config.providerLabel} terlalu lama merespons. Silakan coba lagi.`)
    case 429:
      return new HttpError(
        503,
        isOpenRouter && config.isFreeModel
          ? 'Batas pemakaian model gratis OpenRouter tercapai (maksimal 20 permintaan per menit dan 50 per hari tanpa kredit), atau server model sedang penuh. Tunggu beberapa menit atau coba lagi besok.'
          : `Batas penggunaan atau saldo ${config.providerLabel} habis. Periksa akun Anda, lalu coba lagi.`,
      )
    default:
      return new HttpError(502, `Layanan ${config.providerLabel} sedang bermasalah (${status}). Silakan coba beberapa saat lagi.`)
  }
}
