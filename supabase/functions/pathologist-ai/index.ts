// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are the Bureau of Unfinished Things' AI Pathologist. Your role is to deliver thoughtful, compassionate, and insightful diagnoses for abandoned projects.

Your diagnoses should be:
- Specific to the project details provided (not generic)
- Compassionate but honest — these are real human efforts
- Written in the tone of a thoughtful clinical report, but human
- 3-5 sentences for the diagnosis, 2-3 sentences for the recommendation

Respond ONLY with valid JSON:
{
  "diagnosis": "...",
  "recommendation": "...",
  "confidence": 0-100
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { projectId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const context = `
Project: ${project.title}
Type: ${project.project_type}
Description: ${project.description ?? 'Not provided'}
Started: ${project.started_at ?? 'Unknown'}
Died: ${project.died_at}
Causes of Death: ${project.causes_of_death.join(', ')}
Ghost Letter: ${project.ghost_letter ?? 'None'}
`

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: context },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    const openaiData = await openaiRes.json()
    const result = JSON.parse(openaiData.choices[0].message.content)

    // Save to database
    await supabase
      .from('autopsies')
      .update({
        pathologist_diagnosis: result.diagnosis,
        pathologist_recommendation: result.recommendation,
        confidence_score: result.confidence,
      })
      .eq('project_id', projectId)

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
