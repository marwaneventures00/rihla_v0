import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Search, ArrowUpRight, ArrowRight, TrendingUp, Users, GraduationCap, Target, Calendar, RefreshCw } from "lucide-react";
import { SECTORS, ROLES, EMPLOYERS, getRoleDetail, type Outlook } from "@/lib/marketData";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ScatterChart, Scatter, ZAxis, LabelList } from "recharts";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const outlookStyles: Record<Outlook, string> = {
  Hot: "bg-primary text-primary-foreground border-0 rounded-full text-[10px] font-semibold px-2 py-0.5",
  Stable: "bg-muted text-muted-foreground border-0 rounded-full text-[10px] font-medium px-2 py-0.5",
  Declining: "bg-muted text-muted-foreground border-0 rounded-full text-[10px] font-medium px-2 py-0.5",
};

type MyViewCompany = {
  name: string;
  open_positions: number;
  match_percentage: number;
  city: string;
  why_good_fit: string;
};

type MyViewSkillGap = {
  skill: string;
  demand_level: string;
  learn_resource: string;
};

type MyViewData = {
  sector_summary: string;
  trending_up: boolean;
  trend_percentage: number;
  top_companies: MyViewCompany[];
  skill_gaps: MyViewSkillGap[];
  salary_data: {
    junior: string;
    mid: string;
    senior: string;
    city: string;
  };
  hiring_timeline: string;
  insider_tip: string;
};

function parseMyView(raw: unknown): MyViewData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    sector_summary: String(o.sector_summary ?? ""),
    trending_up: Boolean(o.trending_up),
    trend_percentage: Number(o.trend_percentage ?? 0),
    top_companies: Array.isArray(o.top_companies)
      ? o.top_companies.map((c) => {
          const x = c as Record<string, unknown>;
          return {
            name: String(x.name ?? ""),
            open_positions: Number(x.open_positions ?? 0),
            match_percentage: Number(x.match_percentage ?? 0),
            city: String(x.city ?? ""),
            why_good_fit: String(x.why_good_fit ?? ""),
          };
        })
      : [],
    skill_gaps: Array.isArray(o.skill_gaps)
      ? o.skill_gaps.map((g) => {
          const x = g as Record<string, unknown>;
          return {
            skill: String(x.skill ?? ""),
            demand_level: String(x.demand_level ?? ""),
            learn_resource: String(x.learn_resource ?? ""),
          };
        })
      : [],
    salary_data: {
      junior: String((o.salary_data as Record<string, unknown> | undefined)?.junior ?? ""),
      mid: String((o.salary_data as Record<string, unknown> | undefined)?.mid ?? ""),
      senior: String((o.salary_data as Record<string, unknown> | undefined)?.senior ?? ""),
      city: String((o.salary_data as Record<string, unknown> | undefined)?.city ?? "Casablanca"),
    },
    hiring_timeline: String(o.hiring_timeline ?? ""),
    insider_tip: String(o.insider_tip ?? ""),
  };
}

