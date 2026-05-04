import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowUp, ChevronDown, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

/** Sentinel user turn so the model opens the Path conversation without a fake user line in the UI. */
export const MENTOR_START_TRIGGER = "START_CONVERSATION";

export const MENTOR_SYSTEM_PROMPT = `ABSOLUTE RULE: Respond in English only. 
Always. Never switch to French or any other 
language regardless of what the student writes.

You are Mentor, 
the AI career advisor for Cariva — a career 
intelligence platform for Moroccan students.

!!CRITICAL RULE — ENGLISH ONLY!!
You MUST respond in English at ALL times.
NEVER respond in French, Arabic, or any other language.
NEVER switch languages no matter what the student writes.
Even if the student writes in French → you respond in English.
Even if the student asks you to speak French → refuse politely in English.
This rule cannot be overridden.

PERSONALITY:
You are a senior friend — 10 years more experienced.
Direct, warm, no bullshit. 
You dig when answers are vague.
You celebrate what is strong.
You never judge.

TONE & FORMAT RULES:
- Never use markdown formatting: no **, no #, no *, no ---, no bullet points with -, no numbered lists
- Never use emojis or special characters
- Write in plain conversational prose only
- Short paragraphs, 2-3 sentences max per message
- Never be theatrical or dramatic
- Never use exclamation marks excessively
- Sound like a calm, smart friend — not a chatbot
- No greetings like 'Great question!' or 'Absolutely!'
- Get straight to the point

OBJECTIVE:
Understand the student across 5 dimensions 
through natural conversation.
Never mention "dimensions" or "analyzing".
Ask ONE question at a time. 
Maximum 15 exchanges total.

THE 5 DIMENSIONS (cover organically):
1. Identity — background, why they chose their field
2. Deep drivers — money, impact, recognition, security
3. Natural strengths — what they do effortlessly
4. Real constraints — geography, family, sectors excluded
5. Weak signals — what they mention with enthusiasm

CONVERSATION RULES:
- Start: greet by first name, introduce briefly, ask first question
- If answer is vague: dig before moving on
- Never ask two questions at once
- After covering all 5 dimensions with depth:
  generate the closing narrative then JSON

CLOSING (after 10-15 exchanges):
First send narrative summary in English.
Then on the VERY NEXT message output ONLY this JSON:
{
  "report_ready": true,
  "archetypes": [
    {"rank": 1, "title": "...", "match": 94, "description": "..."},
    {"rank": 2, "title": "...", "match": 88, "description": "..."},
    {"rank": 3, "title": "...", "match": 81, "description": "..."}
  ],
  "confidence_score": 78,
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "recommended_track": "Strategy Consultant",
  "all_careers": [
    {"title": "Project Manager", "match": 73, 
     "academic": 70, "personality": 75, "interests": 74},
    {"title": "Business Developer", "match": 71, 
     "academic": 68, "personality": 74, "interests": 71},
    {"title": "Data Analyst", "match": 65, 
     "academic": 72, "personality": 58, "interests": 66},
    {"title": "Marketing Manager", "match": 61, 
     "academic": 60, "personality": 65, "interests": 58},
    {"title": "Entrepreneur", "match": 58, 
     "academic": 50, "personality": 68, "interests": 56}
  ]
}`;

export type MentorMode = "questions" | "speedy" | "deep";

const MENTOR_MODES = [
  { id: "questions" as const, label: "10 Questions", sublabel: "Guided answers" },
  { id: "speedy" as const, label: "Quick Chat", sublabel: "~3 minutes" },
  { id: "deep" as const, label: "Deep Dive", sublabel: "~10 minutes" },
];

