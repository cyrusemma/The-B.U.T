import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  })

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const adoptionId = session.metadata?.adoption_id

    if (!adoptionId) {
      return NextResponse.json({ error: 'No adoption_id in metadata' }, { status: 400 })
    }

    // Update adoption status to active
    await supabase
      .from('adoptions')
      .update({ status: 'active' })
      .eq('id', adoptionId)

    // Update payment record
    await supabase
      .from('payments')
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'completed',
        completed_at: new Date().toISOString(),
        payment_method: 'card',
      })
      .eq('adoption_id', adoptionId)
      .eq('status', 'pending')

    // Update daily stats
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('daily_stats')
      .upsert(
        { stat_date: today, new_adoptions: 1 },
        { onConflict: 'stat_date', ignoreDuplicates: false }
      )
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', intent.id)
  }

  return NextResponse.json({ received: true })
}