export default function Market() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const [viewTab, setViewTab] = useState<"overview" | "my-view">("overview");
  const [activeTab, setActiveTab] = useState("sectors");
  const [rolesPrefill, setRolesPrefill] = useState("");

  function exploreSector(sectorName: string) {
    setRolesPrefill(sectorName);
    setActiveTab("roles");
  }

  useEffect(() => {
    document.title = "Field — Cariva";
    const nodes = document.querySelectorAll(".page-container");
    const el = nodes[nodes.length - 1] as HTMLElement | undefined;
    if (el) requestAnimationFrame(() => el.classList.add("page-visible"));
  }, []);

  const marketOverviewContent = (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full h-auto p-0 bg-transparent rounded-none border-b border-border justify-start gap-1">
        <TabsTrigger
          value="sectors"
          className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground font-normal data-[state=active]:font-medium"
        >
          Sectors
        </TabsTrigger>
        <TabsTrigger
          value="roles"
          className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground font-normal data-[state=active]:font-medium"
        >
          Roles
        </TabsTrigger>
        <TabsTrigger
          value="employers"
          className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground font-normal data-[state=active]:font-medium"
        >
          Employers
        </TabsTrigger>
        <TabsTrigger
          value="trends"
          className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground font-normal data-[state=active]:font-medium"
        >
          Trends
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sectors" className="mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTORS.map((s) => (
            <Card key={s.name} className="p-6 hover:bg-muted/40 transition-colors border-border/80">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <s.icon className="w-[18px] h-[18px] text-muted-foreground" />
                </div>
                <Badge className={outlookStyles[s.outlook]}>{s.outlook}</Badge>
              </div>
              <h3 className="text-[15px] font-medium mb-1.5">{s.name}</h3>
              <p className="text-[13px] text-muted-foreground line-clamp-2 mb-4 leading-snug">{s.description}</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground p-0 h-auto font-normal text-[13px] group/btn"
                onClick={() => exploreSector(s.name)}
              >
                {tr("Explore", "Explorer")} <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="roles" className="mt-6"><RolesTab prefill={rolesPrefill} /></TabsContent>
      <TabsContent value="employers" className="mt-6"><EmployersTab /></TabsContent>
      <TabsContent value="trends" className="mt-6"><TrendsTab /></TabsContent>
    </Tabs>
  );

  return (
    <div className="page-container w-full space-y-6 text-[14px] leading-normal text-[#0A0A0A]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div>
        <h1
          className="mb-2 text-[32px] font-bold leading-tight text-[#0A0A0A]"
          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
        >
          Field
        </h1>
        <p className="mb-8 max-w-2xl text-[15px] leading-[1.6] text-[#6B6B6B]">
          Explore the Moroccan job market: sectors, roles, employers and emerging trends.
        </p>
      </div>

      <div
        style={{
          background: "#F5F5F5",
          borderRadius: 100,
          padding: 4,
          display: "inline-flex",
          gap: 4,
        }}
      >
        {[
          { id: "overview" as const, label: "Market Overview" },
          { id: "my-view" as const, label: "My View" },
        ].map((t) => {
          const active = viewTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setViewTab(t.id)}
              style={{
                background: active ? "white" : "transparent",
                border: "none",
                borderRadius: 100,
                boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                fontWeight: active ? 600 : 400,
                color: active ? "#0A0A0A" : "#6B6B6B",
                padding: "8px 20px",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {viewTab === "overview" ? marketOverviewContent : <MyViewTab onStartPath={() => navigate("/learn/path")} />}
    </div>
  );
}

function MyViewTab({ onStartPath }: { onStartPath: () => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<string | null>(null);
  const [data, setData] = useState<MyViewData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("today");

  const fetchMyView = async (force = false) => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;

      const { data: pathway } = await supabase
        .from("pathway_results")
        .select("confidence_score, archetypes, recommended_track, result_json")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const resultObj = (pathway?.result_json ?? {}) as Record<string, unknown>;
      const archetypes = Array.isArray(pathway?.archetypes) ? (pathway?.archetypes as unknown[]) : [];
      const firstArch = (archetypes[0] ?? {}) as Record<string, unknown>;
      const pickedTrack =
        pathway?.recommended_track ||
        (typeof resultObj.recommended_track === "string" ? resultObj.recommended_track : null) ||
        (typeof firstArch.title === "string" ? firstArch.title : null) ||
        null;

      setTrack(pickedTrack);
      if (!pickedTrack) {
        setData(null);
        setLoading(false);
        return;
      }

      const dateKey = new Date().toISOString().slice(0, 10);
      const cacheKey = `field_myview_${uid}_${dateKey}`;
      if (!force) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = parseMyView(JSON.parse(cached));
          if (parsed) {
            setData(parsed);
            setLastUpdated("today");
            setLoading(false);
            return;
          }
        }
      }

      const prompt = `You are a Moroccan job market expert.
This student's career target is: ${pickedTrack}

Generate personalized Moroccan job market
intelligence for this specific career path.
Respond ONLY with valid JSON:
{
  "sector_summary": "2-3 sentence insight about their sector in Morocco this month — be specific and data-driven",
  "trending_up": true,
  "trend_percentage": 23,
  "top_companies": [
    {
      "name": "Company name",
      "open_positions": 2,
      "match_percentage": 91,
      "city": "Casablanca",
      "why_good_fit": "one sentence"
    }
  ],
  "skill_gaps": [
    {
      "skill": "Financial Modeling",
      "demand_level": "high",
      "learn_resource": "Coursera"
    }
  ],
  "salary_data": {
    "junior": "8,000 - 12,000 MAD",
    "mid": "15,000 - 25,000 MAD",
    "senior": "25,000 - 40,000 MAD",
    "city": "Casablanca"
  },
  "hiring_timeline": "Q2 2026 is peak hiring season for this sector",
  "insider_tip": "one actionable tip specific to breaking into this field in Morocco"
}`;

      const { data: aiRes } = await supabase.functions.invoke("chat-ai", {
        body: {
          messages: [{ role: "user", content: prompt }],
          model: "claude-haiku-4-5-20251001",
        },
      });
      const reply = String((aiRes as { reply?: unknown })?.reply ?? "");
      const matched = reply.match(/\{[\s\S]*\}/);
      if (!matched) {
        setData(null);
        setLoading(false);
        return;
      }
      const parsed = parseMyView(JSON.parse(matched[0]));
      if (parsed) {
        setData(parsed);
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
      }
      setLastUpdated("today");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMyView(false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 w-full animate-pulse rounded-xl bg-[#EFEFEF]" />
        <div className="h-20 w-full animate-pulse rounded-xl bg-[#EFEFEF]" />
        <div className="h-28 w-full animate-pulse rounded-xl bg-[#EFEFEF]" />
      </div>
    );
  }

  if (!track) {
    return (
      <div
        style={{
          background: "white",
          borderRadius: 16,
          border: "1px solid #E5E5E5",
          padding: 40,
          textAlign: "center",
        }}
      >
        <Target size={32} color="#AAAAAA" style={{ margin: "0 auto" }} />
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#6B6B6B", marginTop: 12 }}>
          Complete your Path conversation to unlock your personalized market view
        </p>
        <button
          type="button"
          onClick={onStartPath}
          style={{
            marginTop: 14,
            background: "#C8102E",
            color: "white",
            borderRadius: 100,
            padding: "10px 20px",
            border: "none",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Start Path →
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <section
        style={{
          background: "white",
          borderLeft: "4px solid #C8102E",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, textTransform: "uppercase", color: "#C8102E", letterSpacing: "0.1em" }}>
            YOUR SECTOR
          </p>
          {data.trending_up ? (
            <span style={{ background: "#F0FDF4", color: "#16A34A", borderRadius: 100, padding: "4px 12px", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600 }}>
              ↑ +{data.trend_percentage}% this month
            </span>
          ) : null}
        </div>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#0A0A0A", lineHeight: 1.7, marginTop: 12 }}>{data.sector_summary}</p>
      </section>

      <section style={{ background: "#0A0A0A", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
        <div className="flex items-center">
          <Calendar size={16} color="rgba(255,255,255,0.5)" />
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: 6 }}>Hiring Timeline</p>
        </div>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "white", fontWeight: 500, marginTop: 8 }}>{data.hiring_timeline}</p>
      </section>

      <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Companies matching your profile</h3>
      {data.top_companies.map((c) => (
        <div key={c.name} style={{ background: "white", borderRadius: 12, border: "1px solid #E5E5E5", padding: 20, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600 }}>{c.name}</p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6B6B6B", marginTop: 2 }}>{c.city}</p>
            <span style={{ display: "inline-block", background: "#F5F5F5", borderRadius: 100, padding: "4px 10px", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6B6B6B", marginTop: 8 }}>
              {c.open_positions} open positions
            </span>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6B6B6B", fontStyle: "italic", marginTop: 6 }}>{c.why_good_fit}</p>
          </div>
          <span style={{ background: "#FFF0F0", color: "#C8102E", borderRadius: 100, padding: "6px 14px", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600 }}>
            {c.match_percentage}% match
          </span>
        </div>
      ))}

      <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16, marginTop: 20 }}>Skills to prioritize now</h3>
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #E5E5E5", padding: "0 18px", marginBottom: 20 }}>
        {data.skill_gaps.map((g) => (
          <div key={g.skill} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F5F5F5" }}>
            <div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500 }}>{g.skill}</span>
              <span style={{ background: "#FFF0F0", color: "#C8102E", borderRadius: 100, padding: "3px 10px", fontFamily: "Inter, sans-serif", fontSize: 11, marginLeft: 8 }}>
                {g.demand_level} demand
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/develop?tab=resources")}
              style={{ border: "none", background: "transparent", color: "#C8102E", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500 }}
            >
              → Learn
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Salary ranges — {data.salary_data.city}
      </h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { label: "Junior", value: data.salary_data.junior, color: "#C8102E" },
          { label: "Mid", value: data.salary_data.mid, color: "#0A0A0A" },
          { label: "Senior", value: data.salary_data.senior, color: "#0A0A0A" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#F5F5F5", borderRadius: 12, padding: 20 }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6B6B6B", textTransform: "uppercase" }}>{s.label}</p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 700, color: s.color, marginTop: 8 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <section style={{ background: "#FFFBEB", borderRadius: 12, borderLeft: "4px solid #F59E0B", padding: "20px 24px", marginTop: 24 }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#B45309" }}>💡 Insider tip</p>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#0A0A0A", lineHeight: 1.7, marginTop: 8 }}>{data.insider_tip}</p>
      </section>

      <div className="mt-8 flex items-center justify-between">
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#AAAAAA" }}>Last updated: {lastUpdated}</p>
        <button
          type="button"
          onClick={() => void fetchMyView(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid #E5E5E5",
            borderRadius: 100,
            padding: "6px 14px",
            background: "transparent",
            color: "#6B6B6B",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
    </div>
  );
}

function RolesTab({ prefill = "" }: { prefill?: string }) {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (prefill && prefill !== q) setQ(prefill);
  }, [prefill]);

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
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Search roles, sectors, or skills...", "Rechercher des roles, secteurs ou competences...")} className="pl-9" />
      </div>
      <div className="space-y-2">
        {filtered.map((r) => {
          const isOpen = open === r.title;
          const detail = getRoleDetail(r);
          return (
            <div key={r.title} className="border-b border-border last:border-b-0">
              <button onClick={() => setOpen(isOpen ? null : r.title)} className="w-full min-h-[56px] px-2 py-3 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors rounded-md">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{r.title}</span>
                    <Badge variant="secondary" className="text-[11px] font-normal">
                      {r.sector}
                    </Badge>
                    <span
                      className={cn(
                        "text-[11px] px-2 py-0.5 rounded-full border",
                        r.level === "Entry" && "border-primary/30 bg-[var(--red-subtle)] text-primary",
                        r.level === "Mid" && "border-border bg-transparent text-muted-foreground",
                        r.level === "Senior" && "border-border bg-muted text-foreground",
                      )}
                    >
                      {r.level}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium text-primary tabular-nums shrink-0">{r.salaryMin.toLocaleString()}–{r.salaryMax.toLocaleString()} MAD/mo</p>
                {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pt-1 border-t border-border bg-secondary/20 space-y-5">
                    <section>
                      <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">{tr("Role overview", "Apercu du role")}</h4>
                      <p className="text-sm leading-relaxed">{detail.overview}</p>
                    </section>

                    <section>
                      <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{tr("Required skills", "Competences requises")}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.fullSkills.map((s) => (
                          <span key={s} className="text-xs px-2 py-1 rounded-md bg-card border border-border">{s}</span>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{tr("Career trajectory", "Trajectoire de carriere")}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {detail.trajectory.map((step, i) => (
                          <div key={step.year} className="flex items-center gap-2">
                            <div className="px-3 py-2 rounded-md bg-card border border-border">
                              <p className="text-[11px] font-semibold text-accent">{step.year}</p>
                              <p className="text-sm font-medium">{step.title}</p>
                            </div>
                            {i < detail.trajectory.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{tr("Top employers in Morocco", "Principaux employeurs au Maroc")}</h4>
                      <div className="grid sm:grid-cols-3 gap-2">
                        {detail.topEmployers.map((e) => (
                          <div key={e.name} className="px-3 py-2 rounded-md bg-card border border-border">
                            <p className="text-sm font-semibold leading-tight">{e.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{e.sector}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{tr("How to get there", "Comment y arriver")}</h4>
                      <ul className="space-y-1.5">
                        {detail.howToGetThere.map((step, i) => (
                          <li key={i} className="text-sm flex gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <div className="pt-1">
                      <Button asChild size="sm">
                        <Link to="/learn">{tr("View related pathways", "Voir les parcours associes")} <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">{tr("No roles match your search.", "Aucun role ne correspond a votre recherche.")}</p>}
      </div>
    </div>
  );
}

function EmployersTab() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {EMPLOYERS.map((e) => (
        <Card key={e.name} className="p-5">
          <div className="flex items-start justify-between mb-3">
            <EmployerLogo name={e.name} careersUrl={e.careersUrl} />
            <Badge variant="secondary" className="text-xs">{e.size}</Badge>
          </div>
          <h3 className="font-semibold mb-0.5 leading-snug">{e.name}</h3>
          <p className="text-xs text-muted-foreground mb-3">{e.sector}</p>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs">
              <span className={cn("w-2 h-2 rounded-full", e.hiring ? "bg-green-600" : "bg-muted-foreground/40")} />
              {e.hiring ? tr("Actively hiring", "Recrute activement") : tr("Not hiring", "Ne recrute pas")}
            </span>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
              <a href={e.careersUrl} target="_blank" rel="noreferrer">
                {tr("Learn more", "En savoir plus")}
              </a>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmployerLogo({ name, careersUrl }: { name: string; careersUrl: string }) {
  const [failed, setFailed] = useState(false);
  let domain = "";
  try {
    domain = new URL(careersUrl).hostname;
  } catch {
    domain = "";
  }
  const logoSrc = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : "";

  if (!logoSrc || failed) {
    const letter = name.trim()[0]?.toUpperCase() ?? "?";
    return (
      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
        {letter}
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
      <img
        src={logoSrc}
        alt={`${name} logo`}
        className="w-6 h-6 object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function TrendsTab() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const EUR_RATE = 10.8; // Approx MAD -> EUR conversion for display only
  const formatMAD = (v: number) => `${v.toLocaleString()} DH`;
  const formatEUR = (v: number) => `€${Math.round(v / EUR_RATE).toLocaleString()}`;

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

  const sectorDemand = [
    { sector: "Tech & Digital", demandScore: 87, salaryMAD: 17000, hiringDemand: 1400 },
    { sector: "Consulting", demandScore: 82, salaryMAD: 16000, hiringDemand: 1080 },
    { sector: "Finance & Banking", demandScore: 74, salaryMAD: 14500, hiringDemand: 920 },
    { sector: "Logistics", demandScore: 71, salaryMAD: 11800, hiringDemand: 760 },
    { sector: "Healthcare", demandScore: 68, salaryMAD: 12600, hiringDemand: 720 },
    { sector: "Energy & Industry", demandScore: 65, salaryMAD: 13800, hiringDemand: 650 },
    { sector: "Agribusiness", demandScore: 58, salaryMAD: 10400, hiringDemand: 470 },
    { sector: "Public Sector", demandScore: 52, salaryMAD: 9800, hiringDemand: 560 },
    { sector: "Marketing & Media", demandScore: 49, salaryMAD: 9200, hiringDemand: 540 },
    { sector: "Real Estate", demandScore: 41, salaryMAD: 8600, hiringDemand: 340 },
  ];

  const snapshot = [
    { icon: Users, value: "38.4%", label: "Youth unemployment rate", source: "HCP Q3 2025" },
    { icon: GraduationCap, value: "34%", label: "Cite education-job mismatch as top barrier", source: "Afrobarometer 2025" },
    { icon: TrendingUp, value: "1 in 3", label: "New graduates find a job within 6 months", source: "World Bank" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-6">
          <Badge variant="secondary" className="mb-3 text-[11px] font-normal">
            Tech & Digital
          </Badge>
          <h3 className="font-bold mb-1">{tr("Tech sector hiring up 24% YoY in Casablanca", "Le recrutement Tech progresse de 24% en glissement annuel a Casablanca")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{tr("Quarterly job openings tracked across major tech employers.", "Offres d'emploi trimestrielles suivies chez les principaux employeurs tech.")}</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={techData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="quarter" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="openings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <Badge variant="secondary" className="mb-3 text-[11px] font-normal">
            Consulting
          </Badge>
          <h3 className="font-bold mb-1">{tr("Consulting firms recruit non-business profiles", "Les cabinets de conseil recrutent des profils hors business")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{tr("Background distribution of analyst-level hires this year.", "Repartition des profils recrutes au niveau analyste cette annee.")}</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consultingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="profile" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <Badge variant="secondary" className="mb-3 text-[11px] font-normal">
            Workplace
          </Badge>
          <h3 className="font-bold mb-1">{tr("Remote work adoption keeps climbing", "L'adoption du travail a distance continue de progresser")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{tr("% of new postings offering hybrid or remote arrangements.", "% des nouvelles offres proposant des modalites hybrides ou a distance.")}</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={remoteData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="pct" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-bold text-lg mb-1">{tr("Sector demand map", "Carte de la demande par secteur")}</h3>
          <p className="text-sm text-muted-foreground">{tr("Bubble size = hiring demand, X = typical monthly salary (DH / €), Y = demand score.", "Taille des bulles = demande de recrutement, X = salaire mensuel type (DH / €), Y = score de demande.")}</p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 8, right: 16, top: 26, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="salaryMAD"
                domain={[8000, 18000]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k DH`}
                tickLine={false}
                axisLine={false}
                label={{ value: tr("Monthly salary", "Salaire mensuel"), position: "insideBottom", offset: -5, fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="demandScore"
                domain={[35, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{ value: tr("Demand score", "Score de demande"), angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <ZAxis type="number" dataKey="hiringDemand" range={[120, 2200]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(v: number, name: string) => {
                  if (name === "hiringDemand") return [v.toLocaleString(), tr("Hiring demand", "Demande de recrutement")];
                  if (name === "salaryMAD") return [`${formatMAD(v)} (${formatEUR(v)})`, tr("Typical monthly salary", "Salaire mensuel type")];
                  return [`${v}/100`, tr("Demand score", "Score de demande")];
                }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.sector ?? ""}
              />
              <Scatter data={sectorDemand} fill="hsl(var(--primary))" fillOpacity={0.75}>
                <LabelList
                  dataKey="sector"
                  position="top"
                  offset={8}
                  style={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 500 }}
                />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 rounded-md p-4 border-l-[3px] border-l-primary bg-[var(--red-subtle)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1 text-primary">{tr("Key insight", "Point cle")}</p>
          <p className="text-sm leading-relaxed text-foreground">
            {tr(
              "Tech & Digital and Consulting are the two fastest-growing sectors for graduate hiring in Morocco. Students with cross-disciplinary profiles (engineering + finance, tech + business) are seeing 40% higher interview rates.",
              "Tech & Digital et Consulting sont les deux secteurs qui progressent le plus vite pour le recrutement des jeunes diplomes au Maroc. Les etudiants aux profils transverses (ingenierie + finance, tech + business) obtiennent 40% de taux d'entretien en plus.",
            )}
          </p>
        </div>
      </Card>

      <div>
        <h3 className="font-bold text-lg mb-1">{tr("Graduate employment snapshot", "Etat de l'emploi des diplomes")}</h3>
        <p className="text-sm text-muted-foreground mb-4">{tr("Why this platform exists — the structural gap between graduates and the job market.", "Pourquoi cette plateforme existe : l'ecart structurel entre diplomes et marche de l'emploi.")}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {snapshot.map((s) => (
            <Card key={s.label} className="p-5">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                <s.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold leading-none mb-1.5 text-primary">{s.value}</p>
              <p className="text-sm font-medium leading-snug mb-2">{s.label}</p>
              <p className="text-xs text-muted-foreground">Source: {s.source}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
