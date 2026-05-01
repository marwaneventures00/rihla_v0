import { useEffect, useMemo, useState } from "react";
import { ArrowUp, MessageCircle, Minus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatRole = "user" | "assistant";
type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

const STORAGE_KEY = "cariva-chat-history";
const STORAGE_TS_KEY = "cariva-chat-history-ts";
const MAX_HISTORY = 10;
const MAX_INPUT = 500;
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

const WELCOME_MESSAGE =
  "Marhaba! I'm Cariva AI, your personal career advisor. I know the Moroccan job market inside out. Ask me anything — career paths, interview tips, salary ranges, company culture, or how to stand out to Moroccan employers. How can I help you today?";

const QUICK_REPLIES = [
  "What career suits me?",
  "How to prepare for McKinsey?",
  "Salary ranges in consulting",
  "Best internships in Morocco",
];

function nowIso() {
  return new Date().toISOString();
}

export default function CarivaChatBot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    const ts = localStorage.getItem(STORAGE_TS_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    const isExpired = !ts || Date.now() - Number(ts) > EXPIRY_MS;
    if (!raw || isExpired) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TS_KEY);
      setMessages([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (Array.isArray(parsed)) setMessages(parsed.slice(-MAX_HISTORY));
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
    localStorage.setItem(STORAGE_TS_KEY, String(Date.now()));
  }, [messages]);

  useEffect(() => {
    if (open) setUnread(false);
  }, [open]);

  const hasWelcome = useMemo(() => messages.length > 0, [messages.length]);
  const showQuickReplies = open && !loading && messages.length === 1 && messages[0]?.content === WELCOME_MESSAGE;

  function ensureWelcome() {
    if (hasWelcome) return;
    setMessages([
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: WELCOME_MESSAGE,
        createdAt: nowIso(),
      },
    ]);
  }

  function openPanel() {
    setOpen(true);
    setMinimized(false);
    ensureWelcome();
  }

  function closePanel() {
    setOpen(false);
    setMinimized(false);
  }

  function clearHistory() {
    setMessages([]);
    setInput("");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TS_KEY);
    ensureWelcome();
  }

  async function sendMessage(contentOverride?: string) {
    const text = (contentOverride ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: nowIso(),
    };
    const nextHistory = [...messages, userMsg].slice(-MAX_HISTORY);
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const payload = {
        messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
      };
      const { data, error } = await supabase.functions.invoke("chat-ai", { body: payload });
      if (error) throw new Error(error.message);
      const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
      if (!reply) throw new Error("No reply from assistant");

      const aiMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
        createdAt: nowIso(),
      };
      setMessages((prev) => [...prev, aiMsg].slice(-MAX_HISTORY));
      if (!open) setUnread(true);
    } catch {
      const fallback: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "I hit a temporary issue. Please try again in a moment.",
        createdAt: nowIso(),
      };
      setMessages((prev) => [...prev, fallback].slice(-MAX_HISTORY));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={openPanel}
          aria-label="Open Meet & Greet chat"
          className="fixed bottom-6 right-6 z-[1000] w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105"
          style={{ backgroundColor: "#000000" }}
        >
          <MessageCircle size={24} color="white" />
          {unread && <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: "#8B5CF6" }} />}
        </button>
      )}

      {open && (
        <div
          className={`fixed right-6 bottom-6 z-[1000] border overflow-hidden ${minimized ? "h-16" : "h-[520px]"} w-[380px] max-w-[calc(100vw-24px)] max-sm:inset-0 max-sm:w-auto max-sm:h-auto max-sm:rounded-none`}
          style={{
            background: "var(--color-background-secondary)",
            borderColor: "var(--color-border-primary)",
            borderRadius: minimized ? 16 : 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div className="px-3 py-2 flex items-start justify-between gap-2" style={{ backgroundColor: "#000000" }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-semibold flex items-center justify-center">C</div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">Meet &amp; Greet</p>
                  <p className="text-[11px] text-white/75 leading-tight">Career Advisor</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={clearHistory} className="p-1.5 rounded hover:bg-white/10 text-white/80" aria-label="Clear chat history">
                <Trash2 className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setMinimized((m) => !m)} className="p-1.5 rounded hover:bg-white/10 text-white" aria-label="Minimize">
                <Minus className="w-4 h-4" />
              </button>
              <button type="button" onClick={closePanel} className="p-1.5 rounded hover:bg-white/10 text-white" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              <div className="h-[390px] max-sm:h-[calc(100vh-180px)] overflow-y-auto px-3 py-3 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                    {m.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-black text-white text-[11px] font-semibold flex items-center justify-center mt-1">C</div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className="px-3 py-2 text-sm whitespace-pre-wrap"
                        style={
                          m.role === "user"
                            ? { background: "#000000", color: "white", borderRadius: "16px 16px 4px 16px" }
                            : { background: "var(--color-background-tertiary)", color: "var(--color-text-primary)", borderRadius: "16px 16px 16px 4px" }
                        }
                      >
                        {m.content}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 px-1">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-black text-white text-[11px] font-semibold flex items-center justify-center mt-1">C</div>
                    <div className="px-3 py-2 rounded-[16px] bg-muted flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:120ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:240ms]" />
                    </div>
                  </div>
                )}

                {showQuickReplies && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {QUICK_REPLIES.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className="text-xs px-2 py-1 rounded-full border border-border bg-background hover:border-primary"
                        onClick={() => void sendMessage(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border p-2">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
                    placeholder="Ask me anything..."
                    className="min-h-[44px] max-h-[120px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={!input.trim() || loading}
                    className="h-11 w-11 p-0 rounded-full bg-black hover:bg-zinc-800"
                    aria-label="Send message"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                </div>
                {input.length >= 420 && (
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    {input.length}/{MAX_INPUT}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
