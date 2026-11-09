/**
 * Uji keamanan database (RLS, hak akses, trigger) memakai PGlite:
 * PostgreSQL asli yang berjalan di Node.js tanpa perlu instalasi.
 *
 * Lingkungan Supabase (skema auth, role anon/authenticated/service_role,
 * fungsi auth.uid()) ditiru secukupnya, lalu supabase/schema.sql dan
 * supabase/seed_knowledge_base.sql dijalankan apa adanya.
 *
 * Jalankan: npm test
 */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { before, describe, test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const schemaSql = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
const seedSql = await readFile(new URL('../supabase/seed_knowledge_base.sql', import.meta.url), 'utf8')

const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'

const supabaseMock = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`

let db

/** Menjalankan query sebagai role tertentu, lalu kembali ke postgres. */
async function as(role, userId, sql, params = []) {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? ''])
  await db.exec(`set role ${role}`)
  try {
    return await db.query(sql, params)
  } finally {
    await db.exec('reset role')
  }
}

async function expectError(promise, pattern) {
  await assert.rejects(promise, (error) => {
    assert.match(String(error.message), pattern)
    return true
  })
}

before(async () => {
  db = new PGlite()
  await db.exec(supabaseMock)
  // Dijalankan dua kali untuk membuktikan skrip aman diulang.
  await db.exec(schemaSql)
  await db.exec(schemaSql)
  await db.exec(seedSql)
  await db.exec(seedSql)

  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'a@contoh.id', '{"full_name":"Ayu","role":"admin"}'),
       ($2, 'b@contoh.id', '{"full_name":"Bima","institution":"UPI"}')`,
    [USER_A, USER_B],
  )

  // Backend (service_role) menyimpan satu analisis untuk A dan satu untuk B.
  for (const [userId, title] of [[USER_A, 'Analisis milik A'], [USER_B, 'Analisis milik B']]) {
    const { rows } = await as(
      'service_role',
      null,
      `insert into public.analyses (user_id, title, dialogue_text, total_utterances)
       values ($1, $2, 'Rina: Tolong tutup pintunya. Dimas: Baik.', 2) returning id`,
      [userId, title],
    )
    await as(
      'service_role',
      null,
      `insert into public.utterances (analysis_id, utterance_number, speaker, utterance_text, category, speech_act_type)
       values ($1, 1, 'Rina', 'Tolong tutup pintunya.', 'directive', 'direct'),
              ($1, 2, 'Dimas', 'Baik.', 'commissive', 'direct')`,
      [rows[0].id],
    )
  }
})

describe('profil & role', () => {
  test('profil dibuat otomatis dan role dari data pendaftaran diabaikan', async () => {
    const { rows } = await db.query('select id, role, full_name, institution from public.profiles order by email')
    assert.equal(rows.length, 2)
    assert.deepEqual(rows.map((r) => r.role), ['user', 'user'])
    assert.equal(rows[1].institution, 'UPI')
  })

  test('pengguna biasa tidak dapat mengubah role-nya sendiri', async () => {
    await expectError(
      as('authenticated', USER_B, `update public.profiles set role = 'admin' where id = $1`, [USER_B]),
      /Hanya admin/,
    )
  })

  test('pengguna dapat mengubah nama, tetapi tidak dapat mengubah email', async () => {
    await as('authenticated', USER_B, `update public.profiles set full_name = 'Bima S.' where id = $1`, [USER_B])
    await expectError(
      as('authenticated', USER_B, `update public.profiles set email = 'x@x.id' where id = $1`, [USER_B]),
      /permission denied/,
    )
  })

  test('pengguna hanya melihat profilnya sendiri', async () => {
    const { rows } = await as('authenticated', USER_B, 'select id from public.profiles')
    assert.deepEqual(rows.map((r) => r.id), [USER_B])
  })

  test('admin pertama diatur dari SQL Editor; admin dapat mengubah role orang lain, bukan dirinya', async () => {
    await db.query(`update public.profiles set role = 'admin' where email = 'a@contoh.id'`)
    await as('authenticated', USER_A, `update public.profiles set role = 'admin' where id = $1`, [USER_B])
    await as('authenticated', USER_A, `update public.profiles set role = 'user' where id = $1`, [USER_B])
    await expectError(
      as('authenticated', USER_A, `update public.profiles set role = 'user' where id = $1`, [USER_A]),
      /dirinya sendiri/,
    )
    const { rows } = await as('authenticated', USER_A, 'select id from public.profiles')
    assert.equal(rows.length, 2)
  })

  test('pengunjung tanpa login (anon) tidak dapat membaca tabel', async () => {
    await expectError(as('anon', null, 'select * from public.profiles'), /permission denied/)
    await expectError(as('anon', null, 'select * from public.knowledge_base'), /permission denied/)
  })
})

