import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const DIAGNOSIS_PROMPT = `You are the Bureau of Unfinished Things' AI Pathologist. Your job is to deliver a thoughtful, compassionate, and honest diagnosis of why a project failed.

You will receive information about an abandoned project. Your diagnosis should be:
- Insightful and specific (not generic)
- Compassionate but honest
- Written like a clinical yet empathetic report
- 3-5 sentences for the diagnosis
- 2-3 sentences for the recommendation

Respond ONLY with valid JSON in this format:
{
  "diagnosis": "The clinical diagnosis text here...",
  "recommendation": "The recommendation for a future adopter here...",
  "confidence": 75
}

The confidence score (0-100) reflects how certain you are based on the evidence provided.`

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get project details
  const { data: project } = await supabase
    .from('projects')
    .select('*, autopsies(*)')
    .eq('id', params.projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Build context for GPT
  const context = `
Project: ${project.title}
Type: ${project.project_type}
Description: ${project.description ?? 'Not provided'}
Started: ${project.started_at ?? 'Unknown'}
Died: ${project.died_at}
Lifespan: ${project.lifespan_months ?? 'Unknown'} months
Causes of Death (as reported by creator): ${project.causes_of_death.join(', ')}
Ghost Letter: ${project.ghost_letter ?? 'None written'}
Adoption Type: ${project.adoption_type}
`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: DIAGNOSIS_PROMPT },
      { role: 'user', content: context },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 500,
  })

  const raw = completion.choices[0].message.content
  if (!raw) {
    return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
  }

  let result: { diagnosis: string; recommendation: string; confidence: number }
  try {
    result = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 })
  }

  // Update autopsy record
  const serviceClient = createServiceClient()
  await serviceClient
    .from('autopsies')
    .update({
      pathologist_diagnosis: result.diagnosis,
      pathologist_recommendation: result.recommendation,
      confidence_score: result.confidence,
    })
    .eq('project_id', params.projectId)

  return NextResponse.json({
    diagnosis: result.diagnosis,
    recommendation: result.recommendation,
    confidence: result.confidence,
  })
}
