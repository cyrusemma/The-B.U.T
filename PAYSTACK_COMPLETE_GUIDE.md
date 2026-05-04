# Paystack Payment Integration - Complete Setup Guide

## 🎯 Overview

Your Bureau of Unfinished Things application has been upgraded with **Paystack payment integration** for Ghana cedis (GHc) transactions. This replaces Stripe and enables seamless payments for project adoption rights in Ghana.

## 📋 What Was Implemented

### 1. **Payment Infrastructure**
- ✅ Paystack API integration for GHc payments
- ✅ Payment account management in Settings
- ✅ Bank account validation (Ghanaian banks)
- ✅ Secure payment credential storage
- ✅ 90/10 revenue split (Creator/Bureau)

### 2. **User Features**
- ✅ **Settings Page**: Payment account configuration
  - Bank selection (17 Ghanaian banks)
  - Account number validation
  - Account name verification
  
- ✅ **Project Creation**: Set adoption prices in GHc
  - Free adoptions (Open Casket)
  - Component sharing (Organ Donor)
  - Paid resurrection rights with custom pricing

- ✅ **Adoption Flow**: Seamless Paystack checkout
  - Initiate payment via Paystack
  - Real-time payment verification
  - Automatic adoption status update

### 3. **UI/UX Enhancements**
- ✅ Glass-morphism design system
- ✅ Mobile-responsive forms
- ✅ Real-time error handling
- ✅ Loading states and feedback
- ✅ Ghana cedis (GHc) currency formatting

## 🚀 Getting Started

### Step 1: Install Dependencies
```bash
npm install
# or
yarn install
```

### Step 2: Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Paystack API Keys
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here

# Application URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 3: Get Paystack Credentials

1. Go to https://dashboard.paystack.co
2. Create account or log in
3. Navigate to **Settings → API Keys & Webhooks**
4. Copy:
   - **Secret Key** → `PAYSTACK_SECRET_KEY`
   - **Public Key** → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

### Step 4: Run Database Migration

```bash
# If using Supabase CLI
supabase migration up

# Or manually run SQL from:
supabase/migrations/005_payment_settings.sql
```

### Step 5: Deploy

The payment system is now ready to use!

## 💰 Currency Guide

All prices are in **Ghana Cedis (GHc)**:

```javascript
import { formatGHc, ghcToPesewas } from '@/lib/paystack'

// Display price
const displayPrice = formatGHc(100) // "GH₵100.00"

// Convert for Paystack API (uses pesewas)
const pesewas = ghcToPesewas(100) // 10000
```

## 🏦 Payment Flow

1. **Creator Sets Up**
   - Goes to Settings → Payment Account Settings
   - Enters bank account details
   - System validates and stores securely

2. **Creator Creates Project**
   - Sets adoption type (Free, Component Share, or Paid Rights)
   - For paid projects, sets price in GHc
   - Project goes live in the morgue

3. **Adopter Initiates**
   - Views project and clicks "Adopt"
   - Reviews terms and confirms
   - Redirected to Paystack checkout

4. **Payment Processing**
   - Customer pays via Paystack
   - Paystack confirms payment
   - System auto-verifies and updates adoption status
   - Creator receives 90%, Bureau gets 10%

5. **Adoption Completes**
   - Adopter can now access full adoption chat
   - Can upload resurrection URL
   - Project is marked as adopted

## 🔐 Security Features

- ✅ Encrypted payment credentials
- ✅ Row-level security on payment tables
- ✅ Webhook verification from Paystack
- ✅ No sensitive data stored in logs
- ✅ HTTPS required for production

## 📱 Supported Banks

Currently configured for:
- Zenith Bank
- Barclays Bank
- Bank of Baroda
- Bank of Africa
- Ecobank Ghana
- Access Bank
- Standard Chartered Bank
- Fidelity Bank
- GCB Bank
- Guinness Bank
- HFC Bank
- Intercontinental Bank
- Prudential Bank
- SIC Bank
- UTC Bank
- United Bank for Africa
- And more...