describe('analisis & tuturan', () => {
  test('pengguna hanya melihat analisis dan tuturan miliknya', async () => {
    const analyses = await as('authenticated', USER_B, 'select title from public.analyses')
    assert.deepEqual(analyses.rows.map((r) => r.title), ['Analisis milik B'])
    const utterances = await as('authenticated', USER_B, 'select count(*)::int as n from public.utterances')
    assert.equal(utterances.rows[0].n, 2)
  })

  test('admin pun tidak dapat membaca isi analisis pengguna lain', async () => {
    const { rows } = await as('authenticated', USER_A, 'select title from public.analyses')
    assert.deepEqual(rows.map((r) => r.title), ['Analisis milik A'])
  })

  test('pengguna tidak dapat membuat atau mengubah hasil analisis secara langsung', async () => {
    await expectError(
      as('authenticated', USER_B, `insert into public.analyses (user_id, title, dialogue_text) values ($1, 'Palsu', 'xxxxxxxxxxxx')`, [USER_B]),
      /permission denied/,
    )
    await expectError(as('authenticated', USER_B, `update public.analyses set title = 'Ubah'`), /permission denied/)
    await expectError(as('authenticated', USER_B, `update public.utterances set category = 'assertive'`), /permission denied/)
  })

  test('statistik pengguna hanya menghitung data miliknya', async () => {
    const { rows } = await as('authenticated', USER_B, 'select public.get_my_stats() as s')
    const stats = rows[0].s
    assert.equal(stats.total_analyses, 1)
    assert.equal(stats.total_utterances, 2)
    assert.deepEqual(stats.category_counts, { directive: 1, commissive: 1 })
    assert.equal(stats.monthly.length, 1)
  })

  test('menghapus analisis milik orang lain tidak berdampak', async () => {
    const result = await as('authenticated', USER_B, `delete from public.analyses where user_id = $1`, [USER_A])
    assert.equal(result.affectedRows, 0)
  })
})

describe('admin', () => {
  test('ringkasan admin dan daftar pengguna hanya untuk admin', async () => {
    await expectError(as('authenticated', USER_B, 'select public.admin_overview()'), /khusus admin/)
    await expectError(as('authenticated', USER_B, 'select * from public.admin_list_users()'), /khusus admin/)

    const overview = await as('authenticated', USER_A, 'select public.admin_overview() as o')
    assert.equal(overview.rows[0].o.total_analyses, 2)
    assert.equal(overview.rows[0].o.total_admins, 1)

    const users = await as('authenticated', USER_A, 'select email, analyses_count::int as n from public.admin_list_users() order by email')
    assert.deepEqual(users.rows, [{ email: 'a@contoh.id', n: 1 }, { email: 'b@contoh.id', n: 1 }])
  })
})

