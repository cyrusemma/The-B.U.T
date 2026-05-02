/**
 * Paystack Payment Integration
 * Handle all Paystack-related operations for Ghana cedis payments
 */

const PAYSTACK_BASE_URL = 'https://api.paystack.co'
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export interface PaystackInitializePaymentParams {
  email: string
  amount: number // in pesewas (GHc cents)
  reference: string
  metadata?: Record<string, any>
  callback_url?: string
}

export interface PaystackRecipient {
  recipient_code: string
  domain: string
  type: string
  currency: string
  bank_account: string
  account_number: string
  bank_code: string
}

export interface PaystackTransferRecipient {
  type: 'nuban'
  name: string
  account_number: string
  bank_code: string
  currency: string
}

/**
 * Initialize a Paystack transaction
 */
export async function initializePaystackPayment(
  params: PaystackInitializePaymentParams
) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        metadata: params.metadata || {},
        callback_url: params.callback_url,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to initialize payment')
    }

    return data.data
  } catch (error) {
    console.error('Paystack initialization error:', error)
    throw error
  }
}

/**
 * Verify a Paystack transaction
 */
export async function verifyPaystackTransaction(reference: string) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }

  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify payment')
    }

    return data.data
  } catch (error) {
    console.error('Paystack verification error:', error)
    throw error
  }
}

/**
 * Create a Paystack transfer recipient
 */
export async function createPaystackRecipient(
  params: PaystackTransferRecipient
) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create recipient')
    }

    return data.data
  } catch (error) {
    console.error('Paystack recipient creation error:', error)
    throw error
  }
}

/**
 * Initiate a transfer to a recipient
 */
export async function initiatePaystackTransfer(
  recipient_code: string,
  amount: number, // in pesewas
  reference: string
) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        source: 'balance',
        recipient: recipient_code,
        amount,
        reference,
        reason: 'Adoption payout - Bureau of Unfinished Things',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to initiate transfer')
    }

    return data.data
  } catch (error) {
    console.error('Paystack transfer error:', error)
    throw error
  }
}

/**
 * Format amount to GHc display string
 */
export function formatGHc(amount: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount)
}

/**
 * Convert GHc to pesewas (cents)
 */
export function ghcToPesewas(ghc: number): number {
  return Math.round(ghc * 100)
}

/**
 * Convert pesewas to GHc
 */
export function pesewasToGhc(pesewas: number): number {
  return pesewas / 100
}

/**
 * Verify Paystack webhook signature (HMAC-SHA512)
 * Critical security check to prevent forged webhooks
 */
export function verifyPaystackWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!PAYSTACK_SECRET_KEY || !signature) {
    return false
  }

  try {
    const crypto = require('crypto')
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex')

    return hash === signature
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}
