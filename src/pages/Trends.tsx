import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";

type TrendStory = {
  headline: string;
  summary: string;
  morocco_angle: string;
  impact: string;
  sector: string;
  sentiment: "positive" | "neutral" | "negative";
  source: string;
  url: string;
  is_global: boolean;
};

type TrendDigest = {
  week_summary: string;
  top_stories: TrendStory[];
  market_signal: string;
  sectors_trending: string[];
  global_vs_local?: string;
  job_search_tips?: string[];
};

type TabMode = "general" | "sector";

function todayKeyPart() {
  return new Date().toISOString().slice(0, 10);
}

function nowLabel() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseDigest(raw: unknown): TrendDigest | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const stories = Array.isArray(data.top_stories) ? data.top_stories : [];
  return {
    week_summary: String(data.week_summary ?? ""),
    top_stories: stories.map((s) => {
      const o = s as Record<string, unknown>;
      const sentiment = String(o.sentiment ?? "neutral").toLowerCase();
      return {
        headline: String(o.headline ?? ""),
        summary: String(o.summary ?? ""),
        morocco_angle: String(o.morocco_angle ?? ""),
        impact: String(o.impact ?? ""),
        sector: String(o.sector ?? "Other"),
        sentiment: sentiment === "positive" || sentiment === "negative" ? sentiment : "neutral",
        source: String(o.source ?? ""),
        url: String(o.url ?? "#"),
        is_global: Boolean(o.is_global),
      } as TrendStory;
    }),
    market_signal: String(data.market_signal ?? ""),
    sectors_trending: Array.isArray(data.sectors_trending) ? data.sectors_trending.map((x) => String(x)) : [],
    global_vs_local: typeof data.global_vs_local === "string" ? data.global_vs_local : undefined,
    job_search_tips: Array.isArray(data.job_search_tips) ? data.job_search_tips.map((x) => String(x)) : undefined,
  };
}

function sentimentColor(sentiment: TrendStory["sentiment"]) {
  if (sentiment === "positive") return "#22C55E";
  if (sentiment === "negative") return "#C8102E";
  return "#9CA3AF";
}

function extractSector(track: string): string {
  const t = track.toLowerCase();
  if (t.includes("consult")) return "Consulting";
  if (t.includes("finance") || t.includes("bank")) return "Finance";
  if (t.includes("product") || t.includes("data") || t.includes("tech")) return "Tech";
  if (t.includes("market") || t.includes("brand")) return "Marketing";
  if (t.includes("industry") || t.includes("supply")) return "Industry";
  return "Business";
}

async function fallbackClaudeDigest(mode: TabMode, sector?: string): Promise<TrendDigest | null> {
  const prompt =
    mode === "sector"
      ? `Generate a Morocco ${sector} weekly digest for students and job seekers.
Respond ONLY with JSON:
{
  "week_summary": "2-3 sentence overview combining global and local trends",
  "top_stories": [
    {
      "headline": "clear headline",
      "summary": "2 sentences — what happened globally",
      "morocco_angle": "1 sentence — relevance for Morocco specifically",
      "impact": "career impact",
      "sector": "${sector}",
      "sentiment": "positive|neutral|negative",
      "source": "Analyst synthesis",
      "url": "https://example.com",
      "is_global": true
    }
  ],
  "market_signal": "one key insight",
  "sectors_trending": ["${sector}", "Tech", "Finance"],
  "global_vs_local": "one sentence on global trends impacting Morocco",
  "job_search_tips": ["tip 1", "tip 2", "tip 3"]
}`
      : `Generate a global + Morocco economy weekly digest for students and job seekers.
Respond ONLY with JSON:
{
  "week_summary": "2-3 sentence overview combining global and local trends",
  "top_stories": [
    {
      "headline": "clear headline",
      "summary": "2 sentences — what happened globally",
      "morocco_angle": "1 sentence — relevance for Morocco specifically",
      "impact": "career impact",
      "sector": "Finance|Tech|Industry|Government|Other",
      "sentiment": "positive|neutral|negative",
      "source": "Analyst synthesis",
      "url": "https://example.com",
      "is_global": true
    }
  ],
  "market_signal": "one key insight",
  "sectors_trending": ["sector1", "sector2", "sector3"],
  "global_vs_local": "one sentence on global trends impacting Morocco"
}`;

  const { data } = await supabase.functions.invoke("chat-ai", {
    body: { messages: [{ role: "user", content: prompt }], model: "claude-haiku-4-5-20251001" },
  });
  const reply = String((data as { reply?: unknown })?.reply ?? "");
  const matched = reply.match(/\{[\s\S]*\}/);
  if (!matched) return null;
  const parsed = JSON.parse(matched[0]) as Record<string, unknown>;
  return parseDigest(parsed);
}

