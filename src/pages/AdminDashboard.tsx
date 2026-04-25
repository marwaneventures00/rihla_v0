import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, ArrowUpDown } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

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
const FIELD_COLORS = ["#1A1A2E", "#C8102E", "#2D2D52", "#E85D6F", "#4A4A6A"];

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
        <h1 className="text-3xl font-bold mb-1">Institutional dashboard</h1>
        <p className="text-muted-foreground">
          Live view of cohort engagement, career-readiness and skills gaps across your university.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-3xl font-bold mt-2" style={{ color: "#C8102E" }}>
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
          <h2 className="font-semibold mb-4">Top career pathways chosen</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PATHWAYS} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" width={130} fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#C8102E" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Students by field of study</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={FIELDS} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                  {FIELDS.map((_, i) => (
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
          <h2 className="font-semibold mb-4">Weekly active users (last 12 weeks)</h2>
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
                  stroke="#C8102E"
                  strokeWidth={2.5}
                  dot={{ fill: "#C8102E", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Skills gap heatmap */}
      <Card className="p-6">
        <h2 className="font-semibold mb-1">Most common skills gaps across your cohort</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Color intensity reflects how many students lack each skill.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SKILLS_GAP.map((g) => {
            const intensity = g.count / maxGap; // 0..1
            // light pink -> deep red
            const bg = `rgba(200, 16, 46, ${0.08 + intensity * 0.82})`;
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
                  {g.count} students
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Engagement table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-semibold">Student engagement</h2>
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, field or level…"
              className="pl-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                {([
                  ["name", "Name"],
                  ["field", "Field of study"],
                  ["level", "Level"],
                  ["onboarding", "Onboarding"],
                  ["readiness", "Readiness score"],
                  ["lastActive", "Last active"],
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
                    No students match your search.
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
    "In progress": "bg-amber-50 text-amber-700 border border-amber-200",
    "Not started": "bg-secondary text-muted-foreground border border-border",
  };
  return (
    <span className={cn("text-xs px-2 py-1 rounded-full font-medium", styles[status])}>
      {status}
    </span>
  );
}
