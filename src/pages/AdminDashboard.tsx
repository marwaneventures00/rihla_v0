import { Card } from "@/components/ui/card";
import { TrendingUp, ArrowRight, Target } from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

/* ---------- Mock data (presentational only — no backend) ---------- */

const STATS = [
  { key: "enrolled", value: "4 500", trend: "+12% vs mois dernier" },
  { key: "active", value: "312", trend: "+8% vs mois dernier" },
  { key: "activation", value: "6.9%", trend: "+1.4 pts vs mois dernier" },
  { key: "readiness", value: "58/100", trend: "+3 pts vs mois dernier" },
] as const;

const WAU = [
  40, 48, 55, 62, 70, 82, 95, 110, 128, 144, 162, 180,
].map((users, i) => ({ week: `S${i + 1}`, users }));

const COHORT_READINESS = 72;

const SKILL_GAP_AREAS = [
  { skill: "Financial modeling", pct: 64 },
  { skill: "Data analysis", pct: 48 },
  { skill: "Case interviewing", pct: 37 },
];

const PATHWAYS = [
  { name: "Data Analyst", count: 89 },
  { name: "Consultant en management", count: 74 },
  { name: "Ingenieur logiciel", count: 61 },
  { name: "Analyste financier", count: 55 },
  { name: "Responsable RH", count: 38 },
  { name: "Responsable marketing", count: 29 },
];

const FIELDS = [
  { name: "Ingenierie", value: 34 },
  { name: "Business", value: 28 },
  { name: "IT", value: 18 },
  { name: "Sciences", value: 12 },
  { name: "Autre", value: 8 },
];

const FIELD_COLORS = ["#2A2A36", "#3D3D4A", "#52525E", "#6B6B78", "#858592"];

const OUTCOMES = [
  { label: "Taux d'emploi des diplomes", value: "78%", delta: "▲ 6% vs cohorte precedente", up: true },
  { label: "Temps moyen d'acces au 1er emploi", value: "4.2 mois", delta: null, up: false },
  { label: "Adequation poste/diplome", value: "81%", delta: null, up: false },
] as const;

type FollowStatus = "good" | "watch";
type FollowStudent = { name: string; field: string; readiness: number; status: FollowStatus };

const FOLLOW_UP_STUDENTS: FollowStudent[] = [
  { name: "Nour El Houda Idrissi", field: "Business", readiness: 81, status: "good" },
  { name: "Yasmine El Amrani", field: "Ingenierie", readiness: 78, status: "good" },
  { name: "Salma Bouazza", field: "IT", readiness: 52, status: "watch" },
  { name: "Imane Lahlou", field: "IT", readiness: 48, status: "watch" },
  { name: "Karim Tazi", field: "Sciences", readiness: 23, status: "watch" },
];

/* ---------- Component ---------- */

