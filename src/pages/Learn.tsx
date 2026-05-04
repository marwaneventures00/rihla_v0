import { Suspense, useMemo, type CSSProperties } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import type { AppLayoutOutletContext } from "@/components/AppLayout";
import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { PathwayResult } from "@/lib/onboarding";
import { Loader2, Lock, Briefcase, TrendingUp, Globe, BookOpen, ArrowLeft } from "lucide-react";
import LearnPath from "./LearnPath";

type ArchetypeCard = { name: string; match: number; desc: string };

export type LearnHubData = {
  userId: string;
  confidenceScore: number;
  hasConversation: boolean;
  latestSession: { id: string; messages: Json; updated_at: string } | null;
  pathway: {
    archetypes: Json | null;
    recommended_track: string | null;
    result_json: Json;
  } | null;
  actionItems: { id: string; completed: boolean }[];
};

const emptyHub: LearnHubData = {
  userId: "",
  confidenceScore: 0,
  hasConversation: false,
  latestSession: null,
  pathway: null,
  actionItems: [],
};

async function fetchLearnHub(): Promise<LearnHubData> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return emptyHub;

  try {
    const [pathRes, countRes, latestRes, actionsRes] = await Promise.all([
      supabase
        .from("pathway_results")
        .select("confidence_score, archetypes, recommended_track, result_json")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("conversation_sessions").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase
        .from("conversation_sessions")
        .select("id, messages, updated_at")
        .eq("user_id", uid)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("action_plan_items").select("id, completed").eq("user_id", uid),
    ]);

    const pathway = pathRes.data;
    const rawScore = pathway?.confidence_score;
    const confidenceScore =
      typeof rawScore === "number" && !Number.isNaN(rawScore) ? Math.min(100, Math.max(0, rawScore)) : 0;

    const count = countRes.count ?? 0;
    const hasConversation = count > 0;

    return {
      userId: uid,
      confidenceScore,
      hasConversation,
      latestSession: latestRes.data
        ? { id: latestRes.data.id, messages: latestRes.data.messages, updated_at: latestRes.data.updated_at }
        : null,
      pathway: pathway
        ? {
            archetypes: pathway.archetypes,
            recommended_track: pathway.recommended_track,
            result_json: pathway.result_json,
          }
        : null,
      actionItems: (actionsRes.data ?? []) as { id: string; completed: boolean }[],
    };
  } catch {
    return { ...emptyHub, userId: uid };
  }
}

function lastMessagePreview(messages: Json): string {
  if (!Array.isArray(messages)) return "";
  let last = "";
  for (const m of messages) {
    const row = m as { content?: string; text?: string; message?: string };
    const c = row.content ?? row.text ?? row.message ?? "";
    if (typeof c === "string" && c.trim()) last = c.trim();
  }
  return last.slice(0, 80);
}

function parseArchetypes(archetypes: Json | null, resultJson: Json): ArchetypeCard[] {
  if (Array.isArray(archetypes) && archetypes.length > 0) {
    return archetypes.slice(0, 3).map((item: unknown) => {
      const o = item as Record<string, unknown>;
      const name = String(o.name ?? o.title ?? o.label ?? "Archetype");
      const match = typeof o.match === "number" ? o.match : Number(o.pct ?? o.fit ?? o.score ?? 0);
      const desc = String(o.description ?? o.summary ?? o.brief ?? "");
      return { name, match: Number.isFinite(match) ? match : 0, desc };
    });
  }
  const r = resultJson as PathwayResult | null;
  if (r?.pathways?.length) {
    return r.pathways.slice(0, 3).map((p) => ({
      name: p.title,
      match: p.fitScore,
      desc: p.whyItFits?.[0] ?? "",
    }));
  }
  return [];
}

function LearnLoading() {
  const { t } = useTranslation();
  return (
    <div
      className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3"
      style={{ background: "#FAFAF8" }}
    >
      <Loader2 className="h-8 w-8 animate-spin text-[#C8102E]" aria-hidden />
      <p className="text-sm text-[#6B6B6B]">{t("common.loading")}</p>
    </div>
  );
}

const sectionLabelStyle: CSSProperties = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#6B6B6B",
};

function PathConfidenceBar({ score }: { score: number }) {
  const { t } = useTranslation();
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="mt-6 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#F0F0F0" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "#C8102E",
            transition: "width 0.8s ease",
          }}
        />
      </div>
      <p className="mt-2 text-[14px] text-[#6B6B6B]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        {t("learn.hub.scoreFraction", { score: pct })}
      </p>
    </div>
  );
}

