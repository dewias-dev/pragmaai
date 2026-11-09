import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * Plugin kecil agar folder `api/` (Vercel Functions) bisa dijalankan
 * langsung oleh `npm run dev` di komputer Anda, tanpa perlu Vercel CLI.
 *
 * Saat di-deploy ke Vercel, plugin ini TIDAK dipakai: Vercel sendiri yang
 * menjalankan file di folder `api/`.
 */
function localApiPlugin() {
  return {
    name: 'pragmaai-local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()

        const url = new URL(req.url, 'http://localhost')
        const name = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '')

        // Hanya nama file sederhana (misal "analyze") yang ada di folder api/ yang diizinkan.
        if (!/^[a-z0-9-]+$/i.test(name) || !existsSync(resolve(server.config.root, 'api', `${name}.js`))) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ error: 'Endpoint tidak ditemukan.' }))
        }

        let mod
        try {
          mod = await server.ssrLoadModule(`/api/${name}.js`)
        } catch (error) {
          server.config.logger.error(`[api/${name}] ${error?.stack || error}`)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ error: 'Gagal memuat endpoint. Lihat pesan error di terminal.' }))
        }

        // Baca body request (maksimal 1 MB) seperti yang dilakukan Vercel.
        const chunks = []
        let size = 0
        for await (const chunk of req) {
          size += chunk.length
          if (size > 1_000_000) {
            res.statusCode = 413
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ error: 'Data yang dikirim terlalu besar.' }))
          }
          chunks.push(chunk)
        }
        const raw = Buffer.concat(chunks).toString('utf8')
        let body = raw || undefined
        if (raw && String(req.headers['content-type'] || '').includes('application/json')) {
          try {
            body = JSON.parse(raw)
          } catch {
            body = undefined
          }
        }

        // Tambahkan helper yang sama dengan Vercel: req.body, req.query, res.status(), res.json().
        req.body = body
        req.query = Object.fromEntries(url.searchParams)
        res.status = (code) => {
          res.statusCode = code
          return res
        }
        res.json = (data) => {
          if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(data))
          return res
        }
        res.send = (data) => {
          res.end(typeof data === 'string' ? data : JSON.stringify(data))
          return res
        }

        try {
          await mod.default(req, res)
        } catch (error) {
          server.config.logger.error(`[api/${name}] ${error?.stack || error}`)
          if (!res.headersSent) res.status(500).json({ error: 'Terjadi kesalahan pada server lokal.' })
        }
      })
    },
  }
}

export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    // Muat variabel rahasia (tanpa awalan VITE_) dari .env.local hanya untuk
    // kode backend di folder api/. Variabel ini TIDAK dikirim ke browser.
    const env = loadEnv(mode, process.cwd(), '')
    for (const [key, value] of Object.entries(env)) {
      if (process.env[key] === undefined) process.env[key] = value
    }
  }

  return {
    plugins: [react(), localApiPlugin()],
    build: {
      chunkSizeWarningLimit: 900,
    },
  }
})
