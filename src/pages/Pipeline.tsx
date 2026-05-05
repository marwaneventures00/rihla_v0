import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plus, AlertCircle, Briefcase, Calendar, TrendingUp, Award, Mail, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

type AppRow = {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string;
  status: string;
  application_url: string | null;
  notes: string | null;
  fit_score: number | null;
  ai_insight: string | null;
  created_at: string;
};

type FitResult = { score: number; insight: string };

const STATUS_COLUMNS = [
  { key: "wishlist", label: "Wishlist" },
  { key: "applied", label: "Applied" },
  { key: "round_1", label: "Round 1" },
  { key: "round_2", label: "Round 2" },
  { key: "offer", label: "Offer" },
] as const;

const STATUS_OPTIONS = [
  { value: "wishlist", label: "Wishlist" },
  { value: "applied", label: "Applied" },
  { value: "round_1", label: "Round 1" },
  { value: "round_2", label: "Round 2" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

function extractJson<T>(text: string): T | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

export default function Pipeline() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [recommendedTrack, setRecommendedTrack] = useState<string | null>(null);
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppRow | null>(null);
  const [emailType, setEmailType] = useState("application");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [moveMenuId, setMoveMenuId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    company_name: "",
    role_title: "",
    status: "wishlist",
    application_url: "",
    notes: "",
  });

  useEffect(() => {
    document.title = "Pipeline — Cariva";
    const nodes = document.querySelectorAll(".page-container");
    const el = nodes[nodes.length - 1] as HTMLElement | undefined;
    if (el) requestAnimationFrame(() => el.classList.add("page-visible"));
  }, []);

  const refreshApplications = async (uid: string) => {
    const { data } = await supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setApplications((data ?? []) as AppRow[]);
  };

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        navigate("/auth", { replace: true });
        return;
      }
      setUserId(uid);

      const [{ data: applicationsData }, { data: pathwayData }, { data: profileData }] = await Promise.all([
        supabase.from("job_applications").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase
          .from("pathway_results")
          .select("recommended_track, archetypes, result_json")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
      ]);

      const rj = (pathwayData?.result_json ?? {}) as Record<string, unknown>;
      const track = pathwayData?.recommended_track || (typeof rj.recommended_track === "string" ? rj.recommended_track : null) || null;
      setRecommendedTrack(track);
      setApplications((applicationsData ?? []) as AppRow[]);
      setUserName(profileData?.full_name?.trim() || "Student");
    })();
  }, [navigate]);

  const metrics = useMemo(() => {
    const total = applications.length;
    const active = applications.filter((a) => !["rejected", "offer"].includes(a.status)).length;
    const thisWeek = applications.filter((a) => new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
    const offers = applications.filter((a) => a.status === "offer").length;
    return { total, active, thisWeek, offers };
  }, [applications]);

  const urgentApps = useMemo(
    () =>
      applications.filter((a) => {
        const daysSince = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return a.status === "applied" && daysSince > 10;
      }),
    [applications],
  );

  const generateEmail = async (type = emailType, app = selectedApp) => {
    if (!app) return;
    setGeneratingEmail(true);
    try {
      const emailPrompt = `Write a professional
${type} email for a job application.

Student name: ${userName}
Company: ${app.company_name}
Role: ${app.role_title}
Email type: ${type}

Rules:
- Concise and professional
- Specific to the company and role
- No placeholder text — write the full email
- English only
- No subject line

Return ONLY the email body text.`;

      const { data } = await supabase.functions.invoke("chat-ai", {
        body: { messages: [{ role: "user", content: emailPrompt }], model: "claude-haiku-4-5-20251001" },
      });
      setGeneratedEmail(String((data as { reply?: unknown })?.reply ?? ""));
    } finally {
      setGeneratingEmail(false);
    }
  };

  useEffect(() => {
    if (showEmailModal && selectedApp) void generateEmail(emailType, selectedApp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEmailModal, selectedApp, emailType]);

  const handleStatusChange = async (app: AppRow, newStatus: string) => {
    await supabase.from("job_applications").update({ status: newStatus }).eq("id", app.id);
    await refreshApplications(userId);
    setMoveMenuId(null);
  };

  const handleAddApplication = async () => {
    if (!addForm.company_name.trim() || !addForm.role_title.trim()) {
      toast.error("Company and role are required");
      return;
    }

    const { data: inserted } = await supabase
      .from("job_applications")
      .insert({
        user_id: userId,
        company_name: addForm.company_name.trim(),
        role_title: addForm.role_title.trim(),
        status: addForm.status,
        application_url: addForm.application_url.trim() || null,
        notes: addForm.notes.trim() || null,
      })
      .select("*")
      .single();

    if (recommendedTrack && inserted) {
      const fitPrompt = `Rate the career fit between:
Student target: ${recommendedTrack}
Job: ${addForm.company_name} — ${addForm.role_title}

Respond ONLY with JSON:
{
  "score": 87,
  "insight": "one sentence explaining the fit",
  "strengths": ["strength 1"],
  "gaps": ["gap 1"]
}`;

      const { data: fitData } = await supabase.functions.invoke("chat-ai", {
        body: { messages: [{ role: "user", content: fitPrompt }], model: "claude-haiku-4-5-20251001" },
      });
      const parsed = extractJson<FitResult>(String((fitData as { reply?: unknown })?.reply ?? ""));
      if (parsed) {
        await supabase.from("job_applications").update({ fit_score: parsed.score, ai_insight: parsed.insight }).eq("id", inserted.id);
      }
    }

    setAddForm({ company_name: "", role_title: "", status: "wishlist", application_url: "", notes: "" });
    setShowAddModal(false);
    await refreshApplications(userId);
  };

  return (
    <div className="page-container w-full" style={{ background: "#FAFAF8", padding: "48px 40px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0A0A0A" }}>Pipeline</h1>
          <p style={{ fontSize: 15, color: "#6B6B6B", marginTop: 4 }}>{metrics.active} active applications</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            background: "#C8102E",
            color: "white",
            borderRadius: 100,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          <Plus size={14} /> Add application
        </button>
      </div>

      <div className="stats-grid grid grid-cols-1 gap-3 md:grid-cols-4" style={{ marginBottom: 32 }}>
        {[
          { label: "Total", value: metrics.total, color: "#0A0A0A", Icon: Briefcase },
          { label: "Active", value: metrics.active, color: "#0A0A0A", Icon: TrendingUp },
          { label: "This week", value: metrics.thisWeek, color: "#0A0A0A", Icon: Calendar },
          { label: "Offers", value: metrics.offers, color: metrics.offers > 0 ? "#22C55E" : "#0A0A0A", Icon: Award },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} style={{ background: "white", borderRadius: 12, border: "1px solid #E5E5E5", padding: 20 }}>
            <Icon size={14} color="#6B6B6B" />
            <p style={{ fontSize: 32, fontWeight: 800, color, marginTop: 8 }}>{value}</p>
            <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>{label}</p>
          </div>
        ))}
      </div>

      {urgentApps.length > 0 ? (
        <div
          style={{
            background: "#FFFBEB",
            border: "1.5px solid #F59E0B",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <AlertCircle size={20} color="#F59E0B" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A" }}>Follow up needed</p>
            <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 2 }}>
              {urgentApps[0].company_name} — applied{" "}
              {Math.floor((Date.now() - new Date(urgentApps[0].created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedApp(urgentApps[0]);
              setEmailType("follow-up");
              setShowEmailModal(true);
            }}
            style={{
              background: "#F59E0B",
              color: "white",
              borderRadius: 100,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Draft follow-up →
          </button>
        </div>
      ) : null}

      {applications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "52px 20px" }}>
          <Briefcase size={48} color="#AAAAAA" style={{ margin: "0 auto" }} />
          <p style={{ fontSize: 18, fontWeight: 600, color: "#0A0A0A", marginTop: 16 }}>No applications yet</p>
          <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 8 }}>Start tracking your job search</p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              marginTop: 20,
              background: "#C8102E",
              color: "white",
              borderRadius: 100,
              padding: "12px 24px",
              border: "none",
              cursor: "pointer",
            }}
          >
            + Add your first application
          </button>
        </div>
      ) : (
        <div className="kanban-board" style={{ overflowX: "auto", display: "flex", gap: 16, paddingBottom: 16 }}>
          {STATUS_COLUMNS.map((col) => {
            const rows = applications.filter((a) => a.status === col.key);
            return (
              <div className="kanban-column" key={col.key} style={{ minWidth: 260, flexShrink: 0, background: "#F5F5F5", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B6B6B", fontWeight: 600 }}>{col.label}</p>
                  <span style={{ background: "white", borderRadius: 100, padding: "2px 8px", fontSize: 12, fontWeight: 600, color: "#0A0A0A" }}>{rows.length}</span>
                </div>

                {rows.map((app) => (
                  <div
                    key={app.id}
                    style={{
                      background: "white",
                      borderRadius: 12,
                      border: "1px solid #E5E5E5",
                      padding: 16,
                      marginBottom: 8,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{app.company_name}</p>
                      {typeof app.fit_score === "number" ? (
                        <span style={{ background: "#FFF0F0", color: "#C8102E", borderRadius: 100, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
                          {app.fit_score}%
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "#AAAAAA" }}>—</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>{app.role_title}</p>
                    <p style={{ fontSize: 11, color: "#AAAAAA", marginTop: 4 }}>Added {new Date(app.created_at).toLocaleDateString()}</p>
                    {app.ai_insight ? (
                      <p style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #F5F5F5", fontSize: 12, color: "#6B6B6B", fontStyle: "italic", lineHeight: 1.5 }}>
                        {app.ai_insight}
                      </p>
                    ) : null}
                    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => navigate("/develop?tab=simulate")} style={{ border: "1px solid #E5E5E5", borderRadius: 100, padding: "4px 10px", fontSize: 11, color: "#6B6B6B", background: "white", cursor: "pointer" }}>Prep</button>
                      <button type="button" onClick={() => { setSelectedApp(app); setEmailType("application"); setShowEmailModal(true); }} style={{ border: "1px solid #E5E5E5", borderRadius: 100, padding: "4px 10px", fontSize: 11, color: "#6B6B6B", background: "white", cursor: "pointer" }}>Email</button>
                      {app.application_url ? (
                        <a href={app.application_url} target="_blank" rel="noreferrer" style={{ border: "1px solid #E5E5E5", borderRadius: 100, padding: "4px 10px", fontSize: 11, color: "#6B6B6B", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          Link <ExternalLink size={10} />
                        </a>
                      ) : null}
                      <button type="button" onClick={() => setMoveMenuId(moveMenuId === app.id ? null : app.id)} style={{ border: "1px solid #E5E5E5", borderRadius: 100, padding: "4px 10px", fontSize: 11, color: "#6B6B6B", background: "white", cursor: "pointer" }}>Move →</button>
                    </div>
                    {moveMenuId === app.id ? (
                      <select
                        value={app.status}
                        onChange={(e) => void handleStatusChange(app, e.target.value)}
                        style={{ marginTop: 8, width: "100%", border: "1px solid #E5E5E5", borderRadius: 8, padding: "6px 8px", fontSize: 12 }}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {showAddModal ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-card" style={{ background: "white", borderRadius: 20, padding: 32, width: 480, maxWidth: "90vw" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Add application</h2>
            {[
              { key: "company_name", label: "Company name *" },
              { key: "role_title", label: "Role title *" },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>{f.label}</label>
                <input
                  value={(addForm as Record<string, string>)[f.key]}
                  onChange={(e) => setAddForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", border: "1.5px solid #E5E5E5", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#0A0A0A", outline: "none" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Status</label>
              <select
                value={addForm.status}
                onChange={(e) => setAddForm((p) => ({ ...p, status: e.target.value }))}
                style={{ width: "100%", border: "1.5px solid #E5E5E5", borderRadius: 10, padding: "10px 14px", fontSize: 14 }}
              >
                {STATUS_OPTIONS.filter((o) => o.value !== "rejected").map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Application URL</label>
              <input
                placeholder="https://..."
                value={addForm.application_url}
                onChange={(e) => setAddForm((p) => ({ ...p, application_url: e.target.value }))}
                style={{ width: "100%", border: "1.5px solid #E5E5E5", borderRadius: 10, padding: "10px 14px", fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Notes</label>
              <textarea
                rows={3}
                value={addForm.notes}
                onChange={(e) => setAddForm((p) => ({ ...p, notes: e.target.value }))}
                style={{ width: "100%", border: "1.5px solid #E5E5E5", borderRadius: 10, padding: "10px 14px", fontSize: 14 }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ border: "1px solid #E5E5E5", background: "transparent", borderRadius: 100, padding: "10px 18px", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={() => void handleAddApplication()} style={{ background: "#C8102E", color: "white", border: "none", borderRadius: 100, padding: "10px 20px", cursor: "pointer" }}>Add application</button>
            </div>
          </div>
        </div>
      ) : null}

      {showEmailModal ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-card" style={{ background: "white", borderRadius: 20, padding: 32, width: 560, maxWidth: "92vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Draft email</h2>
              <button type="button" onClick={() => setShowEmailModal(false)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {["application", "follow-up", "thank you", "negotiation"].map((t) => {
                const active = emailType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEmailType(t)}
                    style={{
                      background: active ? "#0A0A0A" : "transparent",
                      color: active ? "white" : "#6B6B6B",
                      border: active ? "none" : "1px solid #E5E5E5",
                      borderRadius: 100,
                      padding: "6px 16px",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {t === "follow-up" ? "Follow-up" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>
            <div style={{ position: "relative" }}>
              {generatingEmail ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6B6B6B", marginBottom: 8 }}>
                  <Mail size={14} /> Generating...
                </div>
              ) : null}
              <textarea
                value={generatedEmail}
                onChange={(e) => setGeneratedEmail(e.target.value)}
                style={{ width: "100%", minHeight: 200, border: "1.5px solid #E5E5E5", borderRadius: 10, padding: 16, fontSize: 14, lineHeight: 1.7, resize: "vertical", color: "#0A0A0A" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(generatedEmail);
                  toast.success("Copied to clipboard!");
                }}
                style={{ background: "#0A0A0A", color: "white", borderRadius: 100, padding: "10px 20px", border: "none", cursor: "pointer" }}
              >
                Copy
              </button>
              <button type="button" onClick={() => void generateEmail()} style={{ border: "1px solid #E5E5E5", background: "transparent", borderRadius: 100, padding: "10px 16px", cursor: "pointer" }}>
                Regenerate
              </button>
              <button type="button" onClick={() => setShowEmailModal(false)} style={{ border: "1px solid #E5E5E5", background: "transparent", borderRadius: 100, padding: "10px 16px", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
