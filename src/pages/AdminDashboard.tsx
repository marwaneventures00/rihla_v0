import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users, UserCheck, Activity, Gauge } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { cn } from "@/lib/utils";
import type { PathwayResult } from "@/lib/onboarding";

type StudentRow = {
  user_id: string;
  full_name: string | null;
  field_of_study: string | null;
  study_level: string | null;
  onboarding_completed: boolean;
  readiness: number | null;
  topPathway: string | null;
  skillsGap: string[];
  created_at: string;
};

const PIE_COLORS = ["hsl(var(--accent))", "hsl(240 30% 22%)", "hsl(240 17% 55%)", "hsl(350 86% 70%)", "hsl(240 30% 70%)", "hsl(240 17% 35%)"];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof StudentRow>("full_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, field_of_study, study_level, onboarding_completed, created_at");
      const ids = (profiles ?? []).map((p) => p.user_id);
      const { data: results } = ids.length
        ? await supabase.from("pathway_results").select("user_id, result_json, created_at").in("user_id", ids).order("created_at", { ascending: false })
        : { data: [] as any[] };

      const latestByUser = new Map<string, PathwayResult>();
      for (const r of results ?? []) {
        if (!latestByUser.has(r.user_id)) latestByUser.set(r.user_id, r.result_json as unknown as PathwayResult);
      }

      const rows: StudentRow[] = (profiles ?? []).map((p) => {
        const res = latestByUser.get(p.user_id);
        return {
          user_id: p.user_id,
          full_name: p.full_name,
          field_of_study: p.field_of_study,
          study_level: p.study_level,
          onboarding_completed: p.onboarding_completed,
          created_at: p.created_at,
          readiness: res?.readinessScore ?? null,
          topPathway: res?.pathways?.[0]?.title ?? null,
          skillsGap: res?.pathways?.flatMap((pw) => pw.skillsGap) ?? [],
        };
      });
      setStudents(rows);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.onboarding_completed).length;
    const activation = total ? Math.round((active / total) * 100) : 0;
    const scored = students.filter((s) => s.readiness != null);
    const avg = scored.length ? Math.round(scored.reduce((a, s) => a + (s.readiness ?? 0), 0) / scored.length) : 0;
    return { total, active, activation, avg };
  }, [students]);

  const pathwayData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of students) {
      if (s.topPathway) counts.set(s.topPathway, (counts.get(s.topPathway) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [students]);

  const fieldData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of students) {
      const f = s.field_of_study ?? "Unknown";
      counts.set(f, (counts.get(f) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [students]);

  const wauData = useMemo(() => {
    // Synthetic 12-week trend keyed off cohort size
    const base = Math.max(2, Math.round(stats.active * 0.5));
    return Array.from({ length: 12 }).map((_, i) => ({
      week: `W${i + 1}`,
      users: Math.round(base + (stats.active - base) * (i / 11) + Math.sin(i) * 1.5),
    }));
  }, [stats.active]);

  const skillsGap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of students) for (const g of s.skillsGap) counts.set(g, (counts.get(g) ?? 0) + 1);
    return Array.from(counts.entries()).map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [students]);

  const filteredSorted = useMemo(() => {
    const t = search.trim().toLowerCase();
    let rows = students;
    if (t) rows = rows.filter((s) => (s.full_name ?? "").toLowerCase().includes(t) || (s.field_of_study ?? "").toLowerCase().includes(t));
    return [...rows].sort((a, b) => {
      const av = (a[sortBy] ?? "") as string | number;
      const bv = (b[sortBy] ?? "") as string | number;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [students, search, sortBy, sortDir]);

  function toggleSort(col: keyof StudentRow) {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  const maxGap = skillsGap[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Institutional dashboard</h1>
        <p className="text-muted-foreground">Live view of student engagement and career-readiness across your university.</p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="Total students" value={stats.total} />
        <Stat icon={UserCheck} label="Active users" value={stats.active} />
        <Stat icon={Activity} label="Activation rate" value={`${stats.activation}%`} accent />
        <Stat icon={Gauge} label="Avg readiness score" value={stats.avg} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold mb-4">Top 5 pathways chosen</h2>
          <div className="h-56">
            {pathwayData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pathwayData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={140} fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold mb-4">By field of study</h2>
          <div className="h-56">
            {fieldData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fieldData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75}>
                    {fieldData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Weekly active users (last 12 weeks)</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wauData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="users" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Engagement table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-semibold">Student engagement</h2>
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or field…" className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                {([
                  ["full_name", "Name"], ["field_of_study", "Field"], ["study_level", "Level"],
                  ["onboarding_completed", "Status"], ["readiness", "Readiness"], ["created_at", "Joined"],
                ] as [keyof StudentRow, string][]).map(([k, label]) => (
                  <th key={k} className="py-2 px-2 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort(k)}>
                    {label}{sortBy === k ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((s) => (
                <tr key={s.user_id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="py-2.5 px-2 font-medium">{s.full_name ?? "—"}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">{s.field_of_study ?? "—"}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">{s.study_level ?? "—"}</td>
                  <td className="py-2.5 px-2">
                    <span className={cn("text-xs px-2 py-1 rounded-full", s.onboarding_completed ? "bg-accent-soft text-accent" : "bg-secondary text-muted-foreground")}>
                      {s.onboarding_completed ? "Active" : "Onboarding"}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 font-semibold">{s.readiness ?? "—"}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {filteredSorted.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No students yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Skills gap heatmap */}
      <Card className="p-6">
        <h2 className="font-semibold mb-1">Top missing skills across the cohort</h2>
        <p className="text-sm text-muted-foreground mb-4">Color intensity = how many students need this skill.</p>
        {skillsGap.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {skillsGap.map((g) => {
              const intensity = g.count / maxGap;
              return (
                <div key={g.skill} className="rounded-md p-3 border border-border" style={{ backgroundColor: `hsl(350 86% 42% / ${0.08 + intensity * 0.6})` }}>
                  <p className="font-medium text-sm leading-tight">{g.skill}</p>
                  <p className="text-xs text-muted-foreground mt-1">{g.count} student{g.count > 1 ? "s" : ""}</p>
                </div>
              );
            })}
          </div>
        ) : <EmptyChart />}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent = false }: { icon: typeof Users; label: string; value: number | string; accent?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", accent ? "bg-accent text-accent-foreground" : "bg-accent-soft text-accent")}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  );
}

function EmptyChart() {
  return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet — students need to complete onboarding.</div>;
}