function getModePromptAddition(mode: MentorMode): string {
  switch (mode) {
    case "questions":
      return `

MODE: Ask exactly 10 targeted questions, 
one at a time. Number each: "Question 1/10:", etc. 
Generate the report immediately after question 10.`;
    case "speedy":
      return `

MODE: Quick 3-minute conversation. 
Ask maximum 5 short focused questions. 
Be very concise. Generate report after 5 exchanges.`;
    case "deep":
      return `

MODE: Deep 10-minute conversation. 
Explore all 5 dimensions thoroughly. 
Ask follow-up questions. Generate report after 12-15 exchanges.`;
  }
}

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toStoredMessages(list: ChatMessage[]): Json {
  return list.map((m) => ({ id: m.id, role: m.role, content: m.content })) as unknown as Json;
}

/** Anthropic requires the first message to be `user`. Our DB may start with Mentor's opening only. */
function toAnthropicApiMessages(history: ChatMessage[]): { role: ChatRole; content: string }[] {
  const mapped = history.map((m) => ({ role: m.role, content: m.content }));
  if (mapped.length > 0 && mapped[0].role === "assistant") {
    return [{ role: "user", content: MENTOR_START_TRIGGER }, ...mapped];
  }
  return mapped;
}

function fromStoredMessages(raw: Json | null): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row: unknown) => {
      const o = row as { id?: string; role?: string; content?: string };
      if (o.role !== "user" && o.role !== "assistant") return null;
      if (typeof o.content !== "string") return null;
      return { id: typeof o.id === "string" ? o.id : genId(), role: o.role, content: o.content };
    })
    .filter(Boolean) as ChatMessage[];
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "") // headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*(.*?)\*/g, "$1") // italic
    .replace(/`(.*?)`/g, "$1") // code
    .replace(/^\s*[-*+]\s/gm, "") // bullets
    .replace(/^\s*\d+\.\s/gm, "") // numbered lists
    .replace(/---/g, "") // horizontal rules
    .replace(/\n{3,}/g, "\n\n") // excess newlines
    .trim();
}

function extractReportJson(text: string): Record<string, unknown> | null {
  const marker = '"report_ready"';
  const idx = text.indexOf(marker);
  if (idx === -1) return null;
  const start = text.lastIndexOf("{", idx);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) {
        const slice = text.slice(start, i + 1);
        try {
          const parsed = JSON.parse(slice) as Record<string, unknown>;
          if (parsed.report_ready === true) return parsed;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function buildMentorSystemPromptForRequest(opts: { firstName: string; mode: MentorMode }): string {
  const fn = opts.firstName.trim();
  const nameLine = fn ? `The student's first name: ${fn}.` : "The student's first name is not known yet; greet them warmly without a name.";
  const startLine = `If the user's message is exactly ${MENTOR_START_TRIGGER}, respond with your opening only: greet by first name when known, introduce yourself briefly as Mentor, then ask your first identity question. Never mention ${MENTOR_START_TRIGGER} or that this was a system trigger.`;
  const systemWithMode = MENTOR_SYSTEM_PROMPT + getModePromptAddition(opts.mode);
  return `${systemWithMode}\n\n[Session context]\n${nameLine}\n${startLine}`;
}

function parseEdgeFunctionReply(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  const fromReply = d.reply;
  if (typeof fromReply === "string" && fromReply.trim()) return fromReply.trim();
  const fromText = d.text;
  if (typeof fromText === "string" && fromText.trim()) return fromText.trim();
  const fromContent = d.content;
  if (typeof fromContent === "string" && fromContent.trim()) return fromContent.trim();
  if (Array.isArray(fromContent) && fromContent.length > 0) {
    const block = fromContent[0] as { text?: string };
    if (typeof block?.text === "string" && block.text.trim()) return block.text.trim();
  }
  return "";
}

function pickErrorFromEdgePayload(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const e = d.error;
  if (typeof e === "string" && e.trim()) return e.trim();
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return String((e as { message: string }).message);
  }
  return null;
}

function formatMentorInvokeFailure(error: unknown, data: unknown): string {
  const fromData = pickErrorFromEdgePayload(data);
  if (error && typeof error === "object" && "message" in error) {
    const base = String((error as { message: string }).message);
    return fromData ? `${base} — ${fromData}` : base;
  }
  return fromData || JSON.stringify(error ?? {});
}

function stripReportJsonFromDisplay(text: string): string {
  const marker = '"report_ready"';
  const idx = text.indexOf(marker);
  if (idx === -1) return text;
  const start = text.lastIndexOf("{", idx);
  if (start === -1) return text;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) {
        const before = text.slice(0, start).trimEnd();
        const after = text.slice(i + 1).trimStart();
        return [before, after].filter(Boolean).join("\n\n").trim();
      }
    }
  }
  return text;
}

