import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  defaultOnboarding,
  STORAGE_KEY,
  type OnboardingState,
  type Personality,
} from "@/lib/onboarding";
import { useLanguage } from "@/lib/i18n";

const FIELDS = [
  "Engineering",
  "Business & Management",
  "Law",
  "Medicine",
  "Sciences",
  "Arts & Humanities",
  "IT & Computer Science",
  "Architecture",
  "Other",
];
const LEVELS = ["L1", "L2", "L3", "M1", "M2"];
const INSTITUTION_TYPES = [
  "Public university",
  "Private grande école",
  "Public grande école",
];
const SECTORS = [
  "Finance & Banking",
  "Consulting",
  "Tech & Digital",
  "Energy & Industry",
  "Public Sector",
  "Healthcare",
  "Agribusiness",
  "Logistics",
  "Marketing & Media",
  "Entrepreneurship",
];
const WORK_ENVS = [
  "Large corporation",
  "SME/startup",
  "Public institution",
  "I'm open to all",
];
const GEOGRAPHIES = [
  "Morocco only",
  "Morocco + Francophone Africa",
  "International",
];

const PERSONALITY_QUESTIONS: { key: keyof Personality; label: string; trait: string }[] = [
  { key: "investigative", label: "I enjoy analyzing data and solving complex problems", trait: "Investigative" },
  { key: "social", label: "I prefer working with people over working alone", trait: "Social" },
  { key: "enterprising", label: "I like taking initiative and convincing others", trait: "Enterprising" },
  { key: "artistic", label: "I value creativity and finding original solutions", trait: "Artistic" },
  { key: "conventional", label: "I prefer clear rules and structured environments", trait: "Conventional" },
  { key: "realistic", label: "I enjoy building or creating tangible things", trait: "Realistic" },
  { key: "uncertainty", label: "I'm comfortable with uncertainty and ambiguity", trait: "Adaptive" },
  { key: "socialMotivation", label: "I'm motivated by social impact, not just personal success", trait: "Purpose-driven" },
];

