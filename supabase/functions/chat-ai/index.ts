import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-2.0-flash";
const SYSTEM_PROMPT = `You are Cariva AI, a friendly and expert career advisor for Moroccan university students. You have deep knowledge of:
- The Moroccan job market and top employers (OCP, Attijariwafa, McKinsey Casablanca, Deloitte Maroc, etc.)
- Salary ranges in Morocco (in MAD)
- Career pathways from Moroccan universities
- Interview preparation for Moroccan companies
- Internship opportunities in Morocco
- The Moroccan education system and grandes écoles
- Networking in Morocco (LinkedIn, university events)
- The gap between Moroccan education and employer needs

Personality: warm, encouraging, practical, direct. You speak like a senior mentor who genuinely cares about the student's success.
Keep responses concise (2-4 paragraphs max).
Use specific Moroccan examples when relevant.
Always respond in the same language the student writes in (French, English, or Arabic).
Never make up specific salary numbers without noting they are approximate.`;

type Message = { role: "user" | "assistant"; content: string };

function toGeminiRole(role: Message["role"]) {
  return role === "assistant" ? "model" : "user";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? (body.messages as Message[]) : [];
    if (!messages.length) {
      return new Response(JSON.stringify({ error: "messages is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.map((m) => ({
          role: toGeminiRole(m.role),
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("chat-ai Gemini error:", res.status, errText);
      throw new Error(`Gemini API error ${res.status}`);
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ?? "";
    if (!reply) throw new Error("No reply generated");

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("chat-ai error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
