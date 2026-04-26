-- case_sessions
CREATE TABLE public.case_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_json JSONB NOT NULL,
  answer_text TEXT,
  score_json JSONB,
  difficulty TEXT,
  sector TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.case_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own case sessions"
  ON public.case_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own case sessions"
  ON public.case_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own case sessions"
  ON public.case_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view case sessions in their university"
  ON public.case_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role)
    AND get_user_university(user_id) = get_user_university(auth.uid()));

CREATE INDEX idx_case_sessions_user ON public.case_sessions(user_id, created_at DESC);

-- interview_sessions
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  interview_type TEXT,
  language TEXT,
  questions_json JSONB NOT NULL,
  answers_json JSONB,
  feedback_json JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interview sessions"
  ON public.interview_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own interview sessions"
  ON public.interview_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interview sessions"
  ON public.interview_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view interview sessions in their university"
  ON public.interview_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role)
    AND get_user_university(user_id) = get_user_university(auth.uid()));

CREATE INDEX idx_interview_sessions_user ON public.interview_sessions(user_id, created_at DESC);