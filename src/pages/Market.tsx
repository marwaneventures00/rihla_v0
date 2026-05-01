import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Search, ArrowUpRight, ArrowRight, TrendingUp, Users, GraduationCap } from "lucide-react";
import { SECTORS, ROLES, EMPLOYERS, getRoleDetail, type Outlook } from "@/lib/marketData";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ScatterChart, Scatter, ZAxis, LabelList } from "recharts";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

const outlookStyles: Record<Outlook, string> = {
  Hot: "bg-accent-soft text-accent border-0",
  Stable: "bg-secondary text-foreground border-0",
  Declining: "bg-muted text-muted-foreground border-0",
};

export default function Market() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const [activeTab, setActiveTab] = useState("sectors");
  const [rolesPrefill, setRolesPrefill] = useState("");

  function exploreSector(sectorName: string) {
    setRolesPrefill(sectorName);
    setActiveTab("roles");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Terrain</h1>
        <p className="text-muted-foreground">{tr("Navigate Morocco's job market in real terms — sectors, roles, employers and emerging trends.", "Explorez le marche de l'emploi marocain en pratique : secteurs, roles, employeurs et tendances emergentes.")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sectors">{tr("Sectors", "Secteurs")}</TabsTrigger>
          <TabsTrigger value="roles">{tr("Roles", "Roles")}</TabsTrigger>
          <TabsTrigger value="employers">{tr("Employers", "Employeurs")}</TabsTrigger>
          <TabsTrigger value="trends">{tr("Trends", "Tendances")}</TabsTrigger>
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-accent hover:text-accent"
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
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-soft text-accent text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <div className="pt-1">
                      <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Link to="/pathways">{tr("View related pathways", "Voir les parcours associes")} <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
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
          <Badge className="bg-accent-soft text-accent border-0 mb-3">Tech & Digital</Badge>
          <h3 className="font-bold mb-1">{tr("Tech sector hiring up 24% YoY in Casablanca", "Le recrutement Tech progresse de 24% en glissement annuel a Casablanca")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{tr("Quarterly job openings tracked across major tech employers.", "Offres d'emploi trimestrielles suivies chez les principaux employeurs tech.")}</p>
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
          <h3 className="font-bold mb-1">{tr("Consulting firms recruit non-business profiles", "Les cabinets de conseil recrutent des profils hors business")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{tr("Background distribution of analyst-level hires this year.", "Repartition des profils recrutes au niveau analyste cette annee.")}</p>
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
          <h3 className="font-bold mb-1">{tr("Remote work adoption keeps climbing", "L'adoption du travail a distance continue de progresser")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{tr("% of new postings offering hybrid or remote arrangements.", "% des nouvelles offres proposant des modalites hybrides ou a distance.")}</p>
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
              <Scatter data={sectorDemand} fill="hsl(var(--accent))" fillOpacity={0.8}>
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

        <div className="mt-6 rounded-md p-4 border-l-4 border-l-accent bg-accent/5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-accent">{tr("Key insight", "Point cle")}</p>
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
              <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center mb-3">
                <s.icon className="w-5 h-5 text-accent" />
              </div>
              <p className="text-3xl font-bold leading-none mb-1.5 text-accent">{s.value}</p>
              <p className="text-sm font-medium leading-snug mb-2">{s.label}</p>
              <p className="text-xs text-muted-foreground">Source: {s.source}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
