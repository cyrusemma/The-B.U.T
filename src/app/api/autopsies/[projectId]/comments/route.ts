import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { commentText, alternativeCauses } = await request.json()

  if (!commentText?.trim()) {
    return NextResponse.json({ error: 'Comment text required' }, { status: 400 })
  }

  // Get autopsy id
  const { data: autopsy } = await supabase
    .from('autopsies')
    .select('id')
    .eq('project_id', params.projectId)
    .single()

  if (!autopsy) {
    return NextResponse.json({ error: 'Autopsy not found' }, { status: 404 })
  }

  const serviceClient = createServiceClient()

  const { data: comment, error } = await serviceClient
    .from('autopsy_comments')
    .insert({
      autopsy_id: autopsy.id,
      author_id: user.id,
      comment_text: commentText.trim(),
      alternative_causes: alternativeCauses ?? null,
    })
    .select('*, profiles(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Increment community count
  await serviceClient
    .from('autopsies')
    .update({
      community_diagnosis_count: (autopsy as { id: string } & { community_diagnosis_count?: number }) ? undefined : 0,
    })
    .eq('id', autopsy.id)

  // Use raw update
  await supabase.rpc('increment_autopsy_comment_count', { p_autopsy_id: autopsy.id }).maybeSingle()

  return NextResponse.json(comment, { status: 201 })
}
