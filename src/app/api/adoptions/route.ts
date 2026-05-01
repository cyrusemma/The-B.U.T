import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await request.json()

  if (!projectId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check project isn't already adopted
  const { data: project } = await supabase
    .from('projects')
    .select('id, creator_id, is_adopted, title, adoption_type, adoption_price')
    .eq('id', projectId)
    .single()

  if (!project || project.is_adopted) {
    return NextResponse.json({ error: 'Project already adopted' }, { status: 409 })
  }

  // Prevent self-adoption
  if (user.id === project.creator_id) {
    return NextResponse.json({ error: 'You cannot adopt your own project' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const adoptionType = project.adoption_type
  const pricePaid = project.adoption_price ?? null
  const isPaid = adoptionType === 'resurrection_rights' && typeof pricePaid === 'number' && pricePaid > 0

  // Create adoption record
  const { data: adoption, error: adoptionError } = await serviceClient
    .from('adoptions')
    .insert({
      project_id: projectId,
      adopter_id: user.id,
      creator_id: project.creator_id,
      adoption_type: adoptionType,
      price_paid: pricePaid ?? null,
      status: isPaid ? 'pending_payment' : 'active',
    })
    .select('id')
    .single()

  if (adoptionError || !adoption) {
    return NextResponse.json({ error: 'Failed to create adoption' }, { status: 500 })
  }

  // If paid, create Stripe session
  if (isPaid) {
    const amountCents = Math.round(pricePaid * 100)
    const bureauCents = Math.round(amountCents * 0.1)
    const creatorCents = amountCents - bureauCents

    // Create payment record
    await serviceClient.from('payments').insert({
      adoption_id: adoption.id,
      amount_cents: amountCents,
      creator_receives_cents: creatorCents,
      bureau_receives_cents: bureauCents,
      status: 'pending',
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Resurrection Rights: ${project.title}`,
              description: `Adopt and revive this project from the Bureau of Unfinished Things`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/adoption/${adoption.id}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/morgue/${projectId}?payment=cancelled`,
      metadata: {
        adoption_id: adoption.id,
        project_id: projectId,
      },
    })

    return NextResponse.json({ id: adoption.id, checkoutUrl: session.url }, { status: 201 })
  }

  return NextResponse.json({ id: adoption.id }, { status: 201 })
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') // 'adopter' | 'creator'

  let query = supabase
    .from('adoptions')
    .select('*, projects(*), profiles!adopter_id(*)')
    .order('created_at', { ascending: false })

  if (role === 'adopter') {
    query = query.eq('adopter_id', user.id)
  } else if (role === 'creator') {
    query = query.eq('creator_id', user.id)
  } else {
    query = query.or(`adopter_id.eq.${user.id},creator_id.eq.${user.id}`)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
