import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Validate Ghanaian bank account via Paystack Resolve Account API
 * This prevents invalid or mismatched account numbers from being saved
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { account_number, bank_code } = await request.json()

    if (!account_number || !bank_code) {
      return NextResponse.json(
        { error: 'Account number and bank code are required' },
        { status: 400 }
      )
    }

    if (account_number.length !== 10 || !/^\d+$/.test(account_number)) {
      return NextResponse.json(
        { error: 'Account number must be 10 digits' },
        { status: 400 }
      )
    }

    // 🔒 SECURITY: Call Paystack Resolve Account API to validate
    const response = await fetch('https://api.paystack.co/bank/resolve', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      body: new URLSearchParams({
        account_number,
        bank_code,
      }).toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Invalid bank account details' },
        { status: 400 }
      )
    }

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || 'Bank account could not be validated' },
        { status: 400 }
      )
    }

    // Return validated account name from Paystack
    return NextResponse.json(
      {
        status: 'ok',
        account_name: data.data?.account_name || '',
        account_number,
        bank_code,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Bank account validation error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to validate bank account' },
      { status: 500 }
    )
  }
}