function ArchetypeCards({ items }: { items: ArchetypeCard[] }) {
  const { t } = useTranslation();
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {items.map((a) => (
        <div
          key={a.name}
          className="rounded-xl border border-[#E5E5E5] p-4 shadow-sm"
          style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#FAFAF8" }}
        >
          <p className="text-[15px] font-semibold text-[#0A0A0A]">{a.name}</p>
          <p className="mt-1 text-[13px] font-medium text-[#C8102E]">{a.match}%</p>
          {a.desc ? <p className="mt-2 line-clamp-3 text-[12px] leading-snug text-[#6B6B6B]">{a.desc}</p> : null}
        </div>
      ))}
    </div>
  );
}

function LearnHubContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery({
    queryKey: ["learn-hub"],
    queryFn: fetchLearnHub,
    staleTime: 30_000,
  });

  const preview = useMemo(
    () => (data.latestSession ? lastMessagePreview(data.latestSession.messages) : ""),
    [data.latestSession],
  );

  const archetypes = useMemo(
    () => parseArchetypes(data.pathway?.archetypes ?? null, data.pathway?.result_json ?? null),
    [data.pathway],
  );

  const skillsUnlocked = data.confidenceScore >= 75;
  const completedActions = data.actionItems.filter((x) => x.completed).length;
  const totalActions = Math.max(1, data.actionItems.length);
  const trackProgress = Math.round((completedActions / totalActions) * 100);
  const trackName = data.pathway?.recommended_track?.trim() || t("learn.hub.fallbackTrack");

  const pathBody = () => {
    if (!data.hasConversation) {
      return (
        <div
          className="mt-8 rounded-2xl border border-[#E5E5E5] p-8"
          style={{ borderRadius: 16, padding: 32, background: "#FAFAF8" }}
        >
          <h3 className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
            {t("learn.hub.meetMentorTitle")}
          </h3>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#6B6B6B]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            {t("learn.hub.meetMentorSubtitle")}
          </p>
          <button
            type="button"
            onClick={() => navigate("/learn/path")}
            className="mt-6 border-0 font-semibold text-white transition hover:opacity-90"
            style={{
              background: "#C8102E",
              borderRadius: 100,
              padding: "12px 24px",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {t("learn.hub.startConversation")}
          </button>
        </div>
      );
    }

    if (data.confidenceScore < 75) {
      return (
        <div className="mt-8 rounded-2xl border border-[#E5E5E5] p-8" style={{ borderRadius: 16, padding: 32, background: "#FAFAF8" }}>
          <h3 className="text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
            {t("learn.hub.continueTitle")}
          </h3>
          {preview ? (
            <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-[#6B6B6B]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              {preview}
              {preview.length >= 80 ? "…" : ""}
            </p>
          ) : (
            <p className="mt-3 text-[14px] text-[#6B6B6B]">{t("learn.path.subtitle")}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/learn/path")}
              className="border-0 font-semibold text-white transition hover:opacity-90"
              style={{
                background: "#C8102E",
                borderRadius: 100,
                padding: "12px 24px",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {t("learn.hub.continueCta")}
            </button>
          </div>
          {archetypes.length > 0 ? (
            <div className="mt-8">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
                {t("learn.hub.archetypePreviewTitle")}
              </p>
              <ArchetypeCards items={archetypes} />
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="mt-8">
        {archetypes.length > 0 ? <ArchetypeCards items={archetypes} /> : null}
        <button
          type="button"
          onClick={() => navigate("/learn/path/report")}
          className="mt-6 border-0 font-semibold text-white transition hover:opacity-90"
          style={{
            background: "#C8102E",
            borderRadius: 100,
            padding: "12px 24px",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {t("learn.hub.viewFullReport")}
        </button>
      </div>
    );
  };

  const skillsInner = (
    <div className="rounded-2xl border border-[#E5E5E5] p-6" style={{ background: "#FAFAF8" }}>
      <p className="text-[12px] font-semibold text-[#6B6B6B]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        {t("learn.hub.activeTrack")}
      </p>
      <p className="mt-1 text-lg font-semibold text-[#0A0A0A]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        {trackName}
      </p>
      <p className="mt-1 text-[13px] text-[#6B6B6B]">{t("learn.hub.progressLabel")}</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F0F0F0]">
        <div className="h-full rounded-full bg-[#C8102E] transition-all" style={{ width: `${trackProgress}%` }} />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { to: "/develop?tab=cases", title: t("learn.hub.cardCasesTitle"), desc: t("learn.hub.cardCasesDesc"), Icon: Briefcase },
          { to: "/pulse", title: t("learn.hub.cardEdgeTitle"), desc: t("learn.hub.cardEdgeDesc"), Icon: TrendingUp },
          { to: "/field", title: t("learn.hub.cardInternTitle"), desc: t("learn.hub.cardInternDesc"), Icon: Globe },
          { to: "/develop?tab=resources", title: t("learn.hub.cardResourcesTitle"), desc: t("learn.hub.cardResourcesDesc"), Icon: BookOpen },
        ].map(({ to, title, desc, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex gap-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAF8] p-4 no-underline transition hover:border-[#C8102E]/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#C8102E]" style={{ background: "#FAFAF8" }}>
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#0A0A0A]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                {title}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-[#6B6B6B]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                {desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full text-[14px] text-[#0A0A0A]" style={{ background: "#FAFAF8", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section>
        <p className="mb-1" style={sectionLabelStyle}>
          {t("learn.hub.section1")}
        </p>
        <h1
          className="mb-2 text-[32px] font-bold leading-tight text-[#0A0A0A]"
          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
        >
          {t("learn.hub.pathTitle")}
        </h1>
        <p className="mb-8 max-w-2xl text-[15px] leading-[1.6] text-[#6B6B6B]">{t("learn.path.subtitle")}</p>
        <PathConfidenceBar score={data.confidenceScore} />
        {pathBody()}
      </section>

      <div className="my-10 h-px w-full bg-[#E5E5E5]" />

      <section>
        <p className="mb-1" style={sectionLabelStyle}>
          {t("learn.hub.section2")}
        </p>
        <h2
          className="mb-2 text-[32px] font-bold leading-tight text-[#0A0A0A]"
          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
        >
          {t("learn.hub.skillsTitle")}
        </h2>
        <p className="mb-8 max-w-2xl text-[15px] leading-[1.6] text-[#6B6B6B]">{t("learn.skills.subtitle")}</p>

        <div className="relative mt-8">
          {!skillsUnlocked ? (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl px-6 text-center"
              style={{ fontFamily: "Inter, system-ui, sans-serif", background: "rgba(250, 250, 248, 0.92)" }}
            >
              <Lock className="h-6 w-6 text-[#0A0A0A]" aria-hidden />
              <p className="text-[15px] font-semibold text-[#0A0A0A]">{t("learn.hub.skillsLockedTitle")}</p>
              <p className="text-[13px] text-[#6B6B6B]">
                {t("learn.hub.skillsLockedNeed", { current: data.confidenceScore })}
              </p>
            </div>
          ) : null}
          <div
            className={!skillsUnlocked ? "pointer-events-none select-none" : ""}
            style={!skillsUnlocked ? { filter: "blur(4px)" } : undefined}
          >
            {!skillsUnlocked ? (
              <div
                className="rounded-2xl border border-dashed border-[#E5E5E5] p-10 text-center text-[14px] text-[#6B6B6B]"
                style={{ background: "rgba(250, 250, 248, 0.95)" }}
              >
                <p>{t("learn.hub.skillsPreviewLine1")}</p>
                <p className="mt-2">{t("learn.hub.skillsPreviewLine2")}</p>
              </div>
            ) : (
              skillsInner
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function LearnHub() {
  return (
    <Suspense fallback={<LearnLoading />}>
      <LearnHubContent />
    </Suspense>
  );
}

function LearnReportView() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] w-full bg-[#FAFAF8] text-[14px] text-[#0A0A0A]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <Link
        to="/learn"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[#6B6B6B] no-underline hover:text-[#0A0A0A]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("learn.hub.backToLearn")}
      </Link>
      <h1
        className="mb-2 mt-8 text-[32px] font-bold leading-tight text-[#0A0A0A]"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        {t("learn.hub.reportPlaceholderTitle")}
      </h1>
      <p className="mb-8 max-w-lg text-[15px] leading-[1.6] text-[#6B6B6B]">{t("learn.hub.reportPlaceholderBody")}</p>
    </div>
  );
}

export default function Learn() {
  const { pathname } = useLocation();
  const { sidebarCollapsed } = useOutletContext<AppLayoutOutletContext>();
  if (pathname === "/learn/path/report") return <LearnReportView />;
  if (pathname === "/learn/path") return <LearnPath sidebarCollapsed={sidebarCollapsed} />;
  return <LearnHub />;
}
