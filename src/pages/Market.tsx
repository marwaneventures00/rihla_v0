import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Search, ArrowUpRight } from "lucide-react";
import { SECTORS, ROLES, EMPLOYERS, type Outlook } from "@/lib/marketData";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

const outlookStyles: Record<Outlook, string> = {
  Hot: "bg-accent-soft text-accent border-0",
  Stable: "bg-secondary text-foreground border-0",
  Declining: "bg-orange-100 text-orange-700 border-0",
};

export default function Market() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Labor market intelligence</h1>
        <p className="text-muted-foreground">Explore Morocco's job market in real terms — sectors, roles, employers and emerging trends.</p>
      </div>

      <Tabs defaultValue="sectors">
        <TabsList>
          <TabsTrigger value="sectors">Sectors</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="employers">Employers</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="sectors" className="mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTORS.map((s) => (
              <Card key={s.name} className="p-5 hover:shadow-elevated transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-accent" />
                  </div>
                  <Badge className={outlookStyles[s.outlook]}>{s.outlook}</Badge>
                </div>
                <h3 className="font-semibold mb-1.5">{s.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{s.description}</p>
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
                  Explore <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-6"><RolesTab /></TabsContent>
        <TabsContent value="employers" className="mt-6"><EmployersTab /></TabsContent>
        <TabsContent value="trends" className="mt-6"><TrendsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function RolesTab() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return ROLES;
    return ROLES.filter((r) =>
      r.title.toLowerCase().includes(t) || r.sector.toLowerCase().includes(t) || r.skills.some((s) => s.toLowerCase().includes(t))
    );
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles, sectors, or skills…" className="pl-9" />
      </div>
      <div className="space-y-2">
        {filtered.map((r) => {
          const isOpen = open === r.title;
          return (
            <Card key={r.title} className="overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : r.title)} className="w-full p-4 flex items-center gap-4 text-left hover:bg-secondary/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{r.title}</span>
                    <Badge variant="secondary" className="text-xs">{r.sector}</Badge>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full",
                      r.level === "Entry" && "bg-accent-soft text-accent",
                      r.level === "Mid" && "bg-secondary text-foreground",
                      r.level === "Senior" && "bg-primary text-primary-foreground",
                    )}>{r.level}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {r.salaryMin.toLocaleString()}–{r.salaryMax.toLocaleString()} MAD/mo
                  </p>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-border bg-secondary/20">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Key skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.skills.map((s) => <span key={s} className="text-xs px-2 py-1 rounded-md bg-card border border-border">{s}</span>)}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No roles match your search.</p>}
      </div>
    </div>
  );
}

function EmployersTab() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {EMPLOYERS.map((e) => (
        <Card key={e.name} className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-sm">
              {e.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
            <Badge variant="secondary" className="text-xs">{e.size}</Badge>
          </div>
          <h3 className="font-semibold mb-0.5 leading-snug">{e.name}</h3>
          <p className="text-xs text-muted-foreground mb-3">{e.sector}</p>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs">
              <span className={cn("w-2 h-2 rounded-full", e.hiring ? "bg-accent animate-pulse" : "bg-muted-foreground/40")} />
              {e.hiring ? "Actively hiring" : "Not hiring"}
            </span>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs">Learn more</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TrendsTab() {
  const techData = [
    { quarter: "Q1 23", openings: 980 }, { quarter: "Q2 23", openings: 1080 },
    { quarter: "Q3 23", openings: 1140 }, { quarter: "Q4 23", openings: 1190 },
    { quarter: "Q1 24", openings: 1250 }, { quarter: "Q2 24", openings: 1340 },
  ];
  const consultingData = [
    { profile: "Business", pct: 58 }, { profile: "Engineering", pct: 22 },
    { profile: "Sciences", pct: 11 }, { profile: "Other", pct: 9 },
  ];
  const remoteData = [
    { month: "Jan", pct: 18 }, { month: "Feb", pct: 21 }, { month: "Mar", pct: 24 },
    { month: "Apr", pct: 27 }, { month: "May", pct: 29 }, { month: "Jun", pct: 31 },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card className="p-6">
        <Badge className="bg-accent-soft text-accent border-0 mb-3">Tech & Digital</Badge>
        <h3 className="font-bold mb-1">Tech sector hiring up 24% YoY in Casablanca</h3>
        <p className="text-sm text-muted-foreground mb-4">Quarterly job openings tracked across major tech employers.</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={techData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="quarter" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="openings" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <Badge className="bg-accent-soft text-accent border-0 mb-3">Consulting</Badge>
        <h3 className="font-bold mb-1">Consulting firms recruit non-business profiles</h3>
        <p className="text-sm text-muted-foreground mb-4">Background distribution of analyst-level hires this year.</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={consultingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="profile" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="pct" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <Badge className="bg-accent-soft text-accent border-0 mb-3">Workplace</Badge>
        <h3 className="font-bold mb-1">Remote work adoption keeps climbing</h3>
        <p className="text-sm text-muted-foreground mb-4">% of new postings offering hybrid or remote arrangements.</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={remoteData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="pct" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
