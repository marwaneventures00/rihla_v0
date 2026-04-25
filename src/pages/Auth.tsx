import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"student" | "admin">("student");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [loading, setLoading] = useState(false);

  // form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) routeAfterAuth(session);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) routeAfterAuth(data.session);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function routeAfterAuth(session: Session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profile || !profile.onboarding_completed) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate("/pathways", { replace: true });
    }
  }

  async function handleStudentSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate university access code
      const { data: uni, error: uniErr } = await supabase
        .from("universities")
        .select("id, name, license_active")
        .eq("access_code", accessCode.trim().toUpperCase())
        .maybeSingle();

      if (uniErr || !uni) {
        toast.error("Invalid university access code");
        setLoading(false);
        return;
      }
      if (!uni.license_active) {
        toast.error("This university's license is inactive");
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName },
        },
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (userId) {
        await supabase.from("profiles").insert({
          user_id: userId,
          full_name: fullName,
          university_id: uni.id,
          institution_name: uni.name,
        });
        await supabase.from("user_roles").insert({
          user_id: userId,
          role: "student",
          university_id: uni.id,
        });
      }
      toast.success("Account created. Let's set up your profile.");
    } catch (err: any) {
      toast.error(err?.message ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: hero */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-primary-foreground bg-gradient-hero overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Rihla</h1>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-5xl font-bold leading-tight mb-6">
            Discover your career path.
          </h2>
          <p className="text-lg opacity-85">
            Built for Moroccan students. Powered by labor-market intelligence and personalized AI guidance.
          </p>
        </div>
        <div className="relative z-10 text-sm opacity-70">
          © {new Date().getFullYear()} Rihla — Career readiness platform
        </div>
        {/* Decorative gradient orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-primary-foreground/10 blur-3xl" />
      </div>

      {/* Right: forms */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md p-8 shadow-elevated">
          <div className="lg:hidden mb-6 flex items-baseline gap-2">
            <h1 className="text-2xl font-bold">Rihla</h1>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "student" | "admin")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="admin">University admin</TabsTrigger>
            </TabsList>

            <TabsContent value="student">
              <h2 className="text-xl font-semibold mb-1">
                {mode === "signup" ? "Get started" : "Welcome back"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {mode === "signup"
                  ? "Create your student account with your university's access code."
                  : "Sign in to continue your career journey."}
              </p>

              <form onSubmit={mode === "signup" ? handleStudentSignup : handleSignIn} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                )}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                </div>
                {mode === "signup" && (
                  <div>
                    <Label htmlFor="code">University access code</Label>
                    <Input
                      id="code"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="e.g. ESCA2026"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Try <code className="font-mono">ESCA2026</code> for the demo university.</p>
                  </div>
                )}

                <Button type="submit" variant="accent" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {mode === "signup" ? "Create account" : "Sign in"}
                </Button>
              </form>

              <button
                type="button"
                className="w-full text-sm text-muted-foreground mt-4 hover:text-accent transition-colors"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </TabsContent>

            <TabsContent value="admin">
              <h2 className="text-xl font-semibold mb-1">University login</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Admin dashboards arrive in the next phase. For now, please sign in with your credentials.
              </p>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="aemail">Email</Label>
                  <Input id="aemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="apassword">Password</Label>
                  <Input id="apassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" variant="accent" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
