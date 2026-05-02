import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const inter = { fontFamily: "Inter, system-ui, sans-serif" } as const;

const VALUE_BULLETS = [
  "Personalized career path in under 5 minutes",
  "Real-time Moroccan job market intelligence",
  "AI-powered interview and case prep",
] as const;

const inputClassName =
  "h-auto min-h-[48px] w-full rounded-[10px] border-[1.5px] border-[#E5E5E5] bg-white px-4 py-3 text-[15px] font-sans text-[#0A0A0A] placeholder:text-[#6B6B6B]/70 shadow-none focus-visible:border-[#0A0A0A] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(0,0,0,0.06)] focus-visible:ring-offset-0";

const labelClassName = "mb-1.5 block text-[13px] font-medium text-[#0A0A0A]";

const primaryBtnClassName =
  "inline-flex w-full items-center justify-center rounded-full border-0 bg-[#C8102E] py-3.5 text-[15px] font-semibold text-white shadow-none transition-all duration-200 ease-in-out hover:-translate-y-px hover:bg-[#A50D26] hover:shadow-[0_4px_16px_rgba(200,16,46,0.3)] disabled:pointer-events-none disabled:opacity-50";

export default function Auth() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tab, setTab] = useState<"student" | "admin">("student");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("cariva.rememberMe");
    if (saved === "false") setRememberMe(false);
  }, []);

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
      .eq("id", session.user.id)
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
        const trimmedName = fullName.trim();
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: userId,
            full_name: trimmedName.length > 0 ? trimmedName : null,
            onboarding_completed: false,
            university_id: uni.id,
            institution_name: uni.name,
          },
          { onConflict: "id" },
        );
        if (profileError) throw profileError;

        const { error: rolesError } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: "student",
          university_id: uni.id,
        });
        if (rolesError) throw rolesError;
      }
      toast.success("Account created. Let's set up your profile.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem("cariva.rememberMe", rememberMe ? "true" : "false");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] grid lg:grid-cols-2">
      {/* Left: hero */}
      <div className="relative hidden min-h-screen flex-col border-r border-[#E5E5E5] p-12 text-[#0A0A0A] lg:flex">
        <div className="shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 text-[#0A0A0A] no-underline outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#C8102E]" aria-hidden />
            <span className="font-serif text-4xl font-bold tracking-tight lg:text-[2.75rem] lg:leading-none">
              Cariva
            </span>
            <span className="sr-only">Back to home</span>
          </Link>
        </div>

        <div className="mt-12 flex min-h-0 max-w-md flex-1 flex-col justify-center">
          <h2
            className="font-black leading-[1.1] tracking-[-0.02em] text-[#0A0A0A]"
            style={{ ...inter, fontSize: "clamp(36px, 4vw, 56px)" }}
          >
            Discover your career path.
          </h2>
          <p
            className="mt-4 max-w-[360px] text-base leading-[1.6] text-[#6B6B6B]"
            style={inter}
          >
            AI-native career intelligence built for Moroccan students.
          </p>
          <ul className="mt-6 flex flex-col gap-3" style={inter}>
            {VALUE_BULLETS.map((line) => (
              <li key={line} className="flex items-start gap-2 text-left text-[14px] text-[#0A0A0A]">
                <span className="mt-[5px] shrink-0 text-[8px] leading-none text-[#C8102E]" aria-hidden>
                  ●
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto shrink-0 pt-12">
          <blockquote className="text-[15px] italic leading-snug text-[#0A0A0A]" style={inter}>
            &ldquo;Cariva helped me land my first internship at a Big 4 firm.&rdquo;
          </blockquote>
          <p className="mt-2 text-[13px] text-[#6B6B6B]" style={inter}>
            — Yasmine B., ESCA · Class of 2025
          </p>
        </div>

        <div className="mt-10 shrink-0 text-sm text-[#6B6B6B]" style={inter}>
          © {new Date().getFullYear()} Cariva — AI-native career intelligence.
        </div>
      </div>

      {/* Right: forms */}
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-[420px] rounded-[20px] bg-white px-10 py-12 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
          <div className="mb-6 lg:hidden">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-[#0A0A0A] no-underline outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#C8102E]" aria-hidden />
              <span className="font-serif text-3xl font-bold tracking-tight">Cariva</span>
              <span className="sr-only">Back to home</span>
            </Link>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "student" | "admin")}>
            <TabsList className="mb-6 flex h-auto w-full gap-0 rounded-full bg-[#F5F5F5] p-1">
              <TabsTrigger
                value="student"
                className="flex-1 rounded-full border-0 bg-transparent py-2.5 text-sm font-normal text-[#6B6B6B] shadow-none transition-all data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-[#0A0A0A] data-[state=active]:shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                style={inter}
              >
                {t("auth.student", "Student")}
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="flex-1 rounded-full border-0 bg-transparent py-2.5 text-sm font-normal text-[#6B6B6B] shadow-none transition-all data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-[#0A0A0A] data-[state=active]:shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                style={inter}
              >
                {t("auth.universityAdmin", "University admin")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student">
              <h2 className="mb-1 text-xl font-semibold text-[#0A0A0A]" style={inter}>
                {mode === "signup" ? t("auth.getStarted", "Get started") : t("auth.welcomeBack", "Welcome back")}
              </h2>
              <p className="mb-6 text-sm text-[#6B6B6B]" style={inter}>
                {mode === "signup"
                  ? "Create your student account with your university's access code."
                  : "Sign in to continue your career journey."}
              </p>

              <form onSubmit={mode === "signup" ? handleStudentSignup : handleSignIn} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <Label htmlFor="name" className={labelClassName} style={inter}>
                      Full name
                    </Label>
                    <Input id="name" className={inputClassName} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                )}
                <div>
                  <Label htmlFor="email" className={labelClassName} style={inter}>
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className={inputClassName}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password" className={labelClassName} style={inter}>
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    className={inputClassName}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                {mode === "signin" && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-me-student"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label htmlFor="remember-me-student" className="text-sm font-normal text-[#6B6B6B]" style={inter}>
                      Remember me
                    </Label>
                  </div>
                )}
                {mode === "signup" && (
                  <div>
                    <Label htmlFor="code" className={labelClassName} style={inter}>
                      University access code
                    </Label>
                    <Input
                      id="code"
                      className={inputClassName}
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="e.g. ESCA2026"
                      required
                    />
                    <p className="mt-1 text-xs text-[#6B6B6B]" style={inter}>
                      Try <code className="font-mono">ESCA2026</code> for the demo university.
                    </p>
                  </div>
                )}

                <button type="submit" className={primaryBtnClassName} disabled={loading} style={inter}>
                  {loading && <Loader2 className="mr-2 inline h-4 w-4 animate-spin align-middle" />}
                  {mode === "signup" ? t("auth.createAccount", "Create account") : t("auth.signIn", "Sign in")}
                </button>
              </form>

              <button
                type="button"
                className="mt-4 w-full text-sm text-[#6B6B6B] no-underline transition-colors hover:text-[#0A0A0A] hover:underline"
                style={inter}
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </TabsContent>

            <TabsContent value="admin">
              <h2 className="mb-1 text-xl font-semibold text-[#0A0A0A]" style={inter}>
                University login
              </h2>
              <p className="mb-6 text-sm text-[#6B6B6B]" style={inter}>
                Admin dashboards arrive in the next phase. For now, please sign in with your credentials.
              </p>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="aemail" className={labelClassName} style={inter}>
                    Email
                  </Label>
                  <Input
                    id="aemail"
                    type="email"
                    className={inputClassName}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="apassword" className={labelClassName} style={inter}>
                    Password
                  </Label>
                  <Input
                    id="apassword"
                    type="password"
                    className={inputClassName}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me-admin"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="remember-me-admin" className="text-sm font-normal text-[#6B6B6B]" style={inter}>
                    Remember me
                  </Label>
                </div>
                <button type="submit" className={primaryBtnClassName} disabled={loading} style={inter}>
                  {loading && <Loader2 className="mr-2 inline h-4 w-4 animate-spin align-middle" />}
                  {t("auth.signIn", "Sign in")}
                </button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
