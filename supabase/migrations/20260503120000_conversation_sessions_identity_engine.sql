-- Identity Engine: conversation_sessions + PMO/pathway columns
-- (CREATE POLICY IF NOT EXISTS is not valid in Postgres — use DROP + CREATE.)

CREATE TABLE IF NOT EXISTS public.conversation_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  messages jsonb DEFAULT '[]'::jsonb,
  dimensions_covered jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'complete', 'refined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS fit_score integer,
  ADD COLUMN IF NOT EXISTS fit_data jsonb,
  ADD COLUMN IF NOT EXISTS ai_insight text;

ALTER TABLE public.pathway_results
  ADD COLUMN IF NOT EXISTS confidence_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archetypes jsonb,
  ADD COLUMN IF NOT EXISTS all_careers jsonb,
  ADD COLUMN IF NOT EXISTS key_insights jsonb,
  ADD COLUMN IF NOT EXISTS recommended_track text;

ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own sessions" ON public.conversation_sessions;
CREATE POLICY "Users can manage own sessions"
  ON public.conversation_sessions
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id
  ON public.conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pathway_results_user_id
  ON public.pathway_results(user_id);
