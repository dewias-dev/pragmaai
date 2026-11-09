-- =====================================================================
-- PragmaAI – Skema database Supabase (PostgreSQL)
--
-- Cara menjalankan:
--   Supabase Dashboard > SQL Editor > New query > tempel seluruh isi file
--   ini > klik Run. File ini aman dijalankan ulang (idempotent).
--
-- Isi file:
--   1. Tabel: profiles, analyses, utterances, knowledge_base, analysis_feedback
--   2. Fungsi bantu & trigger (profil otomatis, penjaga role, updated_at)
--   3. Fungsi statistik (dashboard pengguna & admin)
--   4. Hak akses (GRANT) per tabel dan per kolom
--   5. Row Level Security (RLS) dan kebijakannya
-- =====================================================================


-- =====================================================================
-- 1. TABEL
-- =====================================================================

-- Profil pengguna. Satu baris per akun Supabase Auth.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  institution text not null default '' check (char_length(institution) <= 160),
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Satu analisis = satu dialog/transkrip yang dianalisis.
create table if not exists public.analyses (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles (id) on delete cascade,
  title                text not null check (char_length(title) between 3 and 200),
  data_source          text not null default '' check (char_length(data_source) <= 300),
  conversation_context text not null default '' check (char_length(conversation_context) <= 4000),
  speakers             text[] not null default '{}',
  dialogue_text        text not null check (char_length(dialogue_text) between 10 and 20000),
  context_sufficiency  text check (context_sufficiency in ('memadai', 'terbatas', 'tidak_memadai')),
  context_note         text not null default '',
  total_utterances     integer not null default 0 check (total_utterances >= 0),
  category_counts      jsonb not null default '{}'::jsonb,
  dominant_categories  text[] not null default '{}',
  academic_conclusion  text not null default '',
  simple_conclusion    text not null default '',
  dominant_findings    jsonb not null default '[]'::jsonb,
  limitations          text not null default '',
  ai_model             text not null default '',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists analyses_user_created_idx on public.analyses (user_id, created_at desc);

-- Setiap unit tuturan beserta hasil analisis Searle-nya.
create table if not exists public.utterances (
  id                    uuid primary key default gen_random_uuid(),
  analysis_id           uuid not null references public.analyses (id) on delete cascade,
  utterance_number      integer not null check (utterance_number > 0),
  speaker               text not null default '',
  addressee             text not null default '',
  utterance_text        text not null,
  quote_verified        boolean not null default true,
  category              text not null check (category in ('assertive', 'directive', 'commissive', 'expressive', 'declaration', 'undetermined')),
  specific_act          text not null default '',
  confidence            text not null default 'sedang' check (confidence in ('tinggi', 'sedang', 'rendah')),
  classification_note   text not null default '',
  alternative_category  text not null default 'tidak_ada'
                        check (alternative_category in ('assertive', 'directive', 'commissive', 'expressive', 'declaration', 'tidak_ada')),
  illocutionary_point   text not null default '',
  propositional_content text not null default '',
  fp_formula            text not null default '',
  ifids                 jsonb not null default '[]'::jsonb,
  linguistic_evidence   jsonb not null default '[]'::jsonb,
  direction_of_fit      text not null default 'undetermined'
                        check (direction_of_fit in ('word_to_world', 'world_to_word', 'double', 'null_fit', 'undetermined')),
  psychological_state   text not null default '',
  felicity_conditions   jsonb not null default '{}'::jsonb,
  speech_act_type       text not null default 'undetermined' check (speech_act_type in ('direct', 'indirect', 'undetermined')),
  literal_force         text not null default '',
  academic_explanation  text not null default '',
  simple_explanation    text not null default '',
  created_at            timestamptz not null default now(),
  unique (analysis_id, utterance_number)
);

create index if not exists utterances_analysis_idx on public.utterances (analysis_id, utterance_number);

-- Materi teori (Knowledge Base). Dikelola oleh admin.
create table if not exists public.knowledge_base (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null check (char_length(title) between 3 and 200),
  topic        text not null default 'Umum' check (char_length(topic) <= 80),
  summary      text not null default '' check (char_length(summary) <= 500),
  content      text not null default '' check (char_length(content) <= 60000),
  sort_order   integer not null default 100,
  is_published boolean not null default true,
  created_by   uuid references public.profiles (id) on delete set null,
  updated_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists knowledge_base_order_idx on public.knowledge_base (sort_order, title);

-- Umpan balik pengguna terhadap hasil analisis (untuk evaluasi kualitas AI).
create table if not exists public.analysis_feedback (
  id                   uuid primary key default gen_random_uuid(),
  analysis_id          uuid not null references public.analyses (id) on delete cascade,
  utterance_id         uuid references public.utterances (id) on delete cascade,
  user_id              uuid not null references public.profiles (id) on delete cascade,
  rating               smallint check (rating between 1 and 5),
  is_accurate          boolean,
  suggested_category   text check (suggested_category in ('assertive', 'directive', 'commissive', 'expressive', 'declaration', 'undetermined')),
  comment              text not null default '' check (char_length(comment) <= 2000),
  -- Salinan singkat agar admin dapat meninjau tanpa membuka analisis milik pengguna.
  utterance_snapshot   text not null default '',
  ai_category_snapshot text not null default '',
  status               text not null default 'baru' check (status in ('baru', 'ditinjau', 'selesai')),
  admin_note           text not null default '' check (char_length(admin_note) <= 2000),
  reviewed_by          uuid references public.profiles (id) on delete set null,
  reviewed_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists analysis_feedback_analysis_idx on public.analysis_feedback (analysis_id);
create index if not exists analysis_feedback_status_idx on public.analysis_feedback (status, created_at desc);
create index if not exists analysis_feedback_user_idx on public.analysis_feedback (user_id);
create index if not exists analysis_feedback_utterance_idx on public.analysis_feedback (utterance_id);


-- =====================================================================
-- 2. FUNGSI BANTU & TRIGGER
-- =====================================================================

-- Memperbarui kolom updated_at setiap kali baris diubah.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists analyses_set_updated_at on public.analyses;
create trigger analyses_set_updated_at before update on public.analyses
  for each row execute function public.set_updated_at();

drop trigger if exists knowledge_base_set_updated_at on public.knowledge_base;
create trigger knowledge_base_set_updated_at before update on public.knowledge_base
  for each row execute function public.set_updated_at();

drop trigger if exists analysis_feedback_set_updated_at on public.analysis_feedback;
create trigger analysis_feedback_set_updated_at before update on public.analysis_feedback
  for each row execute function public.set_updated_at();

-- Mengecek apakah pengguna yang sedang login adalah admin.
-- SECURITY DEFINER agar tidak terjadi perulangan RLS saat membaca tabel profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Membuat profil otomatis ketika ada akun baru di Supabase Auth.
-- Role SELALU 'user'; nilai role dari data pendaftaran diabaikan.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, institution)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'institution', ''), 160)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Menyamakan email di profil bila pengguna mengganti email.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Penjaga profil: pengguna biasa tidak dapat mengubah role (miliknya atau orang lain),
-- admin tidak dapat mengubah role dirinya sendiri, dan email hanya disinkronkan dari Auth.
-- Perubahan dari SQL Editor (postgres) atau service_role tetap diizinkan.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.email := old.email;

    if new.role is distinct from old.role then
      if not public.is_admin() then
        raise exception 'Hanya admin yang dapat mengubah role pengguna.'
          using errcode = '42501';
      end if;
      if new.id = (select auth.uid()) then
        raise exception 'Admin tidak dapat mengubah role dirinya sendiri.'
          using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Mencatat siapa yang membuat/mengubah materi knowledge base.
