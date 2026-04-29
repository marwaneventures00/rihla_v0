import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";

type MyProfile = {
  user_id: string;
  institution_name: string | null;
  field_of_study: string | null;
};

type AlumniProfile = {
  user_id: string;
  full_name: string | null;
  institution_name: string | null;
  field_of_study: string | null;
};

type Connection = {
  student_id: string;
  alumni_id: string;
  status: "pending" | "accepted" | "rejected";
};

export default function MeetAndGreet() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrap() {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      navigate("/auth", { replace: true });
      return;
    }

    const userId = s.session.user.id;
    setUid(userId);

    const { data: p, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, institution_name, field_of_study")
      .eq("user_id", userId)
      .maybeSingle();

    if (pErr || !p) {
      toast.error(pErr?.message ?? tr("Could not load your profile", "Impossible de charger votre profil"));
      setLoading(false);
      return;
    }
    setMyProfile(p as MyProfile);

    await Promise.all([loadAlumni(p as MyProfile), loadConnections(userId)]);
    setLoading(false);
  }

  async function loadAlumni(profile: MyProfile) {
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("institution_name", profile.institution_name ?? "");

    if (countError) {
      toast.error(countError.message);
      return;
    }

    // Auto-activate meet and greet only when at least 2 users share the same school.
    if ((count ?? 0) < 2) {
      setAlumni([]);
      return;
    }

    let query = supabase
      .from("profiles")
      .select("user_id, full_name, institution_name, field_of_study");

    if (profile.institution_name) {
      query = query.eq("institution_name", profile.institution_name);
    }
    if (profile.field_of_study) {
      query = query.eq("field_of_study", profile.field_of_study);
    }

    const { data, error } = await query.order("full_name");
    if (error) {
      toast.error(error.message);
      return;
    }

    setAlumni((data ?? []).filter((a) => a.user_id !== profile.user_id) as AlumniProfile[]);
  }

  async function loadConnections(userId: string) {
    const { data, error } = await supabase
      .from("meet_connections")
      .select("student_id, alumni_id, status")
      .eq("student_id", userId);

    if (error) {
      toast.error(error.message);
      return;
    }

    setConnections((data ?? []) as Connection[]);
  }

  async function requestConnection(alumniId: string) {
    if (!uid) return;
    const { error } = await supabase.from("meet_connections").insert({
      student_id: uid,
      alumni_id: alumniId,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(tr("Request sent", "Demande envoyee"));
    await loadConnections(uid);
  }

  const filteredAlumni = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return alumni;
    return alumni.filter((a) => {
      return (
        (a.full_name ?? "").toLowerCase().includes(q) ||
        (a.field_of_study ?? "").toLowerCase().includes(q) ||
        (a.institution_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [alumni, search]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold mb-1">{tr("Meet & greet", "Meet & greet")}</h1>
        <p className="text-muted-foreground">
          {tr("Find alumni from your school and track, then request to connect.", "Trouvez des alumni de votre ecole et filiere, puis envoyez une demande de connexion.")}
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {tr("Matching by", "Correspondance par")} {myProfile?.institution_name ?? tr("your institution", "votre etablissement")} {tr("and", "et")} {myProfile?.field_of_study ?? tr("your track", "votre filiere")}.
          </p>
          <Badge variant="secondary">{filteredAlumni.length} {tr("alumni", "alumni")}</Badge>
        </div>

        <Input
          placeholder={tr("Search by name, track, or school", "Rechercher par nom, filiere ou ecole")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-3">
          {filteredAlumni.map((a) => {
            const existing = connections.find((c) => c.alumni_id === a.user_id);
            const requested = Boolean(existing);
            return (
              <div key={a.user_id} className="p-4 rounded-lg border border-border flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{a.full_name ?? tr("Alumni member", "Membre alumni")}</p>
                  <p className="text-sm text-muted-foreground">{a.field_of_study ?? tr("Track not set", "Filiere non renseignee")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.institution_name ?? tr("Institution not set", "Etablissement non renseigne")}</p>
                </div>
                <Button
                  size="sm"
                  variant={requested ? "secondary" : "accent"}
                  disabled={requested}
                  onClick={() => requestConnection(a.user_id)}
                >
                  <UserPlus className="w-4 h-4" />
                  {requested ? `${tr("Requested", "Demande")} (${existing?.status})` : tr("Add alumni", "Ajouter un alumni")}
                </Button>
              </div>
            );
          })}

          {filteredAlumni.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
              {tr("No alumni found for your current match yet.", "Aucun alumni trouve pour votre correspondance actuelle.")}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
