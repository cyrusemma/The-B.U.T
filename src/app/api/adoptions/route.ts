import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  initializePaystackPayment,
  ghcToPesewas,
} from '@/lib/paystack'

// Simple in-memory rate limiter for adoption attempts (key: userId)
const adoptionAttempts = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const MAX_ATTEMPTS = 10 // max 10 adoption attempts per hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = adoptionAttempts.get(userId)

  // Reset if window expired
  if (!userLimit || userLimit.reset < now) {
    adoptionAttempts.set(userId, { count: 1, reset: now + RATE_LIMIT_WINDOW })
    return true
  }

  // Check if limit exceeded
  if (userLimit.count >= MAX_ATTEMPTS) {
    return false
  }

  // Increment counter
  userLimit.count++
  return true
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 🔒 SECURITY: Rate limit adoption attempts
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Too many adoption attempts. Please try again later.' },
      { status: 429 }
    )
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

  // Get adopter email for Paystack
  const { data: adopterProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) {
    return NextResponse.json({ error: 'User email not found' }, { status: 400 })
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

  // If paid, create Paystack session
  if (isPaid) {
    try {
      const amountPesewas = ghcToPesewas(pricePaid)
      const bureauPesewas = Math.round(amountPesewas * 0.1)
      const creatorPesewas = amountPesewas - bureauPesewas

      // Create payment record
      const { error: paymentError } = await serviceClient.from('payments').insert({
        adoption_id: adoption.id,
        amount_cents: amountPesewas,
        creator_receives_cents: creatorPesewas,
        bureau_receives_cents: bureauPesewas,
        status: 'pending',
        currency: 'GHS',
        payment_method: 'paystack',
      })

      if (paymentError) {
        throw paymentError
      }

      // Initialize Paystack payment
      const paystackResponse = await initializePaystackPayment({
        email: authUser.email,
        amount: amountPesewas,
        reference: `adoption_${adoption.id}_${Date.now()}`,
        metadata: {
          adoption_id: adoption.id,
          project_id: projectId,
          project_title: project.title,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/adoptions/${adoption.id}/paystack-callback`,
      })

      return NextResponse.json(
        { id: adoption.id, checkoutUrl: paystackResponse.authorization_url },
        { status: 201 }
      )
    } catch (error) {
      console.error('Paystack initialization error:', error)
      return NextResponse.json(
        { error: 'Failed to initialize payment. Please try again.' },
        { status: 500 }
      )
    }
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
