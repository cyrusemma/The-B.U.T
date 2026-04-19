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

  const { url } = await request.json()

  if (!url?.trim()) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  // Verify user is the adopter
  const { data: adoption } = await supabase
    .from('adoptions')
    .select('adopter_id')
    .eq('id', params.adoptionId)
    .single()

  if (!adoption || adoption.adopter_id !== user.id) {
    return NextResponse.json({ error: 'Only the adopter can mark a resurrection' }, { status: 403 })
  }

  const serviceClient = createServiceClient()

  const { error } = await serviceClient
    .from('adoptions')
    .update({
      resurrected_at: new Date().toISOString(),
      resurrection_url: url.trim(),
      status: 'resurrected',
    })
    .eq('id', params.adoptionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
