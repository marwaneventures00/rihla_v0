import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Briefcase, Mic, Clock, Sparkles, ChevronRight, RefreshCw,
  Lightbulb, Building2, ExternalLink, ArrowLeft, CheckCircle2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { RESOURCES, RESOURCE_CATEGORIES, type Resource } from "@/lib/resourcesData";
import type { PathwayResult } from "@/lib/onboarding";

// ---------- Shared ----------

type Profile = {
  field_of_study: string | null;
  study_level: string | null;
  institution_type: string | null;
};

async function callForgeAI(action: string, payload: any) {
  const { data, error } = await supabase.functions.invoke("Forge-ai", {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any).result;
}

function ScoreCircle({ value, color = "var(--red)" }: { value: number; color?: string }) {
  const r = 52; const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{Math.round(value)}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

// =====================================================================
// Cases
// =====================================================================

const DIFFICULTIES = [
  { id: "Analyst", desc: "Entry level. Focus on structure and clear logic." },
  { id: "Consultant", desc: "Mid level. Numbers + recommendation expected." },
  { id: "Senior", desc: "Advanced. Synthesis, trade-offs, executive tone." },
];
const SECTORS = ["Consulting", "Finance & Banking", "Tech & Digital", "Energy", "Agribusiness", "Public Sector"];
const STARTERS = [
  "OCP Group: Entering the European fertilizer market",
  "Attijariwafa Bank: Digital banking strategy for Gen Z",
  "Maroc Telecom: 5G monetization framework",
  "Carrefour Maroc: Profitability recovery",
  "RAM (Royal Air Maroc): Route optimization",
];

type CaseData = {
  title: string; company: string; context: string; question: string;
  data_provided: string[]; hints: string[];
  expected_structure: { framework: string; key_buckets: string[]; quantitative_ask: string };
  model_answer_outline: string;
  scoring_criteria: Record<string, string>;
};
type CaseScore = {
  overall_score: number; grade: string;
  scores: { structure: number; quantitative: number; recommendation: number; morocco_context: number };
  strengths: string[]; improvements: string[];
  what_a_top_candidate_said: string; next_case_suggestion: string;
};

function BusinessCasesTab({ targetRole }: { targetRole?: string }) {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const [difficulty, setDifficulty] = useState("Consultant");
  const [sector, setSector] = useState(SECTORS[0]);
  const [generating, setGenerating] = useState(false);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [answer, setAnswer] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<CaseScore | null>(null);
  const [revealModel, setRevealModel] = useState(false);
  const timerRef = useRef<number | null>(null);
  const roleFocus = (targetRole ?? "").trim();

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem("case_draft");
    if (draft) setAnswer(draft);
  }, []);

  // Timer
  useEffect(() => {
    if (caseData && !score) {
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    }
  }, [caseData, score]);

  // Auto-save every 60s
  useEffect(() => {
    if (!caseData || score) return;
    const i = window.setInterval(() => {
      if (answer) localStorage.setItem("case_draft", answer);
    }, 60000);
    return () => window.clearInterval(i);
  }, [caseData, answer, score]);

  function fmtTime(s: number) {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  async function generate(starterTitle?: string) {
    setGenerating(true); setCaseData(null); setScore(null); setAnswer(""); setSeconds(0); setShowHints(false);
    try {
      const result = await callForgeAI("generate_case", {
        difficulty, sector, starter: starterTitle ?? null, target_role: roleFocus || null,
      });
      setCaseData(result);
      // Save to DB
      const { data: s } = await supabase.auth.getSession();
      if (s.session) {
        const { data: row } = await supabase.from("case_sessions").insert({
          user_id: s.session.user.id, case_json: result, difficulty, sector,
        }).select("id").single();
        if (row) setCaseId(row.id);
      }
    } catch (e: any) {
      toast.error(e.message || tr("Failed to generate case", "Echec de generation du cas"));
    } finally { setGenerating(false); }
  }

  async function submitForScoring() {
    if (!caseData || !answer.trim()) { toast.error(tr("Write your answer first.", "Ecrivez d'abord votre reponse.")); return; }
    setScoring(true);
    try {
      const result = await callForgeAI("score_case", {
        case_json: caseData, answer, difficulty,
      });
      setScore(result);
      localStorage.removeItem("case_draft");
      if (caseId) {
        await supabase.from("case_sessions").update({
          answer_text: answer, score_json: result, completed_at: new Date().toISOString(),
        }).eq("id", caseId);
      }
    } catch (e: any) {
      toast.error(e.message || tr("Scoring failed", "Echec de l'evaluation"));
    } finally { setScoring(false); }
  }

  function reset() {
    setCaseData(null); setScore(null); setAnswer(""); setSeconds(0); setCaseId(null); setShowHints(false); setRevealModel(false);
    localStorage.removeItem("case_draft");
  }

  // ---- Score screen ----
  if (score) {
    const gradeColor = score.grade === "Offer" ? "bg-emerald-500"
      : score.grade === "Strong Pass" ? "bg-[hsl(var(--primary))]"
      : score.grade === "Pass" ? "bg-amber-500" : "bg-accent";
    const dims = [
      { k: "Structure", v: score.scores.structure },
      { k: "Quantitative", v: score.scores.quantitative },
      { k: "Recommendation", v: score.scores.recommendation },
      { k: "Morocco context", v: score.scores.morocco_context },
    ];
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={reset}><ArrowLeft className="w-4 h-4" /> {tr("Back to cases", "Retour aux cas")}</Button>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ScoreCircle value={score.overall_score} />
            <div className="flex-1 text-center md:text-left">
              <Badge className={`${gradeColor} text-primary-foreground mb-2`}>{score.grade}</Badge>
              <h2 className="text-2xl font-bold">{caseData?.title}</h2>
              <p className="text-sm text-muted-foreground">{tr("Time", "Temps")} : {fmtTime(seconds)}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {dims.map((d) => (
              <div key={d.k}>
                <div className="flex justify-between text-sm mb-1"><span>{d.k}</span><span className="font-semibold">{d.v}/25</span></div>
                <Progress value={(d.v / 25) * 100} />
              </div>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5 border-l-4 border-l-emerald-500">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {tr("Strengths", "Points forts")}</h3>
            <ul className="space-y-2 text-sm">{score.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
          </Card>
          <Card className="p-5 border-l-4 border-l-amber-500">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> {tr("Areas to improve", "Axes d'amelioration")}</h3>
            <ul className="space-y-2 text-sm">{score.improvements.map((s, i) => <li key={i}>• {s}</li>)}</ul>
          </Card>
        </div>

        <Card className="p-5">
          <button onClick={() => setRevealModel((v) => !v)} className="flex items-center gap-2 font-semibold">
            <Lightbulb className="w-4 h-4 text-accent" /> {tr("What a top candidate said", "Ce qu'un excellent candidat a dit")}
            <ChevronRight className={`w-4 h-4 transition-transform ${revealModel ? "rotate-90" : ""}`} />
          </button>
          {revealModel && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{score.what_a_top_candidate_said}</p>}
        </Card>

        <Card className="p-5 bg-accent-soft">
          <p className="text-sm"><strong>{tr("Next case suggestion:", "Suggestion de prochain cas :")} </strong>{score.next_case_suggestion}</p>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button onClick={reset} className="bg-accent text-accent-foreground hover:bg-accent/90"><RefreshCw className="w-4 h-4" /> {tr("Try another case", "Essayer un autre cas")}</Button>
          <Button variant="outline">{tr("Practice interview for this role", "S'entrainer en entretien pour ce role")}</Button>
        </div>
      </div>
    );
  }

  // ---- Case interface ----
  if (caseData) {
    return (
      <div className="grid lg:grid-cols-[3fr_2fr] gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-2"><Building2 className="w-3 h-3" /> {caseData.company}</Badge>
              <h2 className="text-xl font-bold">{caseData.title}</h2>
            </div>
            <Badge className="bg-accent text-accent-foreground"><Clock className="w-3 h-3" /> {fmtTime(seconds)}</Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{caseData.context}</p>

          <div className="border-2 border-accent rounded-lg p-4 bg-accent/5">
            <p className="text-xs font-semibold text-accent mb-1">{tr("THE QUESTION", "LA QUESTION")}</p>
            <p className="font-medium">{caseData.question}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{tr("Data provided", "Donnees fournies")}</p>
            <div className="space-y-2">
              {caseData.data_provided.map((d, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-md border border-border">
                  <span className="text-xs font-bold text-accent">{i + 1}</span>
                  <span className="text-sm">{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Button variant="outline" size="sm" onClick={() => setShowHints((v) => !v)}>
              <Lightbulb className="w-4 h-4" /> {showHints ? tr("Hide", "Masquer") : tr("Show", "Afficher")} {tr("hints", "indices")}
            </Button>
            {showHints && (
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {caseData.hints.map((h, i) => <li key={i}>💡 {h}</li>)}
              </ul>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-3 self-start sticky top-20">
          <h3 className="font-semibold">{tr("Your answer", "Votre reponse")}</h3>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={tr("Structure your approach here. Start with your framework, then walk through each bucket...", "Structurez votre approche ici. Commencez par votre cadre, puis detaillez chaque volet...")}
            className="min-h-[300px]"
          />
          <p className="text-xs text-muted-foreground">{answer.length} characters</p>
          <Button onClick={submitForScoring} disabled={scoring} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {scoring ? tr("Scoring...", "Evaluation...") : tr("Submit for scoring →", "Soumettre pour evaluation →")}
          </Button>
        </Card>
      </div>
    );
  }

  // ---- Entry / loading ----
  if (generating) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {roleFocus && (
        <Card className="p-4 border border-accent/20 bg-accent-soft/25">
          <p className="text-sm">
            <span className="font-semibold text-accent">{tr("Role-focused cases enabled:", "Cas focalises sur le metier :")}</span>{" "}
            {roleFocus}
          </p>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold">{tr("Case Simulator", "Simulateur de cas business")}</h2>
        <p className="text-muted-foreground">{tr("Practice real consulting frameworks on Morocco-specific cases.", "Entrainez-vous avec de vrais cadres de conseil sur des cas adaptes au Maroc.")}</p>
      </div>

      <Card className="p-6">
        <p className="text-sm font-semibold mb-3">{tr("Difficulty", "Difficulte")}</p>
        <div className="grid md:grid-cols-3 gap-3">
          {DIFFICULTIES.map((d) => (
            <button key={d.id} onClick={() => setDifficulty(d.id)}
              className={`text-left p-4 rounded-lg border-2 transition ${difficulty === d.id ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/30"}`}>
              <p className="font-semibold">{d.id}</p>
              <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
            </button>
          ))}
        </div>

        <p className="text-sm font-semibold mb-3 mt-6">{tr("Sector", "Secteur")}</p>
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => (
            <button key={s} onClick={() => setSector(s)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${sector === s ? "bg-accent text-accent-foreground border-accent" : "border-border hover:border-muted-foreground/30"}`}>
              {s}
            </button>
          ))}
        </div>

        <Button onClick={() => generate()} className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
          {tr("Generate my case", "Generer mon cas")} <ChevronRight className="w-4 h-4" />
        </Button>
        {roleFocus && (
          <Button
            onClick={() => generate(`${roleFocus} interview/case prep`)}
            variant="outline"
            className="mt-3"
          >
            {tr("Generate role-focused case", "Generer un cas cible metier")} <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">{tr("Quick-launch cases", "Cas rapides")}</h3>
        <div className="space-y-2">
          {STARTERS.map((s) => (
            <button key={s} onClick={() => generate(s)}
              className="w-full text-left p-3 rounded-md border border-border hover:border-accent hover:bg-accent/5 transition flex justify-between items-center">
              <span className="text-sm">{s}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// =====================================================================
// Simulate
// =====================================================================

const INTERVIEW_TYPES = [
  { id: "Behavioral", icon: Mic, desc: "HR round — competency questions" },
  { id: "Technical", icon: Briefcase, desc: "Role-specific knowledge" },
  { id: "Mixed", icon: Sparkles, desc: "Both, recommended" },
];
const LANGUAGES = ["French", "English", "Arabic"];

type IQuestion = {
  id: number; type: string; question: string; what_we_assess: string;
  time_suggestion: number; follow_up?: string;
};
type IFeedback = {
  overall_score: number; hiring_decision: string;
  question_scores: { question_id: number; score: number; what_was_strong: string; what_to_improve: string; model_answer_hint: string }[];
  overall_strengths: string[]; overall_improvements: string[];
  communication_score: number; structure_score: number; relevance_score: number;
  coach_note: string;
};

function InterviewPrepTab({ profile, defaultRole }: { profile: Profile | null; defaultRole: string }) {
  const { language: appLanguage } = useLanguage();
  const tr = (en: string, fr: string) => (appLanguage === "fr" ? fr : en);
  const [role, setRole] = useState(defaultRole);
  const [type, setType] = useState("Mixed");
  const [language, setLanguage] = useState("French");
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<IQuestion[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [intro, setIntro] = useState("");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scoring, setScoring] = useState(false);
  const [feedback, setFeedback] = useState<IFeedback | null>(null);

  useEffect(() => { setRole(defaultRole); }, [defaultRole]);

  const normalizedRole = role.toLowerCase();
  const personalizedPrepSteps = useMemo(() => {
    const common = [
      tr("Build a 90-second pitch: profile, strengths, and why this role in Morocco.", "Construisez un pitch de 90 secondes : profil, forces et pourquoi ce role au Maroc."),
      tr("Prepare 3 STAR stories (leadership, problem solving, teamwork).", "Preparez 3 histoires STAR (leadership, problem solving, teamwork)."),
      tr("Practice crisp answers in 2 minutes max per question.", "Entrainez-vous a repondre de facon concise (2 minutes max par question)."),
    ];
    if (normalizedRole.includes("consult")) {
      return [
        tr("Master case structure (issue tree, MECE, recommendation).", "Maitrisez la structure des cas (issue tree, MECE, recommandation)."),
        tr("Train mental math and market sizing with Moroccan examples.", "Travaillez le calcul mental et le market sizing avec des exemples marocains."),
        ...common,
      ];
    }
    if (normalizedRole.includes("bank") || normalizedRole.includes("finance")) {
      return [
        tr("Review valuation and accounting basics (P&L, cash flow, multiples).", "Revisez les bases de valorisation et comptabilite (P&L, cash flow, multiples)."),
        tr("Prepare deal/market discussion examples relevant to MENA.", "Preparez des exemples de discussion deal/marche pertinents pour la region MENA."),
        ...common,
      ];
    }
    if (normalizedRole.includes("marketing") || normalizedRole.includes("brand")) {
      return [
        tr("Prepare 2 campaign analyses: objective, KPI, channel mix, outcome.", "Preparez 2 analyses de campagne : objectif, KPI, mix canal, resultat."),
        tr("Practice customer segmentation and growth ideas for Morocco.", "Entrainez-vous a la segmentation client et aux idees de croissance pour le Maroc."),
        ...common,
      ];
    }
    return [
      tr("Map the top 5 skills expected for this role and your proof points.", "Mappez les 5 competences cles de ce role et vos preuves concretes."),
      tr("Prepare role-specific examples from projects, internships, or campus work.", "Preparez des exemples lies au role depuis vos projets, stages ou activites campus."),
      ...common,
    ];
  }, [normalizedRole, tr]);

  async function startInterview() {
    setGenerating(true); setFeedback(null); setAnswers({}); setIdx(0);
    try {
      const result = await callForgeAI("generate_interview", {
        role, type, language,
        field_of_study: profile?.field_of_study, level: profile?.study_level,
        institution_type: profile?.institution_type, skills_gap: [],
      });
      setQuestions(result.questions); setIntro(result.intro_message);
      const { data: s } = await supabase.auth.getSession();
      if (s.session) {
        const { data: row } = await supabase.from("interview_sessions").insert({
          user_id: s.session.user.id, role, interview_type: type, language,
          questions_json: result,
        }).select("id").single();
        if (row) setSessionId(row.id);
      }
    } catch (e: any) {
      toast.error(e.message || tr("Failed to generate interview", "Echec de generation de l'entretien"));
    } finally { setGenerating(false); }
  }

  async function submitForFeedback() {
    if (!questions) return;
    setScoring(true);
    try {
      const qa = questions.map((q) => ({ ...q, answer: answers[q.id] ?? "" }));
      const result = await callForgeAI("score_interview", {
        role, language, background: `${profile?.field_of_study ?? ""} - ${profile?.study_level ?? ""}`, qa,
      });
      setFeedback(result);
      if (sessionId) {
        await supabase.from("interview_sessions").update({
          answers_json: answers, feedback_json: result, completed_at: new Date().toISOString(),
        }).eq("id", sessionId);
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setScoring(false); }
  }

  function reset() { setQuestions(null); setFeedback(null); setAnswers({}); setIdx(0); setSessionId(null); }

  if (feedback && questions) {
    const decisionColor =
      feedback.hiring_decision === "Strong hire" ? "bg-emerald-500" :
      feedback.hiring_decision === "Hire" ? "bg-[hsl(var(--primary))]" :
      feedback.hiring_decision === "Maybe" ? "bg-amber-500" : "bg-accent";
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={reset}><ArrowLeft className="w-4 h-4" /> {tr("Back", "Retour")}</Button>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ScoreCircle value={feedback.overall_score} />
            <div className="flex-1 text-center md:text-left">
              <Badge className={`${decisionColor} text-primary-foreground mb-2`}>{feedback.hiring_decision}</Badge>
              <h2 className="text-2xl font-bold">{tr("Mock interview", "Entretien blanc")} · {role}</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {[
              { k: "Communication", v: feedback.communication_score },
              { k: "Structure", v: feedback.structure_score },
              { k: "Relevance", v: feedback.relevance_score },
            ].map((d) => (
              <div key={d.k}>
                <div className="flex justify-between text-sm mb-1"><span>{d.k}</span><span className="font-semibold">{d.v}/100</span></div>
                <Progress value={d.v} />
              </div>
            ))}
          </div>
        </Card>

        <Accordion type="single" collapsible className="space-y-2">
          {feedback.question_scores.map((qs) => {
            const q = questions.find((x) => x.id === qs.question_id);
            return (
              <Card key={qs.question_id} className="p-0 overflow-hidden">
                <AccordionItem value={`q${qs.question_id}`} className="border-0">
                  <AccordionTrigger className="px-5 hover:no-underline">
                    <div className="flex-1 text-left">
                      <p className="text-xs text-muted-foreground">{tr("Question", "Question")} {qs.question_id}</p>
                      <p className="font-medium">{q?.question}</p>
                    </div>
                    <Badge className="mr-3 bg-accent text-accent-foreground">{qs.score}</Badge>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4 space-y-2 text-sm">
                    <p><strong className="text-emerald-600">{tr("Strong:", "Fort :")} </strong>{qs.what_was_strong}</p>
                    <p><strong className="text-amber-600">{tr("Improve:", "A ameliorer :")} </strong>{qs.what_to_improve}</p>
                    <p className="text-muted-foreground"><strong>{tr("Model hint:", "Indice modele :")} </strong>{qs.model_answer_hint}</p>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            );
          })}
        </Accordion>

        <Card className="p-5 border-l-4 border-l-accent">
          <h3 className="font-semibold mb-2">{tr("Coach note", "Note du coach")}</h3>
          <p className="text-sm leading-relaxed">{feedback.coach_note}</p>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => { reset(); startInterview(); }} className="bg-accent text-accent-foreground hover:bg-accent/90">{tr("Retry this interview", "Reessayer cet entretien")}</Button>
          <Button variant="outline" onClick={reset}>{tr("Try a different role", "Essayer un autre role")}</Button>
        </div>
      </div>
    );
  }

  if (questions) {
    const q = questions[idx];
    const isLast = idx === questions.length - 1;
    return (
      <div className="space-y-5 max-w-3xl mx-auto">
        <Progress value={((idx + 1) / questions.length) * 100} />
        <p className="text-sm text-muted-foreground text-center">{tr("Question", "Question")} {idx + 1} {tr("of", "sur")} {questions.length}</p>
        {idx === 0 && intro && (
          <Card className="p-4 bg-accent-soft text-sm italic">{intro}</Card>
        )}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ backgroundColor: "var(--color-background-tertiary)", color: "var(--color-text-primary)" }}
            >
              IV
            </div>
            <div className="flex-1">
              <Badge variant="outline" className="mb-2 capitalize">{q.type}</Badge>
              <p className="text-lg font-medium">{q.question}</p>
              <p className="text-xs text-muted-foreground mt-2">⏱ {tr("Suggested", "Suggere")} : {Math.round(q.time_suggestion / 60)} min</p>
            </div>
          </div>
        </Card>
        <Textarea
          value={answers[q.id] ?? ""}
          onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
          placeholder={tr("Type your answer...", "Ecrivez votre reponse...")}
          className="min-h-[200px]"
        />
        <div className="flex justify-between">
          <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>← {tr("Previous", "Precedent")}</Button>
          {isLast ? (
            <Button onClick={submitForFeedback} disabled={scoring} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {scoring ? tr("Scoring...", "Evaluation...") : tr("Get my feedback →", "Obtenir mon feedback →")}
            </Button>
          ) : (
            <Button onClick={() => setIdx((i) => i + 1)} className="bg-accent text-accent-foreground hover:bg-accent/90">{tr("Next question →", "Question suivante →")}</Button>
          )}
        </div>
      </div>
    );
  }

  if (generating) {
    return <div className="space-y-3"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {defaultRole && (
        <Card className="p-5 border-l-4 border-l-accent bg-accent-soft/30">
          <p className="text-xs uppercase tracking-wide text-accent font-semibold mb-2">
            {tr("Personalized prep plan", "Plan de preparation personnalise")}
          </p>
          <h3 className="font-semibold text-lg mb-2">
            {tr("Target job:", "Metier cible :")} {defaultRole}
          </h3>
          <ul className="space-y-1.5 text-sm text-foreground/90">
            {personalizedPrepSteps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent font-semibold">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold">{tr("Simulate", "Simulateur d'entretien blanc")}</h2>
        <p className="text-muted-foreground">{tr("Practice with AI. Get scored. Improve before the real thing.", "Entrainez-vous avec l'IA. Obtenez un score. Progressez avant le vrai entretien.")}</p>
      </div>

      <Card className="p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold mb-2">{tr("Target role", "Role cible")}</p>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[defaultRole, "Data Analyst", "Consultant", "Financial Analyst", "Product Manager", "Marketing Manager"].filter((v, i, a) => v && a.indexOf(v) === i).map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">{tr("Interview type", "Type d'entretien")}</p>
          <div className="grid md:grid-cols-3 gap-3">
            {INTERVIEW_TYPES.map((t) => (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`text-left p-4 rounded-lg border-2 transition ${type === t.id ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/30"}`}>
                <t.icon className="w-5 h-5 text-accent mb-2" />
                <p className="font-semibold">{t.id}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">{tr("Language", "Langue")}</p>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button key={l} onClick={() => setLanguage(l)}
                className={`px-4 py-2 rounded-full text-sm border transition ${language === l ? "bg-accent text-accent-foreground border-accent" : "border-border"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={startInterview} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {tr("Start interview", "Demarrer l'entretien")} <ChevronRight className="w-4 h-4" />
        </Button>
      </Card>
    </div>
  );
}

// =====================================================================
// RESOURCES
// =====================================================================

type AIRec = {
  priority_message: string;
  top_resources: { type: string; name: string; why_now: string; time_to_complete: string; direct_link: string }[];
};

function ResourceProviderLogo({ provider, link }: { provider: string; link: string }) {
  const [failed, setFailed] = useState(false);
  let domain = "";
  try {
    domain = new URL(link).hostname;
  } catch {
    domain = "";
  }
  const logoSrc = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : "";

  if (!logoSrc || failed) {
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ backgroundColor: "var(--color-background-tertiary)", color: "var(--color-text-primary)" }}
      >
        {provider.split(" ").map((s) => s[0]).join("").slice(0, 2)}
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-border"
      style={{ backgroundColor: "var(--color-background-tertiary)" }}
    >
      <img
        src={logoSrc}
        alt={`${provider} logo`}
        className="w-6 h-6 object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function ResourcesTab({ pathway, profile }: { pathway: PathwayResult | null; profile: Profile | null }) {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const [filter, setFilter] = useState<typeof RESOURCE_CATEGORIES[number]>("All");
  const [aiRec, setAiRec] = useState<AIRec | null>(null);
  const [loadingRec, setLoadingRec] = useState(true);

  const topPathwayTitle = pathway?.pathways?.[0]?.title?.toLowerCase() ?? "";
  const skillsGap = pathway?.pathways?.[0]?.skillsGap ?? [];

  useEffect(() => {
    (async () => {
      try {
        const result = await callForgeAI("recommend_resources", {
          top_pathway: pathway?.pathways?.[0]?.title ?? "Generalist",
          skills_gap: skillsGap,
          study_level: profile?.study_level,
          next_action: pathway?.actionPlan?.[0],
        });
        setAiRec(result);
      } catch (e) {
        // Silent fallback to static resources
        setAiRec(null);
      } finally { setLoadingRec(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathway?.pathways?.[0]?.title]);

  const filtered = useMemo(() => {
    let list: Resource[] = filter === "All" ? RESOURCES : RESOURCES.filter((r) => r.category === filter);
    // Sort: pathway match first
    return list.sort((a, b) => {
      const aMatch = a.pathwayMatch.some((kw) => topPathwayTitle.includes(kw)) ? 1 : 0;
      const bMatch = b.pathwayMatch.some((kw) => topPathwayTitle.includes(kw)) ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [filter, topPathwayTitle]);

  function isRecommended(r: Resource) {
    return skillsGap.some((g) => r.skill.toLowerCase().includes(g.toLowerCase().split(" ")[0]))
      || r.pathwayMatch.some((kw) => topPathwayTitle.includes(kw));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{tr("Resources", "Ressources")}</h2>
        <p className="text-muted-foreground">{tr("Curated for your pathway and Moroccan market relevance.", "Selectionne selon votre parcours et la realite du marche marocain.")}</p>
      </div>

      {/* AI "Start here" */}
      {loadingRec ? (
        <Card className="p-6 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid md:grid-cols-3 gap-3">
            <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
          </div>
        </Card>
      ) : aiRec ? (
        <Card className="p-6 border-l-4 border-l-accent">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="font-semibold">{tr("Start here", "Commencez ici")}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{aiRec.priority_message}</p>
          <div className="grid md:grid-cols-3 gap-3">
            {aiRec.top_resources.map((r, i) => (
              <a key={i} href={r.direct_link} target="_blank" rel="noopener noreferrer"
                className="block p-4 rounded-lg border border-border hover:border-accent transition">
                <Badge className="bg-accent text-accent-foreground mb-2">{tr("Recommended for you", "Recommande pour vous")}</Badge>
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.why_now}</p>
                <p className="text-xs mt-2"><Clock className="w-3 h-3 inline" /> {r.time_to_complete}</p>
              </a>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Filters */}
      <div className="glass-pill inline-flex flex-wrap gap-2 rounded-full bg-transparent p-1.5">
        {RESOURCE_CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              filter === c
                ? "border-transparent bg-accent-soft text-accent"
                : "border-border/50 bg-transparent text-foreground/80 hover:bg-background/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <Card className="p-6 text-sm text-muted-foreground col-span-full">{tr("No resources in this category yet.", "Aucune ressource dans cette categorie pour le moment.")}</Card>
        )}
        {filtered.map((r) => (
          <Card key={r.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <ResourceProviderLogo provider={r.provider} link={r.link} />
                <div>
                  <p className="font-semibold leading-tight">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.provider}</p>
                </div>
              </div>
              {isRecommended(r) && <Badge className="bg-accent text-accent-foreground shrink-0">{tr("Recommended", "Recommande")}</Badge>}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary" className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {r.duration}</Badge>
              {r.level && <Badge variant="outline">{r.level}</Badge>}
              {r.popular && <Badge className="bg-accent text-accent-foreground">{tr("Popular in Morocco", "Populaire au Maroc")}</Badge>}
            </div>
            <p className="text-xs"><strong>{tr("Skill:", "Competence :")} </strong>{r.skill}</p>
            <a href={r.link} target="_blank" rel="noopener noreferrer" className="block pt-2">
              <Button
                size="sm"
                className="w-full border border-border bg-secondary text-accent hover:bg-secondary/80"
              >
                {r.category === "Virtual Internships" ? tr("Start free", "Commencer gratuitement") : tr("Enroll free", "S'inscrire gratuitement")}
                <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// PAGE
// =====================================================================

export default function Forge() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pathway, setPathway] = useState<PathwayResult | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return;
      const uid = s.session.user.id;
      const [{ data: p }, { data: pw }] = await Promise.all([
        supabase.from("profiles").select("field_of_study, study_level, institution_type").eq("user_id", uid).maybeSingle(),
        supabase.from("pathway_results").select("result_json").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (p) setProfile(p as Profile);
      if (pw) setPathway(pw.result_json as unknown as PathwayResult);
    })();
  }, []);

  const requestedRole = searchParams.get("role")?.trim() ?? "";
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam === "cases" || tabParam === "interview" || tabParam === "resources" ? tabParam : "cases";
  const [activeTab, setActiveTab] = useState<"cases" | "interview" | "resources">(initialTab);
  const defaultRole = requestedRole || (pathway?.pathways?.[0]?.title ?? "Business Analyst");

  useEffect(() => {
    const nextTab = tabParam === "cases" || tabParam === "interview" || tabParam === "resources" ? tabParam : "cases";
    setActiveTab(nextTab);
  }, [tabParam]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-[var(--text-h1)] font-medium mb-2">{tr("Forge", "Forge")}</h1>
        <p className="text-muted-foreground">{tr("Forge your edge in Morocco.", "Forgez votre avantage au Maroc.")}</p>
      </div>

      {requestedRole && (
        <Card className="p-4 border border-primary/25 bg-[var(--red-subtle)]">
          <p className="text-sm">
            <span className="font-semibold text-primary">{tr("Personalized mode enabled:", "Mode personnalise active :")}</span>{" "}
            {tr("you are preparing specifically for", "vous vous preparez specifiquement pour")}{" "}
            <span className="font-semibold">{requestedRole}</span>.
          </p>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "cases" | "interview" | "resources")}>
        <TabsList className="glass-pill h-auto rounded-full bg-transparent p-1.5 text-foreground/70">
          <TabsTrigger
            value="cases"
            className="rounded-full px-4 py-2 data-[state=active]:bg-accent-soft data-[state=active]:text-accent data-[state=active]:shadow-none"
          >
            {tr("Cases", "Cas business")}
          </TabsTrigger>
          <TabsTrigger
            value="interview"
            className="rounded-full px-4 py-2 data-[state=active]:bg-accent-soft data-[state=active]:text-accent data-[state=active]:shadow-none"
          >
            {tr("Simulate", "Preparation entretien")}
          </TabsTrigger>
          <TabsTrigger
            value="resources"
            className="rounded-full px-4 py-2 data-[state=active]:bg-accent-soft data-[state=active]:text-accent data-[state=active]:shadow-none"
          >
            {tr("Resources", "Ressources")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="cases" className="mt-6"><BusinessCasesTab targetRole={requestedRole || defaultRole} /></TabsContent>
        <TabsContent value="interview" className="mt-6"><InterviewPrepTab profile={profile} defaultRole={defaultRole} /></TabsContent>
        <TabsContent value="resources" className="mt-6"><ResourcesTab pathway={pathway} profile={profile} /></TabsContent>
      </Tabs>
    </div>
  );
}
