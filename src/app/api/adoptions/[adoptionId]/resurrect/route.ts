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

  const { url, agreementSigned } = await request.json()

  if (!url?.trim()) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  // Verify user is the adopter
  const { data: adoption } = await supabase
    .from('adoptions')
    .select('adopter_id, adoption_type, ip_transfer_agreement_signed, ip_transfer_signed_at')
    .eq('id', params.adoptionId)
    .single()

  if (!adoption || adoption.adopter_id !== user.id) {
    return NextResponse.json({ error: 'Only the adopter can mark a resurrection' }, { status: 403 })
  }

  const requiresAgreement =
    adoption.adoption_type === 'resurrection_rights' && !adoption.ip_transfer_agreement_signed

  if (requiresAgreement && !agreementSigned) {
    return NextResponse.json(
      { error: 'IP transfer agreement must be acknowledged first' },
      { status: 400 }
    )
  }

  const serviceClient = createServiceClient()
  const now = new Date().toISOString()

  const { error } = await serviceClient
    .from('adoptions')
    .update({
      resurrected_at: now,
      resurrection_url: url.trim(),
      status: 'resurrected',
      ip_transfer_agreement_signed:
        adoption.ip_transfer_agreement_signed || adoption.adoption_type === 'resurrection_rights'
          ? true
          : adoption.ip_transfer_agreement_signed,
      ip_transfer_signed_at:
        requiresAgreement ? now : adoption.ip_transfer_signed_at,
    })
    .eq('id', params.adoptionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
