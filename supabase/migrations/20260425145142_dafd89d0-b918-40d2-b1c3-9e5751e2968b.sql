
UPDATE public.profiles p
SET onboarding_completed = true
WHERE EXISTS (SELECT 1 FROM public.pathway_results pr WHERE pr.user_id = p.user_id)
  AND p.onboarding_completed = false;
