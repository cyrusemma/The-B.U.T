-- ============================================================
-- Payment Settings for Paystack Integration
-- Adds payment account details for creators
-- ============================================================

-- Payment Settings Table
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_provider TEXT NOT NULL DEFAULT 'paystack',
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  bank_code TEXT,
  paystack_recipient_code TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Payments Table (for tracking Paystack transactions)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adoption_id UUID NOT NULL REFERENCES public.adoptions(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL,
  currency TEXT DEFAULT 'GHS',
  creator_receives_cents BIGINT,
  bureau_receives_cents BIGINT,
  status TEXT DEFAULT 'pending',
  paystack_reference TEXT,
  payment_method TEXT DEFAULT 'paystack',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Add missing columns if they don't exist (for existing payments table)
DO $$
BEGIN
  -- Add paystack_reference column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'paystack_reference') THEN
    ALTER TABLE public.payments ADD COLUMN paystack_reference TEXT;
  END IF;
  
  -- Add currency column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'currency') THEN
    ALTER TABLE public.payments ADD COLUMN currency TEXT DEFAULT 'GHS';
  END IF;
  
  -- Add creator_receives_cents column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'creator_receives_cents') THEN
    ALTER TABLE public.payments ADD COLUMN creator_receives_cents BIGINT;
  END IF;
  
  -- Add bureau_receives_cents column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'bureau_receives_cents') THEN
    ALTER TABLE public.payments ADD COLUMN bureau_receives_cents BIGINT;
  END IF;
  
  -- Add payment_method column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_method') THEN
    ALTER TABLE public.payments ADD COLUMN payment_method TEXT DEFAULT 'paystack';
  END IF;
END $$;

-- Add RLS Policies
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Users can insert their own payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Users can update their own payment settings" ON public.payment_settings;

CREATE POLICY "Users can view their own payment settings"
  ON public.payment_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment settings"
  ON public.payment_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment settings"
  ON public.payment_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes (CREATE INDEX IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_payment_settings_user_id ON public.payment_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_adoption_id ON public.payments(adoption_id);
CREATE INDEX IF NOT EXISTS idx_payments_paystack_reference ON public.payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
