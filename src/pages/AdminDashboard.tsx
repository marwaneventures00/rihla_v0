import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, ArrowUpDown } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

/* ---------- Mock data ---------- */

const STATS = [
  { label: "Total enrolled students", value: "4,500", trend: "+12% vs last month" },
  { label: "Active users (onboarded)", value: "312", trend: "+8% vs last month" },
  { label: "Activation rate", value: "6.9%", trend: "+1.4 pts vs last month" },
  { label: "Avg. career readiness", value: "58/100", trend: "+3 pts vs last month" },
];

const PATHWAYS = [
  { name: "Data Analyst", count: 89 },
  { name: "Management Consultant", count: 74 },
  { name: "Software Engineer", count: 61 },
  { name: "Financial Analyst", count: 55 },
  { name: "HR Manager", count: 38 },
  { name: "Marketing Manager", count: 29 },
];

const FIELDS = [
  { name: "Engineering", value: 34 },
  { name: "Business", value: 28 },
  { name: "IT", value: 18 },
  { name: "Sciences", value: 12 },
  { name: "Other", value: 8 },
];

// Navy / red palette
const FIELD_COLORS = ["#6366F1", "#8B5CF6", "#4F46E5", "#A78BFA", "#7C83FF"];

const WAU = [
  40, 48, 55, 62, 70, 82, 95, 110, 128, 144, 162, 180,
].map((users, i) => ({ week: `W${i + 1}`, users }));

const SKILLS_GAP = [
  { skill: "SQL & Data Analysis", count: 187 },
  { skill: "Python / R", count: 156 },
  { skill: "Project Management", count: 134 },
  { skill: "Excel & Financial Modeling", count: 122 },
  { skill: "Communication & Presentation", count: 118 },
  { skill: "Object-Oriented Programming", count: 98 },
  { skill: "Digital Marketing", count: 87 },
  { skill: "Financial Regulations", count: 76 },
  { skill: "Agile / Scrum", count: 65 },
  { skill: "Arabic Business Writing", count: 54 },
];

type Status = "Completed" | "In progress" | "Not started";
type Student = {
  name: string;
  field: string;
  level: string;
  onboarding: Status;
  readiness: number;
  lastActive: string; // ISO
};

const STUDENTS: Student[] = [
  { name: "Yasmine El Amrani", field: "Engineering", level: "M1", onboarding: "Completed", readiness: 78, lastActive: "2026-04-24" },
  { name: "Mehdi Benjelloun", field: "Business", level: "L3", onboarding: "Completed", readiness: 65, lastActive: "2026-04-23" },
  { name: "Salma Bouazza", field: "IT", level: "M2", onboarding: "In progress", readiness: 52, lastActive: "2026-04-22" },
  { name: "Karim Tazi", field: "Sciences", level: "L2", onboarding: "Not started", readiness: 0, lastActive: "2026-04-10" },
  { name: "Nour El Houda Idrissi", field: "Business", level: "M1", onboarding: "Completed", readiness: 81, lastActive: "2026-04-24" },
  { name: "Anas Cherkaoui", field: "Engineering", level: "L3", onboarding: "Completed", readiness: 70, lastActive: "2026-04-21" },
  { name: "Imane Lahlou", field: "IT", level: "M2", onboarding: "In progress", readiness: 48, lastActive: "2026-04-20" },
  { name: "Othmane Berrada", field: "Engineering", level: "L1", onboarding: "Not started", readiness: 0, lastActive: "2026-04-05" },
];

/* ---------- Component ---------- */

type SortKey = keyof Student;

