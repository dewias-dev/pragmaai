-- =====================================================================
-- PragmaAI – Menjadikan sebuah akun sebagai ADMIN
--
-- 1. Daftar dulu melalui halaman Register di aplikasi.
-- 2. Ganti email di bawah dengan email akun tersebut.
-- 3. Jalankan di Supabase > SQL Editor.
--
-- Setelah ada admin pertama, admin lain dapat diatur dari menu
-- "Kelola pengguna" di aplikasi.
-- =====================================================================

update public.profiles
   set role = 'admin'
 where email = 'email-anda@contoh.com';

-- Cek hasilnya:
select id, email, full_name, role from public.profiles where role = 'admin';
