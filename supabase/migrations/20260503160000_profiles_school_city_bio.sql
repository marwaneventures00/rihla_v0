-- Extended profile fields for student identity / edit profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS graduation_year text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS bio text;

-- updated_at already exists from initial schema; ensure default if missing (no-op if present)
ALTER TABLE public.profiles
  ALTER COLUMN updated_at SET DEFAULT now();
