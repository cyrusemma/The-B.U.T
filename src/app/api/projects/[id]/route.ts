import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles(*),
      project_files(*),
      autopsies(
        *,
        autopsy_comments(*, profiles(*))
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!data.is_public && data.creator_id !== user?.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
