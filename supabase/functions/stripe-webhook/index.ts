import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  const body = await req.text()
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2024-09-30.acacia',
    httpClient: Stripe.createFetchHttpClient(),
  })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    return new Response(`Webhook error: ${String(err)}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const adoptionId = session.metadata?.adoption_id

    if (adoptionId) {
      await supabase
        .from('adoptions')
        .update({ status: 'active' })
        .eq('id', adoptionId)

      await supabase
        .from('payments')
        .update({
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('adoption_id', adoptionId)
        .eq('status', 'pending')

      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('daily_stats')
        .upsert({ stat_date: today, new_adoptions: 1 }, { onConflict: 'stat_date' })
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
