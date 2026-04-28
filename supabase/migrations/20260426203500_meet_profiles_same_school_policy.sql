DROP POLICY IF EXISTS "Authenticated users can view alumni profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view same-school profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND institution_name IS NOT NULL
    AND institution_name = (
      SELECT p.institution_name
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
      LIMIT 1
    )
  );
