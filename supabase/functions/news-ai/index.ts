const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NewsBody = {
  type?: "general" | "sector";
  sector?: string;
};

function buildPrompt(articlesSummary: string, type: "general" | "sector", sector?: string) {
  const base = `You are a career intelligence
analyst helping Moroccan students understand
global business trends.

Here are today's top business headlines from
around the world and Morocco:

${articlesSummary || "No fresh articles found from APIs."}

Generate a structured digest. For each story,
explain the global context AND what it means
specifically for Moroccan students and their careers.

Respond ONLY with this JSON:
{
  "week_summary": "2-3 sentence overview combining global and local trends",
  "top_stories": [
    {
      "headline": "clear headline",
      "summary": "2 sentences — what happened globally",
      "morocco_angle": "1 sentence — relevance for Morocco specifically",
      "impact": "what this means for Moroccan students job market",
      "sector": "Finance|Tech|Consulting|Industry|Government|Other",
      "sentiment": "positive|neutral|negative",
      "source": "source name (FT, Bloomberg, Reuters, etc.)",
      "url": "article url",
      "is_global": true
    }
  ],
  "market_signal": "one key global insight relevant for Moroccan job seekers",
  "sectors_trending": ["sector1", "sector2", "sector3"],
  "global_vs_local": "one sentence on how global trends are hitting Morocco"`;

  if (type === "sector") {
    return `${base},
  "job_search_tips": ["tip 1", "tip 2", "tip 3"]
}

Focus particularly on the ${sector ?? "target"} sector and career-relevant signals.`;
  }

  return `${base}
}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const GNEWS_API_KEY = Deno.env.get("GNEWS_API_KEY");
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!GNEWS_API_KEY) throw new Error("GNEWS_API_KEY not configured");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as NewsBody;
    const type = body?.type === "sector" ? "sector" : "general";
    const sector = String(body?.sector ?? "").trim();

    const urls =
      type === "general"
        ? [
            `https://gnews.io/api/v4/top-headlines?category=business&lang=en&max=5&apikey=${GNEWS_API_KEY}`,
            `https://gnews.io/api/v4/search?q=morocco+economy+maroc&lang=en&max=5&apikey=${GNEWS_API_KEY}`,
            `https://gnews.io/api/v4/search?q=africa+business+economy&lang=en&max=3&apikey=${GNEWS_API_KEY}`,
          ]
        : [
            `https://gnews.io/api/v4/search?q=${encodeURIComponent(sector)}&lang=en&max=5&apikey=${GNEWS_API_KEY}`,
            `https://gnews.io/api/v4/search?q=${encodeURIComponent(`${sector} morocco maroc`)}&lang=en&max=5&apikey=${GNEWS_API_KEY}`,
          ];

    const responses = await Promise.all(urls.map((u) => fetch(u).then((r) => r.json())));
    const merged = responses.flatMap((r) => {
      const data = r as Record<string, unknown>;
      return Array.isArray(data.articles) ? data.articles : [];
    }) as Array<Record<string, unknown>>;

    const dedup = new Map<string, Record<string, unknown>>();
    for (const a of merged) {
      const title = String(a.title ?? "").trim().toLowerCase();
      if (!title || dedup.has(title)) continue;
      dedup.set(title, a);
    }
    const articles = Array.from(dedup.values()).slice(0, 10);

    const articlesSummary = articles
      .map((a, i) => {
        const row = a as Record<string, unknown>;
        const sourceObj = (row.source ?? {}) as Record<string, unknown>;
        return `${i + 1}. ${String(row.title ?? "")} (${String(sourceObj.name ?? "Unknown source")}) — ${String(row.description ?? "")}`;
      })
      .join("\n");

    const claudePrompt = buildPrompt(articlesSummary, type, sector);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{ role: "user", content: claudePrompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(JSON.stringify({ error: `Anthropic API error ${anthropicRes.status}`, detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = (await anthropicRes.json()) as Record<string, unknown>;
    const text =
      typeof aiData.content === "object" && Array.isArray(aiData.content)
        ? String((aiData.content[0] as { text?: string }).text ?? "")
        : "";
    const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : cleaned) as Record<string, unknown>;

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