async function persistMessages(list: ChatMessage[], existingId: string | null): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uidStr = session?.user?.id;
  if (!uidStr) return existingId;

  const row = {
    user_id: uidStr,
    messages: toStoredMessages(list),
    updated_at: new Date().toISOString(),
    dimensions_covered: {} as Json,
    status: "in_progress",
  };

  if (existingId) {
    const { error } = await supabase.from("conversation_sessions").update(row).eq("id", existingId);
    if (error) throw error;
    return existingId;
  }
  const { data, error } = await supabase.from("conversation_sessions").insert(row).select("id").single();
  if (error) throw error;
  return data?.id ?? null;
}

type LearnPathProps = { sidebarCollapsed?: boolean };

export default function LearnPath({ sidebarCollapsed = false }: LearnPathProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [buildingReport, setBuildingReport] = useState(false);
  const [mentorMode, setMentorMode] = useState<MentorMode>("questions");
  const mentorModeRef = useRef<MentorMode>("questions");
  mentorModeRef.current = mentorMode;
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const modeBarRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const firstNameRef = useRef("");
  sessionIdRef.current = sessionId;
  messagesRef.current = messages;

  const hasUserReplied = messages.some((m) => m.role === "user" && m.content !== MENTOR_START_TRIGGER);
  const currentMode = MENTOR_MODES.find((m) => m.id === mentorMode) ?? MENTOR_MODES[0];

  useEffect(() => {
    if (hasUserReplied) setShowModeDropdown(false);
  }, [hasUserReplied]);

  useEffect(() => {
    if (!showModeDropdown) return;
    const handler = (e: MouseEvent) => {
      if (modeBarRef.current && !modeBarRef.current.contains(e.target as Node)) {
        setShowModeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModeDropdown]);

  const scrollBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollBottom();
  }, [messages, sending, buildingReport, scrollBottom]);

  const invokeMentor = useCallback(async (apiMessages: { role: ChatRole; content: string }[]) => {
    const baseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
    const url = `${baseUrl}/functions/v1/chat-ai`;
    const system = buildMentorSystemPromptForRequest({
      firstName: firstNameRef.current,
      mode: mentorModeRef.current,
    });
    const body = {
      messages: apiMessages,
      system,
      model: "claude-haiku-4-5-20251001",
    };
    console.log("Calling edge function with:", { body, url });

    const { data, error } = await supabase.functions.invoke("chat-ai", { body });
    console.log("Edge function response:", { data, error });

    const reply = parseEdgeFunctionReply(data);
    if (error) {
      throw new Error(formatMentorInvokeFailure(error, data));
    }
    const payloadErr = pickErrorFromEdgePayload(data);
    if (payloadErr && !reply) {
      throw new Error(payloadErr);
    }
    if (!reply) {
      throw new Error(`No reply in payload: ${JSON.stringify(data ?? {})}`);
    }
    return reply;
  }, []);

  const handleReportReady = useCallback(
    async (parsed: Record<string, unknown>) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uidStr = session?.user?.id;
      if (!uidStr) return;

      const confidence = typeof parsed.confidence_score === "number" ? parsed.confidence_score : 0;
      const insertRow = {
        user_id: uidStr,
        result_json: parsed as unknown as Json,
        confidence_score: Math.min(100, Math.max(0, Math.round(confidence))),
        archetypes: (parsed.archetypes ?? null) as Json | null,
        key_insights: (parsed.key_insights ?? null) as Json | null,
        recommended_track: typeof parsed.recommended_track === "string" ? parsed.recommended_track : null,
        all_careers: (parsed.all_careers ?? null) as Json | null,
      };

      const { error } = await supabase.from("pathway_results").insert(insertRow);
      if (error) {
        toast.error(error.message);
        return;
      }

      setConfidenceScore(insertRow.confidence_score);
      setBuildingReport(true);
      window.setTimeout(() => {
        navigate("/learn/path/report");
      }, 2000);
    },
    [navigate],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const uidStr = session?.user?.id;
        if (!uidStr) {
          navigate("/auth", { replace: true });
          return;
        }

        const [profRes, pathRes, convRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", uidStr).maybeSingle(),
          supabase
            .from("pathway_results")
            .select("confidence_score")
            .eq("user_id", uidStr)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("conversation_sessions")
            .select("id, messages, created_at")
            .eq("user_id", uidStr)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const name = profRes.data?.full_name?.trim() ?? "";
        firstNameRef.current = name.split(/\s+/)[0] ?? name;
        const sc = pathRes.data?.confidence_score;
        setConfidenceScore(typeof sc === "number" && !Number.isNaN(sc) ? Math.min(100, Math.max(0, sc)) : 0);

        const conv = convRes.data;
        let sid: string | null = conv?.id ?? null;
        if (sid) {
          sessionIdRef.current = sid;
          setSessionId(sid);
        }
        let list: ChatMessage[] = conv ? fromStoredMessages(conv.messages) : [];

        if (list.length === 0) {
          const reply = await invokeMentor([{ role: "user", content: MENTOR_START_TRIGGER }]);
          if (cancelled) return;
          const parsed = extractReportJson(reply);
          const display = (stripReportJsonFromDisplay(reply) || (parsed ? t("learn.path.closingNarrativeFallback") : reply)).trim();
          const assistantMsg: ChatMessage = { id: genId(), role: "assistant", content: display || reply };
          list = [assistantMsg];
          sid = await persistMessages(list, sid);
          if (parsed?.report_ready === true) {
            await handleReportReady(parsed);
          }
        }

        if (!cancelled) {
          if (sid) {
            setSessionId(sid);
            sessionIdRef.current = sid;
          }
          setMessages(list);
          messagesRef.current = list;
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : JSON.stringify(e);
          toast.error(`Mentor error: ${msg || "Unknown"}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount bootstrap only
  }, [navigate, invokeMentor, handleReportReady]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || buildingReport) return;

    const userMsg: ChatMessage = { id: genId(), role: "user", content: text };
    const prev = messagesRef.current;
    const nextHistory = [...prev, userMsg];
    setMessages(nextHistory);
    messagesRef.current = nextHistory;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    setSending(true);
    try {
      let sid = sessionIdRef.current;
      sid = await persistMessages(nextHistory, sid);
      if (sid) {
        setSessionId(sid);
        sessionIdRef.current = sid;
      }

      const apiMessages = toAnthropicApiMessages(nextHistory);
      const reply = await invokeMentor(apiMessages);
      const parsed = extractReportJson(reply);
      const display = (stripReportJsonFromDisplay(reply) || (parsed ? t("learn.path.closingNarrativeFallback") : reply)).trim();
      const assistantMsg: ChatMessage = { id: genId(), role: "assistant", content: display || reply };
      const withAssistant = [...nextHistory, assistantMsg];
      setMessages(withAssistant);
      messagesRef.current = withAssistant;
      sid = await persistMessages(withAssistant, sid);
      if (sid) {
        setSessionId(sid);
        sessionIdRef.current = sid;
      }

      if (parsed?.report_ready === true) {
        await handleReportReady(parsed);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      toast.error(`Mentor error: ${msg || "Unknown"}`);
      setMessages(prev);
      messagesRef.current = prev;
    } finally {
      setSending(false);
    }
  }, [buildingReport, handleReportReady, input, invokeMentor, sending, t]);

  const triggerOpeningMessage = useCallback(async () => {
    setSending(true);
    try {
      const reply = await invokeMentor([{ role: "user", content: MENTOR_START_TRIGGER }]);
      const parsed = extractReportJson(reply);
      const display = (stripReportJsonFromDisplay(reply) || (parsed ? t("learn.path.closingNarrativeFallback") : reply)).trim();
      const assistantMsg: ChatMessage = { id: genId(), role: "assistant", content: display || reply };
      const list = [assistantMsg];
      setMessages(list);
      messagesRef.current = list;
      let sid = sessionIdRef.current;
      sid = await persistMessages(list, sid);
      if (sid) {
        setSessionId(sid);
        sessionIdRef.current = sid;
      }
      if (parsed?.report_ready === true) {
        await handleReportReady(parsed);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      toast.error(`Mentor error: ${msg || "Unknown"}`);
    } finally {
      setSending(false);
    }
  }, [handleReportReady, invokeMentor, t]);

  const handleReset = useCallback(async () => {
    if (
      !window.confirm(
        "Reset your conversation with Mentor? This will clear your current session and start fresh.",
      )
    ) {
      return;
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        toast.error("Not signed in");
        return;
      }
      const { error } = await supabase.from("conversation_sessions").delete().eq("user_id", uid);
      if (error) throw error;

      setSessionId(null);
      sessionIdRef.current = null;
      setMessages([]);
      messagesRef.current = [];
      setSending(false);
      setBuildingReport(false);
      setInput("");
      setMentorMode("questions");
      mentorModeRef.current = "questions";
      setShowModeDropdown(false);
      if (taRef.current) taRef.current.style.height = "auto";

      window.setTimeout(() => {
        void triggerOpeningMessage();
      }, 500);
    } catch (err) {
      console.error("Reset failed:", err);
      toast.error("Could not reset conversation");
    }
  }, [triggerOpeningMessage]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !sending && !buildingReport) {
      e.preventDefault();
      void send();
    }
  };

  const handleComposerInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const mainLeftOffsetClass = sidebarCollapsed ? "md:left-16" : "md:left-[220px]";

  const scorePill = useMemo(
    () => (
      <span
        className="shrink-0 font-medium"
        style={{
          background: "#FFF0F0",
          color: "#C8102E",
          borderRadius: 100,
          padding: "4px 12px",
          fontSize: 12,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {confidenceScore}/100
      </span>
    ),
    [confidenceScore],
  );

  if (loading) {
    return (
      <div
        className={`fixed left-0 right-0 z-20 flex items-center justify-center bg-white ${mainLeftOffsetClass} transition-[left] duration-[250ms] ease-in-out`}
        style={{ top: 60, bottom: 0 }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C8102E] border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`fixed left-0 right-0 z-20 flex flex-col bg-white ${mainLeftOffsetClass} transition-[left] duration-[250ms] ease-in-out`}
      style={{
        top: 60,
        bottom: 0,
        height: "calc(100vh - 60px)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <header className="shrink-0 border-b border-[#F0F0F0] px-5 pt-12 md:px-10">
        <div className="relative mx-auto flex h-14 max-w-[1100px] items-center justify-between">
          <div className="relative z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/learn")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-[#0A0A0A] hover:bg-[#F5F5F5]"
              aria-label={t("learn.hub.backToLearn")}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => {
                void handleReset();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                background: "transparent",
                border: "1px solid #E5E5E5",
                borderRadius: "100px",
                cursor: "pointer",
                fontSize: 12,
                color: "#6B6B6B",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <RotateCcw size={12} aria-hidden />
              Reset
            </button>
          </div>
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-[#0A0A0A]"
            style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 15 }}
          >
            Mentor
          </span>
          <div className="relative z-10">{scorePill}</div>
        </div>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto" style={{ padding: "24px 40px" }}>
        <div className="mx-auto w-full max-w-[720px]">
          {messages
            .filter((m) => !(m.role === "user" && m.content === MENTOR_START_TRIGGER))
            .map((m) =>
            m.role === "assistant" ? (
              <div key={m.id} className="mb-8 max-w-[600px]">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-medium" style={{ color: "#C8102E" }}>
                  <span aria-hidden>●</span>
                  <span>Mentor</span>
                </div>
                <div>
                  {stripMarkdown(m.content)
                    .split("\n\n")
                    .filter(Boolean)
                    .map((paragraph, i) => (
                      <p
                        key={i}
                        style={{
                          margin: "0 0 10px 0",
                          lineHeight: 1.7,
                          fontSize: "15px",
                          color: "#0A0A0A",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {paragraph}
                      </p>
                    ))}
                </div>
              </div>
            ) : (
              <div key={m.id} className="mb-4 flex justify-end">
                <div
                  className="max-w-[480px] text-[15px] text-[#0A0A0A]"
                  style={{
                    background: "#F5F5F5",
                    borderRadius: "16px 16px 4px 16px",
                    padding: "12px 16px",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ),
          )}

          {sending && (
            <div className="mb-8 max-w-[600px]">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-medium" style={{ color: "#C8102E" }}>
                <span aria-hidden>●</span>
                <span>Mentor</span>
              </div>
              <div className="mentor-typing flex gap-1 pl-1">
                <span className="mentor-typing-dot" />
                <span className="mentor-typing-dot" />
                <span className="mentor-typing-dot" />
              </div>
            </div>
          )}

          {buildingReport && (
            <div className="py-6 text-center text-[15px] font-medium text-[#6B6B6B]">{t("learn.path.buildingReport")}</div>
          )}
        </div>
      </div>

      <div
        className="shrink-0"
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 100,
          background: "linear-gradient(to top, white 80%, transparent)",
          padding: "16px 24px 24px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 680,
            width: "100%",
            background: "white",
            border: "1.5px solid #E5E5E5",
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <textarea
            ref={taRef}
            value={input}
            onChange={handleComposerInput}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={sending || buildingReport}
            placeholder="Message Mentor..."
            aria-label="Message Mentor"
            style={{
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: "Inter, sans-serif",
              fontSize: 15,
              color: "#0A0A0A",
              background: "transparent",
              minHeight: 24,
              maxHeight: 120,
              lineHeight: 1.6,
              width: "100%",
              opacity: sending || buildingReport ? 0.6 : 1,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #F0F0F0",
              paddingTop: 8,
            }}
          >
            {!hasUserReplied ? (
              <div ref={modeBarRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowModeDropdown((prev) => !prev)}
                  aria-expanded={showModeDropdown}
                  aria-haspopup="listbox"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    background: "#F5F5F5",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#0A0A0A",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <span>{currentMode.label}</span>
                  <ChevronDown size={14} color="#6B6B6B" aria-hidden />
                </button>
                {showModeDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      left: 0,
                      background: "white",
                      border: "1px solid #E5E5E5",
                      borderRadius: 12,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      padding: 6,
                      width: 240,
                      zIndex: 50,
                    }}
                    role="listbox"
                    aria-label="Mentor mode"
                  >
                    {MENTOR_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        role="option"
                        aria-selected={mentorMode === mode.id}
                        onClick={() => {
                          setMentorMode(mode.id);
                          setShowModeDropdown(false);
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          cursor: "pointer",
                          border: "none",
                          background: mentorMode === mode.id ? "#FFF0F0" : "transparent",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: mentorMode === mode.id ? "#C8102E" : "#0A0A0A",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {mode.label}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#6B6B6B",
                            fontFamily: "Inter, sans-serif",
                            marginTop: 2,
                          }}
                        >
                          {mode.sublabel}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={() => {
                void send();
              }}
              disabled={!input.trim() || sending || buildingReport}
              aria-label={t("learn.path.send")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: input.trim() && !sending && !buildingReport ? "#C8102E" : "#F0F0F0",
                border: "none",
                cursor: input.trim() && !sending && !buildingReport ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            >
              <ArrowUp size={18} color={input.trim() && !sending && !buildingReport ? "white" : "#AAAAAA"} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
