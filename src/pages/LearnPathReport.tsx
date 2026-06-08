import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type CareerItem = {
  title: string;
  match: number;
  description: string;
};

type PathwayResultRow = {
  confidence_score: number | null;
  archetypes: Json | null;
  all_careers: Json | null;
  key_insights: Json | null;
  recommended_track: string | null;
  result_json: Json | null;
};

function clampScore(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function maybeParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseCareerItem(raw: unknown): CareerItem | null {
  try {
    const obj = asRecord(maybeParseJson(raw));
    if (!obj) return null;
    const title = String(obj.title ?? obj.name ?? obj.label ?? "").trim();
    if (!title) return null;
    const match = clampScore(obj.match ?? obj.score ?? obj.pct ?? obj.fit);
    const description = String(obj.description ?? obj.summary ?? obj.brief ?? "").trim();
    return { title, match, description };
  } catch {
    return null;
  }
}

function toArray(value: unknown): unknown[] {
  const parsed = maybeParseJson(value);
  return Array.isArray(parsed) ? parsed : [];
}

function parseTopArchetypes(row: PathwayResultRow | null): CareerItem[] {
  if (!row) return [];
  try {
    const parsedResult = maybeParseJson(row.result_json);
    const resultObj = asRecord(parsedResult);

    const fromResultArchetypes = toArray(resultObj?.archetypes).map(parseCareerItem).filter(Boolean) as CareerItem[];
    if (fromResultArchetypes.length > 0) return fromResultArchetypes.slice(0, 3);

    const fromColumnArchetypes = toArray(row.archetypes).map(parseCareerItem).filter(Boolean) as CareerItem[];
    if (fromColumnArchetypes.length > 0) return fromColumnArchetypes.slice(0, 3);

    const fromPathways = toArray(resultObj?.pathways)
      .map((entry) => {
        try {
          const obj = asRecord(entry);
          if (!obj) return null;
          const title = String(obj.title ?? obj.name ?? "").trim();
          if (!title) return null;
          const match = clampScore(obj.fitScore ?? obj.match ?? obj.score);
          const why = toArray(obj.whyItFits)
            .map((x) => String(x ?? "").trim())
            .find(Boolean);
          return {
            title,
            match,
            description: why ?? "",
          } as CareerItem;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as CareerItem[];

    return fromPathways.slice(0, 3);
  } catch {
    return [];
  }
}

function parseAllCareers(row: PathwayResultRow | null): CareerItem[] {
  if (!row) return [];
  try {
    return toArray(row.all_careers)
      .map(parseCareerItem)
      .filter(Boolean)
      .sort((a, b) => b!.match - a!.match) as CareerItem[];
  } catch {
    return [];
  }
}

function parseInsights(row: PathwayResultRow | null): string[] {
  if (!row) return [];
  try {
    const insights = toArray(row.key_insights)
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
    return insights.slice(0, 3);
  } catch {
    return [];
  }
}

function getFirstName(fullName: string | null | undefined): string {
  const clean = String(fullName ?? "").trim();
  if (!clean) return "there";
  return clean.split(/\s+/)[0] ?? "there";
}

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className="report-skeleton"
      style={{
        height: tall ? 270 : 190,
        borderRadius: 16,
        border: "1px solid #EAEAEA",
      }}
    />
  );
}

export default function LearnPathReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("there");
  const [result, setResult] = useState<PathwayResultRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Learn Report — Cariva";
    const nodes = document.querySelectorAll(".page-container");
    const el = nodes[nodes.length - 1] as HTMLElement | undefined;
    if (el) requestAnimationFrame(() => el.classList.add("page-visible"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user?.id) {
          navigate("/auth", { replace: true });
          return;
        }

        const [profileRes, resultRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
          supabase
            .from("pathway_results")
            .select("confidence_score, archetypes, all_careers, key_insights, recommended_track, result_json")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (cancelled) return;
        setFirstName(getFirstName(profileRes.data?.full_name));

        if (resultRes.error) {
          setError(resultRes.error.message);
          setResult(null);
          return;
        }

        if (!resultRes.data) {
          setResult(null);
          return;
        }

        setResult(resultRes.data as PathwayResultRow);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load report";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const topCareers = useMemo(() => parseTopArchetypes(result), [result]);
  const allCareers = useMemo(() => parseAllCareers(result), [result]);
  const insights = useMemo(() => parseInsights(result), [result]);
  const confidenceScore = clampScore(result?.confidence_score ?? 0);
  const skillsUnlocked = confidenceScore >= 75;
  const titleName = firstName || "there";

  if (loading) {
    return (
      <div className="page-container" style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <style>{`
          @keyframes reportShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          .report-skeleton {
            background: linear-gradient(90deg, #f2f2f2 25%, #e8e8e8 37%, #f2f2f2 63%);
            background-size: 400% 100%;
            animation: reportShimmer 1.25s ease infinite;
          }
        `}</style>
        <main className="mx-auto w-full max-w-[1000px] px-6 py-10 md:px-10 md:py-12">
          <div className="report-skeleton h-5 w-36 rounded-full" />
          <div className="report-skeleton mt-6 h-12 w-3/4 rounded-xl" />
          <div className="report-skeleton mt-4 h-5 w-1/3 rounded-lg" />
          <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            <SkeletonCard tall />
            <SkeletonCard />
            <SkeletonCard />
          </section>
          <section className="mt-12 space-y-3">
            <div className="report-skeleton h-8 w-64 rounded-xl" />
            <div className="report-skeleton h-10 w-full rounded-xl" />
            <div className="report-skeleton h-10 w-full rounded-xl" />
            <div className="report-skeleton h-10 w-full rounded-xl" />
          </section>
        </main>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="page-container" style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <main className="mx-auto w-full max-w-[1000px] px-6 py-10 md:px-10 md:py-12">
          <button
            type="button"
            onClick={() => navigate("/learn")}
            className="text-[14px] font-medium text-[#6B6B6B] transition hover:text-[#0A0A0A]"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            ← Back to Learn
          </button>
          <h1
            className="mt-8 text-[34px] font-[800] leading-tight text-[#0A0A0A] md:text-[40px]"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            No report yet
          </h1>
          <button
            type="button"
            onClick={() => navigate("/learn/path")}
            className="mt-8 rounded-full border-0 bg-[#C8102E] px-7 py-3 text-[15px] font-semibold text-white transition hover:opacity-90"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Start your Path conversation →
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      <main className="mx-auto w-full max-w-[1000px] px-6 py-10 md:px-10 md:py-12">
        <button
          type="button"
          onClick={() => navigate("/learn")}
          className="text-[14px] font-medium text-[#6B6B6B] transition hover:text-[#0A0A0A]"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          ← Back to Learn
        </button>

        <h1
          className="mt-8 text-[34px] font-[800] leading-tight text-[#0A0A0A] md:text-[40px]"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Here's who you are, {titleName}.
        </h1>
        <p
          className="mt-2 text-[16px] text-[#6B6B6B]"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Based on your conversation with Mentor
        </p>

        <section className="report-cards-grid mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {topCareers.map((career, idx) => {
            const primary = idx === 0;
            return (
              <button
                type="button"
                key={`${career.title}-${idx}`}
                onClick={() => navigate(`/learn/path/career/${encodeURIComponent(career.title)}`)}
                className="min-w-0 text-left"
                style={{
                  border: primary ? "2px solid #C8102E" : "1.5px solid #E5E5E5",
                  borderRadius: primary ? 20 : 16,
                  padding: primary ? 32 : 24,
                  background: "white",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: primary ? "#C8102E" : "#6B6B6B",
                    background: primary ? "#FFF0F0" : "#F7F7F7",
                    borderRadius: 100,
                    padding: "4px 12px",
                    display: "inline-block",
                  }}
                >
                  #{idx + 1} Match
                </span>
                <h2
                  className="mt-4 break-words"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: primary ? 28 : 20,
                    fontWeight: 700,
                    color: "#0A0A0A",
                    lineHeight: 1.2,
                  }}
                >
                  {career.title}
                </h2>
                <p
                  className="mt-4"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: primary ? 48 : 32,
                    fontWeight: 900,
                    color: "#C8102E",
                    lineHeight: 1,
                  }}
                >
                  {career.match}%
                </p>
                <p
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 13,
                    color: "#6B6B6B",
                    marginTop: 4,
                  }}
                >
                  match
                </p>
                {career.description ? (
                  <p
                    className="mt-4"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 14,
                      color: "#6B6B6B",
                      lineHeight: 1.6,
                    }}
                  >
                    {career.description}
                  </p>
                ) : null}
                <span
                  className="mt-6 inline-block rounded-full bg-[#C8102E] px-5 py-2.5 text-[14px] font-semibold text-white"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Explore this career →
                </span>
              </button>
            );
          })}
        </section>

        <section className="mt-10">
          <h3
            className="mb-4 text-[22px] font-bold text-[#0A0A0A]"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            All your possible careers
          </h3>
          {allCareers.length === 0 ? (
            <p
              className="text-[15px] text-[#6B6B6B]"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Complete your Path conversation to see all career matches
            </p>
          ) : (
            <div className="space-y-1.5">
              {allCareers.map((career) => (
                <button
                  key={career.title}
                  type="button"
                  onClick={() => navigate(`/learn/path/career/${encodeURIComponent(career.title)}`)}
                  className="w-full rounded-lg px-2 py-2 transition hover:bg-[#FAFAF8]"
                  style={{ textAlign: "left" }}
                >
                  <div className="flex items-center gap-4">
                    <p
                      className="w-[220px] shrink-0 truncate text-[15px] font-medium text-[#0A0A0A]"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {career.title}
                    </p>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#F0F0F0]">
                      <div className="h-full rounded-full bg-[#C8102E]" style={{ width: `${career.match}%` }} />
                    </div>
                    <p
                      className="min-w-[40px] text-right text-[13px] text-[#6B6B6B]"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {career.match}%
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {insights.length > 0 ? (
          <section className="mt-10">
            <h3
              className="mb-4 text-[22px] font-bold text-[#0A0A0A]"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              What Mentor understood
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {insights.map((insight, idx) => (
                <article
                  key={`${insight.slice(0, 20)}-${idx}`}
                  style={{
                    background: "white",
                    borderRadius: 12,
                    border: "1px solid #E5E5E5",
                    padding: 20,
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 32,
                      color: "#C8102E",
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    "
                  </span>
                  <p
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 15,
                      color: "#0A0A0A",
                      lineHeight: 1.7,
                    }}
                  >
                    {insight}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10 flex flex-wrap items-center gap-4">
          {skillsUnlocked ? (
            <p
              className="text-[14px] text-[#22C55E]"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              ✓ Your Path score is {confidenceScore}/100 — Skills unlocked!
            </p>
          ) : (
            <p
              className="text-[14px] text-[#6B6B6B]"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Continue with Mentor to refine your profile
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate(skillsUnlocked ? "/learn" : "/learn/path")}
            className="rounded-full border-0 bg-[#C8102E] px-7 py-3.5 text-[15px] font-semibold text-white transition hover:opacity-90"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            {skillsUnlocked ? "Start Skills →" : "Continue conversation →"}
          </button>
        </section>

        <button
          type="button"
          onClick={() => navigate("/learn/path")}
          className="mt-8 rounded-full border px-5 py-2.5 text-[14px] text-[#6B6B6B] transition hover:bg-white"
          style={{
            border: "1.5px solid #E5E5E5",
            borderRadius: 100,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          These careers don't feel right → Refine with Mentor
        </button>
      </main>
    </div>
  );
}
