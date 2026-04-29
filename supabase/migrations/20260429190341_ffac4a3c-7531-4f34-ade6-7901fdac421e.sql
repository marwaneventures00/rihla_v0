CREATE TABLE public.meet_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  alumni_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, alumni_id)
);

ALTER TABLE public.meet_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view connections involving them"
ON public.meet_connections FOR SELECT
USING (auth.uid() = student_id OR auth.uid() = alumni_id);

CREATE POLICY "Students can create their own connection requests"
ON public.meet_connections FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Either party can update their connection"
ON public.meet_connections FOR UPDATE
USING (auth.uid() = student_id OR auth.uid() = alumni_id);

CREATE INDEX idx_meet_connections_student ON public.meet_connections(student_id);
CREATE INDEX idx_meet_connections_alumni ON public.meet_connections(alumni_id);

CREATE TRIGGER update_meet_connections_updated_at
BEFORE UPDATE ON public.meet_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();