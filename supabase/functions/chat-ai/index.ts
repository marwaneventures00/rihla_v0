const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are Mentor, Cariva's AI career advisor for Moroccan university students. You have deep expertise in the Moroccan job market, top employers (OCP, Attijariwafa, McKinsey Casablanca, Deloitte Maroc, BMCE, Maroc Telecom), realistic salary ranges in MAD, career pathways from Moroccan grandes écoles, interview preparation, internship opportunities, and the gap between Moroccan education and employer expectations. Be warm, direct, encouraging. Keep responses to 2-4 paragraphs. Use specific Moroccan examples. Respond in the same language the student uses (French, English, or Arabic).`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey?.trim()) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const fromBody =
      (typeof body.system === 'string' && body.system.trim()) ||
      (typeof body.systemPrompt === 'string' && body.systemPrompt.trim()) ||
      '';
    const system = fromBody || SYSTEM_PROMPT;
    const model =
      typeof body.model === 'string' && body.model.trim().length > 0
        ? body.model.trim()
        : 'claude-haiku-4-5-20251001';
    const maxTokens = system.length > 2000 ? 4096 : 1024;

    const requestBody: Record<string, unknown> = {
      model: model ?? 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: messages.slice(-20),
    };
    if (system) {
      requestBody.system = system;
    }

    console.log(
      'Anthropic request:',
      JSON.stringify({
        model: requestBody.model,
        messageCount: (requestBody.messages as unknown[]).length,
        hasSystem: typeof requestBody.system === 'string' && (requestBody.system as string).length > 0,
        firstMessage: (requestBody.messages as unknown[])[0],
      }),
    );

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Anthropic response status:', res.status);
    const rawBody = await res.text();
    console.log('Anthropic raw body:', rawBody.substring(0, 500));

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Anthropic returned non-JSON body',
          reply: '',
          snippet: rawBody.substring(0, 200),
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!res.ok) {
      const anthropicErr =
        (typeof data?.error === 'object' &&
          data.error !== null &&
          'message' in (data.error as object) &&
          String((data.error as { message?: string }).message)) ||
        (typeof data?.message === 'string' && data.message) ||
        JSON.stringify(data);
      return new Response(JSON.stringify({ error: anthropicErr || `Anthropic HTTP ${res.status}`, reply: '' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (data?.type === 'error') {
      const errObj = data.error;
      const msg =
        errObj && typeof errObj === 'object' && 'message' in errObj && typeof (errObj as { message: string }).message === 'string'
          ? (errObj as { message: string }).message
          : JSON.stringify(data);
      return new Response(JSON.stringify({ error: msg, reply: '' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reply =
      typeof data?.content === 'object' && Array.isArray(data.content)
        ? String((data.content[0] as { text?: string } | undefined)?.text ?? '')
        : '';

    if (!reply.trim()) {
      console.error('chat-ai empty content', rawBody.substring(0, 2000));
      return new Response(JSON.stringify({ error: 'Empty model response (no content[0].text)', reply: '' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reply: reply.trim() }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('chat-ai error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