To add more banks, update `GHANA_BANKS` in:
`src/components/settings/PaymentSettingsForm.tsx`

## 🧪 Testing

### Test Credentials (Sandbox Mode)

Use these when testing:
- **Card Number**: 4084084084084081
- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3-4 digits (e.g., 123)
- **OTP**: 123456 (if prompted)

### Test Flow
1. Set up a payment account in Settings
2. Create a project with "Resurrection Rights" adoption
3. Set a test price (e.g., 50 GHc)
4. Adopt the project as another user
5. Verify payment via Paystack dashboard

## 📊 Admin Dashboard

Track payments in Supabase:

```sql
-- View all payments
SELECT * FROM payments ORDER BY created_at DESC;

-- View creator payment settings
SELECT * FROM payment_settings;

-- View adoption with payment status
SELECT 
  a.id,
  a.status,
  p.status as payment_status,
  p.amount_cents,
  pr.display_name as creator
FROM adoptions a
LEFT JOIN payments p ON a.id = p.adoption_id
LEFT JOIN projects pr ON a.project_id = pr.id;
```

## 🔗 Webhook Configuration (Production)

Set up Paystack webhooks in dashboard:

1. Go to Settings → API Keys & Webhooks
2. Add webhook URL:
   ```
   https://yourdomain.com/api/adoptions/[adoptionId]/paystack-callback
   ```
3. Select events:
   - `charge.success`
   - `charge.failed`

## 📖 File Structure

```
bureau/
├── src/
│   ├── lib/
│   │   └── paystack.ts                    # Paystack utilities
│   ├── components/
│   │   └── settings/
│   │       └── PaymentSettingsForm.tsx    # Payment account form
│   └── app/
│       ├── api/
│       │   └── adoptions/
│       │       ├── route.ts               # Main adoption API
│       │       └── [adoptionId]/
│       │           └── paystack-callback/ # Webhook handler
│       └── (app)/
│           └── settings/page.tsx          # Settings page
├── supabase/
│   └── migrations/
│       └── 005_payment_settings.sql       # Database schema
└── PAYSTACK_SETUP.md                      # This guide
```

## 🐛 Troubleshooting

### "PAYSTACK_SECRET_KEY is not configured"
- Check `.env.local` file exists
- Verify `PAYSTACK_SECRET_KEY` is set
- Restart dev server: `npm run dev`

### Payment fails with "Invalid amount"
- Ensure price is a valid number > 0
- Check currency is GHc (not USD)
- Amount is automatically converted to pesewas

### Bank account validation fails
- Account number must be exactly 10 digits
- Account name must match bank records
- Selected bank must be in the list

### Webhook not confirming payment
- Verify webhook URL is correct
- Check Paystack webhook logs in dashboard
- Ensure HTTPS in production

## 💡 Key Functions

```javascript
// Initialize payment
import { initializePaystackPayment } from '@/lib/paystack'
const session = await initializePaystackPayment({
  email: 'adopter@example.com',
  amount: ghcToPesewas(100), // 10000 pesewas
  reference: 'adoption_123_456',
  metadata: { adoption_id: '123' }
})

// Format display
import { formatGHc } from '@/lib/paystack'
console.log(formatGHc(100)) // "GH₵100.00"

// Currency conversion
import { ghcToPesewas, pesewasToGhc } from '@/lib/paystack'
const pesewas = ghcToPesewas(100)     // 10000
const ghc = pesewasToGhc(10000)       // 100
```

## 📞 Support

For issues:
1. Check Paystack dashboard status
2. Review error logs in browser console
3. Check Supabase RLS policies
4. Verify all environment variables are set
5. Contact Paystack support: https://support.paystack.com

## 🎉 What's Next

You can now:
- ✅ Accept GHc payments for project adoptions
- ✅ Set custom prices for resurrection rights
- ✅ Automatically payout creators (90%)
- ✅ Track all transactions in Supabase
- ✅ Provide a seamless adoption experience

Happy resurrecting! 🏛️
