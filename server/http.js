/**
 * Kesalahan yang aman ditampilkan ke pengguna, lengkap dengan kode status HTTP.
 * Kesalahan lain (bug, error tak terduga) hanya dicatat di log server.
 */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }
}

export function sendJson(res, status, data) {
  res.status(status).json(data)
}

export function sendError(res, error, logLabel = 'api') {
  if (error instanceof HttpError) {
    const body = { error: error.message }
    if (error.details) body.details = error.details
    return sendJson(res, error.status, body)
  }
  console.error(`[${logLabel}]`, error)
  return sendJson(res, 500, { error: 'Terjadi kesalahan tak terduga di server. Silakan coba lagi.' })
}

/** Mengambil token dari header "Authorization: Bearer <token>". */
export function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(String(header).trim())
  return match ? match[1].trim() : ''
}
