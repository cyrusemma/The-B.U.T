import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { adoptionId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messageText } = await request.json()

  if (!messageText?.trim()) {
    return NextResponse.json({ error: 'Message text required' }, { status: 400 })
  }

  // Verify user is participant
  const { data: adoption } = await supabase
    .from('adoptions')
    .select('adopter_id, creator_id')
    .eq('id', params.adoptionId)
    .single()

  if (!adoption) {
    return NextResponse.json({ error: 'Adoption not found' }, { status: 404 })
  }

  if (user.id !== adoption.adopter_id && user.id !== adoption.creator_id) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  }

  const serviceClient = createServiceClient()

  const { data: message, error } = await serviceClient
    .from('adoption_chats')
    .insert({
      adoption_id: params.adoptionId,
      sender_id: user.id,
      message_text: messageText.trim(),
    })
    .select('*, profiles(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(message, { status: 201 })
}

export async function GET(
  _request: Request,
  { params }: { params: { adoptionId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('adoption_chats')
    .select('*, profiles(*)')
    .eq('adoption_id', params.adoptionId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
