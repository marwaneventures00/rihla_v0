import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

type CareerScores = {
  match: number;
  academic: number;
  personality: number;
  interests: number;
};

type CareerProfile = {
  title: string;
  tagline: string;
  definition: string;
  daily_life: string[];
  required_skills: string[];
  top_companies_morocco: string[];
  salary_junior: string;
  salary_senior: string;
  market_demand: string;
  user_strengths: string[];
  user_gaps: string[];
};

type CacheShape = {
  timestamp: number;
  profile: CareerProfile;
};

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  border: "1px solid #E5E5E5",
  padding: 28,
  marginBottom: 20,
};

function clamp(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseAiJson(text: string): CareerProfile | null {
  try {
    const matched = text.match(/\{[\s\S]*\}/);
    if (!matched) return null;
    const parsed = JSON.parse(matched[0]) as Record<string, unknown>;
    return {
      title: String(parsed.title ?? ""),
      tagline: String(parsed.tagline ?? ""),
      definition: String(parsed.definition ?? ""),
      daily_life: Array.isArray(parsed.daily_life) ? parsed.daily_life.map((x) => String(x)) : [],
      required_skills: Array.isArray(parsed.required_skills) ? parsed.required_skills.map((x) => String(x)) : [],
      top_companies_morocco: Array.isArray(parsed.top_companies_morocco)
        ? parsed.top_companies_morocco.map((x) => String(x))
        : [],
      salary_junior: String(parsed.salary_junior ?? ""),
      salary_senior: String(parsed.salary_senior ?? ""),
      market_demand: String(parsed.market_demand ?? ""),
      user_strengths: Array.isArray(parsed.user_strengths) ? parsed.user_strengths.map((x) => String(x)) : [],
      user_gaps: Array.isArray(parsed.user_gaps) ? parsed.user_gaps.map((x) => String(x)) : [],
    };
  } catch {
    return null;
  }
}

export default function CareerDetail() {
  const { careerId } = useParams();
  const navigate = useNavigate();
  const careerName = decodeURIComponent(careerId ?? "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scores, setScores] = useState<CareerScores>({ match: 0, academic: 0, personality: 0, interests: 0 });
  const [profile, setProfile] = useState<CareerProfile | null>(null);

  useEffect(() => {
    document.title = "Career Detail — Cariva";
    const nodes = document.querySelectorAll(".page-container");
    const el = nodes[nodes.length - 1] as HTMLElement | undefined;
    if (el) requestAnimationFrame(() => el.classList.add("page-visible"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          navigate("/auth", { replace: true });
          return;
        }

        const { data: latestRow } = await supabase
          .from("pathway_results")
          .select("all_careers")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const careers = (Array.isArray(latestRow?.all_careers) ? latestRow?.all_careers : []) as Array<Record<string, unknown>>;
        const matched = careers.find(
          (c) => String(c.title ?? "").trim().toLowerCase() === careerName.trim().toLowerCase(),
        );
        if (matched) {
          setScores({
            match: clamp(matched.match),
            academic: clamp(matched.academic),
            personality: clamp(matched.personality),
            interests: clamp(matched.interests),
          });
        }

        const cacheKey = `career_${careerName}_${userId}`;
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as CacheShape;
            const valid = Date.now() - cached.timestamp < 24 * 60 * 60 * 1000;
            if (valid && cached.profile) {
              if (!cancelled) {
                setProfile(cached.profile);
                setLoading(false);
              }
              return;
            }
          } catch {
            // Ignore broken cache and regenerate.
          }
        }

        const prompt = `Generate a career profile for
"${careerName}" specifically for Moroccan students.
Respond ONLY with valid JSON, no other text:
{
  "title": "${careerName}",
  "tagline": "one sentence describing the role",
  "definition": "2-3 sentences explaining what this career is",
  "daily_life": [
    "task or activity 1",
    "task or activity 2",
    "task or activity 3",
    "task or activity 4"
  ],
  "required_skills": [
    "skill 1", "skill 2", "skill 3", "skill 4"
  ],
  "top_companies_morocco": [
    "company 1", "company 2", "company 3"
  ],
  "salary_junior": "8,000 - 12,000 MAD/month",
  "salary_senior": "20,000 - 35,000 MAD/month",
  "market_demand": "high",
  "user_strengths": [
    "strength from their profile"
  ],
  "user_gaps": [
    "gap from their profile"
  ]
}`;

        const { data, error: invokeError } = await supabase.functions.invoke("chat-ai", {
          body: {
            messages: [{ role: "user", content: prompt }],
            model: "claude-haiku-4-5-20251001",
          },
        });

        if (invokeError) throw invokeError;
        const reply = String((data as { reply?: unknown })?.reply ?? "");
        const parsed = parseAiJson(reply);
        if (!parsed) throw new Error("Invalid AI JSON");

        if (!cancelled) {
          setProfile(parsed);
          localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), profile: parsed }));
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [careerName, navigate]);

  const title = useMemo(() => profile?.title || careerName || "Career", [profile?.title, careerName]);
  const tagline = profile?.tagline || "";

  return (
    <div className="page-container" style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      <main className="mx-auto w-full max-w-[800px] px-6 py-10 md:px-10 md:py-12">
        <style>{`
          @keyframes cdShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          .cd-skeleton {
            background: linear-gradient(90deg, #f2f2f2 25%, #e8e8e8 37%, #f2f2f2 63%);
            background-size: 400% 100%;
            animation: cdShimmer 1.25s ease infinite;
          }
        `}</style>

        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 24,
            cursor: "pointer",
            border: "none",
            background: "transparent",
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            color: "#6B6B6B",
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          Back to report
        </button>

        <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: 36, fontWeight: 800, color: "#0A0A0A", marginBottom: 8 }}>{title}</h1>
        {tagline ? (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#6B6B6B", marginBottom: 16 }}>{tagline}</p>
        ) : null}

        <span
          style={{
            background: "#FFF0F0",
            color: "#C8102E",
            borderRadius: 100,
            padding: "6px 16px",
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          {scores.match}% match
        </span>

        <section style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Academic", value: scores.academic },
            { label: "Personality", value: scores.personality },
            { label: "Interests", value: scores.interests },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 100, flexShrink: 0, fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6B6B6B" }}>{row.label}</span>
              <div style={{ flex: 1, height: 6, background: "#F0F0F0", borderRadius: 100, overflow: "hidden" }}>
                <div style={{ width: `${row.value}%`, height: "100%", background: "#C8102E", borderRadius: 100 }} />
              </div>
              <span style={{ width: 40, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6B6B6B" }}>{row.value}%</span>
            </div>
          ))}
        </section>

        {loading ? (
          <>
            <div className="cd-skeleton" style={{ ...cardStyle, height: 140 }} />
            <div className="cd-skeleton" style={{ ...cardStyle, height: 160 }} />
            <div className="cd-skeleton" style={{ ...cardStyle, height: 150 }} />
            <p style={{ marginTop: 40, textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B6B6B" }}>
              Mentor is building your career profile...
            </p>
          </>
        ) : error || !profile ? (
          <>
            <div style={cardStyle}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#6B6B6B" }}>Career details temporarily unavailable</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/learn")}
              style={{
                width: "100%",
                border: "none",
                cursor: "pointer",
                marginTop: 8,
                borderRadius: 100,
                padding: 16,
                background: "#C8102E",
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Start this track in Skills →
            </button>
          </>
        ) : (
          <>
            <section style={cardStyle}>
              <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600, color: "#0A0A0A", marginBottom: 12 }}>
                What this professional does
              </h2>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#6B6B6B", lineHeight: 1.7 }}>{profile.definition}</p>
            </section>

            <section style={cardStyle}>
              <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600, color: "#0A0A0A", marginBottom: 12 }}>
                Daily life
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {profile.daily_life.map((item, idx) => (
                  <div key={`${item}-${idx}`} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8102E", marginTop: 8, flexShrink: 0 }} />
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#0A0A0A", lineHeight: 1.8 }}>{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600, color: "#0A0A0A", marginBottom: 12 }}>
                Key skills
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {profile.required_skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      border: "1px solid #E5E5E5",
                      borderRadius: 100,
                      padding: "6px 14px",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "#0A0A0A",
                      background: "white",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600, color: "#0A0A0A", marginBottom: 12 }}>
                The Moroccan market
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "#6B6B6B",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                    }}
                  >
                    Top employers
                  </p>
                  {profile.top_companies_morocco.map((company) => (
                    <p
                      key={company}
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        color: "#0A0A0A",
                        padding: "8px 0",
                        borderBottom: "1px solid #F5F5F5",
                      }}
                    >
                      {company}
                    </p>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ background: "#F5F5F5", borderRadius: 10, padding: "14px 16px" }}>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6B6B6B" }}>Junior</p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, color: "#C8102E" }}>{profile.salary_junior}</p>
                  </div>
                  <div style={{ background: "#F5F5F5", borderRadius: 10, padding: "14px 16px" }}>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6B6B6B" }}>Senior</p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, color: "#0A0A0A" }}>{profile.salary_senior}</p>
                  </div>
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600, color: "#0A0A0A", marginBottom: 12 }}>
                Your current profile
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "#22C55E",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                    }}
                  >
                    You already have
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {profile.user_strengths.map((item, idx) => (
                      <div key={`${item}-${idx}`} style={{ display: "flex", gap: 8 }}>
                        <CheckCircle size={16} color="#22C55E" />
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#0A0A0A", lineHeight: 1.6 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "#C8102E",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                    }}
                  >
                    What you need to develop
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {profile.user_gaps.map((item, idx) => (
                      <div key={`${item}-${idx}`} style={{ display: "flex", gap: 8 }}>
                        <XCircle size={16} color="#C8102E" />
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#0A0A0A", lineHeight: 1.6 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={() => navigate("/learn")}
              style={{
                width: "100%",
                border: "none",
                cursor: "pointer",
                marginTop: 8,
                borderRadius: 100,
                padding: 16,
                background: "#C8102E",
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#A50D26";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#C8102E";
              }}
            >
              Start this track in Skills →
            </button>
          </>
        )}
      </main>
    </div>
  );
}
