-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('student', 'admin');

-- Universities
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  admin_email TEXT,
  license_active BOOLEAN NOT NULL DEFAULT true,
  student_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universities are viewable by everyone"
  ON public.universities FOR SELECT
  USING (true);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  full_name TEXT,
  field_of_study TEXT,
  study_level TEXT,
  institution_name TEXT,
  institution_type TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate from profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get a user's university id
CREATE OR REPLACE FUNCTION public.get_user_university(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT university_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles RLS
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view profiles in their university"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    AND university_id = public.get_user_university(auth.uid())
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- User roles RLS
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Onboarding responses
CREATE TABLE public.onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_sectors TEXT[] NOT NULL DEFAULT '{}',
  work_environment TEXT,
  geography TEXT,
  ambition_level INT,
  personality_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding"
  ON public.onboarding_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view onboarding in their university"
  ON public.onboarding_responses FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    AND public.get_user_university(user_id) = public.get_user_university(auth.uid())
  );

CREATE POLICY "Users can insert their own onboarding"
  ON public.onboarding_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding"
  ON public.onboarding_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- Pathway results
CREATE TABLE public.pathway_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pathway_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pathways"
  ON public.pathway_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view pathways in their university"
  ON public.pathway_results FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    AND public.get_user_university(user_id) = public.get_user_university(auth.uid())
  );

CREATE POLICY "Users can insert their own pathways"
  ON public.pathway_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Action plan items
CREATE TABLE public.action_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.action_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own action items"
  ON public.action_plan_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action items"
  ON public.action_plan_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action items"
  ON public.action_plan_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action items"
  ON public.action_plan_items FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed test university
INSERT INTO public.universities (name, access_code, admin_email)
VALUES ('ESCA Ecole de Management', 'ESCA2026', 'admin@esca.ma');