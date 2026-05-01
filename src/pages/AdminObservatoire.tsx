import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  ExternalLink,
  Linkedin,
  LineChart as LineChartIcon,
  Search,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

type GraduateProfile = Tables<"graduate_profiles">;
type ObservatoireSurvey = Tables<"observatoire_surveys">;
type UniversityRow = Pick<Tables<"universities">, "id" | "name">;

type StatusKey = GraduateProfile["current_status"];

const STATUS_LABEL: Record<StatusKey, string> = {
  employed: "Employed",
  seeking: "Seeking",
  further_study: "Further study",
  entrepreneurship: "Entrepreneurship",
  unknown: "Unknown",
};

const STATUS_COLORS: Record<StatusKey, string> = {
  employed: "#22C55E",
  seeking: "#EF4444",
  further_study: "#3B82F6",
  entrepreneurship: "#8B5CF6",
  unknown: "#94A3B8",
};

const MOROCCO_DEMAND_INDEX: Record<string, number> = {
  Consulting: 22,
  Banking: 20,
  Technology: 18,
  Energy: 12,
  Manufacturing: 10,
  Retail: 9,
  Public: 8,
  Education: 7,
};

type AIInsights = {
  headline_finding: string;
  employment_trend: string;
  top_performing_field: string;
  attention_needed: string;
  recommendation_for_university: string;
  comparison_to_morocco_average: string;
};

const SURVEY_INVITES_KEY = "cariva.observatoire.surveyInvites.v1";
const CSV_MAP_IGNORE = "__ignore__";

function loadSurveyInvites(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SURVEY_INVITES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function persistSurveyInvites(next: Record<string, string>) {
  localStorage.setItem(SURVEY_INVITES_KEY, JSON.stringify(next));
}

function isCompleteSurveyRow(s: ObservatoireSurvey) {
  return s.biggest_challenge.trim() !== "Pending graduate response";
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isMobile;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((c) => c.trim().length)) rows.push(row);
      row = [];
      continue;
    }
    if (!inQuotes && ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  row.push(cur);
  if (row.some((c) => c.trim().length)) rows.push(row);
  return rows;
}

function bucketMonths(m: number | null): string {
  if (m === null || Number.isNaN(m)) return "Unknown";
  if (m <= 3) return "0-3";
  if (m <= 6) return "3-6";
  if (m <= 12) return "6-12";
  if (m <= 24) return "12-24";
  return "24+";
}

type DevelopAiResponse = { error?: string; result?: unknown };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

async function callDevelopAI(action: string, payload: unknown) {
  const { data, error } = await supabase.functions.invoke<DevelopAiResponse>("develop-ai", { body: { action, payload } });
  if (error) throw new Error(error.message);
  if (!isRecord(data)) throw new Error("Unexpected AI response");
  if (typeof data.error === "string" && data.error.trim()) throw new Error(data.error);
  return data.result;
}

