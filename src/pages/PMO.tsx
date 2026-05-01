import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Briefcase, ChevronRight, Pencil, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type JobApplication = Tables<"job_applications">;
type InterviewRound = Tables<"interview_rounds">;

type StageKey = "wishlist" | "applied" | "round_1" | "round_2" | "final" | "offer";

const PMO_BG = "var(--color-background-tertiary)";
const PMO_CARD = "var(--color-background-secondary)";
const PMO_BORDER = "var(--color-border-tertiary)";
const PMO_CTA = "hsl(var(--primary))";
const PMO_STAGE = "hsl(var(--primary))";
const PMO_TEXT = "var(--color-text-primary)";
const PMO_MUTED = "var(--color-text-secondary)";

const STAGES: { key: StageKey; label: string; pill: string; left: string }[] = [
  { key: "wishlist", label: "Wishlist", pill: "#6B7280", left: "#6B7280" },
  { key: "applied", label: "Applied", pill: "#3B82F6", left: "#3B82F6" },
  { key: "round_1", label: "Round 1", pill: "#EAB308", left: "#EAB308" },
  { key: "round_2", label: "Round 2", pill: "#F97316", left: "#F97316" },
  { key: "final", label: "Final", pill: PMO_STAGE, left: PMO_STAGE },
  { key: "offer", label: "Offer", pill: "#22C55E", left: "#22C55E" },
];

const ROUND_TYPES = ["Screening", "Technical", "Case", "Behavioral", "Panel", "Final"];
const ROUND_FORMATS = ["Video", "Phone", "In-person", "Take-home"];
const SOURCES = ["LinkedIn", "Indeed", "Referral", "Company Site", "Campus", "Other"];

const initialApplicationForm = {
  company_name: "",
  role_title: "",
  job_url: "",
  location: "",
  salary_range: "",
  application_date: "",
  source: "",
  status: "wishlist",
  notes: "",
  contact_name: "",
  contact_email: "",
  next_action: "",
  next_action_date: "",
};

const initialRoundForm = {
  round_type: "",
  interview_date: "",
  interviewer_name: "",
  duration_minutes: "",
  format: "",
  questions_asked: "",
  my_performance: 0,
  feedback_received: "",
  next_steps: "",
};

function normalizeStatus(raw: string | null): StageKey | "rejected" | "withdrawn" {
  const s = (raw ?? "").toLowerCase().replace(/\s+/g, "_");
  if (s.includes("reject")) return "rejected";
  if (s.includes("withdraw")) return "withdrawn";
  if (s === "wishlist" || s === "wish_list") return "wishlist";
  if (s === "applied") return "applied";
  if (s === "round_1" || s === "round1" || s === "first_round") return "round_1";
  if (s === "round_2" || s === "round2" || s === "second_round") return "round_2";
  if (s === "final" || s === "final_round") return "final";
  if (s === "offer" || s === "offered") return "offer";
  return "applied";
}

function stageIndex(stage: StageKey): number {
  return STAGES.findIndex((s) => s.key === stage);
}

