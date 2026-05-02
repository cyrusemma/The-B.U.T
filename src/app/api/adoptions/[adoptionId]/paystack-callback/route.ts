import { createServiceClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyPaystackTransaction, verifyPaystackWebhookSignature } from '@/lib/paystack'

export async function POST(
  request: Request,
  { params }: { params: { adoptionId: string } }
) {
  try {
    // 🔒 CRITICAL: Verify webhook signature to prevent forged webhooks
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!verifyPaystackWebhookSignature(body, signature)) {
      console.warn('Invalid webhook signature detected')
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const webhookData = JSON.parse(body)

    // Only process charge.success events
    if (webhookData.event !== 'charge.success') {
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    const reference = webhookData.data?.reference

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // 🔒 SECURITY: Get adoption to verify it exists and get adopter ID
    const { data: adoption, error: adoptionFetchError } = await serviceClient
      .from('adoptions')
      .select('id, adopter_id, status')
      .eq('id', params.adoptionId)
      .single()

    if (adoptionFetchError || !adoption) {
      return NextResponse.json(
        { error: 'Adoption not found' },
        { status: 404 }
      )
    }

    // Prevent double-processing
    if (adoption.status === 'active') {
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // Verify payment with Paystack
    const paystackData = await verifyPaystackTransaction(reference)

    if (!paystackData.status) {
      // Payment failed, update payment record
      await serviceClient
        .from('payments')
        .update({
          status: 'failed',
          paystack_reference: reference,
          updated_at: new Date().toISOString(),
        })
        .eq('adoption_id', params.adoptionId)

      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // ✅ Payment successful - update payment record
    const { error: paymentError } = await serviceClient
      .from('payments')
      .update({
        status: 'completed',
        paystack_reference: reference,
        updated_at: new Date().toISOString(),
      })
      .eq('adoption_id', params.adoptionId)

    if (paymentError) {
      console.error('Payment update error:', paymentError)
      throw paymentError
    }

    // ✅ Update adoption status to active
    const { error: adoptionError } = await serviceClient
      .from('adoptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.adoptionId)

    if (adoptionError) {
      console.error('Adoption update error:', adoptionError)
      throw adoptionError
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Paystack webhook error:', { error: errorMsg })
    // Always return 200 to Paystack so they don't retry
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}

// Legacy GET handler for redirect-style callbacks (if using old setup)
export async function GET(
  request: Request,
  { params }: { params: { adoptionId: string } }
) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/adoption/${params.adoptionId}?payment=unauthorized`
      )
    }

    // Verify this user owns the adoption
    const { data: adoption } = await supabase
      .from('adoptions')
      .select('adopter_id')
      .eq('id', params.adoptionId)
      .single()

    if (!adoption || adoption.adopter_id !== user.id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/adoption/${params.adoptionId}?payment=forbidden`
      )
    }

    const serviceClient = createServiceClient()

    // Verify payment with Paystack
    const paystackData = await verifyPaystackTransaction(reference)

    if (!paystackData.status) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/adoption/${params.adoptionId}?payment=failed`
      )
    }

    // Update payment and adoption records
    await serviceClient
      .from('payments')
      .update({
        status: 'completed',
        paystack_reference: reference,
        updated_at: new Date().toISOString(),
      })
      .eq('adoption_id', params.adoptionId)

    await serviceClient
      .from('adoptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.adoptionId)

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/adoption/${params.adoptionId}?payment=success`
    )
  } catch (error) {
    console.error('Paystack callback error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/adoption/${params.adoptionId}?payment=error`
    )
  }
}
