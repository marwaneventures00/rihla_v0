ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_alumni BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_role TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT;

CREATE POLICY "Authenticated users can view alumni profiles"
  ON public.profiles
  FOR SELECT
  USING (is_alumni = true AND auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.meet_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alumni_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, alumni_id)
);

ALTER TABLE public.meet_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their meet requests"
  ON public.meet_connections
  FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = alumni_id);

CREATE POLICY "Students can create meet requests"
  ON public.meet_connections
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND student_id <> alumni_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = alumni_id AND p.is_alumni = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_meet_connections_student
  ON public.meet_connections(student_id, created_at DESC);
