import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Project } from '@/lib/types/database'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Per-user rate limit: 5 diagnoses per hour (in-memory; swap for Redis in production)
const LIMIT   = 5
const WINDOW  = 60 * 60 * 1000 // 1 hour
const callLog = new Map<string, { count: number; reset: number }>()

function checkRateLimit(userId: string): boolean {
  const now   = Date.now()
  const entry = callLog.get(userId)
  if (!entry || now >= entry.reset) {
    callLog.set(userId, { count: 1, reset: now + WINDOW })
    return true
  }
  if (entry.count >= LIMIT) return false
  entry.count++
  return true
}

const SYSTEM_PROMPT = `You are the Bureau of Unfinished Things' AI Pathologist — a clinical, empathetic expert who performs formal autopsies on abandoned creative and technical projects.

Your role is to deliver an honest, specific, and compassionate post-mortem. You write with the gravitas of a museum curator and the precision of a forensic examiner. Never be generic.

Output your report in EXACTLY this format — no extra text, no markdown, no deviation:

[OFFICIAL_CAUSE]: {A single clinical sentence naming the precise cause of death. E.g. "Death by Scope Paralysis, compounded by co-founder departure and runway depletion."}
[DIAGNOSIS]: {3–4 sentences of deep, specific diagnosis. Reference the project's actual details. Be insightful about the psychology and circumstances, not just the surface causes.}
[RECOMMENDATION]: {2–3 sentences addressed directly to a future adopter. What should they know before picking this up? What's salvageable and what needs rebuilding?}
[DIFFICULTY]: {exactly one of: easy, moderate, hard}
[DIFFICULTY_REASON]: {One sentence explaining the difficulty rating, specific to this project.}
[CONFIDENCE]: {An integer from 0–100 reflecting how certain you are given the evidence provided.}`

// Parse the model's delimited output into structured fields
function parseOutput(text: string) {
  function extract(key: string, nextKey?: string) {
    const escaped = key.replace(/[[\]]/g, '\\$&')
    const next = nextKey?.replace(/[[\]]/g, '\\$&')
    const pattern = next
      ? new RegExp(`\\[${escaped}\\]:\\s*([\\s\\S]*?)\\[${next}\\]:`)
      : new RegExp(`\\[${escaped}\\]:\\s*([\\s\\S]*)$`)
    return text.match(pattern)?.[1]?.trim() ?? ''
  }

  const raw_difficulty = extract('DIFFICULTY', 'DIFFICULTY_REASON').toLowerCase()
  const difficulty = (['easy', 'moderate', 'hard'] as const).find(d => raw_difficulty.includes(d)) ?? 'moderate'
  const confidence = parseInt(extract('CONFIDENCE')) || 70

  return {
    official_cause:   extract('OFFICIAL_CAUSE', 'DIAGNOSIS'),
    diagnosis:        extract('DIAGNOSIS', 'RECOMMENDATION'),
    recommendation:   extract('RECOMMENDATION', 'DIFFICULTY'),
    difficulty,
    difficulty_reason: extract('DIFFICULTY_REASON', 'CONFIDENCE'),
    confidence,
  }
}

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkRateLimit(user.id)) {
    const errEvent = JSON.stringify({ type: 'error', message: 'Diagnosis limit reached (5/hour). Please try again later.' })
    return new Response(`data: ${errEvent}\n\n`, {
      status: 429,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.projectId)
    .single() as unknown as { data: Project | null }

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const lifespan = project.lifespan_months
    ? `${project.lifespan_months} month${project.lifespan_months !== 1 ? 's' : ''}`
    : 'unknown duration'

  const context = `Project title: ${project.title}
Type: ${project.project_type}
Description: ${project.description ?? 'Not provided'}
Started: ${project.started_at ?? 'Unknown'}
Died: ${project.died_at}
Lifespan: ${lifespan}
Causes of death (self-reported): ${project.causes_of_death.join(', ')}
Ghost letter from creator: ${project.ghost_letter ?? 'None written'}
Adoption type offered: ${project.adoption_type}${project.adoption_price ? ` at GH₵${project.adoption_price}` : ''}`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      let fullText = ''

      try {
        const messageStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: context }],
        })

        for await (const event of messageStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullText += event.delta.text
            send({ type: 'chunk', text: event.delta.text })
          }
        }

        // Parse and persist
        const parsed = parseOutput(fullText)

        const serviceClient = createServiceClient()
        await serviceClient
          .from('autopsies')
          .update({
            official_cause:           parsed.official_cause  || null,
            pathologist_diagnosis:    parsed.diagnosis       || null,
            pathologist_recommendation: parsed.recommendation || null,
            resurrection_difficulty:  parsed.difficulty,
            difficulty_reason:        parsed.difficulty_reason || null,
            confidence_score:         parsed.confidence,
          })
          .eq('project_id', params.projectId)

        send({ type: 'done', ...parsed })
      } catch (err) {
        send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Diagnosis failed',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