export default function AdminObservatoire() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [graduates, setGraduates] = useState<GraduateProfile[]>([]);
  const [surveys, setSurveys] = useState<ObservatoireSurvey[]>([]);
  const [surveyInvites, setSurveyInvites] = useState<Record<string, string>>({});
  const [universities, setUniversities] = useState<UniversityRow[]>([]);

  const [yearFilter, setYearFilter] = useState<string>("all");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<GraduateProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({
    student_name: "",
    graduation_year: String(new Date().getFullYear()),
    field_of_study: "",
    current_status: "unknown" as StatusKey,
    current_role: "",
    current_company: "",
    current_sector: "",
    current_salary_range: "",
    time_to_first_job_months: "",
    location: "",
    linkedin_url: "",
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);

  const [sortKey, setSortKey] = useState<keyof GraduateProfile | "none">("last_updated");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        navigate("/auth", { replace: true });
        return;
      }
      const uid = s.session.user.id;

      const { data: roles } = await supabase.from("user_roles").select("role, university_id").eq("user_id", uid);
      const isAdmin = roles?.some((r) => r.role === "admin");
      if (!isAdmin) {
        navigate("/pathways", { replace: true });
        return;
      }
      setSurveyInvites(loadSurveyInvites());
      const uni = roles?.find((r) => r.role === "admin" && r.university_id)?.university_id ?? null;
      setUniversityId(uni);

      if (!uni) {
        setGraduates([]);
        setSurveys([]);
        setLoading(false);
        return;
      }

      const { data: grads, error: gErr } = await supabase
        .from("graduate_profiles")
        .select("*")
        .order("last_updated", { ascending: false });

      if (gErr) {
        toast.error("Could not load Observatoire data");
        setGraduates([]);
        setSurveys([]);
        setLoading(false);
        return;
      }

      const gradRows = (grads ?? []) as GraduateProfile[];
      setGraduates(gradRows);
      const uniIds = Array.from(new Set(gradRows.map((g) => g.university_id)));
      if (uniIds.length) {
        const { data: uniRows } = await supabase
          .from("universities")
          .select("id, name")
          .in("id", uniIds)
          .order("name", { ascending: true });
        setUniversities((uniRows ?? []) as UniversityRow[]);
      } else {
        setUniversities([]);
      }

      const ids = gradRows.map((g) => g.id);
      if (!ids.length) {
        setSurveys([]);
        setLoading(false);
        return;
      }

      const { data: surv, error: sErr } = await supabase
        .from("observatoire_surveys")
        .select("*")
        .in("graduate_id", ids)
        .order("survey_date", { ascending: false });

      if (sErr) {
        toast.error("Could not load survey responses");
        setSurveys([]);
      } else {
        setSurveys((surv ?? []) as ObservatoireSurvey[]);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const fields = useMemo(() => {
    const set = new Set<string>();
    graduates.forEach((g) => set.add(g.field_of_study));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [graduates]);

  const uniNameById = useMemo(() => {
    const map = new Map<string, string>();
    universities.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [universities]);

  const filtered = useMemo(() => {
    return graduates.filter((g) => {
      if (universityFilter !== "all" && g.university_id !== universityFilter) return false;
      if (yearFilter !== "all" && String(g.graduation_year) !== yearFilter) return false;
      if (fieldFilter !== "all" && g.field_of_study !== fieldFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          g.student_name.toLowerCase().includes(q) ||
          g.field_of_study.toLowerCase().includes(q) ||
          (g.current_company ?? "").toLowerCase().includes(q) ||
          (g.current_role ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [graduates, universityFilter, yearFilter, fieldFilter, search]);

  const metrics = useMemo(() => {
    const total = filtered.length;
    const employed = filtered.filter((g) => g.current_status === "employed").length;
    const employmentRate = total ? (employed / total) * 100 : 0;

    const ttf = filtered.map((g) => g.time_to_first_job_months).filter((v): v is number => typeof v === "number" && v >= 0);
    const avgTtf = ttf.length ? ttf.reduce((a, b) => a + b, 0) / ttf.length : null;

    const aligned = filtered.filter((g) => g.current_status === "employed" && (g.current_role || "").trim().length > 0);
    const alignmentRate = employed ? (aligned.length / employed) * 100 : 0;

    const lastSurveys = new Map<string, ObservatoireSurvey>();
    surveys
      .filter(isCompleteSurveyRow)
      .forEach((s) => {
        const prev = lastSurveys.get(s.graduate_id);
        if (!prev || new Date(s.survey_date).getTime() > new Date(prev.survey_date).getTime()) lastSurveys.set(s.graduate_id, s);
      });
    const satScores = Array.from(lastSurveys.values()).map((s) => s.satisfaction_score);
    const avgSat = satScores.length ? satScores.reduce((a, b) => a + b, 0) / satScores.length : null;

    return { total, employmentRate, avgTtf, alignmentRate, avgSat, employedCount: employed };
  }, [filtered, surveys]);

  const statusDonut = useMemo(() => {
    const keys: StatusKey[] = ["employed", "seeking", "further_study", "entrepreneurship", "unknown"];
    const total = filtered.length || 1;
    return keys.map((k) => {
      const count = filtered.filter((g) => g.current_status === k).length;
      return { key: k, name: STATUS_LABEL[k], value: count, pct: (count / total) * 100, color: STATUS_COLORS[k] };
    });
  }, [filtered]);

  const ttfBars = useMemo(() => {
    const buckets = ["0-3", "3-6", "6-12", "12-24", "24+", "Unknown"];
    const counts = Object.fromEntries(buckets.map((b) => [b, 0])) as Record<string, number>;
    filtered.forEach((g) => {
      const b = bucketMonths(g.time_to_first_job_months);
      counts[b] = (counts[b] ?? 0) + 1;
    });
    return buckets.map((name) => ({ name, graduates: counts[name] ?? 0 }));
  }, [filtered]);

  const fieldBars = useMemo(() => {
    const byField = new Map<string, { total: number; employed: number }>();
    filtered.forEach((g) => {
      const cur = byField.get(g.field_of_study) ?? { total: 0, employed: 0 };
      cur.total += 1;
      if (g.current_status === "employed") cur.employed += 1;
      byField.set(g.field_of_study, cur);
    });
    const rows = Array.from(byField.entries()).map(([field, v]) => ({
      field,
      rate: v.total ? (v.employed / v.total) * 100 : 0,
      employed: v.employed,
      total: v.total,
    }));
    rows.sort((a, b) => b.rate - a.rate);
    return rows;
  }, [filtered]);

  const sectorBars = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((g) => {
      const sec = (g.current_sector ?? "").trim() || "Unknown";
      map.set(sec, (map.get(sec) ?? 0) + 1);
    });
    const rows = Array.from(map.entries())
      .map(([sector, count]) => ({
        sector,
        count,
        demand: MOROCCO_DEMAND_INDEX[sector] ?? Math.min(18, 6 + Math.round(count * 1.2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    return rows;
  }, [filtered]);

  const surveySeries = useMemo(() => {
    const months: { key: string; label: string; responses: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: d.toLocaleString(undefined, { month: "short", year: "numeric" }), responses: 0 });
    }
    const inScope = surveys.filter(isCompleteSurveyRow).filter((s) => {
      const t = new Date(s.survey_date).getTime();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)).getTime();
      return t >= start;
    });
    inScope.forEach((s) => {
      const d = new Date(s.survey_date);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const row = months.find((m) => m.key === key);
      if (row) row.responses += 1;
    });
    return months.map(({ label, responses }) => ({ month: label, responses }));
  }, [surveys]);

  const pendingSurveys = useMemo(() => {
    const completed = new Set(
      surveys.filter(isCompleteSurveyRow).map((s) => s.graduate_id),
    );
    return filtered.filter((g) => !completed.has(g.id)).slice(0, 12);
  }, [filtered, surveys]);

  const completionRate = useMemo(() => {
    if (!filtered.length) return 0;
    const completed = new Set(
      surveys.filter(isCompleteSurveyRow).map((s) => s.graduate_id),
    );
    const count = filtered.reduce((acc, g) => acc + (completed.has(g.id) ? 1 : 0), 0);
    return (count / filtered.length) * 100;
  }, [filtered, surveys]);

  const invitedOutstanding = useMemo(() => {
    const completed = new Set(
      surveys.filter(isCompleteSurveyRow).map((s) => s.graduate_id),
    );
    return filtered.filter((g) => !completed.has(g.id) && surveyInvites[g.id]).length;
  }, [filtered, surveys, surveyInvites]);

  const nationalMetrics = useMemo(() => {
    const total = graduates.length;
    const employed = graduates.filter((g) => g.current_status === "employed").length;
    const employmentRate = total ? (employed / total) * 100 : 0;
    const ttf = graduates.map((g) => g.time_to_first_job_months).filter((v): v is number => typeof v === "number" && v >= 0);
    const avgTtf = ttf.length ? ttf.reduce((a, b) => a + b, 0) / ttf.length : 0;
    const aligned = graduates.filter((g) => g.current_status === "employed" && (g.current_role || "").trim().length > 0);
    const alignmentRate = employed ? (aligned.length / employed) * 100 : 0;
    return { employmentRate, avgTtf, alignmentRate };
  }, [graduates]);

  const sortedRows = useMemo(() => {
    const rows = [...filtered];
    if (sortKey === "none") return rows;
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") return av < bv ? -dir : dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
    return rows;
  }, [filtered, sortDir, sortKey]);

  function toggleSort(k: keyof GraduateProfile) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  }

  function exportCsv() {
    const header = [
      "Name",
      "University",
      "Field",
      "Graduation year",
      "Status",
      "Company",
      "Role",
      "Sector",
      "Salary range",
      "LinkedIn URL",
      "Time to first job",
    ];
    const lines = [header.join(",")];
    filtered.forEach((g) => {
      lines.push(
        [
          JSON.stringify(g.student_name),
          JSON.stringify(uniNameById.get(g.university_id) ?? "Unknown institution"),
          JSON.stringify(g.field_of_study),
          g.graduation_year,
          JSON.stringify(g.current_status),
          JSON.stringify(g.current_company ?? ""),
          JSON.stringify(g.current_role ?? ""),
          JSON.stringify(g.current_sector ?? ""),
          JSON.stringify(g.current_salary_range ?? ""),
          JSON.stringify(g.linkedin_url ?? ""),
          g.time_to_first_job_months ?? "",
        ].join(","),
      );
    });
    downloadTextFile(`observatoire_export_${new Date().toISOString().slice(0, 10)}.csv`, lines.join("\n"));
  }

  async function refresh() {
    if (!universityId) return;
    const { data: grads } = await supabase
      .from("graduate_profiles")
      .select("*")
      .order("last_updated", { ascending: false });
    const gradRows = (grads ?? []) as GraduateProfile[];
    setGraduates(gradRows);
    const uniIds = Array.from(new Set(gradRows.map((g) => g.university_id)));
    if (uniIds.length) {
      const { data: uniRows } = await supabase
        .from("universities")
        .select("id, name")
        .in("id", uniIds)
        .order("name", { ascending: true });
      setUniversities((uniRows ?? []) as UniversityRow[]);
    } else {
      setUniversities([]);
    }
    const ids = gradRows.map((g) => g.id);
    if (!ids.length) {
      setSurveys([]);
      return;
    }
    const { data: surv } = await supabase
      .from("observatoire_surveys")
      .select("*")
      .in("graduate_id", ids)
      .order("survey_date", { ascending: false });
    setSurveys((surv ?? []) as ObservatoireSurvey[]);
  }

  async function addGraduate() {
    if (!universityId) return toast.error("No university context for this admin account");
    if (!manual.student_name.trim() || !manual.field_of_study.trim()) return toast.error("Name and field are required");
    const year = Number(manual.graduation_year);
    if (!Number.isFinite(year)) return toast.error("Invalid graduation year");

    const payload = {
      university_id: universityId,
      student_name: manual.student_name.trim(),
      graduation_year: year,
      field_of_study: manual.field_of_study.trim(),
      current_status: manual.current_status,
      current_role: manual.current_role || null,
      current_company: manual.current_company || null,
      current_sector: manual.current_sector || null,
      current_salary_range: manual.current_salary_range || null,
      time_to_first_job_months: manual.time_to_first_job_months ? Number(manual.time_to_first_job_months) : null,
      location: manual.location || null,
      linkedin_url: manual.linkedin_url || null,
      last_updated: new Date().toISOString(),
    };

    const { error } = await supabase.from("graduate_profiles").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Graduate added");
    setManualOpen(false);
    setManual({
      student_name: "",
      graduation_year: String(new Date().getFullYear()),
      field_of_study: "",
      current_status: "unknown",
      current_role: "",
      current_company: "",
      current_sector: "",
      current_salary_range: "",
      time_to_first_job_months: "",
      location: "",
      linkedin_url: "",
    });
    await refresh();
  }

  function openImport() {
    setImportOpen(true);
    setCsvText("");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
  }

  function onCsvPicked(file: File) {
    file.text().then((t) => {
      setCsvText(t);
      const rows = parseCsv(t);
      if (!rows.length) return;
      setCsvHeaders(rows[0].map((h) => h.trim()));
      setCsvRows(rows.slice(1));
      const auto: Record<string, string> = {};
      rows[0].forEach((h) => {
        const key = h.trim().toLowerCase();
        if (key.includes("name")) auto[h] = "student_name";
        else if (key.includes("year")) auto[h] = "graduation_year";
        else if (key.includes("field")) auto[h] = "field_of_study";
        else if (key.includes("status")) auto[h] = "current_status";
        else if (key.includes("role")) auto[h] = "current_role";
        else if (key.includes("company")) auto[h] = "current_company";
        else if (key.includes("sector")) auto[h] = "current_sector";
        else if (key.includes("salary")) auto[h] = "current_salary_range";
        else if (key.includes("time")) auto[h] = "time_to_first_job_months";
        else if (key.includes("location")) auto[h] = "location";
        else if (key.includes("linkedin")) auto[h] = "linkedin_url";
      });
      setMapping(auto);
    });
  }

  async function importCsv() {
    if (!universityId) return toast.error("No university context for this admin account");
    if (!csvHeaders.length) return toast.error("Upload a CSV first");

    const required = ["student_name", "graduation_year", "field_of_study", "current_status"];
    const mappedTargets = new Set(
      Object.values(mapping).filter((v) => v && v !== CSV_MAP_IGNORE),
    );
    for (const r of required) {
      if (!mappedTargets.has(r)) return toast.error(`Map required column: ${r}`);
    }

    setImporting(true);
    try {
      const inserts: TablesInsert<"graduate_profiles">[] = [];
      for (const row of csvRows) {
        const obj: TablesInsert<"graduate_profiles"> = { university_id: universityId, last_updated: new Date().toISOString() };
        csvHeaders.forEach((h, idx) => {
          const target = mapping[h];
          if (!target || target === CSV_MAP_IGNORE) return;
          const raw = row[idx] ?? "";
          if (target === "graduation_year") obj.graduation_year = Number(raw);
          else if (target === "time_to_first_job_months") obj.time_to_first_job_months = raw ? Number(raw) : null;
          else (obj as Record<string, unknown>)[target] = raw;
        });
        if (!obj.student_name || !obj.field_of_study || !obj.graduation_year || !obj.current_status) continue;
        inserts.push(obj);
      }
      if (!inserts.length) throw new Error("No valid rows to import");
      const { error } = await supabase.from("graduate_profiles").insert(inserts);
      if (error) throw new Error(error.message);
      toast.success(`Imported ${inserts.length} graduates`);
      setImportOpen(false);
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function generateInsights() {
    setAiLoading(true);
    try {
      const payload = {
        filters: { university: universityFilter, year: yearFilter, field: fieldFilter, search },
        metrics: {
          graduates_tracked: metrics.total,
          employment_rate_pct: metrics.employmentRate,
          avg_time_to_first_job_months: metrics.avgTtf,
          field_alignment_pct: metrics.alignmentRate,
          avg_satisfaction: metrics.avgSat,
        },
        status_breakdown: statusDonut,
        time_to_job_distribution: ttfBars,
        top_fields: fieldBars.slice(0, 5),
        top_sectors: sectorBars,
        survey_completion_rate_pct: completionRate,
      };
      const result = (await callDevelopAI("analyze_graduates", payload)) as AIInsights;
      setAiInsights(result);
      toast.success("Insights generated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not generate insights");
    } finally {
      setAiLoading(false);
    }
  }

  const selectedSurveys = useMemo(() => {
    if (!selected) return [];
    return surveys
      .filter((s) => s.graduate_id === selected.id && isCompleteSurveyRow(s))
      .sort((a, b) => new Date(b.survey_date).getTime() - new Date(a.survey_date).getTime());
  }, [selected, surveys]);

  async function sendSurvey(graduateId: string) {
    const grad = graduates.find((g) => g.id === graduateId);
    if (!grad) return;
    const completed = surveys.some((s) => s.graduate_id === graduateId && isCompleteSurveyRow(s));
    if (completed) return toast.info("This graduate already has a completed survey on file");

    const next = { ...surveyInvites, [graduateId]: new Date().toISOString() };
    setSurveyInvites(next);
    persistSurveyInvites(next);
    toast.success("Survey invitation queued (email integration pending)");
  }

  async function bulkSurvey() {
    const completedIds = new Set(
      surveys.filter(isCompleteSurveyRow).map((s) => s.graduate_id),
    );
    const targets = filtered.filter((g) => !completedIds.has(g.id)).slice(0, 25);
    if (!targets.length) return toast.info("No pending graduates in current filter");
    const next = { ...surveyInvites };
    targets.forEach((g) => {
      next[g.id] = new Date().toISOString();
    });
    setSurveyInvites(next);
    persistSurveyInvites(next);
    toast.success(`Queued ${targets.length} survey invitations (email integration pending)`);
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
        Loading Observatoire…
      </div>
    );
  }

  if (!universityId) {
    return (
      <div className="max-w-2xl space-y-3">
        <h1 className="text-2xl font-bold">Observatoire des Diplômés</h1>
        <p className="text-sm text-muted-foreground">
          This feature is available for university admins linked to a university record. Your admin account does not have a{" "}
          <span className="font-mono">university_id</span> yet.
        </p>
      </div>
    );
  }

  const bestField = fieldBars[0]?.field;
  const worstField = fieldBars[fieldBars.length - 1]?.field;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold">Observatoire des Diplômés</h1>
            <span
              className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border"
              style={{ backgroundColor: "#B8860B33", color: "#F3D27A", borderColor: "#B8860B" }}
            >
              New
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Track graduate outcomes. Prove your institution&apos;s impact.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <Button
            variant="outline"
            className="w-full md:w-auto"
            style={{ backgroundColor: "transparent", borderColor: "var(--color-border-primary)", color: "var(--color-text-primary)" }}
            onClick={exportCsv}
          >
            <Download className="w-4 h-4 mr-2" />
            Export to CSV →
          </Button>
        </div>
      </div>

      <Card className="p-4 md:p-6 border border-border bg-card">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <Label className="text-xs text-muted-foreground">Institution</Label>
            <Select value={universityFilter} onValueChange={setUniversityFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All institutions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All institutions</SelectItem>
                {universities.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Graduation year</Label>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {["2020", "2021", "2022", "2023", "2024", "2025"].map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Field of study</Label>
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All fields</SelectItem>
                {fields.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, company, role…" className="pl-9" />
            </div>
          </div>
        </div>
      </Card>

      {!filtered.length ? (
        <Card className="p-10 text-center border border-dashed border-border">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Start building your graduate observatory</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Add your first graduates to begin tracking career outcomes and measuring institutional impact.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="bg-[#C8102E] text-white hover:bg-[#C8102E]/90 w-full sm:w-auto" onClick={() => setManualOpen(true)}>
              Add graduates →
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              style={{ backgroundColor: "transparent", borderColor: "var(--color-border-primary)", color: "var(--color-text-primary)" }}
              onClick={openImport}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV →
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 stack-on-xs">
            <MetricCard label="Graduates tracked" value={String(metrics.total)} />
            <MetricCard
              label="Employment rate"
              value={`${metrics.employmentRate.toFixed(1)}%`}
              hint={metrics.employmentRate >= 70 ? "Strong" : "Watch"}
              positive={metrics.employmentRate >= 70}
            />
            <MetricCard
              label="Avg time to job"
              value={metrics.avgTtf === null ? "—" : `${metrics.avgTtf.toFixed(1)} mo`}
              icon={metrics.avgTtf !== null && metrics.avgTtf <= 6 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            />
            <MetricCard label="Field alignment" value={`${metrics.alignmentRate.toFixed(1)}%`} />
            <MetricCard
              label="Satisfaction"
              value={metrics.avgSat === null ? "—" : `${metrics.avgSat.toFixed(2)} / 5`}
              stars={metrics.avgSat}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="p-4 md:p-6 border border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Employment status</h3>
                <LineChartIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="h-[260px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDonut} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {statusDonut.map((e) => (
                        <Cell key={e.key} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const payload = item?.payload as { pct?: number; name?: string } | undefined;
                        const pct = typeof payload?.pct === "number" ? payload.pct.toFixed(1) : "0.0";
                        return [`${String(value)} (${pct}%)`, payload?.name ?? "—"];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                {statusDonut.map((s) => (
                  <div key={s.key} className="flex items-center justify-between border border-border rounded-md px-2 py-1">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span>
                      {s.value} ({s.pct.toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 md:p-6 border border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Time to first job</h3>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="h-[200px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ttfBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="graduates" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 md:p-6 border border-border bg-card xl:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Employment by field</h3>
                <div className="text-xs text-muted-foreground">
                  Best: <span className="text-foreground font-medium">{bestField ?? "—"}</span> · Worst:{" "}
                  <span className="text-foreground font-medium">{worstField ?? "—"}</span>
                </div>
              </div>
              <div className="h-[260px] md:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fieldBars} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis type="category" dataKey="field" width={120} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                      {fieldBars.map((entry) => {
                        const isBest = entry.field === bestField;
                        const isWorst = entry.field === worstField && fieldBars.length > 1;
                        const fill = isBest ? "#22C55E" : isWorst ? "#EF4444" : "#6366F1";
                        return <Cell key={entry.field} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 md:p-6 border border-border bg-card xl:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Sector distribution vs demand</h3>
                <span className="text-xs text-muted-foreground">Demand index (illustrative)</span>
              </div>
              <div className="h-[200px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="sector" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} />
                    <Legend />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" name="Graduates" fill="#6366F1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="demand" name="Morocco demand" fill="#F3D27A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="p-4 md:p-6 border border-border bg-card">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold">Graduate outcomes</h3>
                <p className="text-xs text-muted-foreground">Click a row to open the profile panel.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  style={{ backgroundColor: "transparent", borderColor: "var(--color-border-primary)", color: "var(--color-text-primary)" }}
                  onClick={() => setManualOpen(true)}
                >
                  Add graduate manually
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  style={{ backgroundColor: "transparent", borderColor: "var(--color-border-primary)", color: "var(--color-text-primary)" }}
                  onClick={openImport}
                >
                  Import CSV
                </Button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("student_name")}>
                      Name
                    </TableHead>
                    <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => toggleSort("graduation_year")}>
                      Year
                    </TableHead>
                    <TableHead className="hidden lg:table-cell cursor-pointer" onClick={() => toggleSort("field_of_study")}>
                      Field
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("current_status")}>
                      Status
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Role</TableHead>
                    <TableHead className="hidden xl:table-cell">Company</TableHead>
                    <TableHead className="hidden xl:table-cell">Sector</TableHead>
                    <TableHead className="hidden md:table-cell">Time to job</TableHead>
                    <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => toggleSort("last_updated")}>
                      Last updated
                    </TableHead>
                    <TableHead className="hidden md:table-cell">LinkedIn</TableHead>
                    <TableHead className="md:hidden">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRows.map((g) => (
                    <TableRow
                      key={g.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelected(g);
                        setSheetOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{g.student_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{g.graduation_year}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{g.field_of_study}</TableCell>
                      <TableCell className="text-xs">{STATUS_LABEL[g.current_status as StatusKey]}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{g.current_role ?? "—"}</TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground">{g.current_company ?? "—"}</TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground">{g.current_sector ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{g.time_to_first_job_months ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(g.last_updated).toLocaleDateString()}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {g.linkedin_url ? (
                          <a
                            href={g.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border hover:border-primary"
                            aria-label="Open LinkedIn profile"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="md:hidden">
                        <details onClick={(e) => e.stopPropagation()}>
                          <summary className="cursor-pointer text-xs underline underline-offset-2">View</summary>
                          <div className="mt-2 text-xs text-muted-foreground space-y-1">
                            <div>Field: {g.field_of_study}</div>
                            <div>Role: {g.current_role ?? "—"}</div>
                            <div>Company: {g.current_company ?? "—"}</div>
                          </div>
                        </details>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="p-4 md:p-6 border border-border bg-card">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold">Survey management</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Completion rate: {completionRate.toFixed(1)}%
                    {invitedOutstanding > 0 ? (
                      <span className="text-muted-foreground"> · Invitations outstanding: {invitedOutstanding}</span>
                    ) : null}
                  </p>
                </div>
                <Button
                  className="w-full md:w-auto bg-[#C8102E] text-white hover:bg-[#C8102E]/90"
                  onClick={() => void bulkSurvey()}
                >
                  Send bulk survey →
                </Button>
              </div>

              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Pending responses (sample)</p>
                <div className="space-y-2">
                  {pendingSurveys.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending graduates in this filter.</p>
                  ) : (
                    pendingSurveys.map((g) => (
                      <div key={g.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{g.student_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {g.field_of_study} · {g.graduation_year}
                          </p>
                          {surveyInvites[g.id] && (
                            <p className="text-[11px] mt-1" style={{ color: "#F3D27A" }}>
                              Invited · {new Date(surveyInvites[g.id]).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          style={{ backgroundColor: "transparent", borderColor: "var(--color-border-primary)", color: "var(--color-text-primary)" }}
                          onClick={() => void sendSurvey(g.id)}
                        >
                          Nudge
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 border border-border bg-card">
              <h3 className="font-semibold mb-3">Survey response rate (12 months)</h3>
              <div className="h-[200px] md:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={surveySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="responses" stroke="#F3D27A" strokeWidth={2} dot={{ r: 2, fill: "#F3D27A" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card
            className="p-4 md:p-6 border border-border bg-card"
            style={{ borderLeftWidth: 4, borderLeftColor: "#B8860B" }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: "#F3D27A" }}>
                  Observatoire Intelligence
                </p>
                <h3 className="text-lg font-semibold mt-1">Strategic narrative for leadership</h3>
                <p className="text-sm text-muted-foreground mt-1">Generated from your filtered cohort + aggregate KPIs.</p>
              </div>
              <Button
                className="w-full md:w-auto bg-[#C8102E] text-white hover:bg-[#C8102E]/90"
                disabled={aiLoading}
                onClick={() => void generateInsights()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {aiLoading ? "Generating…" : "Generate insights →"}
              </Button>
            </div>

            {aiInsights && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                <InsightCard k="Headline" v={aiInsights.headline_finding} />
                <InsightCard k="Employment trend" v={aiInsights.employment_trend} />
                <InsightCard k="Top field" v={aiInsights.top_performing_field} />
                <InsightCard k="Attention" v={aiInsights.attention_needed} />
                <InsightCard k="Recommendation" v={aiInsights.recommendation_for_university} />
                <InsightCard k="Morocco comparison" v={aiInsights.comparison_to_morocco_average} />
              </div>
            )}
          </Card>

          <Card className="p-4 md:p-6 border border-border bg-card">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">Benchmark your institution</h3>
              <p className="text-xs text-muted-foreground">Red = your filtered cohort · Gray = Moroccan average</p>
            </div>
            <div className="mt-5 space-y-4">
              {[
                {
                  label: "Employment rate",
                  yours: metrics.employmentRate,
                  national: nationalMetrics.employmentRate,
                  suffix: "%",
                  toBar: (v: number) => Math.min(100, v),
                },
                {
                  label: "Time to first job",
                  yours: metrics.avgTtf ?? 0,
                  national: nationalMetrics.avgTtf,
                  suffix: " mo",
                  toBar: (v: number) => Math.min(100, (v / 24) * 100),
                },
                {
                  label: "Field alignment",
                  yours: metrics.alignmentRate,
                  national: nationalMetrics.alignmentRate,
                  suffix: "%",
                  toBar: (v: number) => Math.min(100, v),
                },
              ].map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{row.label}</span>
                    <span className="text-muted-foreground">
                      {row.yours.toFixed(1)}
                      {row.suffix} vs {row.national.toFixed(1)}
                      {row.suffix}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${row.toBar(row.yours)}%` }} />
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-muted-foreground/70" style={{ width: `${row.toBar(row.national)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? "h-[90vh] w-full p-0 border-t" : "w-[520px] sm:max-w-[520px] p-0 border-l"}
        >
          <div className="h-full overflow-y-auto p-4 md:p-6">
            <SheetHeader>
              <SheetTitle>{selected?.student_name ?? "Graduate"}</SheetTitle>
            </SheetHeader>

            {selected && (
              <div className="mt-4 space-y-4 text-sm">
                <Card className="p-4 border border-border">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Year</p>
                      <p className="font-medium">{selected.graduation_year}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Field</p>
                      <p className="font-medium">{selected.field_of_study}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{STATUS_LABEL[selected.current_status as StatusKey]}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time to job</p>
                      <p className="font-medium">{selected.time_to_first_job_months ?? "—"} mo</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Role / company</p>
                      <p className="font-medium">
                        {(selected.current_role ?? "—") + " · " + (selected.current_company ?? "—")}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Sector</p>
                      <p className="font-medium">{selected.current_sector ?? "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">LinkedIn profile</p>
                      {selected.linkedin_url ? (
                        <a
                          href={selected.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-primary underline underline-offset-2"
                        >
                          <Linkedin className="w-4 h-4" />
                          View profile
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="font-medium">—</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Last verified on LinkedIn</p>
                      <p className="font-medium">{new Date(selected.last_updated).toLocaleString()}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border border-border">
                  <h4 className="font-semibold mb-2">Career timeline</h4>
                  <ol className="space-y-2 text-xs text-muted-foreground">
                    <li>
                      <span className="text-foreground font-medium">{selected.graduation_year}</span> — Graduated ({selected.field_of_study})
                    </li>
                    <li>
                      <span className="text-foreground font-medium">Today</span> — {STATUS_LABEL[selected.current_status as StatusKey]}
                      {selected.current_role ? ` · ${selected.current_role}` : ""}
                    </li>
                  </ol>
                </Card>

                <Card className="p-4 border border-border">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold">Surveys</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      style={{ backgroundColor: "transparent", borderColor: "var(--color-border-primary)", color: "var(--color-text-primary)" }}
                      onClick={() => selected && void sendSurvey(selected.id)}
                    >
                      Send survey →
                    </Button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {surveyInvites[selected.id] && (
                      <div
                        className="text-xs rounded-lg border px-3 py-2"
                        style={{ borderLeftWidth: 3, borderLeftColor: "#B8860B", backgroundColor: "#B8860B14" }}
                      >
                        <span className="text-muted-foreground">Invitation queued:</span>{" "}
                        <span className="text-foreground font-medium">{new Date(surveyInvites[selected.id]).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedSurveys.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No completed survey responses yet.</p>
                    ) : (
                      selectedSurveys.map((s) => (
                        <div key={s.id} className="border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">{new Date(s.survey_date).toLocaleString()}</p>
                            <p className="text-xs font-medium">Satisfaction: {s.satisfaction_score}/5</p>
                          </div>
                          <p className="text-xs mt-2 text-muted-foreground">
                            Employed: {s.employed ? "Yes" : "No"} · Role match: {s.role_matches_degree ? "Yes" : "No"} · Recommend:{" "}
                            {s.would_recommend_university ? "Yes" : "No"}
                          </p>
                          <p className="text-xs mt-2">
                            <span className="text-muted-foreground">Challenge:</span> {s.biggest_challenge}
                          </p>
                          <p className="text-xs mt-1">
                            <span className="text-muted-foreground">Advice:</span> {s.advice_for_students}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add graduate</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label>Name</Label>
              <Input className="mt-1" value={manual.student_name} onChange={(e) => setManual((m) => ({ ...m, student_name: e.target.value }))} />
            </div>
            <div>
              <Label>Graduation year</Label>
              <Input className="mt-1" value={manual.graduation_year} onChange={(e) => setManual((m) => ({ ...m, graduation_year: e.target.value }))} />
            </div>
            <div>
              <Label>Field</Label>
              <Input className="mt-1" value={manual.field_of_study} onChange={(e) => setManual((m) => ({ ...m, field_of_study: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label>Status</Label>
              <Select value={manual.current_status} onValueChange={(v) => setManual((m) => ({ ...m, current_status: v as StatusKey }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as StatusKey[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Input className="mt-1" value={manual.current_role} onChange={(e) => setManual((m) => ({ ...m, current_role: e.target.value }))} />
            </div>
            <div>
              <Label>Company</Label>
              <Input className="mt-1" value={manual.current_company} onChange={(e) => setManual((m) => ({ ...m, current_company: e.target.value }))} />
            </div>
            <div>
              <Label>Sector</Label>
              <Input className="mt-1" value={manual.current_sector} onChange={(e) => setManual((m) => ({ ...m, current_sector: e.target.value }))} />
            </div>
            <div>
              <Label>Salary range</Label>
              <Input className="mt-1" value={manual.current_salary_range} onChange={(e) => setManual((m) => ({ ...m, current_salary_range: e.target.value }))} />
            </div>
            <div>
              <Label>Time to job (months)</Label>
              <Input className="mt-1" value={manual.time_to_first_job_months} onChange={(e) => setManual((m) => ({ ...m, time_to_first_job_months: e.target.value }))} />
            </div>
            <div>
              <Label>Location</Label>
              <Input className="mt-1" value={manual.location} onChange={(e) => setManual((m) => ({ ...m, location: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label>LinkedIn</Label>
              <Input className="mt-1" value={manual.linkedin_url} onChange={(e) => setManual((m) => ({ ...m, linkedin_url: e.target.value }))} />
              {manual.linkedin_url.trim().length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">Profile data will be verified against LinkedIn</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setManualOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#C8102E] text-white hover:bg-[#C8102E]/90" onClick={() => void addGraduate()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import graduates (CSV)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  downloadTextFile(
                    "cariva_graduates_template.csv",
                    [
                      "student_name,graduation_year,field_of_study,current_status,current_role,current_company,current_sector,current_salary_range,time_to_first_job_months,location,linkedin_url",
                      "Example Graduate,2024,Computer Science,employed,Data Analyst,ACME,Technology,8000-12000 MAD,4,Casablanca,https://linkedin.com/in/example",
                    ].join("\n"),
                  )
                }
              >
                Download template
              </Button>
              <label className="border border-dashed border-border rounded-lg px-4 py-6 text-sm text-muted-foreground cursor-pointer w-full sm:w-auto text-center">
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onCsvPicked(e.target.files[0])} />
                Drag & drop CSV, or click to upload
              </label>
            </div>

            {!!csvHeaders.length && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Preview (first 5 rows)</Label>
                  <Textarea className="mt-1 font-mono text-xs" readOnly value={csvRows.slice(0, 5).map((r) => r.join(",")).join("\n")} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {csvHeaders.map((h) => (
                    <div key={h}>
                      <Label className="text-xs text-muted-foreground">Map: {h}</Label>
                      <Select
                        value={mapping[h] ?? CSV_MAP_IGNORE}
                        onValueChange={(v) => setMapping((m) => ({ ...m, [h]: v }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Ignore" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CSV_MAP_IGNORE}>Ignore</SelectItem>
                          <SelectItem value="student_name">student_name</SelectItem>
                          <SelectItem value="graduation_year">graduation_year</SelectItem>
                          <SelectItem value="field_of_study">field_of_study</SelectItem>
                          <SelectItem value="current_status">current_status</SelectItem>
                          <SelectItem value="current_role">current_role</SelectItem>
                          <SelectItem value="current_company">current_company</SelectItem>
                          <SelectItem value="current_sector">current_sector</SelectItem>
                          <SelectItem value="current_salary_range">current_salary_range</SelectItem>
                          <SelectItem value="time_to_first_job_months">time_to_first_job_months</SelectItem>
                          <SelectItem value="location">location</SelectItem>
                          <SelectItem value="linkedin_url">linkedin_url</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Close
            </Button>
            <Button className="bg-[#C8102E] text-white hover:bg-[#C8102E]/90" disabled={importing} onClick={() => void importCsv()}>
              {importing ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  positive,
  icon,
  stars,
}: {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
  icon?: ReactNode;
  stars?: number | null;
}) {
  return (
    <Card className="p-4 border border-border bg-card">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className={`text-2xl font-semibold ${positive === true ? "text-emerald-500" : positive === false ? "text-amber-500" : ""}`}>{value}</p>
        {icon}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {stars !== null && stars !== undefined && (
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`w-4 h-4 ${n <= Math.round(stars) ? "fill-current" : ""}`} style={{ color: "#F3D27A" }} />
          ))}
        </div>
      )}
    </Card>
  );
}

function InsightCard({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4" style={{ borderLeftWidth: 4, borderLeftColor: "#B8860B" }}>
      <p className="text-[11px] uppercase tracking-wide" style={{ color: "#F3D27A" }}>
        {k}
      </p>
      <p className="mt-2 text-sm text-foreground">{v}</p>
    </div>
  );
}