export default function AdminDashboard() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);

  const statLabels: Record<string, string> = {
    enrolled: tr("Total enrolled students", "Total des etudiants inscrits"),
    active: tr("Active users", "Utilisateurs actifs"),
    activation: tr("Activation rate", "Taux d'activation"),
    readiness: tr("Avg. career readiness", "Maturite carriere moyenne"),
  };

  return (
    <div className="space-y-12">
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

      {/* ============ BLOC 1 — ADOPTION ============ */}
      <section className="space-y-5">
        <SectionHeader
          index={1}
          title={tr("Adoption", "Adoption")}
          question={tr("Are students using the platform?", "Les etudiants utilisent-ils la plateforme ?")}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <Card key={s.key} className="p-5">
              <p className="text-sm text-muted-foreground">{statLabels[s.key]}</p>
              <p className="text-3xl font-bold mt-2 text-primary">{s.value}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                {s.trend}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">
            {tr("Weekly active users (last 12 weeks)", "Utilisateurs actifs hebdomadaires (12 dernieres semaines)")}
          </h2>
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
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* ============ BLOC 2 — PREPARATION / READINESS ============ */}
      <section className="space-y-5">
        <SectionHeader
          index={2}
          title={tr("Cohort readiness", "Preparation de la cohorte")}
          question={tr("Are they ready for the job market?", "Sont-ils prets pour le marche du travail ?")}
        />

        <Card className="p-6">
          <div className="grid gap-6 lg:grid-cols-[auto,1fr] lg:items-center">
            <div>
              <p className="text-sm text-muted-foreground">{tr("Cohort readiness", "Maturite moyenne de la cohorte")}</p>
              <p className="text-6xl font-black leading-none tracking-[-0.03em] text-primary mt-2">
                {COHORT_READINESS}%
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{tr("Average readiness across the cohort", "Readiness moyenne de la cohorte")}</span>
                <span className="font-semibold text-foreground">{COHORT_READINESS}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${COHORT_READINESS}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>0%</span>
                <span>{tr("Target 80%", "Objectif 80%")}</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ============ BLOC 3 — ECARTS DE COMPETENCES ============ */}
      <section className="space-y-5">
        <SectionHeader
          index={3}
          title={tr("Skills gaps", "Ecarts de competences")}
          question={tr("Where should support be focused?", "Ou concentrer l'accompagnement ?")}
        />

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="font-semibold">{tr("Skills gap by area", "Ecarts de competences par domaine")}</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-[var(--red-subtle)] px-3 py-1 text-xs font-semibold text-primary">
              <Target className="w-3.5 h-3.5" />
              {tr("Top skills gap: Financial modeling", "Top skills gap : Financial modeling")}
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SKILL_GAP_AREAS} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="skill" type="category" width={130} fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, tr("Gap", "Ecart")]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="p-6">
            <h2 className="font-semibold mb-4">{tr("Top career pathways chosen", "Parcours de carriere les plus choisis")}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PATHWAYS} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={130} fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold mb-4">{tr("Students by field of study", "Etudiants par domaine d'etude")}</h2>
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
        </div>
      </section>

      {/* ============ BLOC 4 — OUTCOMES / OBSERVATOIRE ============ */}
      <section className="space-y-5">
        <SectionHeader
          index={4}
          title={tr("Graduate outcomes", "Devenir des diplomes")}
          question={tr("What results do graduates achieve?", "Quels resultats pour les diplomes ?")}
        />

        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {OUTCOMES.map((o) => (
              <div key={o.label} className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs font-medium text-muted-foreground leading-tight">{o.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-[-0.02em] text-primary">{o.value}</p>
                {o.delta && (
                  <p className="mt-1 text-xs font-semibold text-emerald-600">{o.delta}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <Link
              to="/admin/observatoire"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4"
            >
              {tr("View the full Observatoire", "Voir l'Observatoire complet")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </section>

      {/* ============ BLOC 5 — SUIVI DES ETUDIANTS ============ */}
      <section className="space-y-5">
        <SectionHeader
          index={5}
          title={tr("Students to follow", "Etudiants necessitant un suivi")}
          question={tr("Who should be supported first?", "Qui accompagner en priorite ?")}
        />

        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-3 px-2 font-medium text-muted-foreground">{tr("Name", "Nom")}</th>
                  <th className="py-3 px-2 font-medium text-muted-foreground">{tr("Field", "Domaine")}</th>
                  <th className="py-3 px-2 font-medium text-muted-foreground">{tr("Readiness", "Readiness")}</th>
                  <th className="py-3 px-2 font-medium text-muted-foreground">{tr("Status", "Statut")}</th>
                </tr>
              </thead>
              <tbody>
                {FOLLOW_UP_STUDENTS.map((s) => (
                  <tr key={s.name} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="py-3 px-2 font-medium">{s.name}</td>
                    <td className="py-3 px-2 text-muted-foreground">{s.field}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold w-9">{s.readiness}%</span>
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                          <div
                            className={cn("h-full rounded-full", s.status === "good" ? "bg-emerald-500" : "bg-amber-500")}
                            style={{ width: `${s.readiness}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <FollowBadge status={s.status} tr={tr} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

/* ---------- Helpers ---------- */

function SectionHeader({ index, title, question }: { index: number; title: string; question: string }) {
  return (
    <div className="flex items-baseline gap-3 flex-wrap border-b border-border pb-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--red-subtle)] text-xs font-bold text-primary">
        {index}
      </span>
      <h2 className="text-xl font-bold">{title}</h2>
      <span className="text-sm text-muted-foreground">{question}</span>
    </div>
  );
}

function FollowBadge({ status, tr }: { status: FollowStatus; tr: (en: string, fr: string) => string }) {
  if (status === "good") {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        {tr("On track", "En bonne voie")}
      </span>
    );
  }
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">
      {tr("Needs support", "A accompagner")}
    </span>
  );
}