describe('knowledge base', () => {
  test('materi awal tersedia dan dapat dibaca pengguna login', async () => {
    const { rows } = await as('authenticated', USER_B, 'select slug from public.knowledge_base order by sort_order')
    assert.equal(rows.length, 8)
    assert.equal(rows[0].slug, 'pengertian-pragmatik')
  })

  test('pengguna biasa tidak dapat mengelola materi; admin dapat', async () => {
    await expectError(
      as('authenticated', USER_B, `insert into public.knowledge_base (slug, title) values ('uji', 'Materi uji')`),
      /row-level security/,
    )
    const inserted = await as(
      'authenticated',
      USER_A,
      `insert into public.knowledge_base (slug, title, is_published) values ('draf-admin', 'Draf admin', false) returning created_by`,
    )
    assert.equal(inserted.rows[0].created_by, USER_A)

    const hidden = await as('authenticated', USER_B, `select 1 from public.knowledge_base where slug = 'draf-admin'`)
    assert.equal(hidden.rows.length, 0)

    const updated = await as('authenticated', USER_B, `update public.knowledge_base set title = 'Diubah' where slug = 'pengertian-pragmatik'`)
    assert.equal(updated.affectedRows, 0)
  })
})

describe('umpan balik', () => {
  test('alur umpan balik: kirim, salinan otomatis, tinjauan admin', async () => {
    const own = await as('authenticated', USER_B, `select a.id as analysis_id, u.id as utterance_id
      from public.analyses a join public.utterances u on u.analysis_id = a.id where u.utterance_number = 1`)
    const { analysis_id, utterance_id } = own.rows[0]

    const inserted = await as(
      'authenticated',
      USER_B,
      `insert into public.analysis_feedback (analysis_id, utterance_id, user_id, suggested_category, comment, status, utterance_snapshot)
       values ($1, $2, $3, 'expressive', 'Menurut saya ini ekspresif', 'selesai', 'teks palsu')
       returning id, status, utterance_snapshot, ai_category_snapshot`,
      [analysis_id, utterance_id, USER_B],
    )
    const feedback = inserted.rows[0]
    assert.equal(feedback.status, 'baru')
    assert.equal(feedback.utterance_snapshot, 'Tolong tutup pintunya.')
    assert.equal(feedback.ai_category_snapshot, 'directive')

    // RLS menyaring baris: pengguna biasa tidak menemukan baris yang boleh diubah.
    const attempt = await as('authenticated', USER_B, `update public.analysis_feedback set status = 'selesai' where id = $1`, [feedback.id])
    assert.equal(attempt.affectedRows, 0)
    const notUpdated = await db.query('select status from public.analysis_feedback where id = $1', [feedback.id])
    assert.equal(notUpdated.rows[0].status, 'baru')

    await as('authenticated', USER_A, `update public.analysis_feedback set status = 'ditinjau', admin_note = 'Benar' where id = $1`, [feedback.id])
    const reviewed = await db.query('select status, reviewed_by from public.analysis_feedback where id = $1', [feedback.id])
    assert.equal(reviewed.rows[0].status, 'ditinjau')
    assert.equal(reviewed.rows[0].reviewed_by, USER_A)

    await expectError(
      as('authenticated', USER_A, `update public.analysis_feedback set comment = 'diubah admin' where id = $1`, [feedback.id]),
      /permission denied/,
    )
  })

  test('tidak dapat mengirim umpan balik untuk analisis milik orang lain', async () => {
    const other = await db.query(`select id from public.analyses where user_id = $1`, [USER_A])
    await expectError(
      as('authenticated', USER_B, `insert into public.analysis_feedback (analysis_id, user_id, rating) values ($1, $2, 5)`, [other.rows[0].id, USER_B]),
      /row-level security/,
    )
  })

  test('menghapus analisis sendiri ikut menghapus tuturan dan umpan baliknya', async () => {
    const result = await as('authenticated', USER_B, 'delete from public.analyses')
    assert.equal(result.affectedRows, 1)
    const left = await db.query(`select
      (select count(*)::int from public.utterances u join public.analyses a on a.id = u.analysis_id where a.user_id = $1) as utterances,
      (select count(*)::int from public.analysis_feedback where user_id = $1) as feedback`, [USER_B])
    assert.deepEqual(left.rows[0], { utterances: 0, feedback: 0 })
  })
})
