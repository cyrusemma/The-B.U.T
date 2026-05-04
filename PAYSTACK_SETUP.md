# Paystack Integration Setup Guide

## Environment Variables

Add these to your `.env.local` file:

```env
# Paystack API Keys
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key_here

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Paystack Keys

1. Go to https://dashboard.paystack.co
2. Sign up or log in to your Paystack account
3. Navigate to Settings → API Keys & Webhooks
4. Copy your Secret Key and Public Key
5. Add them to your `.env.local` file

## Webhook Configuration

Configure Paystack webhooks in your dashboard:

1. Go to Settings → API Keys & Webhooks
2. Add Webhook URL:
   ```
   https://yourdomain.com/api/adoptions/[adoptionId]/paystack-callback
   ```
3. Select events:
   - `charge.success`
   - `charge.failed`

## Database Migration

Run the migration to create payment tables:

```bash
supabase migration up
```

Or apply manually using the SQL in `supabase/migrations/005_payment_settings.sql`

## Payment Flow

1. **Creator Setup**: Creator sets their bank account in Settings → Payment Account Settings
2. **Project Creation**: Creator sets adoption type and price in GHc (Ghana Cedis)
3. **Adoption**: Adopter initiates adoption, which redirects to Paystack checkout
4. **Payment**: Payment is processed via Paystack
5. **Callback**: Paystack confirms payment and updates adoption status
6. **Payout**: Creator receives 90% of the payment, Bureau gets 10%

## GHc Currency Format

- All amounts are stored in the database as whole numbers (GHc)
- Paystack API expects amounts in pesewas (GHc cents)
- Use `ghcToPesewas()` to convert GHc to pesewas
- Use `pesewasToGhc()` to convert pesewas to GHc
- Use `formatGHc()` to display formatted currency strings

Example:
```javascript
import { ghcToPesewas, formatGHc } from '@/lib/paystack'

const ghcAmount = 100 // 100 GHc
const pesewas = ghcToPesewas(ghcAmount) // 10000
const formatted = formatGHc(ghcAmount) // "GH₵100.00"
```

## Testing

Use Paystack's test credentials:

- Test Card: `4084084084084081`
- Expiry: Any future date
- CVV: Any 3-4 digits

## Banks Supported

Currently configured for these Ghanaian banks:
- Zenith Bank
- Barclays Bank
- Bank of Baroda
- Bank of Africa
- Ecobank
- Access Bank
- Standard Chartered Bank
- Fidelity Bank
- GCB Bank
- And more...

Add more banks by updating `GHANA_BANKS` in `src/components/settings/PaymentSettingsForm.tsx`