export default function AdminDashboard() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const localizedStats = STATS.map((s) => ({
    ...s,
    label:
      s.label === "Total enrolled students"
        ? tr("Total enrolled students", "Total des etudiants inscrits")
        : s.label === "Active users (onboarded)"
          ? tr("Active users (onboarded)", "Utilisateurs actifs (onboardes)")
          : s.label === "Activation rate"
            ? tr("Activation rate", "Taux d'activation")
            : tr("Avg. career readiness", "Maturite carriere moyenne"),
    trend: tr(
      s.trend,
      s.trend
        .replace("vs last month", "vs mois dernier")
        .replace("pts", "pts"),
    ),
  }));
  const localizedPathways = PATHWAYS.map((p) => ({
    ...p,
    name:
      p.name === "Management Consultant"
        ? tr("Management Consultant", "Consultant en management")
        : p.name === "Software Engineer"
          ? tr("Software Engineer", "Ingenieur logiciel")
          : p.name === "Financial Analyst"
            ? tr("Financial Analyst", "Analyste financier")
            : p.name === "HR Manager"
              ? tr("HR Manager", "Responsable RH")
              : p.name === "Marketing Manager"
                ? tr("Marketing Manager", "Responsable marketing")
                : p.name,
  }));
  const localizedFields = FIELDS.map((f) => ({
    ...f,
    name:
      f.name === "Engineering"
        ? tr("Engineering", "Ingenierie")
        : f.name === "Business"
          ? tr("Business", "Business")
          : f.name === "Sciences"
            ? tr("Sciences", "Sciences")
            : f.name === "Other"
              ? tr("Other", "Autre")
              : f.name,
  }));
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const maxGap = SKILLS_GAP[0].count;

  const filteredSorted = useMemo(() => {
    const t = search.trim().toLowerCase();
    let rows = STUDENTS;
    if (t) {
      rows = rows.filter(
        (s) =>
          s.name.toLowerCase().includes(t) ||
          s.field.toLowerCase().includes(t) ||
          s.level.toLowerCase().includes(t),
      );
    }
    return [...rows].sort((a, b) => {
      const av = a[sortBy] as string | number;
      const bv = b[sortBy] as string | number;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [search, sortBy, sortDir]);

  function toggleSort(col: SortKey) {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">{tr("Institutional dashboard", "Tableau de bord institutionnel")}</h1>
        <p className="text-muted-foreground">
          {tr(
            "Live view of cohort engagement, career-readiness and skills gaps across your university.",
            "Vue en direct de l'engagement des cohortes, de la maturite carriere et des ecarts de competences de votre universite.",
          )}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {localizedStats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-3xl font-bold mt-2 text-accent">
              {s.value}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              {s.trend}
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">{tr("Top career pathways chosen", "Parcours de carriere les plus choisis")}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={localizedPathways} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" width={130} fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">{tr("Students by field of study", "Etudiants par domaine d'etude")}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={localizedFields} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                  {localizedFields.map((_, i) => (
                    <Cell key={i} fill={FIELD_COLORS[i % FIELD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => `${v}%`}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">{tr("Weekly active users (last 12 weeks)", "Utilisateurs actifs hebdomadaires (12 dernieres semaines)")}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WAU}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2.5}
                  dot={{ fill: "hsl(var(--accent))", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Skills gap heatmap */}
      <Card className="p-6">
        <h2 className="font-semibold mb-1">{tr("Most common skills gaps across your cohort", "Ecarts de competences les plus frequents de votre cohorte")}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {tr("Color intensity reflects how many students lack each skill.", "L'intensite de la couleur montre combien d'etudiants manquent chaque competence.")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SKILLS_GAP.map((g) => {
            const intensity = g.count / maxGap; // 0..1
            // light indigo -> deep indigo
            const bg = `rgba(99, 102, 241, ${0.08 + intensity * 0.82})`;
            const dark = intensity > 0.55;
            return (
              <div
                key={g.skill}
                className="rounded-lg p-4 border border-border transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: bg }}
              >
                <p className={cn("font-semibold text-sm leading-tight", dark ? "text-white" : "text-foreground")}>
                  {g.skill}
                </p>
                <p className={cn("text-xs mt-2", dark ? "text-white/85" : "text-muted-foreground")}>
                  {g.count} {tr("students", "etudiants")}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Engagement table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-semibold">{tr("Student engagement", "Engagement etudiant")}</h2>
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr("Search by name, field or level...", "Rechercher par nom, domaine ou niveau...")}
              className="pl-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                {([
                  ["name", tr("Name", "Nom")],
                  ["field", tr("Field of study", "Domaine d'etude")],
                  ["level", tr("Level", "Niveau")],
                  ["onboarding", tr("Onboarding", "Onboarding")],
                  ["readiness", tr("Readiness score", "Score de maturite")],
                  ["lastActive", tr("Last active", "Derniere activite")],
                ] as [SortKey, string][]).map(([k, label]) => (
                  <th
                    key={k}
                    className="py-3 px-2 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                    onClick={() => toggleSort(k)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                      {sortBy === k && (
                        <span className="text-foreground">{sortDir === "asc" ? "↑" : "↓"}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((s) => (
                <tr key={s.name} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="py-3 px-2 font-medium">{s.name}</td>
                  <td className="py-3 px-2 text-muted-foreground">{s.field}</td>
                  <td className="py-3 px-2 text-muted-foreground">{s.level}</td>
                  <td className="py-3 px-2">
                    <StatusBadge status={s.onboarding} />
                  </td>
                  <td className="py-3 px-2 font-semibold">
                    {s.readiness > 0 ? `${s.readiness}/100` : "—"}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {new Date(s.lastActive).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredSorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    {tr("No students match your search.", "Aucun etudiant ne correspond a votre recherche.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "In progress": "bg-accent-soft text-accent border border-accent/25",
    "Not started": "bg-secondary text-muted-foreground border border-border",
  };
  return (
    <span className={cn("text-xs px-2 py-1 rounded-full font-medium", styles[status])}>
      {status}
    </span>
  );
}