create or replace function public.stamp_knowledge_base_author()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce((select auth.uid()), new.created_by);
  end if;
  new.updated_by := coalesce((select auth.uid()), new.updated_by);
  return new;
end;
$$;

drop trigger if exists knowledge_base_stamp_author on public.knowledge_base;
create trigger knowledge_base_stamp_author before insert or update on public.knowledge_base
  for each row execute function public.stamp_knowledge_base_author();

-- Mengisi salinan tuturan pada umpan balik dari data asli (bukan dari input pengguna),
-- dan memastikan tuturan memang bagian dari analisis yang sama.
create or replace function public.fill_feedback_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_text text;
  v_category text;
begin
  new.utterance_snapshot := '';
  new.ai_category_snapshot := '';

  if new.utterance_id is not null then
    select u.utterance_text, u.category
      into v_text, v_category
      from public.utterances u
     where u.id = new.utterance_id
       and u.analysis_id = new.analysis_id;

    if not found then
      raise exception 'Tuturan tidak ditemukan pada analisis ini.' using errcode = '23503';
    end if;

    new.utterance_snapshot := left(v_text, 1000);
    new.ai_category_snapshot := v_category;
  end if;

  if current_user in ('authenticated', 'anon') then
    new.status := 'baru';
    new.admin_note := '';
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists analysis_feedback_fill_snapshot on public.analysis_feedback;
create trigger analysis_feedback_fill_snapshot before insert on public.analysis_feedback
  for each row execute function public.fill_feedback_snapshot();

