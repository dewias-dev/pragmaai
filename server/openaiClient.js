import OpenAI, { APIConnectionTimeoutError, APIError, APIUserAbortError } from 'openai'
import { HttpError } from './http.js'

export function createOpenAIClient(config) {
  return new OpenAI({
    apiKey: config.openaiApiKey,
    timeout: 150_000,
    maxRetries: 1,
  })
}

/** Model keluarga reasoning (gpt-5.x, o-series) menerima parameter reasoning.effort. */
function supportsReasoning(model) {
  return /^(gpt-5|o\d)/i.test(model)
}

/**
 * Memanggil OpenAI Responses API dan memaksa jawaban mengikuti skema JSON.
 * Mengembalikan objek JavaScript yang sudah di-parse.
 */
export async function callStructured(openai, config, { name, instructions, input, schema, maxOutputTokens, signal }) {
  const effort = config.reasoningEffort
  const request = {
    model: config.openaiModel,
    instructions,
    input,
    max_output_tokens: maxOutputTokens,
    store: false, // data penelitian pengguna tidak disimpan di OpenAI
    text: {
      format: { type: 'json_schema', name, schema, strict: true },
    },
  }
  if (effort && effort !== 'off' && supportsReasoning(config.openaiModel)) {
    request.reasoning = { effort }
  }

  let response
  try {
    response = await openai.responses.create(request, { signal })
  } catch (error) {
    throw toHttpError(error, config)
  }

  if (response.status === 'incomplete') {
    const reason = response.incomplete_details?.reason
    if (reason === 'max_output_tokens') {
      throw new HttpError(422, 'Dialog terlalu panjang untuk diproses sekaligus. Bagi dialog menjadi beberapa analisis yang lebih pendek.')
    }
    if (reason === 'content_filter') {
      throw new HttpError(422, 'OpenAI menolak memproses sebagian isi dialog karena kebijakan konten.')
    }
    throw new HttpError(502, 'Jawaban AI tidak lengkap. Silakan coba lagi.')
  }

  const refusal = response.output
    ?.flatMap((item) => item.content ?? [])
    .find((part) => part.type === 'refusal')
  if (refusal) {
    throw new HttpError(422, 'AI menolak menganalisis dialog ini. Periksa kembali isi dialog.')
  }

  const text = response.output_text
  if (!text) throw new HttpError(502, 'AI tidak mengembalikan hasil. Silakan coba lagi.')

  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(502, 'Format jawaban AI tidak dapat dibaca. Silakan coba lagi.')
  }
}

/** Menerjemahkan error OpenAI menjadi pesan yang jelas bagi pengguna. */
export function toHttpError(error, config) {
  if (error instanceof HttpError) return error
  if (error instanceof APIUserAbortError || error?.name === 'AbortError') {
    return new HttpError(504, 'Analisis melebihi batas waktu server. Bagi dialog menjadi beberapa bagian, lalu coba lagi.')
  }
  if (error instanceof APIConnectionTimeoutError) {
    return new HttpError(504, 'OpenAI terlalu lama merespons. Silakan coba lagi.')
  }
  if (error instanceof APIError) {
    console.error('[openai]', error.status, error.code, error.message)
    switch (error.status) {
      case 400:
        return new HttpError(502, `Permintaan ke OpenAI ditolak: ${error.message}. Periksa OPENAI_MODEL dan OPENAI_REASONING_EFFORT.`)
      case 401:
        return new HttpError(502, 'OPENAI_API_KEY tidak valid. Periksa kembali API key di environment variable.')
      case 403:
        return new HttpError(502, `Akun OpenAI tidak memiliki akses ke model "${config.openaiModel}".`)
      case 404:
        return new HttpError(502, `Model OpenAI "${config.openaiModel}" tidak ditemukan. Periksa OPENAI_MODEL.`)
      case 429:
        return new HttpError(503, 'Batas penggunaan atau saldo OpenAI habis. Periksa billing akun OpenAI, lalu coba lagi.')
      default:
        if (error.status >= 500) return new HttpError(502, 'Layanan OpenAI sedang bermasalah. Silakan coba beberapa saat lagi.')
    }
  }
  console.error('[openai] error tak terduga', error)
  return new HttpError(502, 'Gagal terhubung ke OpenAI. Silakan coba lagi.')
}
