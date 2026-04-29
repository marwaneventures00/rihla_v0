// Cariva v1.0 - Gemini API
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_MODEL = 'gemini-2.0-flash'; // v2
const MAX_TOKENS = 2000;

type Action =
  | 'generate_case'
  | 'score_case'
  | 'generate_interview'
  | 'score_interview'
  | 'recommend_resources'
  | 'generate_pulse';

const SYSTEM_PROMPTS: Record<Action, string> = {
  generate_case:
    'You are a case interview trainer specializing in the Moroccan and North African business context. Generate structured business cases involving real Moroccan companies, industries, and market dynamics. Always respond with valid JSON only.',
  score_case:
    'You are a case interview trainer specializing in the Moroccan and North African business context. Always respond with valid JSON only.',
  generate_interview:
    'You are a senior HR interviewer and career coach specializing in the Moroccan job market. Generate realistic interview questions tailored to the role and Moroccan professional context. Always respond with valid JSON only.',
  score_interview:
    'You are a senior HR interviewer and career coach specializing in the Moroccan job market. Always respond with valid JSON only.',
  recommend_resources:
    'You are a career development advisor for Moroccan university students. Recommend specific learning resources based on the student profile. Always respond with valid JSON only.',
  generate_pulse:
    'You are a personal career advisor for Moroccan university students. Generate a personalized weekly career briefing that is motivating, specific, and actionable. Always respond with valid JSON only.',
};

function buildPrompt(action: Action, p: any): string {
  switch (action) {
    case 'generate_case':
      return `Generate a business case interview for a ${p.difficulty} level candidate interested in the ${p.sector} sector in Morocco.

Return ONLY this JSON:
{
  "title": string,
  "company": string,
  "context": string (2-3 sentences),
  "question": string,
  "data_provided": [string, string, string, string],
  "hints": [string, string, string],
  "expected_structure": {
    "framework": string,
    "key_buckets": [string],
    "quantitative_ask": string
  },
  "model_answer_outline": string,
  "scoring_criteria": {
    "structure": string,
    "quantitative": string,
    "recommendation": string,
    "morocco_context": string
  }
}`;
    case 'score_case':
      return `Score this business case response.
Case: ${JSON.stringify(p.case_json)}
Student answer: ${p.answer}
Student level: ${p.difficulty}

Return ONLY this JSON:
{
  "overall_score": number,
  "grade": "Offer" | "Strong Pass" | "Pass" | "No Offer",
  "scores": {"structure": number, "quantitative": number, "recommendation": number, "morocco_context": number},
  "strengths": [string, string, string],
  "improvements": [string, string, string],
  "what_a_top_candidate_said": string,
  "next_case_suggestion": string
}`;
    case 'generate_interview':
      return `Generate a mock interview for this candidate:
- Target role: ${p.role}
- Interview type: ${p.type}
- Language: ${p.language}
- Student background: ${p.field_of_study}, ${p.level}, ${p.institution_type}
- Key skills gaps: ${(p.skills_gap || []).join(', ')}

All questions must be in ${p.language}.

Return ONLY this JSON:
{
  "intro_message": string,
  "questions": [
    {"id": 1, "type": "behavioral"|"technical"|"situational", "question": string, "what_we_assess": string, "time_suggestion": number, "follow_up": string}
  ] (exactly 5)
}`;
    case 'score_interview':
      return `Score this mock interview.
Role: ${p.role}
Language: ${p.language}
Background: ${p.background}
Q&A: ${JSON.stringify(p.qa)}

Return ONLY this JSON:
{
  "overall_score": number,
  "hiring_decision": "Strong hire"|"Hire"|"Maybe"|"No hire",
  "question_scores": [
    {"question_id": number, "score": number, "what_was_strong": string, "what_to_improve": string, "model_answer_hint": string}
  ],
  "overall_strengths": [string, string],
  "overall_improvements": [string, string],
  "communication_score": number,
  "structure_score": number,
  "relevance_score": number,
  "coach_note": string
}`;
    case 'recommend_resources':
      return `Based on this student's profile, recommend their top 3 priority resources:
- Pathway: ${p.top_pathway}
- Skills gaps: ${(p.skills_gap || []).join(', ')}
- Level: ${p.study_level}
- Next 90-day action: ${p.next_action || 'N/A'}

Return ONLY this JSON:
{
  "priority_message": string,
  "top_resources": [
    {"type": "course"|"internship"|"certification", "name": string, "why_now": string, "time_to_complete": string, "direct_link": string}
  ] (exactly 3)
}`;
    case 'generate_pulse':
      return `Generate a weekly career pulse for this student:
Profile: ${p.field_of_study}, ${p.level}
Top pathway: ${p.top_pathway}
Skills gaps: ${(p.skills_gap || []).join(', ')}
Active applications: ${p.active_applications || 0}
Readiness score: ${p.readiness_score || 0}

Return ONLY this JSON:
{
  "week_theme": string,
  "opening_message": string,
  "skill_of_the_week": {
    "skill": string,
    "why_this_week": string,
    "how_to_practice": string,
    "time_required": string
  },
  "job_to_apply": {
    "role": string,
    "company": string,
    "why_it_fits": string,
    "where_to_find": string
  },
  "resource_of_the_week": {
    "type": string,
    "name": string,
    "provider": string,
    "time_required": string,
    "direct_link": string
  },
  "interview_tip": string,
  "closing_motivation": string,
  "weekly_challenge": string
}`;
  }
}

async function callGemini(action: Action, payload: any): Promise<any> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPTS[action] }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: buildPrompt(action, payload) }],
        },
      ],
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini error:', res.status, errText);
    throw new Error(`Gemini API error ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
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

    const body = await req.json();
    const action: Action = body.action;
    const payload = body.payload ?? {};

    if (!action || !(action in SYSTEM_PROMPTS)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await callGemini(action, payload);

    return new Response(JSON.stringify({ result }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('develop-ai error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
