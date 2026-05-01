import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(req.url)
    const includePrivate = searchParams.get('includePrivate') === 'true'

    let query = supabase
      .from('curator_notes')
      .select('*, curator:curator_id(username, display_name)')
      .eq('project_id', params.projectId)
      .order('created_at', { ascending: false })

    if (!includePrivate) {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching curator notes:', error)
    return NextResponse.json({ error: 'Failed to fetch curator notes' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, is_public } = await req.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('curator_notes')
      .upsert(
        {
          project_id: params.projectId,
          curator_id: user.id,
          content: content.trim(),
          is_public: is_public ?? true,
        },
        { onConflict: 'project_id,curator_id' }
      )
      .select('*, curator:curator_id(username, display_name)')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating/updating curator note:', error)
    return NextResponse.json(
      { error: 'Failed to create/update curator note' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('curator_notes')
      .delete()
      .eq('project_id', params.projectId)
      .eq('curator_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting curator note:', error)
    return NextResponse.json({ error: 'Failed to delete curator note' }, { status: 500 })
  }
}
