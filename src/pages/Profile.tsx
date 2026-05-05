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
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [pathway, setPathway] = useState<PathwayRow | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
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
      setEmail(userRes.data.user?.email ?? session.user.email ?? "");
      setPathway(pathwayRes.data ?? null);
      setConfidenceScore(typeof pathwayRes.data?.confidence_score === "number" ? pathwayRes.data.confidence_score : 0);
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

  return (
    <div
      style={{
        padding: "48px 40px",
        maxWidth: "720px",
        margin: "0 auto",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {loading ? (
        <div style={{ textAlign: "center", paddingTop: "80px" }}>
          <p style={{ color: "#6B6B6B" }}>Loading...</p>
        </div>
      ) : isEditing ? (
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            border: "1px solid #E5E5E5",
            padding: "32px",
            marginBottom: "24px",
          }}
        >
          <p style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 700 }}>Edit Profile</p>
          <div style={{ display: "grid", gap: "10px" }}>
            <input
              value={formData.full_name}
              onChange={(e) => setFormData((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="Full name"
              style={{ border: "1px solid #E5E5E5", borderRadius: 10, padding: "10px 12px" }}
            />
            <input
              value={formData.school}
              onChange={(e) => setFormData((f) => ({ ...f, school: e.target.value }))}
              placeholder="School"
              style={{ border: "1px solid #E5E5E5", borderRadius: 10, padding: "10px 12px" }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={() => void handleSave()}
              style={{ background: "#C8102E", color: "white", border: "none", borderRadius: 100, padding: "8px 16px" }}
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                background: "transparent",
                border: "1px solid #E5E5E5",
                borderRadius: 100,
                padding: "8px 16px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              border: "1px solid #E5E5E5",
              padding: "32px",
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "#0A0A0A",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 700,
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (profile?.full_name ?? email ?? "U")[0].toUpperCase()
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
                {profile?.full_name ?? email?.split("@")[0] ?? "Student"}
              </p>
              <p style={{ fontSize: "14px", color: "#6B6B6B", margin: "4px 0 0" }}>{email ?? ""}</p>
              {profile?.school && (
                <span
                  style={{
                    display: "inline-block",
                    background: "#F5F5F5",
                    borderRadius: "100px",
                    padding: "4px 12px",
                    fontSize: "12px",
                    color: "#6B6B6B",
                    marginTop: "8px",
                  }}
                >
                  {profile.school}
                  {profile.graduation_year ? ` · Class of ${profile.graduation_year}` : ""}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: "transparent",
                border: "1px solid #E5E5E5",
                borderRadius: "100px",
                padding: "8px 16px",
                fontSize: "13px",
                color: "#6B6B6B",
                cursor: "pointer",
              }}
            >
              Edit profile
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            {[
              { label: "Path Score", value: confidenceScore ?? 0, sub: "out of 100" },
              { label: "Learn Score", value: "—", sub: "coming soon" },
              { label: "Applications", value: applicationsCount ?? 0, sub: "active" },
              {
                label: "Member since",
                value: profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en", { month: "short", year: "numeric" })
                  : "—",
                sub: "Cariva",
              },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  border: "1px solid #E5E5E5",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    margin: 0,
                    color: i === 0 && (confidenceScore ?? 0) > 0 ? "#C8102E" : "#0A0A0A",
                  }}
                >
                  {stat.value}
                </p>
                <p style={{ fontSize: "13px", color: "#6B6B6B", margin: "4px 0 0" }}>{stat.label}</p>
                <p style={{ fontSize: "11px", color: "#AAAAAA", margin: "2px 0 0" }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid #E5E5E5",
              padding: "24px",
              marginTop: "24px",
            }}
          >
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
              style={{
                width: "100%",
                background: "transparent",
                border: "1.5px solid #FFCDD2",
                borderRadius: "100px",
                padding: "12px",
                color: "#C8102E",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Sign out
            </button>
          </div>
        </>
      )}
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
