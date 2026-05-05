import { useCallback, useEffect, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  Download,
  Target,
  Lock,
  CheckCircle,
  Circle,
  ExternalLink,
  Camera,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type ProfileData = {
  full_name: string | null;
  created_at: string | null;
  school: string | null;
  graduation_year: string | null;
  field_of_study: string | null;
  city: string | null;
  linkedin_url: string | null;
  bio: string | null;
  updated_at: string | null;
  avatar_url: string | null;
};

type ProfileFormState = {
  full_name: string;
  school: string;
  graduation_year: string;
  field_of_study: string;
  city: string;
  linkedin_url: string;
  bio: string;
};

function emptyForm(): ProfileFormState {
  return {
    full_name: "",
    school: "",
    graduation_year: "",
    field_of_study: "",
    city: "",
    linkedin_url: "",
    bio: "",
  };
}

function profileToForm(p: ProfileData | null): ProfileFormState {
  if (!p) return emptyForm();
  return {
    full_name: p.full_name ?? "",
    school: p.school ?? "",
    graduation_year: p.graduation_year ?? "",
    field_of_study: p.field_of_study ?? "",
    city: p.city ?? "",
    linkedin_url: p.linkedin_url ?? "",
    bio: p.bio ?? "",
  };
}

function schoolBadgeText(p: ProfileData | null): string {
  const s = p?.school?.trim();
  const y = p?.graduation_year?.trim();
  if (!s && !y) return "ESCA · Class of 2026";
  const parts: string[] = [];
  if (s) parts.push(s);
  if (y) parts.push(`Class of ${y}`);
  return parts.join(" · ");
}

function linkedinHref(url: string): string {
  const t = url.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#6B6B6B",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
  display: "block",
};

const inputBase: CSSProperties = {
  border: "1.5px solid #E5E5E5",
  borderRadius: 10,
  padding: "10px 14px",
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  color: "#0A0A0A",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s ease",
  boxSizing: "border-box",
};

type PathwayRow = {
  confidence_score: number | null;
  archetypes: Json | null;
  recommended_track: string | null;
  created_at: string | null;
};

type ConversationRow = {
  status: string | null;
  created_at: string | null;
};

type ArchDisplay = { rank: number; title: string; match: number };

function topArchetypes(archetypes: Json | null): ArchDisplay[] {
  if (!Array.isArray(archetypes) || archetypes.length === 0) return [];
  return archetypes.slice(0, 3).map((item: unknown, i) => {
    const o = item as Record<string, unknown>;
    const title = String(o.title ?? o.name ?? "Archetype");
    const raw = o.match ?? o.pct ?? o.fit ?? 0;
    const match = typeof raw === "number" ? raw : Number(raw);
    const n = Number.isFinite(match) ? Math.min(100, Math.max(0, match)) : 0;
    return { rank: i + 1, title, match: n };
  });
}

function formatMemberSince(createdAt: string | null): string {
  if (!createdAt) return "—";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatAchievementDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const mont = "Inter, system-ui, sans-serif";
const montSans = "Inter, sans-serif";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [pathway, setPathway] = useState<PathwayRow | null>(null);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [conversation, setConversation] = useState<ConversationRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormState>(() => emptyForm());
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    document.title = "Profile — Cariva";
    const nodes = document.querySelectorAll(".page-container");
    const el = nodes[nodes.length - 1] as HTMLElement | undefined;
    if (el) requestAnimationFrame(() => el.classList.add("page-visible"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        navigate("/auth", { replace: true });
        return;
      }
      const uid = session.user.id;
      setUserId(uid);

      const [profileRes, userRes, pathwayRes, appsRes, convRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "full_name, created_at, school, graduation_year, field_of_study, city, linkedin_url, bio, updated_at, avatar_url",
          )
          .eq("id", uid)
          .maybeSingle(),
        supabase.auth.getUser(),
        supabase
          .from("pathway_results")
          .select("confidence_score, archetypes, recommended_track, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase
          .from("conversation_sessions")
          .select("status, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      if (profileRes.error) {
        console.error("Profile load error:", profileRes.error);
        toast.error(`Could not load profile: ${profileRes.error.message}`);
      }

      const row = profileRes.data as ProfileData | null;
      setProfile(row);
      setFormData(profileToForm(row));
      const rawAv = row?.avatar_url?.trim();
      setAvatarUrl(rawAv ? `${rawAv.split("?")[0]}?t=${Date.now()}` : null);
      setEmail(userRes.data.user?.email ?? session.user.email ?? null);
      setPathway(pathwayRes.data ?? null);
      setApplicationsCount(appsRes.count ?? 0);
      setConversation(convRes.data ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const displayName = profile?.full_name?.trim() || email?.split("@")[0] || "Member";
  const pathScore = typeof pathway?.confidence_score === "number" ? pathway.confidence_score : 0;
  const archetypeList = topArchetypes(pathway?.archetypes ?? null);
  const hasArchetypes = archetypeList.length > 0;
  const pathwayCreatedAt = pathway?.created_at ?? null;
  const conversationExists = Boolean(conversation);
  const memberSinceLabel = formatMemberSince(profile?.created_at ?? null);

  const handleSave = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not signed in");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim() || null,
          school: formData.school.trim() || null,
          graduation_year: formData.graduation_year.trim() || null,
          field_of_study: formData.field_of_study.trim() || null,
          city: formData.city.trim() || null,
          linkedin_url: formData.linkedin_url.trim() || null,
          bio: formData.bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Save error:", error);
        toast.error(`Save failed: ${error.message}`);
        return;
      }

      const updatedAt = new Date().toISOString();
      setProfile((prev) => ({
        ...(prev ?? {
          full_name: null,
          created_at: null,
          school: null,
          graduation_year: null,
          field_of_study: null,
          city: null,
          linkedin_url: null,
          bio: null,
          updated_at: null,
          avatar_url: null,
        }),
        full_name: formData.full_name.trim() || null,
        school: formData.school.trim() || null,
        graduation_year: formData.graduation_year.trim() || null,
        field_of_study: formData.field_of_study.trim() || null,
        city: formData.city.trim() || null,
        linkedin_url: formData.linkedin_url.trim() || null,
        bio: formData.bio.trim() || null,
        updated_at: updatedAt,
      }));
      toast.success("Profile updated!");
      setIsEditing(false);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  }, [formData]);

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      const rawExt = file.name.split(".").pop() ?? "jpg";
      const fileExt = rawExt.replace(/[^a-z0-9]/gi, "").slice(0, 4) || "jpg";
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const baseUrl = data.publicUrl;
      const busted = `${baseUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: baseUrl }).eq("id", user.id);
      if (dbErr) throw dbErr;

      setAvatarUrl(busted);
      setProfile((prev) => (prev ? { ...prev, avatar_url: baseUrl } : prev));
      window.dispatchEvent(new CustomEvent("cariva:avatar-updated", { detail: { url: baseUrl } }));
      toast.success("Photo updated!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Could not upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  const h2Style: CSSProperties = {
    fontFamily: mont,
    fontSize: 22,
    fontWeight: 700,
    color: "#0A0A0A",
    margin: "32px 0 16px",
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "40vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: mont,
          color: "#6B6B6B",
          background: "#FAFAF8",
        }}
      >
        Loading…
      </div>
    );
  }

  const badgeText = schoolBadgeText(profile);
  const li = profile?.linkedin_url?.trim();
  const bioText = profile?.bio?.trim();

  return (
    <div
      className="page-container"
      style={{
        background: "#FAFAF8",
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 40px",
        fontFamily: mont,
      }}
    >
      {/* Section 1 — Identity */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          border: "1px solid #E5E5E5",
          padding: 32,
          display: "flex",
          alignItems: "flex-start",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #E5E5E5",
              }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#0A0A0A",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          {uploadingAvatar ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.75)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader2 className="h-6 w-6 animate-spin text-[#C8102E]" aria-hidden />
            </div>
          ) : null}
          <label
            htmlFor="avatar-upload"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#C8102E",
              border: "2px solid white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: uploadingAvatar ? "wait" : "pointer",
              pointerEvents: uploadingAvatar ? "none" : "auto",
            }}
          >
            <Camera size={12} color="white" aria-hidden />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(ev) => void handleAvatarUpload(ev)}
            disabled={uploadingAvatar}
          />
        </div>

        {isEditing ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label htmlFor="pf-full_name" style={labelStyle}>
                  Full Name
                </label>
                <input
                  id="pf-full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData((f) => ({ ...f, full_name: e.target.value }))}
                  style={inputBase}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0A0A0A";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E5E5";
                  }}
                />
              </div>
              <div>
                <label htmlFor="pf-school" style={labelStyle}>
                  School / University
                </label>
                <input
                  id="pf-school"
                  value={formData.school}
                  onChange={(e) => setFormData((f) => ({ ...f, school: e.target.value }))}
                  placeholder="e.g. ESCA École de Management"
                  style={inputBase}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0A0A0A";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E5E5";
                  }}
                />
              </div>
              <div>
                <label htmlFor="pf-field" style={labelStyle}>
                  Field of Study
                </label>
                <input
                  id="pf-field"
                  value={formData.field_of_study}
                  onChange={(e) => setFormData((f) => ({ ...f, field_of_study: e.target.value }))}
                  placeholder="e.g. Business Administration"
                  style={inputBase}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0A0A0A";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E5E5";
                  }}
                />
              </div>
              <div>
                <label htmlFor="pf-year" style={labelStyle}>
                  Graduation Year
                </label>
                <input
                  id="pf-year"
                  type="number"
                  value={formData.graduation_year}
                  onChange={(e) => setFormData((f) => ({ ...f, graduation_year: e.target.value }))}
                  placeholder="e.g. 2026"
                  style={inputBase}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0A0A0A";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E5E5";
                  }}
                />
              </div>
              <div>
                <label htmlFor="pf-city" style={labelStyle}>
                  City
                </label>
                <input
                  id="pf-city"
                  value={formData.city}
                  onChange={(e) => setFormData((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Casablanca"
                  style={inputBase}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0A0A0A";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E5E5";
                  }}
                />
              </div>
              <div>
                <label htmlFor="pf-li" style={labelStyle}>
                  LinkedIn URL
                </label>
                <input
                  id="pf-li"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData((f) => ({ ...f, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/yourname"
                  style={inputBase}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0A0A0A";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E5E5";
                  }}
                />
              </div>
              <div>
                <label htmlFor="pf-bio" style={labelStyle}>
                  Bio
                </label>
                <textarea
                  id="pf-bio"
                  value={formData.bio}
                  onChange={(e) => setFormData((f) => ({ ...f, bio: e.target.value }))}
                  maxLength={200}
                  placeholder="A short bio about yourself..."
                  rows={4}
                  style={{ ...inputBase, resize: "vertical", minHeight: 100 }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0A0A0A";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E5E5";
                  }}
                />
                <p style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4, fontFamily: montSans }}>
                  {formData.bio.length}/200
                </p>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                style={{
                  background: "#C8102E",
                  color: "white",
                  borderRadius: 100,
                  padding: "10px 24px",
                  fontWeight: 600,
                  border: "none",
                  cursor: saving ? "wait" : "pointer",
                  fontFamily: mont,
                  opacity: saving ? 0.85 : 1,
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setFormData(profileToForm(profile));
                  setIsEditing(false);
                }}
                style={{
                  background: "transparent",
                  border: "1.5px solid #E5E5E5",
                  borderRadius: 100,
                  padding: "10px 24px",
                  color: "#6B6B6B",
                  cursor: "pointer",
                  fontFamily: mont,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: mont, fontSize: 24, fontWeight: 700, color: "#0A0A0A" }}>{displayName}</div>
              <div style={{ fontSize: 14, color: "#6B6B6B", marginTop: 4 }}>{email ?? "—"}</div>
              {bioText ? (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    fontStyle: "italic",
                    color: "#6B6B6B",
                    fontFamily: montSans,
                    lineHeight: 1.5,
                  }}
                >
                  {bioText}
                </p>
              ) : null}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 10 }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "white",
                    border: "1px solid #E5E5E5",
                    borderRadius: 100,
                    padding: "4px 12px",
                    fontSize: 12,
                    color: "#6B6B6B",
                    fontFamily: mont,
                  }}
                >
                  {badgeText}
                </div>
                {profile?.city?.trim() ? (
                  <div
                    style={{
                      display: "inline-block",
                      background: "white",
                      border: "1px solid #E5E5E5",
                      borderRadius: 100,
                      padding: "4px 12px",
                      fontSize: 12,
                      color: "#6B6B6B",
                      fontFamily: mont,
                    }}
                  >
                    {profile.city.trim()}
                  </div>
                ) : null}
              </div>
              {li ? (
                <a
                  href={linkedinHref(li)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 12,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#C8102E",
                    textDecoration: "none",
                    fontFamily: mont,
                  }}
                >
                  LinkedIn
                  <ExternalLink size={14} aria-hidden />
                </a>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData(profileToForm(profile));
                setIsEditing(true);
              }}
              style={{
                flexShrink: 0,
                border: "1px solid #E5E5E5",
                borderRadius: 100,
                padding: "8px 16px",
                fontSize: 13,
                color: "#0A0A0A",
                background: "transparent",
                cursor: "pointer",
                fontFamily: mont,
              }}
            >
              Edit profile
            </button>
          </>
        )}
      </div>

      {/* Section 2 — Journey */}
      <h2 style={h2Style}>Your Journey</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
        className="profile-journey-grid"
      >
        {[
          {
            value: String(pathScore),
            label: "Path Score",
            sub: "out of 100",
            valueColor: pathScore > 0 ? "#C8102E" : "#AAAAAA",
            valueFont: mont,
            valueSize: 28,
          },
          {
            value: "—",
            label: "Learn Score",
            sub: "coming soon",
            valueColor: "#AAAAAA",
            valueFont: mont,
            valueSize: 22,
          },
          {
            value: String(applicationsCount),
            label: "Applications",
            sub: "active",
            valueColor: applicationsCount > 0 ? "#0A0A0A" : "#AAAAAA",
            valueFont: mont,
            valueSize: 28,
          },
          {
            value: memberSinceLabel,
            label: "Member since",
            sub: "Cariva",
            valueColor: "#0A0A0A",
            valueFont: mont,
            valueSize: 16,
            valueWeight: 600,
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "white",
              borderRadius: 12,
              border: "1px solid #E5E5E5",
              padding: 20,
            }}
          >
            <div
              style={{
                fontFamily: card.valueFont,
                fontSize: card.valueSize,
                fontWeight: card.valueWeight ?? 700,
                color: card.valueColor,
              }}
            >
              {card.value}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A", marginTop: 8 }}>{card.label}</div>
            <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Section 3 — Career profile */}
      <h2 style={h2Style}>My Career Profile</h2>
      {hasArchetypes ? (
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #E5E5E5",
            padding: 24,
          }}
        >
          {archetypeList.map((a, idx) => (
            <div key={a.rank}>
              {idx > 0 ? <div style={{ height: 1, background: "#F5F5F5", margin: "16px 0" }} /> : null}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#F5F5F5",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0A0A0A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  #{a.rank}
                </div>
                <span style={{ fontSize: 15, fontWeight: 500, color: "#0A0A0A", flex: 1, minWidth: 120 }}>{a.title}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#C8102E", marginLeft: "auto" }}>{a.match}%</span>
              </div>
              <div style={{ height: 4, background: "#F0F0F0", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${a.match}%`, background: "#C8102E", borderRadius: 2 }} />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => navigate("/learn/path/report")}
            style={{
              marginTop: 24,
              background: "#C8102E",
              color: "white",
              border: "none",
              borderRadius: 100,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: mont,
            }}
          >
            View full report →
          </button>
        </div>
      ) : (
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #E5E5E5",
            padding: 32,
            textAlign: "center",
          }}
        >
          <Target size={32} color="#AAAAAA" style={{ margin: "0 auto" }} aria-hidden />
          <p style={{ fontSize: 15, color: "#6B6B6B", marginTop: 12 }}>Your career profile will appear here</p>
          <button
            type="button"
            onClick={() => navigate("/learn/path")}
            style={{
              marginTop: 20,
              background: "#C8102E",
              color: "white",
              border: "none",
              borderRadius: 100,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: mont,
            }}
          >
            Start Path conversation →
          </button>
        </div>
      )}

      {/* Section 4 — Documents & Achievements */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 32,
        }}
        className="profile-two-col"
      >
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #E5E5E5",
            padding: 24,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0A0A0A", marginBottom: 16 }}>Documents</div>

          <DocRow
            icon={<Download size={16} color="#6B6B6B" aria-hidden />}
            label="Archetype Report"
            sub="Your career profile PDF"
            action={
              hasArchetypes ? (
                <button
                  type="button"
                  style={{
                    border: "1px solid #E5E5E5",
                    borderRadius: 100,
                    padding: "6px 14px",
                    fontSize: 12,
                    color: "#6B6B6B",
                    background: "transparent",
                    cursor: "pointer",
                    fontFamily: mont,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                  onClick={() => toast.info("PDF download coming soon")}
                >
                  Download
                </button>
              ) : (
                <button type="button" disabled style={docBtnDisabled}>
                  Not yet generated
                </button>
              )
            }
          />
          <div style={{ height: 1, background: "#F5F5F5", margin: "16px 0" }} />
          <DocRow
            icon={<Download size={16} color="#6B6B6B" aria-hidden />}
            label="Cariva Certificate"
            sub="Virtual Internship completion"
            action={
              <button type="button" disabled style={{ ...docBtnDisabled, display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={14} aria-hidden />
                Locked
              </button>
            }
          />
          <div style={{ height: 1, background: "#F5F5F5", margin: "16px 0" }} />
          <DocRow
            icon={<Download size={16} color="#6B6B6B" aria-hidden />}
            label="AI Resume"
            sub="Generated from your profile"
            action={
              <button
                type="button"
                style={{
                  background: "#C8102E",
                  color: "white",
                  border: "none",
                  borderRadius: 100,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: mont,
                }}
                onClick={() => toast.info("Coming soon — AI Resume generation is being built 🚀")}
              >
                Generate
              </button>
            }
          />
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #E5E5E5",
            padding: 24,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0A0A0A", marginBottom: 16 }}>Achievements</div>

          <AchRow
            icon={
              conversationExists ? (
                <CheckCircle size={18} color="#22C55E" aria-hidden />
              ) : (
                <Circle size={18} color="#AAAAAA" aria-hidden />
              )
            }
            label="Path Started"
            right={formatAchievementDate(conversation?.created_at ?? null)}
          />
          <div style={{ height: 1, background: "#F5F5F5", margin: "14px 0" }} />
          <AchRow
            icon={
              hasArchetypes ? (
                <CheckCircle size={18} color="#22C55E" aria-hidden />
              ) : (
                <Circle size={18} color="#AAAAAA" aria-hidden />
              )
            }
            label="Career Profile Generated"
            right={hasArchetypes ? formatAchievementDate(pathwayCreatedAt) : "—"}
          />
          <div style={{ height: 1, background: "#F5F5F5", margin: "14px 0" }} />
          <AchRow
            icon={
              applicationsCount > 0 ? (
                <CheckCircle size={18} color="#22C55E" aria-hidden />
              ) : (
                <Circle size={18} color="#AAAAAA" aria-hidden />
              )
            }
            label="First Application"
            right="—"
          />
          <div style={{ height: 1, background: "#F5F5F5", margin: "14px 0" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Lock size={18} color="#AAAAAA" aria-hidden />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "#0A0A0A" }}>Virtual Internship</div>
            </div>
            <span style={{ fontSize: 12, color: "#AAAAAA" }}>Locked</span>
          </div>
        </div>
      </div>

      {/* Section 5 — Account */}
      <h2 style={h2Style}>Account</h2>
      <div
        style={{
          background: "white",
          borderRadius: 16,
          border: "1px solid #E5E5E5",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A" }}>Language</span>
          <LanguageSwitcher />
        </div>
        <div style={{ height: 1, background: "#F5F5F5", margin: "16px 0" }} />
        <button
          type="button"
          onClick={() => {
            void handleSignOut();
          }}
          style={{
            width: "100%",
            background: "transparent",
            border: "1.5px solid #FFCDD2",
            borderRadius: 100,
            padding: 12,
            fontSize: 14,
            color: "#C8102E",
            cursor: "pointer",
            fontFamily: mont,
          }}
        >
          Sign out
        </button>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .profile-journey-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .profile-two-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const docBtnDisabled: CSSProperties = {
  border: "1px solid #E5E5E5",
  borderRadius: 100,
  padding: "6px 14px",
  fontSize: 12,
  color: "#6B6B6B",
  background: "transparent",
  opacity: 0.5,
  cursor: "not-allowed",
  fontFamily: "Inter, sans-serif",
};

function DocRow({
  icon,
  label,
  sub,
  action,
}: {
  icon: ReactNode;
  label: string;
  sub: string;
  action: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 140 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ marginLeft: "auto" }}>{action}</div>
    </div>
  );
}

function AchRow({ icon, label, right }: { icon: ReactNode; label: string; right: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {icon}
      <div style={{ flex: 1, fontSize: 14, color: "#0A0A0A" }}>{label}</div>
      <span style={{ fontSize: 12, color: "#6B6B6B" }}>{right}</span>
    </div>
  );
}
