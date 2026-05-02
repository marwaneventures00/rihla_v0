import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, role")
        .eq("id", user.id)
        .maybeSingle();

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isAdmin = roles?.some((r) => r.role === "admin");

      if (isAdmin) {
        navigate("/admin", { replace: true });
        return;
      }

      if (profile?.onboarding_completed === true) {
        navigate("/pathways", { replace: true });
        return;
      }

      navigate("/onboarding", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-accent" />
    </div>
  );
};

export default Index;