function nextStage(stage: StageKey): StageKey {
  const i = stageIndex(stage);
  return STAGES[Math.min(i + 1, STAGES.length - 1)].key;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function daysFromNow(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default function PMO() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isAppSheetOpen, setIsAppSheetOpen] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [appForm, setAppForm] = useState(initialApplicationForm);
  const [roundForm, setRoundForm] = useState(initialRoundForm);
  const [showRejected, setShowRejected] = useState(false);
  const [savingApplication, setSavingApplication] = useState(false);
  const [savingRound, setSavingRound] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  async function loadData(uid: string) {
    setLoading(true);
    const [{ data: appRows, error: appErr }, { data: roundRows, error: roundErr }] = await Promise.all([
      supabase.from("job_applications").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("interview_rounds").select("*").eq("user_id", uid).order("interview_date", { ascending: false }),
    ]);
    if (appErr || roundErr) {
      toast.error("Failed to load Career PMO data");
    } else {
      setApplications(appRows ?? []);
      setRounds(roundRows ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      if (uid) await loadData(uid);
      else setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const sync = (matches: boolean) => setIsMobile(matches);
    sync(query.matches);
    const handler = (e: MediaQueryListEvent) => sync(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  const appsByStage = useMemo(() => {
    const grouped: Record<StageKey, JobApplication[]> = {
      wishlist: [],
      applied: [],
      round_1: [],
      round_2: [],
      final: [],
      offer: [],
    };
    for (const app of applications) {
      const normalized = normalizeStatus(app.status);
      if (normalized in grouped) grouped[normalized as StageKey].push(app);
    }
    return grouped;
  }, [applications]);

  const rejectedApps = useMemo(
    () => applications.filter((app) => normalizeStatus(app.status) === "rejected"),
    [applications],
  );

  const stats = useMemo(() => {
    const total = applications.length;
    const inProgress = applications.filter((a) => {
      const s = normalizeStatus(a.status);
      return s !== "rejected" && s !== "withdrawn" && s !== "offer";
    }).length;
    const in7Days = rounds.filter((r) => {
      const d = daysFromNow(r.interview_date);
      return d !== null && d >= 0 && d <= 7;
    }).length;
    const offers = applications.filter((a) => normalizeStatus(a.status) === "offer").length;
    return { total, inProgress, in7Days, offers };
  }, [applications, rounds]);

  const deadlines = useMemo(() => {
    return applications
      .map((app) => ({ app, days: daysFromNow(app.next_action_date) }))
      .filter((x): x is { app: JobApplication; days: number } => x.days !== null && x.days >= 0 && x.days < 7)
      .sort((a, b) => a.days - b.days);
  }, [applications]);

  const selectedAppRounds = useMemo(() => {
    if (!selectedApp) return [];
    return rounds
      .filter((r) => r.application_id === selectedApp.id)
      .sort((a, b) => (a.interview_date ?? "").localeCompare(b.interview_date ?? ""));
  }, [rounds, selectedApp]);

  function resetApplicationForm() {
    setAppForm(initialApplicationForm);
    setEditingAppId(null);
  }

  function openCreateApplication() {
    resetApplicationForm();
    setIsAddSheetOpen(true);
  }

  function openEditApplication(app: JobApplication) {
    setEditingAppId(app.id);
    setAppForm({
      company_name: app.company_name ?? "",
      role_title: app.role_title ?? "",
      job_url: app.job_url ?? "",
      location: app.location ?? "",
      salary_range: app.salary_range ?? "",
      application_date: app.application_date ?? "",
      source: app.source ?? "",
      status: normalizeStatus(app.status) === "rejected" ? "applied" : (normalizeStatus(app.status) as StageKey),
      notes: app.notes ?? "",
      contact_name: app.contact_name ?? "",
      contact_email: app.contact_email ?? "",
      next_action: app.next_action ?? "",
      next_action_date: app.next_action_date ?? "",
    });
    setIsAddSheetOpen(true);
  }

  async function saveApplication() {
    if (!userId) return;
    if (!appForm.company_name.trim() || !appForm.role_title.trim()) {
      toast.error("Company and role are required");
      return;
    }
    setSavingApplication(true);
    const payload = {
      user_id: userId,
      company_name: appForm.company_name.trim(),
      role_title: appForm.role_title.trim(),
      job_url: appForm.job_url || null,
      location: appForm.location || null,
      salary_range: appForm.salary_range || null,
      application_date: appForm.application_date || null,
      source: appForm.source || null,
      status: appForm.status,
      notes: appForm.notes || null,
      contact_name: appForm.contact_name || null,
      contact_email: appForm.contact_email || null,
      next_action: appForm.next_action || null,
      next_action_date: appForm.next_action_date || null,
    };
    const q = editingAppId
      ? supabase.from("job_applications").update(payload).eq("id", editingAppId).eq("user_id", userId)
      : supabase.from("job_applications").insert(payload);
    const { error } = await q;
    if (error) toast.error("Could not save application");
    else {
      toast.success(editingAppId ? "Application updated" : "Application added");
      setIsAddSheetOpen(false);
      resetApplicationForm();
      await loadData(userId);
    }
    setSavingApplication(false);
  }

  async function moveStage(app: JobApplication) {
    if (!userId) return;
    const normalized = normalizeStatus(app.status);
    if (!(normalized in appsByStage)) return;
    const next = nextStage(normalized as StageKey);
    const { error } = await supabase
      .from("job_applications")
      .update({ status: next })
      .eq("id", app.id)
      .eq("user_id", userId);
    if (error) toast.error("Could not move application");
    else await loadData(userId);
  }

  async function saveInterviewRound() {
    if (!userId || !selectedApp) return;
    if (!roundForm.round_type || !roundForm.interview_date) {
      toast.error("Round type and date are required");
      return;
    }
    setSavingRound(true);
    const existingCount = rounds.filter((r) => r.application_id === selectedApp.id).length;
    const payload = {
      application_id: selectedApp.id,
      user_id: userId,
      round_number: existingCount + 1,
      round_type: roundForm.round_type,
      interview_date: roundForm.interview_date,
      interviewer_name: roundForm.interviewer_name || null,
      duration_minutes: roundForm.duration_minutes ? Number(roundForm.duration_minutes) : null,
      format: roundForm.format || null,
      questions_asked: roundForm.questions_asked || null,
      my_performance: roundForm.my_performance || null,
      feedback_received: roundForm.feedback_received || null,
      next_steps: roundForm.next_steps || null,
    };
    const { error } = await supabase.from("interview_rounds").insert(payload);
    if (error) toast.error("Could not log interview round");
    else {
      toast.success("Interview round logged");
      setIsRoundModalOpen(false);
      setRoundForm(initialRoundForm);
      await loadData(userId);
    }
    setSavingRound(false);
  }

  function cardFor(app: JobApplication) {
    const stage = normalizeStatus(app.status);
    const stageColor = STAGES.find((s) => s.key === stage)?.left ?? "#6B7280";
    const since = daysSince(app.application_date);
    const actionDays = daysFromNow(app.next_action_date);

    return (
      <article
        key={app.id}
        className="rounded-[10px] border p-4 cursor-pointer"
        style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, borderLeftColor: stageColor, borderLeftWidth: 3 }}
        onClick={() => { setSelectedApp(app); setIsAppSheetOpen(true); }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: PMO_TEXT }}>{app.company_name}</p>
          <span className="text-[10px] px-2 py-1 rounded-full border" style={{ color: PMO_MUTED, borderColor: PMO_BORDER }}>
            {app.source ?? "Direct"}
          </span>
        </div>
        <p className="mt-1 text-[13px]" style={{ color: PMO_MUTED }}>{app.role_title}</p>
        <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: PMO_MUTED }}>
          <span>{formatDate(app.application_date)}</span>
          <span>{since === null ? "—" : `${since}d ago`}</span>
        </div>
        <div className="mt-3 min-h-6">
          {actionDays !== null && (
            <span
              className="text-[10px] px-2 py-1 rounded-full"
              style={{ backgroundColor: "rgba(249,115,22,0.2)", color: "#FDBA74" }}
            >
              Action needed
            </span>
          )}
        </div>
        <div className="mt-2 flex justify-end gap-1">
          <button
            type="button"
            className="p-1.5 rounded-md border"
            style={{ borderColor: PMO_BORDER, color: PMO_MUTED }}
            onClick={(e) => { e.stopPropagation(); openEditApplication(app); }}
            aria-label="Edit application"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md border"
            style={{ borderColor: PMO_BORDER, color: PMO_MUTED }}
            onClick={(e) => { e.stopPropagation(); void moveStage(app); }}
            aria-label="Move stage"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="min-h-full rounded-xl p-4 md:p-8" style={{ backgroundColor: PMO_BG, color: PMO_TEXT, fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Career PMO</h1>
            <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border" style={{ backgroundColor: "#B8860B33", color: "#F3D27A", borderColor: "#B8860B" }}>
              Premium
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: PMO_MUTED }}>Track every application. Win every interview.</p>
        </div>
        <Button
          onClick={openCreateApplication}
          variant="outline"
          className="rounded-xl w-full md:w-auto"
          style={{ backgroundColor: "transparent", borderColor: "var(--color-border-primary)", color: "var(--color-text-primary)" }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add application
        </Button>
      </div>

      <div className="mt-5 border-t" style={{ borderColor: PMO_BORDER }} />

      <section className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 stack-on-xs">
        {[
          { label: "APPLICATIONS", value: stats.total, color: PMO_TEXT },
          { label: "IN PROGRESS", value: stats.inProgress, color: PMO_TEXT },
          { label: "THIS WEEK", value: stats.in7Days, color: PMO_TEXT },
          { label: "OFFERS", value: stats.offers, color: "#22C55E" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border p-4" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER }}>
            <p className="text-[11px] tracking-wide" style={{ color: PMO_MUTED }}>{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-6">
        <section>
          {loading ? (
            <div className="rounded-xl border p-10 text-center text-sm" style={{ borderColor: PMO_BORDER, color: PMO_MUTED, backgroundColor: PMO_CARD }}>
              Loading your premium pipeline...
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-xl border p-12 text-center" style={{ borderColor: PMO_BORDER, backgroundColor: PMO_CARD }}>
              <Briefcase className="w-12 h-12 mx-auto" style={{ color: PMO_BORDER }} />
              <h3 className="mt-4 text-xl font-semibold text-foreground">Start tracking your applications</h3>
              <p className="mt-2 text-sm" style={{ color: PMO_MUTED }}>Add your first application to build your pipeline.</p>
              <Button
                variant="outline"
                className="mt-5 rounded-xl w-full md:w-auto"
                style={{ backgroundColor: "transparent", borderColor: "var(--color-border-primary)", color: "var(--color-text-primary)" }}
                onClick={openCreateApplication}
              >
                <Plus className="w-4 h-4 mr-1" /> Add application
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto pb-2">
                <div className="flex gap-3 min-w-max">
                  {STAGES.map((stage) => (
                    <div key={stage.key} className="w-[260px] shrink-0">
                      <div className="mb-2 glass rounded-full px-3 py-2 flex items-center justify-between border border-border">
                        <p className="text-[12px] uppercase tracking-wide" style={{ color: PMO_MUTED }}>{stage.label}</p>
                        <span className="text-[10px] px-2 py-1 rounded-full border border-border bg-background/40" style={{ color: stage.pill }}>
                          {appsByStage[stage.key].length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {appsByStage[stage.key].map((app) => cardFor(app))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:hidden">
                <Accordion type="multiple" className="space-y-2">
                  {STAGES.map((stage) => (
                    <AccordionItem key={stage.key} value={stage.key} className="rounded-lg border border-border bg-card px-3">
                      <AccordionTrigger className="text-sm">
                        <div className="flex w-full items-center justify-between pr-2">
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">{stage.label}</span>
                          <span className="glass text-[10px] px-2 py-1 rounded-full border border-border bg-background/40" style={{ color: stage.pill }}>
                            {appsByStage[stage.key].length}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pb-2">
                          {appsByStage[stage.key].map((app) => cardFor(app))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <button
                type="button"
                className="mt-4 text-xs underline underline-offset-4"
                style={{ color: PMO_MUTED }}
                onClick={() => setShowRejected((v) => !v)}
              >
                {showRejected ? "Hide rejected" : `View rejected (${rejectedApps.length})`}
              </button>
              {showRejected && (
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {rejectedApps.length === 0 ? (
                    <p className="text-sm" style={{ color: PMO_MUTED }}>No rejected applications.</p>
                  ) : (
                    rejectedApps.map((app) => cardFor(app))
                  )}
                </div>
              )}
            </>
          )}
        </section>

        <aside className="sticky top-24 self-start">
          <div className="rounded-xl border p-4" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER }}>
            <h3 className="text-sm font-semibold text-foreground">Upcoming Deadlines</h3>
            <div className="mt-3 space-y-2">
              {deadlines.length === 0 ? (
                <p className="text-sm" style={{ color: PMO_MUTED }}>No deadlines this week</p>
              ) : deadlines.map(({ app, days }) => {
                const color = days < 2 ? "#EF4444" : days < 5 ? "#F97316" : PMO_MUTED;
                return (
                  <div key={app.id} className="rounded-lg border p-2" style={{ borderColor: PMO_BORDER }}>
                    <p className="text-xs font-medium text-foreground">{app.company_name}</p>
                    <p className="text-xs" style={{ color: PMO_MUTED }}>{app.next_action ?? "Next action"}</p>
                    <p className="text-[11px] mt-1" style={{ color }}>{days === 0 ? "Today" : `In ${days} day${days > 1 ? "s" : ""}`}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <Sheet open={isAppSheetOpen} onOpenChange={setIsAppSheetOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? "h-[90vh] w-full p-0 border-t" : "w-[480px] sm:max-w-[480px] p-0 border-l"}
          style={{ backgroundColor: PMO_BG, borderColor: PMO_BORDER, color: PMO_TEXT }}
        >
          <div className="h-full overflow-y-auto p-6">
            <SheetHeader>
              <SheetTitle className="text-foreground">{selectedApp?.company_name ?? "Application"}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-xl border p-4" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER }}>
                <p className="text-[11px] uppercase tracking-wide" style={{ color: PMO_MUTED }}>Role</p>
                <p className="text-foreground mt-1">{selectedApp?.role_title ?? "—"}</p>
                <p className="mt-2 text-xs" style={{ color: PMO_MUTED }}>{selectedApp?.location ?? "No location"} · {selectedApp?.salary_range ?? "No salary range"}</p>
                <p className="mt-2 text-xs" style={{ color: PMO_MUTED }}>Applied: {formatDate(selectedApp?.application_date ?? null)}</p>
                {selectedApp?.notes && <p className="mt-3 text-xs" style={{ color: PMO_MUTED }}>{selectedApp.notes}</p>}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Interview timeline</h4>
                <div className="mt-3 space-y-3">
                  {selectedAppRounds.length === 0 ? (
                    <p className="text-xs" style={{ color: PMO_MUTED }}>No interview rounds logged yet.</p>
                  ) : selectedAppRounds.map((round) => (
                    <div key={round.id} className="rounded-xl border p-3" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER }}>
                      <div className="flex justify-between">
                        <p className="text-sm text-foreground">{round.round_type ?? "Round"}</p>
                        <p className="text-xs" style={{ color: PMO_MUTED }}>{formatDate(round.interview_date)}</p>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= (round.my_performance ?? 0) ? "fill-current" : ""}`} style={{ color: PMO_STAGE }} />
                        ))}
                      </div>
                      {round.feedback_received && <p className="mt-2 text-xs" style={{ color: PMO_MUTED }}>{round.feedback_received}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-6 w-full rounded-xl"
              style={{ backgroundColor: "transparent", borderColor: "var(--color-border-primary)", color: "var(--color-text-primary)" }}
              onClick={() => setIsRoundModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" /> Log interview round
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? "h-[90vh] w-full p-0 border-t" : "w-[480px] sm:max-w-[480px] p-0 border-l"}
          style={{ backgroundColor: PMO_BG, borderColor: PMO_BORDER, color: PMO_TEXT }}
        >
          <div className="h-full overflow-y-auto p-6">
            <SheetHeader>
              <SheetTitle className="text-foreground">{editingAppId ? "Edit application" : "Add application"}</SheetTitle>
            </SheetHeader>
            <div className="mt-5 space-y-5">
              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-wide" style={{ color: PMO_MUTED }}>Company & Role</p>
                <div>
                  <label className="text-[11px] uppercase" style={{ color: PMO_MUTED }}>Company name</label>
                  <Input value={appForm.company_name} onChange={(e) => setAppForm((f) => ({ ...f, company_name: e.target.value }))} className="mt-1 border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
                </div>
                <div>
                  <label className="text-[11px] uppercase" style={{ color: PMO_MUTED }}>Role title</label>
                  <Input value={appForm.role_title} onChange={(e) => setAppForm((f) => ({ ...f, role_title: e.target.value }))} className="mt-1 border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-wide" style={{ color: PMO_MUTED }}>Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] uppercase" style={{ color: PMO_MUTED }}>Application date</label>
                    <Input type="date" value={appForm.application_date} onChange={(e) => setAppForm((f) => ({ ...f, application_date: e.target.value }))} className="mt-1 border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase" style={{ color: PMO_MUTED }}>Source</label>
                    <Select value={appForm.source} onValueChange={(v) => setAppForm((f) => ({ ...f, source: v }))}>
                      <SelectTrigger className="mt-1 border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }}>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Input placeholder="Job URL" value={appForm.job_url} onChange={(e) => setAppForm((f) => ({ ...f, job_url: e.target.value }))} className="border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Location" value={appForm.location} onChange={(e) => setAppForm((f) => ({ ...f, location: e.target.value }))} className="border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
                  <Input placeholder="Salary range" value={appForm.salary_range} onChange={(e) => setAppForm((f) => ({ ...f, salary_range: e.target.value }))} className="border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
                </div>
                <Select value={appForm.status} onValueChange={(v) => setAppForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }}>
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>{STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-wide" style={{ color: PMO_MUTED }}>Contact & Notes</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Contact name" value={appForm.contact_name} onChange={(e) => setAppForm((f) => ({ ...f, contact_name: e.target.value }))} className="border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
                  <Input placeholder="Contact email" value={appForm.contact_email} onChange={(e) => setAppForm((f) => ({ ...f, contact_email: e.target.value }))} className="border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
                </div>
                <Input placeholder="Next action" value={appForm.next_action} onChange={(e) => setAppForm((f) => ({ ...f, next_action: e.target.value }))} className="border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
                <Input type="date" value={appForm.next_action_date} onChange={(e) => setAppForm((f) => ({ ...f, next_action_date: e.target.value }))} className="border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
                <Textarea placeholder="Notes" value={appForm.notes} onChange={(e) => setAppForm((f) => ({ ...f, notes: e.target.value }))} className="border min-h-[110px]" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
              </section>
            </div>
            <Button onClick={() => void saveApplication()} disabled={savingApplication} className="mt-6 w-full text-accent-foreground rounded-xl" style={{ backgroundColor: PMO_CTA }}>
              {savingApplication ? "Saving..." : editingAppId ? "Save changes" : "Create application"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isRoundModalOpen} onOpenChange={setIsRoundModalOpen}>
        <DialogContent className="max-w-xl border" style={{ backgroundColor: PMO_BG, borderColor: PMO_BORDER, color: PMO_TEXT }}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Log interview round</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase" style={{ color: PMO_MUTED }}>Round type</label>
              <Select value={roundForm.round_type} onValueChange={(v) => setRoundForm((f) => ({ ...f, round_type: v }))}>
                <SelectTrigger className="mt-1 border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>{ROUND_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] uppercase" style={{ color: PMO_MUTED }}>Date</label>
              <Input type="date" value={roundForm.interview_date} onChange={(e) => setRoundForm((f) => ({ ...f, interview_date: e.target.value }))} className="mt-1 border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
            </div>
            <Input placeholder="Interviewer name" value={roundForm.interviewer_name} onChange={(e) => setRoundForm((f) => ({ ...f, interviewer_name: e.target.value }))} className="border col-span-2" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
            <div>
              <label className="text-[11px] uppercase" style={{ color: PMO_MUTED }}>Duration (minutes)</label>
              <Input value={roundForm.duration_minutes} onChange={(e) => setRoundForm((f) => ({ ...f, duration_minutes: e.target.value }))} className="mt-1 border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
            </div>
            <div>
              <label className="text-[11px] uppercase" style={{ color: PMO_MUTED }}>Format</label>
              <Select value={roundForm.format} onValueChange={(v) => setRoundForm((f) => ({ ...f, format: v }))}>
                <SelectTrigger className="mt-1 border" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }}>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>{ROUND_FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Questions asked" value={roundForm.questions_asked} onChange={(e) => setRoundForm((f) => ({ ...f, questions_asked: e.target.value }))} className="border col-span-2 min-h-[80px]" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
            <div className="col-span-2">
              <label className="text-[11px] uppercase" style={{ color: PMO_MUTED }}>My performance</label>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRoundForm((f) => ({ ...f, my_performance: n }))}>
                    <Star className={`w-5 h-5 ${n <= roundForm.my_performance ? "fill-current" : ""}`} style={{ color: PMO_STAGE }} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea placeholder="Feedback received" value={roundForm.feedback_received} onChange={(e) => setRoundForm((f) => ({ ...f, feedback_received: e.target.value }))} className="border col-span-2 min-h-[80px]" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
            <Textarea placeholder="Next steps" value={roundForm.next_steps} onChange={(e) => setRoundForm((f) => ({ ...f, next_steps: e.target.value }))} className="border col-span-2 min-h-[80px]" style={{ backgroundColor: PMO_CARD, borderColor: PMO_BORDER, color: PMO_TEXT }} />
          </div>
          <Button onClick={() => void saveInterviewRound()} disabled={savingRound} className="w-full text-accent-foreground rounded-xl" style={{ backgroundColor: PMO_CTA }}>
            {savingRound ? "Saving..." : "Save interview round"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
