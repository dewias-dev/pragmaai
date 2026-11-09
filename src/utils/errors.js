/**
 * Menerjemahkan pesan error Supabase (bahasa Inggris) menjadi pesan
 * bahasa Indonesia yang menjelaskan apa yang harus dilakukan.
 */
const TRANSLATIONS = [
  [/invalid login credentials/i, 'Email atau kata sandi salah.'],
  [/email not confirmed/i, 'Email belum dikonfirmasi. Buka tautan konfirmasi yang dikirim ke email Anda.'],
  [/user already registered/i, 'Email ini sudah terdaftar. Silakan login.'],
  [/password should be at least/i, 'Kata sandi terlalu pendek.'],
  [/(weak|pwned).*password|password.*(weak|known)/i, 'Kata sandi terlalu lemah atau pernah bocor. Gunakan kata sandi lain yang lebih kuat.'],
  [/unable to validate email|invalid email/i, 'Format email tidak valid.'],
  [/rate limit|too many requests|security purposes/i, 'Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.'],
  [/new password should be different/i, 'Kata sandi baru harus berbeda dari kata sandi lama.'],
  [/jwt expired|session.*(missing|expired)|refresh token/i, 'Sesi login berakhir. Silakan login ulang.'],
  [/failed to fetch|network/i, 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'],
  [/duplicate key.*slug/i, 'Slug sudah dipakai materi lain. Gunakan slug yang berbeda.'],
  [/permission denied|row-level security|42501/i, 'Anda tidak memiliki izin untuk melakukan tindakan ini.'],
]

export function toFriendlyMessage(error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  if (!error) return fallback
  const message = typeof error === 'string' ? error : error.message || ''
  for (const [pattern, friendly] of TRANSLATIONS) {
    if (pattern.test(message)) return friendly
  }
  // Pesan dari trigger database kita sudah berbahasa Indonesia.
  if (/admin|pengguna|tuturan|akses/i.test(message)) return message
  return fallback
}
