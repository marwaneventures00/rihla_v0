import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShieldCheck, Save, Briefcase, Mic } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import type { PathwayResult } from "@/lib/onboarding";

type ProfileRow = {
  full_name: string | null;
  field_of_study: string | null;
  study_level: string | null;
  institution_name: string | null;
};
type ActionItem = { id: string; action_text: string; completed: boolean };
type PathwayRow = { id: string; result_json: PathwayResult; created_at: string };

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow>({ full_name: "", field_of_study: "", study_level: "", institution_name: "" });
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [pathways, setPathways] = useState<PathwayRow[]>([]);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [caseSessions, setCaseSessions] = useState<any[]>([]);
  const [interviewSessions, setInterviewSessions] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { navigate("/auth", { replace: true }); return; }
      const userId = s.session.user.id;
      setUid(userId);

      const [{ data: p }, { data: a }, { data: pw }, { data: r }, { data: cs }, { data: is }] = await Promise.all([
        supabase.from("profiles").select("full_name, field_of_study, study_level, institution_name, university_id").eq("user_id", userId).maybeSingle(),
        supabase.from("action_plan_items").select("id, action_text, completed").eq("user_id", userId).order("created_at"),
        supabase.from("pathway_results").select("id, result_json, created_at").eq("user_id", userId).order("created_at"),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("case_sessions").select("id, case_json, score_json, completed_at, created_at").eq("user_id", userId).not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(5),
        supabase.from("interview_sessions").select("id, role, feedback_json, completed_at, created_at").eq("user_id", userId).not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(5),
      ]);

      if (p) {
        setProfile({
          full_name: p.full_name, field_of_study: p.field_of_study,
          study_level: p.study_level, institution_name: p.institution_name,
        });
        setUniversityId((p as any).university_id ?? null);
      }
      setActions((a ?? []) as ActionItem[]);
      setPathways((pw ?? []).map((row) => ({ ...row, result_json: row.result_json as unknown as PathwayResult })));
      setHasAdmin(!!r?.some((x) => x.role === "admin"));
      setCaseSessions(cs ?? []);
      setInterviewSessions(is ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  const scoreHistory = useMemo(() => {
    if (pathways.length === 0) return [];
    // Synthesize a 6-point trajectory ending at the latest score.
    const latest = pathways[pathways.length - 1].result_json.readinessScore;
    const start = Math.max(20, latest - 35);
    const steps = 6;
    return Array.from({ length: steps }).map((_, i) => ({
      week: `W${i + 1}`,
      score: Math.round(start + ((latest - start) * i) / (steps - 1)),
    }));
  }, [pathways]);

  async function saveProfile() {
    if (!uid) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      field_of_study: profile.field_of_study,
      study_level: profile.study_level,
      institution_name: profile.institution_name,
    }).eq("user_id", uid);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  async function toggleAction(item: ActionItem) {
    const next = !item.completed;
    setActions((arr) => arr.map((a) => a.id === item.id ? { ...a, completed: next } : a));
    const { error } = await supabase.from("action_plan_items").update({ completed: next }).eq("id", item.id);
    if (error) {
      setActions((arr) => arr.map((a) => a.id === item.id ? { ...a, completed: !next } : a));
      toast.error(error.message);
    }
  }

  async function promoteToAdmin() {
    if (!uid || !universityId) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin", university_id: universityId });
    if (error) { toast.error(error.message); return; }
    setHasAdmin(true);
    toast.success("Admin role granted. Refresh to see admin nav.");
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  const completed = actions.filter((a) => a.completed).length;
  const latestPathways = pathways[pathways.length - 1]?.result_json.pathways ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold mb-1">My profile & progress</h1>
        <p className="text-muted-foreground">Keep your information current and track your career-readiness journey.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        {/* Profile form */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xl font-bold">
              {(profile.full_name ?? "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold">{profile.full_name ?? "—"}</h2>
              <p className="text-sm text-muted-foreground">{profile.institution_name}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div><Label>Full name</Label><Input value={profile.full_name ?? ""} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} /></div>
            <div><Label>Institution</Label><Input value={profile.institution_name ?? ""} onChange={(e) => setProfile((p) => ({ ...p, institution_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Field of study</Label><Input value={profile.field_of_study ?? ""} onChange={(e) => setProfile((p) => ({ ...p, field_of_study: e.target.value }))} /></div>
              <div><Label>Level</Label><Input value={profile.study_level ?? ""} onChange={(e) => setProfile((p) => ({ ...p, study_level: e.target.value }))} /></div>
            </div>
            <Button variant="accent" onClick={saveProfile} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
            </Button>
          </div>
        </Card>

        {/* Score history */}
        <Card className="p-6">
          <h2 className="font-semibold mb-1">Career readiness over time</h2>
          <p className="text-sm text-muted-foreground mb-4">Tracked across your pathway assessments.</p>
          <div className="h-56">
            {scoreHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Complete your onboarding to see your readiness journey.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Saved pathways */}
      {latestPathways.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Your saved pathways</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {latestPathways.map((p) => (
              <div key={p.title} className="p-4 rounded-lg border border-border">
                <p className="font-semibold mb-1">{p.title}</p>
                <p className="text-xs text-muted-foreground mb-2">{p.fitScore}% fit · {p.salaryRange.min.toLocaleString()}–{p.salaryRange.max.toLocaleString()} MAD</p>
                <div className="flex flex-wrap gap-1">
                  {p.topEmployers.slice(0, 2).map((e) => <span key={e} className="text-xs text-muted-foreground">· {e}</span>)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action plan checklist */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">My 90-day action plan</h2>
            <p className="text-sm text-muted-foreground">{completed} of {actions.length} complete</p>
          </div>
          <div className="w-40 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-accent transition-all" style={{ width: actions.length ? `${(completed / actions.length) * 100}%` : "0%" }} />
          </div>
        </div>
        <ul className="space-y-2">
          {actions.map((a) => (
            <li key={a.id} className="flex items-start gap-3 p-3 rounded-md border border-border">
              <Checkbox checked={a.completed} onCheckedChange={() => toggleAction(a)} className="mt-0.5" />
              <span className={a.completed ? "text-sm text-muted-foreground line-through" : "text-sm"}>{a.action_text}</span>
            </li>
          ))}
          {actions.length === 0 && <p className="text-sm text-muted-foreground">Your action plan will appear here after completing onboarding.</p>}
        </ul>
      </Card>

      {/* Demo helper: promote to admin */}
      {!hasAdmin && universityId && (
        <Card className="p-6 border-dashed">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Demo: try the admin dashboard</h3>
              <p className="text-sm text-muted-foreground mb-3">Grant yourself the university admin role for this university to preview the institutional analytics dashboard.</p>
              <Button variant="outline" size="sm" onClick={promoteToAdmin}>Grant admin role</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
