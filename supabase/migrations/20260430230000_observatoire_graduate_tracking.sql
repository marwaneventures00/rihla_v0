-- Observatoire: graduate outcomes tracking (university-scoped)

create extension if not exists "pgcrypto";

create table if not exists public.graduate_profiles (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  student_name text not null,
  graduation_year int not null,
  field_of_study text not null,
  current_status text not null check (current_status in ('employed','seeking','further_study','entrepreneurship','unknown')),
  current_role text,
  current_company text,
  current_sector text,
  current_salary_range text,
  time_to_first_job_months int,
  location text,
  linkedin_url text,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists graduate_profiles_university_id_idx on public.graduate_profiles (university_id);
create index if not exists graduate_profiles_graduation_year_idx on public.graduate_profiles (graduation_year);
create index if not exists graduate_profiles_field_idx on public.graduate_profiles (field_of_study);
create index if not exists graduate_profiles_status_idx on public.graduate_profiles (current_status);

create table if not exists public.observatoire_surveys (
  id uuid primary key default gen_random_uuid(),
  graduate_id uuid not null references public.graduate_profiles (id) on delete cascade,
  survey_date timestamptz not null default now(),
  employed boolean not null default false,
  role_matches_degree boolean not null default false,
  satisfaction_score int not null check (satisfaction_score between 1 and 5),
  would_recommend_university boolean not null default false,
  key_skills_used text[] not null default '{}'::text[],
  biggest_challenge text not null default '',
  advice_for_students text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists observatoire_surveys_graduate_id_idx on public.observatoire_surveys (graduate_id);
create index if not exists observatoire_surveys_survey_date_idx on public.observatoire_surveys (survey_date);

alter table public.graduate_profiles enable row level security;
alter table public.observatoire_surveys enable row level security;

-- Helper predicate: caller is an admin tied to the same university row
-- (This intentionally excludes admins without a university_id.)
create policy "graduate_profiles_select_university_admin"
on public.graduate_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
      and ur.university_id is not null
      and ur.university_id = graduate_profiles.university_id
  )
);

create policy "graduate_profiles_write_university_admin"
on public.graduate_profiles
for all
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
      and ur.university_id is not null
      and ur.university_id = graduate_profiles.university_id
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
      and ur.university_id is not null
      and ur.university_id = graduate_profiles.university_id
  )
);

create policy "observatoire_surveys_select_university_admin"
on public.observatoire_surveys
for select
to authenticated
using (
  exists (
    select 1
    from public.graduate_profiles gp
    join public.user_roles ur
      on ur.user_id = auth.uid()
     and ur.role = 'admin'
     and ur.university_id is not null
     and ur.university_id = gp.university_id
    where gp.id = observatoire_surveys.graduate_id
  )
);

create policy "observatoire_surveys_write_university_admin"
on public.observatoire_surveys
for all
to authenticated
using (
  exists (
    select 1
    from public.graduate_profiles gp
    join public.user_roles ur
      on ur.user_id = auth.uid()
     and ur.role = 'admin'
     and ur.university_id is not null
     and ur.university_id = gp.university_id
    where gp.id = observatoire_surveys.graduate_id
  )
)
with check (
  exists (
    select 1
    from public.graduate_profiles gp
    join public.user_roles ur
      on ur.user_id = auth.uid()
     and ur.role = 'admin'
     and ur.university_id is not null
     and ur.university_id = gp.university_id
    where gp.id = observatoire_surveys.graduate_id
  )
);
