import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth", { replace: true });
        return;
      }
      const uid = data.session.user.id;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("onboarding_completed").eq("user_id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      const isAdmin = roles?.some((r) => r.role === "admin");
      const isStudent = roles?.some((r) => r.role === "student");
      const stored = localStorage.getItem("rihla.activeView");
      const view = stored === "admin" && isAdmin ? "admin" : stored === "student" && isStudent ? "student" : isAdmin ? "admin" : "student";
      if (view === "admin") navigate("/admin", { replace: true });
      else navigate(profile?.onboarding_completed ? "/pathways" : "/onboarding", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-accent" />
    </div>
  );
};

export default Index;
