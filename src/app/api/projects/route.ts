import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    title, description, projectType, startedAt, diedAt,
    causesOfDeath, ghostLetter, adoptionType, adoptionPrice,
    isPublic, files,
  } = body

  if (!title || !projectType || !causesOfDeath?.length || !adoptionType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Insert project
  const { data: project, error: projectError } = await serviceClient
    .from('projects')
    .insert({
      creator_id: user.id,
      title,
      description: description || null,
      project_type: projectType,
      started_at: startedAt || null,
      died_at: diedAt,
      causes_of_death: causesOfDeath,
      ghost_letter: ghostLetter || null,
      adoption_type: adoptionType,
      adoption_price: adoptionPrice || null,
      is_public: isPublic ?? true,
    })
    .select('id')
    .single()

  if (projectError || !project) {
    console.error('Project insert error:', projectError)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }

  // Insert file records
  if (files?.length > 0) {
    const fileRecords = files.map((f: { name: string; type: string; size: number; path: string }) => ({
      project_id: project.id,
      file_name: f.name,
      file_type: f.type,
      file_size_bytes: f.size,
      storage_path: f.path,
    }))

    await serviceClient.from('project_files').insert(fileRecords)
  }

  // Update daily stats
  const today = new Date().toISOString().split('T')[0]
  await serviceClient.rpc('increment_daily_stat', {
    p_date: today,
    p_column: 'new_projects_submitted',
  }).maybeSingle()

  return NextResponse.json({ id: project.id }, { status: 201 })
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1')  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20))
  const cause = searchParams.get('cause')
  const type = searchParams.get('type')
  const adopted = searchParams.get('adopted')
  const search = searchParams.get('search')

  let query = supabase
    .from('projects')
    .select('*, profiles!creator_id(*), project_files(*), autopsies(*)', { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (cause) {
    query = query.contains('causes_of_death', [cause])
  }
  if (type) {
    query = query.eq('project_type', type)
  }
  if (adopted === 'false') {
    query = query.eq('is_adopted', false)
  }
  if (adopted === 'true') {
    query = query.eq('is_adopted', true)
  }
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    projects: data,
    total: count,
    page,
    pages: Math.ceil((count ?? 0) / limit),
  })
}
