import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OnboardingPayload {
  field: string;
  level: string;
  institutionType: string;
  sectors: string[];
  workEnv: string;
  geography: string;
  ambition: number;
  personality: {
    investigative: number;
    social: number;
    enterprising: number;
    artistic: number;
    conventional: number;
    realistic: number;
    uncertainty: number;
    socialMotivation: number;
  };
}

const SYSTEM_PROMPT =
  "You are a career intelligence engine for Moroccan university students. You have deep knowledge of the Moroccan labor market, major employers, salary ranges, and career trajectories. Always respond with valid JSON only. No prose, no markdown, no explanation outside the JSON.";

function buildUserPrompt(p: OnboardingPayload): string {
  return `Generate a career readiness assessment and pathway recommendations for this student:

- Field of study: ${p.field}
- Level: ${p.level}
- Institution type: ${p.institutionType}
- Preferred sectors: ${p.sectors.join(', ')}
- Work environment preference: ${p.workEnv}
- Geographic ambition: ${p.geography}
- Ambition level (1-5): ${p.ambition}
- Personality scores (1-5 each): Investigative=${p.personality.investigative}, Social=${p.personality.social}, Enterprising=${p.personality.enterprising}, Artistic=${p.personality.artistic}, Conventional=${p.personality.conventional}, Realistic=${p.personality.realistic}, Uncertainty tolerance=${p.personality.uncertainty}, Social motivation=${p.personality.socialMotivation}

Return ONLY this JSON structure:
{
  "readinessScore": number (0-100),
  "topTraits": [string, string],
  "pathways": [
    {
      "title": string,
      "fitScore": number (0-100),
      "whyItFits": [string, string, string],
      "trajectory": {"Y1": string, "Y3": string, "Y5": string},
      "salaryRange": {"min": number, "max": number},
      "topEmployers": [string, string, string],
      "skillsGap": [string, string, string]
    }
  ] (exactly 3 pathways),
  "actionPlan": [string, string, string, string, string]
}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: OnboardingPayload = await req.json();

    const combinedPrompt = `INSTRUCTIONS:\n${SYSTEM_PROMPT}\n\nREQUEST:\n${buildUserPrompt(payload)}`;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: combinedPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('Gemini error:', aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: `Gemini API failed: ${aiRes.status}`, details: errText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const text = aiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

    let result: unknown;
    try {
      result = JSON.parse(cleaned);
    } catch (e) {
      console.error('JSON parse error. Raw:', text);
      return new Response(JSON.stringify({ error: 'Model returned invalid JSON', raw: text }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insertErr } = await supabase
      .from('pathway_results')
      .insert({ user_id: userData.user.id, result_json: result });

    if (insertErr) console.error('Insert error:', insertErr);

    const actions = (result as any)?.actionPlan ?? [];
    if (Array.isArray(actions) && actions.length > 0) {
      await supabase.from('action_plan_items').insert(
        actions.map((a: string) => ({ user_id: userData.user.id, action_text: a }))
      );
    }

    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', userData.user.id);

    return new Response(JSON.stringify({ result }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('generate-pathway error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