export default function Trends() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabMode>("general");
  const [loading, setLoading] = useState(true);
  const [digest, setDigest] = useState<TrendDigest | null>(null);
  const [sectorDigest, setSectorDigest] = useState<TrendDigest | null>(null);
  const [sectorName, setSectorName] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);

  const activeDigest = tab === "general" ? digest : sectorDigest;

  const fetchTrends = async (forceRefresh = false) => {
    setLoading(true);
    setDisclaimer(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        navigate("/auth", { replace: true });
        return;
      }
      const dateKey = todayKeyPart();

      if (tab === "general") {
        const cacheKey = `trends_general_${dateKey}`;
        if (!forceRefresh) {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = parseDigest(JSON.parse(cached));
            if (parsed) {
              setDigest(parsed);
              setLastUpdated(`today at ${nowLabel()}`);
              setLoading(false);
              return;
            }
          }
        }
        try {
          const { data, error } = await supabase.functions.invoke("news-ai", { body: { type: "general" } });
          if (error) throw error;
          const parsed = parseDigest(data);
          if (!parsed) throw new Error("Invalid digest");
          setDigest(parsed);
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
          setLastUpdated(`today at ${nowLabel()}`);
        } catch {
          const fallback = await fallbackClaudeDigest("general");
          if (fallback) {
            setDigest(fallback);
            setLastUpdated(`today at ${nowLabel()}`);
            setDisclaimer("Based on available data");
          }
        }
      } else {
        const { data: latestPath } = await supabase
          .from("pathway_results")
          .select("recommended_track")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const track = String(latestPath?.recommended_track ?? "").trim();
        if (!track) {
          setSectorDigest(null);
          setSectorName(null);
          setLoading(false);
          return;
        }
        const sector = extractSector(track);
        setSectorName(sector);
        const cacheKey = `trends_sector_${sector}_${dateKey}`;

        if (!forceRefresh) {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = parseDigest(JSON.parse(cached));
            if (parsed) {
              setSectorDigest(parsed);
              setLastUpdated(`today at ${nowLabel()}`);
              setLoading(false);
              return;
            }
          }
        }

        try {
          const { data, error } = await supabase.functions.invoke("news-ai", { body: { type: "sector", sector } });
          if (error) throw error;
          const parsed = parseDigest(data);
          if (!parsed) throw new Error("Invalid digest");
          const filteredStories = parsed.top_stories.filter(
            (s) => s.sector.toLowerCase() === sector.toLowerCase() || s.sector.toLowerCase() === "other",
          );
          const normalized = { ...parsed, top_stories: filteredStories.length ? filteredStories : parsed.top_stories };
          setSectorDigest(normalized);
          localStorage.setItem(cacheKey, JSON.stringify(normalized));
          setLastUpdated(`today at ${nowLabel()}`);
        } catch {
          const fallback = await fallbackClaudeDigest("sector", sector);
          if (fallback) {
            setSectorDigest(fallback);
            setLastUpdated(`today at ${nowLabel()}`);
            setDisclaimer("Based on available data");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    document.title = "Trends — Cariva";
    const nodes = document.querySelectorAll(".page-container");
    const el = nodes[nodes.length - 1] as HTMLElement | undefined;
    if (el) requestAnimationFrame(() => el.classList.add("page-visible"));
  }, []);

  const headerTitle = useMemo(() => {
    if (tab === "sector" && sectorName) return `Trends in ${sectorName} this week`;
    return "Trends";
  }, [tab, sectorName]);

  return (
    <div className="page-container" style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      <main className="mx-auto w-full max-w-[900px] px-6 py-10 md:px-10 md:py-12">
        <style>{`
          @keyframes trendsShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          .trends-skeleton {
            background: linear-gradient(90deg, #f2f2f2 25%, #e8e8e8 37%, #f2f2f2 63%);
            background-size: 400% 100%;
            animation: trendsShimmer 1.25s ease infinite;
            border-radius: 12px;
          }
        `}</style>

        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: 32, fontWeight: 800, color: "#0A0A0A" }}>{headerTitle}</h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#6B6B6B", marginTop: 6 }}>
              Morocco&apos;s economy and job market, this week.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchTrends(true)}
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              border: "1px solid #E5E5E5",
              borderRadius: 100,
              padding: "6px 14px",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              color: "#6B6B6B",
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div
          style={{
            background: "#F5F5F5",
            borderRadius: 100,
            padding: 4,
            display: "inline-flex",
            gap: 4,
            margin: "24px 0",
          }}
        >
          {[
            { id: "general", label: "General Economy" },
            { id: "sector", label: "My Sector ⭐" },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as TabMode)}
                style={{
                  background: active ? "white" : "transparent",
                  border: "none",
                  borderRadius: 100,
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  padding: "8px 20px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#0A0A0A" : "#6B6B6B",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <>
            <div className="trends-skeleton h-28 w-full" />
            <div className="trends-skeleton mt-4 h-20 w-full" />
            <div className="trends-skeleton mt-4 h-28 w-full" />
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B6B6B", textAlign: "center", marginTop: 28 }}>
              Fetching latest Morocco news...
            </p>
          </>
        ) : tab === "sector" && !sectorName ? (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid #E5E5E5",
              padding: 24,
            }}
          >
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#6B6B6B" }}>
              Complete Path to unlock your personalized sector trends
            </p>
            <button
              type="button"
              onClick={() => navigate("/learn/path")}
              style={{
                marginTop: 12,
                border: "none",
                borderRadius: 100,
                padding: "10px 20px",
                background: "#C8102E",
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Start Path →
            </button>
          </div>
        ) : activeDigest ? (
          <>
            <section
              style={{
                background: "white",
                borderRadius: 16,
                borderLeft: "4px solid #C8102E",
                padding: 24,
                marginBottom: 24,
              }}
            >
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  textTransform: "uppercase",
                  color: "#C8102E",
                  letterSpacing: "0.1em",
                }}
              >
                Global + Morocco this week
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#0A0A0A", lineHeight: 1.7, marginTop: 8 }}>
                {activeDigest.week_summary}
              </p>
            </section>

            <section style={{ background: "#0A0A0A", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>📡 Market Signal</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "white", lineHeight: 1.6, marginTop: 6, fontWeight: 500 }}>
                {activeDigest.market_signal}
              </p>
            </section>

            <section style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Trending sectors</p>
              <div className="flex flex-wrap gap-2">
                {activeDigest.sectors_trending.map((s) => (
                  <span
                    key={s}
                    style={{
                      background: "white",
                      border: "1px solid #E5E5E5",
                      borderRadius: 100,
                      padding: "6px 16px",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "#0A0A0A",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {tab === "sector" && activeDigest.job_search_tips?.length ? (
              <section
                style={{
                  background: "white",
                  borderRadius: 12,
                  border: "1px solid #E5E5E5",
                  padding: 20,
                  marginBottom: 14,
                }}
              >
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
                  What this means for your job search
                </p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {activeDigest.job_search_tips.map((tip) => (
                    <li key={tip} style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B6B6B", lineHeight: 1.7 }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              {activeDigest.top_stories.map((story, i) => (
                <article
                  key={`${story.headline}-${i}`}
                  style={{
                    background: "white",
                    borderRadius: 12,
                    border: "1px solid #E5E5E5",
                    padding: 20,
                    marginBottom: 12,
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
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          background: "#F5F5F5",
                          borderRadius: 100,
                          padding: "4px 10px",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 11,
                          color: "#6B6B6B",
                          textTransform: "uppercase",
                        }}
                      >
                        {story.sector}
                      </span>
                      <span
                        style={{
                          background: "#F5F5F5",
                          borderRadius: 100,
                          padding: "4px 10px",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 11,
                          color: "#6B6B6B",
                        }}
                      >
                        {story.is_global ? "🌍 Global" : "🇲🇦 Morocco"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6B6B6B" }}>
                      <span style={{ color: sentimentColor(story.sentiment) }}>●</span> {story.source}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 600, color: "#0A0A0A", margin: "10px 0 8px" }}>
                    {story.headline}
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B6B6B", lineHeight: 1.6, marginBottom: 10 }}>
                    {story.summary}
                  </p>
                  {story.morocco_angle ? (
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        color: "#6B6B6B",
                        fontStyle: "italic",
                        marginTop: 6,
                        marginBottom: 10,
                      }}
                    >
                      🇲🇦 Morocco angle: {story.morocco_angle}
                    </p>
                  ) : null}
                  <div style={{ background: "#F5F5F5", borderRadius: 8, padding: "10px 14px" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#0A0A0A" }}>💼 Career impact: </span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6B6B6B" }}>{story.impact}</span>
                  </div>
                  <a
                    href={story.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      marginTop: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      textDecoration: "none",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "#C8102E",
                    }}
                  >
                    Read full story →
                  </a>
                </article>
              ))}
            </section>

            {(lastUpdated || disclaimer) && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6B6B6B", marginTop: 10 }}>
                {lastUpdated ? `Last updated: ${lastUpdated}` : ""}
                {lastUpdated && disclaimer ? " · " : ""}
                {disclaimer ?? ""}
              </p>
            )}
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#AAAAAA", textAlign: "center", marginTop: 32 }}>
              Sources: Financial Times · Bloomberg · Reuters · Le Matin · L&apos;Economiste · GNews
            </p>
          </>
        ) : (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B6B6B" }}>No trends available right now.</p>
        )}
      </main>
    </div>
  );
}
