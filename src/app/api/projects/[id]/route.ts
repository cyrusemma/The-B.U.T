import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ProjectWithProfile } from '@/lib/types/database'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('projects')
    .select(`*, profiles!creator_id(*), project_files(*), autopsies(*, autopsy_comments(*, profiles!author_id(*)))`)
    .eq('id', params.id)
    .single() as unknown as { data: ProjectWithProfile | null; error: { message: string } | null }

  if (error || !data) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!data.is_public && data.creator_id !== user?.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