export default function Onboarding() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const optionLabel: Record<string, string> = {
    Engineering: "Ingenierie",
    "Business & Management": "Business et management",
    Law: "Droit",
    Medicine: "Medecine",
    Sciences: "Sciences",
    "Arts & Humanities": "Lettres et sciences humaines",
    "IT & Computer Science": "Informatique et sciences du numerique",
    Architecture: "Architecture",
    Other: "Autre",
    "Public university": "Universite publique",
    "Private grande école": "Grande ecole privee",
    "Public grande école": "Grande ecole publique",
    "Finance & Banking": "Finance et banque",
    Consulting: "Conseil",
    "Tech & Digital": "Tech et digital",
    "Energy & Industry": "Energie et industrie",
    "Public Sector": "Secteur public",
    Healthcare: "Sante",
    Agribusiness: "Agrobusiness",
    Logistics: "Logistique",
    "Marketing & Media": "Marketing et media",
    Entrepreneurship: "Entrepreneuriat",
    "Large corporation": "Grande entreprise",
    "SME/startup": "PME/startup",
    "Public institution": "Institution publique",
    "I'm open to all": "Je suis ouvert(e) a tout",
    "Morocco only": "Maroc uniquement",
    "Morocco + Francophone Africa": "Maroc + Afrique francophone",
    International: "International",
  };
  const labelFor = (value: string) => (language === "fr" ? (optionLabel[value] ?? value) : value);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingState>(defaultOnboarding);
  const [submitting, setSubmitting] = useState(false);

  // load persisted state
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setData({ ...defaultOnboarding, ...JSON.parse(raw) }); } catch { /* ignore */ }
    }
  }, []);

  // persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // require auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: s }) => {
      if (!s.session) navigate("/auth", { replace: true });
    });
  }, [navigate]);

  const update = <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const updatePersonality = (key: keyof Personality, value: number) =>
    setData((d) => ({ ...d, personality: { ...d.personality, [key]: value } }));

  const toggleSector = (s: string) => {
    setData((d) => {
      if (d.sectors.includes(s)) return { ...d, sectors: d.sectors.filter((x) => x !== s) };
      if (d.sectors.length >= 3) {
        toast.info(tr("You can pick up to 3 sectors", "Vous pouvez choisir jusqu'a 3 secteurs"));
        return d;
      }
      return { ...d, sectors: [...d.sectors, s] };
    });
  };

  const step1Valid = data.field && data.level && data.institutionName.trim() && data.institutionType;
  const step2Valid = data.sectors.length > 0 && data.workEnv && data.geography;
  const step3Valid = PERSONALITY_QUESTIONS.every((q) => data.personality[q.key] > 0);

  async function handleSubmit() {
    if (!step3Valid) {
      toast.error(tr("Please answer all questions", "Veuillez repondre a toutes les questions"));
      return;
    }
    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        navigate("/auth");
        return;
      }
      const userId = session.session.user.id;

      // Save profile fields
      await supabase.from("profiles").update({
        field_of_study: data.field,
        study_level: data.level,
        institution_name: data.institutionName,
        institution_type: data.institutionType,
      }).eq("user_id", userId);

      // Save onboarding responses
      await supabase.from("onboarding_responses").insert({
        user_id: userId,
        preferred_sectors: data.sectors,
        work_environment: data.workEnv,
        geography: data.geography,
        ambition_level: data.ambition,
        personality_scores: data.personality as unknown as Record<string, number>,
      });

      // Call edge function
      const { data: fnData, error: fnErr } = await supabase.functions.invoke("generate-pathway", {
        body: {
          field: data.field,
          level: data.level,
          institutionType: data.institutionType,
          sectors: data.sectors,
          workEnv: data.workEnv,
          geography: data.geography,
          ambition: data.ambition,
          personality: data.personality,
        },
      });

      if (fnErr) throw fnErr;
      if ((fnData as any)?.error) throw new Error((fnData as any).error);

      localStorage.removeItem(STORAGE_KEY);
      toast.success(tr("Your career pathways are ready!", "Vos parcours de carriere sont prets !"));
      navigate("/pathways", { replace: true });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? tr("Something went wrong. Please try again.", "Une erreur est survenue. Veuillez reessayer."));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitting) return <AnalyzingScreen />;

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">{tr("Step", "Etape")} {step} {tr("of", "sur")} 3</p>
            <h1 className="text-2xl font-bold">
              {step === 1 && tr("Academic profile", "Profil academique")}
              {step === 2 && tr("Career appetite", "Aspirations de carriere")}
              {step === 3 && tr("Personality snapshot", "Apercu de personnalite")}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">{tr("Progress", "Progression")}</p>
            <p className="text-sm font-semibold text-primary">{Math.round(progress)}%</p>
          </div>
        </div>
        <Progress value={progress} className="mb-8 h-2" />

        <Card className="p-8 border-border/80">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label>{tr("Field of study", "Domaine d'etude")}</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
                  value={data.field}
                  onChange={(e) => update("field", e.target.value)}
                >
                  <option value="">{tr("Select your field", "Selectionnez votre domaine")}</option>
                  {FIELDS.map((f) => <option key={f} value={f}>{labelFor(f)}</option>)}
                </select>
              </div>
              <div>
                <Label>{tr("Study level", "Niveau d'etudes")}</Label>
                <RadioGroup
                  className="grid grid-cols-5 gap-2 mt-2"
                  value={data.level}
                  onValueChange={(v) => update("level", v)}
                >
                  {LEVELS.map((l) => (
                    <Label
                      key={l}
                      htmlFor={`level-${l}`}
                      className={cn(
                        "flex items-center justify-center h-12 rounded-md border cursor-pointer transition-colors text-sm font-medium",
                        data.level === l ? "border-primary bg-[var(--red-subtle)] text-primary" : "border-border hover:border-primary/30"
                      )}
                    >
                      <RadioGroupItem id={`level-${l}`} value={l} className="sr-only" />
                      {l}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="inst">{tr("Institution name", "Nom de l'etablissement")}</Label>
                <Input id="inst" value={data.institutionName} onChange={(e) => update("institutionName", e.target.value)} />
              </div>
              <div>
                <Label>{tr("Institution type", "Type d'etablissement")}</Label>
                <RadioGroup
                  className="grid sm:grid-cols-3 gap-2 mt-2"
                  value={data.institutionType}
                  onValueChange={(v) => update("institutionType", v)}
                >
                  {INSTITUTION_TYPES.map((t) => (
                    <Label
                      key={t}
                      htmlFor={`it-${t}`}
                      className={cn(
                        "flex items-center justify-center h-14 px-3 rounded-md border cursor-pointer text-sm text-center transition-colors",
                        data.institutionType === t ? "border-primary bg-[var(--red-subtle)] text-primary" : "border-border hover:border-primary/30"
                      )}
                    >
                      <RadioGroupItem id={`it-${t}`} value={t} className="sr-only" />
                      {labelFor(t)}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label>{tr("Preferred sectors", "Secteurs preferes")} <span className="text-muted-foreground font-normal">{tr("(pick up to 3)", "(choisissez jusqu'a 3)")}</span></Label>
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  {SECTORS.map((s) => {
                    const selected = data.sectors.includes(s);
                    return (
                      <label
                        key={s}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                          selected ? "border-primary bg-[var(--red-subtle)]" : "border-border hover:border-primary/30"
                        )}
                      >
                        <Checkbox checked={selected} onCheckedChange={() => toggleSector(s)} />
                        <span className="text-sm">{labelFor(s)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>{tr("Work environment", "Environnement de travail")}</Label>
                <RadioGroup
                  className="grid sm:grid-cols-2 gap-2 mt-2"
                  value={data.workEnv}
                  onValueChange={(v) => update("workEnv", v)}
                >
                  {WORK_ENVS.map((w) => (
                    <Label
                      key={w}
                      htmlFor={`we-${w}`}
                      className={cn(
                        "flex items-center justify-center h-12 px-3 rounded-md border cursor-pointer text-sm text-center transition-colors",
                        data.workEnv === w ? "border-primary bg-[var(--red-subtle)] text-primary" : "border-border hover:border-primary/30"
                      )}
                    >
                      <RadioGroupItem id={`we-${w}`} value={w} className="sr-only" />
                      {labelFor(w)}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>{tr("Geographic ambition", "Ambition geographique")}</Label>
                <RadioGroup
                  className="grid sm:grid-cols-3 gap-2 mt-2"
                  value={data.geography}
                  onValueChange={(v) => update("geography", v)}
                >
                  {GEOGRAPHIES.map((g) => (
                    <Label
                      key={g}
                      htmlFor={`g-${g}`}
                      className={cn(
                        "flex items-center justify-center h-14 px-3 rounded-md border cursor-pointer text-sm text-center transition-colors",
                        data.geography === g ? "border-primary bg-[var(--red-subtle)] text-primary" : "border-border hover:border-primary/30"
                      )}
                    >
                      <RadioGroupItem id={`g-${g}`} value={g} className="sr-only" />
                      {labelFor(g)}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>{tr("Ambition horizon", "Horizon d'ambition")}</Label>
                  <span className="text-sm font-semibold text-primary">{data.ambition} / 5</span>
                </div>
                <Slider
                  value={[data.ambition]}
                  onValueChange={(v) => update("ambition", v[0])}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{tr("Stable job", "Emploi stable")}</span>
                  <span>{tr("Leadership / entrepreneurship", "Leadership / entrepreneuriat")}</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                {tr("Rate how much each statement describes you, from 1 (not at all) to 5 (completely).", "Evaluez chaque affirmation de 1 (pas du tout) a 5 (completement).")}
              </p>
              {PERSONALITY_QUESTIONS.map((q, i) => (
                <div key={q.key}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground font-normal">Q{i + 1}.</span> {q.label}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">{q.trait}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = data.personality[q.key] === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => updatePersonality(q.key, n)}
                          className={cn(
                            "h-12 rounded-md border text-sm font-semibold transition-all",
                            active
                              ? "border-primary bg-primary text-primary-foreground scale-[1.01]"
                              : "border-border hover:border-primary/30 hover:bg-muted"
                          )}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4" /> {tr("Back", "Retour")}
            </Button>
            {step < 3 ? (
              <Button
                variant="default"
                onClick={() => setStep((s) => s + 1)}
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
              >
                {tr("Continue", "Continuer")} <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit} disabled={!step3Valid}>
                <Sparkles className="w-4 h-4" /> {tr("Generate my pathways", "Generer mes parcours")}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AnalyzingScreen() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="max-w-md w-full p-10 text-center shadow-elevated">
        <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
        <h2 className="text-xl font-bold mb-2">{tr("Analyzing your profile...", "Analyse de votre profil...")}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {tr("Our career intelligence engine is matching your strengths to opportunities in the Moroccan job market.", "Notre moteur d'intelligence carriere associe vos points forts aux opportunites du marche marocain.")}
        </p>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse w-2/3 rounded-full" />
        </div>
      </Card>
    </div>
  );
}