-- Mencatat admin yang meninjau umpan balik.
create or replace function public.stamp_feedback_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status or new.admin_note is distinct from old.admin_note then
    new.reviewed_by := coalesce((select auth.uid()), new.reviewed_by);
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists analysis_feedback_stamp_review on public.analysis_feedback;
create trigger analysis_feedback_stamp_review before update on public.analysis_feedback
  for each row execute function public.stamp_feedback_review();


-- =====================================================================
-- 3. FUNGSI STATISTIK
-- =====================================================================

-- Statistik dashboard untuk pengguna yang sedang login.
-- SECURITY INVOKER: RLS tetap berlaku, jadi hanya data miliknya yang dihitung.
create or replace function public.get_my_stats()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with my_analyses as (
    select a.id, a.created_at
      from public.analyses a
     where a.user_id = (select auth.uid())
  ),
  my_utterances as (
    select u.category, u.speech_act_type
      from public.utterances u
      join my_analyses a on a.id = u.analysis_id
  )
  select jsonb_build_object(
    'total_analyses', (select count(*) from my_analyses),
    'total_utterances', (select count(*) from my_utterances),
    'category_counts', coalesce(
      (select jsonb_object_agg(category, n) from (select category, count(*) as n from my_utterances group by category) c),
      '{}'::jsonb),
    'speech_act_types', coalesce(
      (select jsonb_object_agg(speech_act_type, n) from (select speech_act_type, count(*) as n from my_utterances group by speech_act_type) t),
      '{}'::jsonb),
    'monthly', coalesce(
      (select jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'), 'count', n) order by m)
         from (select date_trunc('month', created_at) as m, count(*) as n
                 from my_analyses
                where created_at >= date_trunc('month', now()) - interval '5 months'
                group by 1) mm),
      '[]'::jsonb)
  );
$$;

-- Ringkasan global untuk admin: hanya angka agregat, tanpa isi dialog pengguna.
create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin.' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'total_users', (select count(*) from public.profiles),
    'total_admins', (select count(*) from public.profiles where role = 'admin'),
    'total_analyses', (select count(*) from public.analyses),
    'total_utterances', (select count(*) from public.utterances),
    'open_feedback', (select count(*) from public.analysis_feedback where status = 'baru'),
    'category_counts', coalesce(
      (select jsonb_object_agg(category, n) from (select category, count(*) as n from public.utterances group by category) c),
      '{}'::jsonb)
  );
end;
$$;

-- Daftar pengguna untuk halaman admin, lengkap dengan jumlah analisis masing-masing.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  institution text,
  role text,
  created_at timestamptz,
  analyses_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin.' using errcode = '42501';
  end if;

  return query
    select p.id, p.email, p.full_name, p.institution, p.role, p.created_at,
           (select count(*) from public.analyses a where a.user_id = p.id) as analyses_count
      from public.profiles p
     order by p.created_at desc;
end;
$$;


-- =====================================================================
-- 4. HAK AKSES (GRANT)
--    Supabase versi baru tidak lagi membuka tabel baru ke API secara
--    otomatis, jadi semua hak akses ditulis eksplisit di sini.
--    Pengunjung tanpa login (anon) tidak diberi akses ke tabel mana pun.
-- =====================================================================

revoke all on table public.profiles, public.analyses, public.utterances,
                    public.knowledge_base, public.analysis_feedback
  from anon, authenticated;

-- profiles: baca + ubah kolom tertentu saja (email & id tidak bisa diubah dari aplikasi).
grant select on public.profiles to authenticated;
grant update (full_name, institution, role) on public.profiles to authenticated;

-- analyses & utterances: pengguna hanya bisa membaca dan menghapus.
-- Penyimpanan hasil analisis hanya dilakukan backend (service_role) setelah AI selesai.
grant select, delete on public.analyses to authenticated;
grant select on public.utterances to authenticated;

-- knowledge_base: semua pengguna login dapat membaca; RLS membatasi penulisan hanya untuk admin.
grant select, insert, update, delete on public.knowledge_base to authenticated;

-- analysis_feedback: pengguna dapat mengirim & menghapus miliknya; admin hanya mengubah kolom peninjauan.
grant select, insert, delete on public.analysis_feedback to authenticated;
grant update (status, admin_note) on public.analysis_feedback to authenticated;

-- Backend (service_role) membutuhkan akses penuh. service_role selalu melewati RLS.
grant select, insert, update, delete on public.profiles, public.analyses, public.utterances,
                                        public.knowledge_base, public.analysis_feedback
  to service_role;

-- Fungsi: cabut akses default, lalu buka hanya yang diperlukan.
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.get_my_stats() from public, anon;
revoke execute on function public.admin_overview() from public, anon;
revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.get_my_stats() to authenticated;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_list_users() to authenticated;


-- =====================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.utterances enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.analysis_feedback enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles: baca milik sendiri atau admin" on public.profiles;
create policy "profiles: baca milik sendiri atau admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "profiles: ubah milik sendiri atau admin" on public.profiles;
create policy "profiles: ubah milik sendiri atau admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- ---------- analyses ----------
drop policy if exists "analyses: baca milik sendiri" on public.analyses;
create policy "analyses: baca milik sendiri" on public.analyses
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "analyses: hapus milik sendiri" on public.analyses;
create policy "analyses: hapus milik sendiri" on public.analyses
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- utterances ----------
drop policy if exists "utterances: baca milik sendiri" on public.utterances;
create policy "utterances: baca milik sendiri" on public.utterances
  for select to authenticated
  using (exists (
    select 1 from public.analyses a
     where a.id = utterances.analysis_id
       and a.user_id = (select auth.uid())
  ));

-- ---------- knowledge_base ----------
drop policy if exists "knowledge_base: baca materi terbit" on public.knowledge_base;
create policy "knowledge_base: baca materi terbit" on public.knowledge_base
  for select to authenticated
  using (is_published or public.is_admin());

drop policy if exists "knowledge_base: admin menambah" on public.knowledge_base;
create policy "knowledge_base: admin menambah" on public.knowledge_base
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "knowledge_base: admin mengubah" on public.knowledge_base;
create policy "knowledge_base: admin mengubah" on public.knowledge_base
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "knowledge_base: admin menghapus" on public.knowledge_base;
create policy "knowledge_base: admin menghapus" on public.knowledge_base
  for delete to authenticated
  using (public.is_admin());

-- ---------- analysis_feedback ----------
drop policy if exists "feedback: baca milik sendiri atau admin" on public.analysis_feedback;
create policy "feedback: baca milik sendiri atau admin" on public.analysis_feedback
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "feedback: kirim untuk analisis sendiri" on public.analysis_feedback;
create policy "feedback: kirim untuk analisis sendiri" on public.analysis_feedback
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.analyses a
       where a.id = analysis_feedback.analysis_id
         and a.user_id = (select auth.uid())
    )
  );

drop policy if exists "feedback: admin meninjau" on public.analysis_feedback;
create policy "feedback: admin meninjau" on public.analysis_feedback
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "feedback: hapus milik sendiri atau admin" on public.analysis_feedback;
create policy "feedback: hapus milik sendiri atau admin" on public.analysis_feedback
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());


-- =====================================================================
-- 6. DATA AWAL
--    Membuat profil untuk akun yang mungkin sudah terdaftar sebelum
--    skema ini dijalankan.
-- =====================================================================

insert into public.profiles (id, email, full_name)
select u.id, u.email, left(coalesce(u.raw_user_meta_data ->> 'full_name', ''), 120)
  from auth.users u
on conflict (id) do nothing;

-- Selesai. Lanjutkan dengan menjalankan supabase/seed_knowledge_base.sql
