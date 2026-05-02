'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Loader2, Save, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'

interface PaymentSetting {
  id: string
  user_id: string
  account_number: string
  account_name: string
  bank_code: string | null
  is_verified: boolean
}

interface PaymentSettingsFormProps {
  profile: Profile
  onSaved?: () => void
}

const GHANA_BANKS = [
  { code: '030', name: 'Zenith Bank' },
  { code: '011', name: 'Barclays Bank' },
  { code: '012', name: 'Bank of Baroda' },
  { code: '013', name: 'Bank of Africa' },
  { code: '015', name: 'Ecobank' },
  { code: '017', name: 'Access Bank' },
  { code: '018', name: 'Standard Chartered Bank' },
  { code: '019', name: 'Fidelity Bank' },
  { code: '020', name: 'GCB Bank' },
  { code: '023', name: 'Guinness Bank' },
  { code: '024', name: 'HFC Bank' },
  { code: '026', name: 'Intercontinental Bank' },
  { code: '027', name: 'Prudential Bank' },
  { code: '028', name: 'SIC Bank' },
  { code: '031', name: 'UTC Bank' },
  { code: '034', name: 'United Bank' },
  { code: '035', name: 'UBA Bank' },
]

export default function PaymentSettingsForm({
  profile,
  onSaved,
}: PaymentSettingsFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<PaymentSetting | null>(null)

  const [formData, setFormData] = useState({
    account_number: '',
    account_name: '',
    bank_code: '',
  })

  // Load existing settings on mount
  useState(() => {
    const loadSettings = async () => {
      try {
        const { data, error: err } = await supabase
          .from('payment_settings')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (err) throw err

        if (data) {
          setSettings(data)
          setFormData({
            account_number: data.account_number || '',
            account_name: data.account_name || '',
            bank_code: data.bank_code || '',
          })
        }
      } catch (err) {
        console.error('Failed to load payment settings:', err)
      } finally {
        setFetchingData(false)
      }
    }

    loadSettings()
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!formData.account_number || !formData.account_name || !formData.bank_code) {
        throw new Error('All fields are required')
      }

      if (formData.account_number.length !== 10) {
        throw new Error('Account number must be 10 digits')
      }

      // 🔒 SECURITY: Validate bank account against Paystack
      const validationRes = await fetch('/api/payment-settings/validate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: formData.account_number,
          bank_code: formData.bank_code,
        }),
      })

      const validationData = await validationRes.json()

      if (!validationRes.ok) {
        throw new Error(validationData.error || 'Bank account validation failed')
      }

      if (settings) {
        // Update existing
        const { error: err } = await supabase
          .from('payment_settings')
          .update({
            account_number: formData.account_number,
            account_name: formData.account_name,
            bank_code: formData.bank_code,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id)

        if (err) throw err
      } else {
        // Create new
        const { error: err } = await supabase
          .from('payment_settings')
          .insert({
            user_id: profile.id,
            account_number: formData.account_number,
            account_name: formData.account_name,
            bank_code: formData.bank_code,
          })

        if (err) throw err
      }

      setSuccess(true)
      onSaved?.()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment settings')
    } finally {
      setLoading(false)
    }
  }

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <section>
      <h3 className="font-serif text-lg text-slate-200 mb-4 flex items-center gap-2">
        <CreditCard size={18} className="text-amber-600" />
        Payment Account Settings
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="glass-morphism rounded-xl border border-white/10 p-6 sm:p-8 space-y-6">
          <p className="text-slate-400 text-sm leading-relaxed">
            Configure your Paystack account to receive payments when your projects are adopted. All
            payments are processed in Ghana Cedis (GHc).
          </p>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Success Alert */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-400">Payment settings saved successfully!</p>
            </motion.div>
          )}

          {/* Bank Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Bank
            </label>
            <select
              value={formData.bank_code}
              onChange={(e) =>
                setFormData({ ...formData, bank_code: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/50 transition-colors"
              required
            >
              <option value="">Select your bank…</option>
              {GHANA_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Only Ghanaian banks are supported
            </p>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Account Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.account_number}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                setFormData({ ...formData, account_number: val })
              }}
              placeholder="0123456789"
              maxLength={10}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/50 transition-colors font-mono"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              10-digit account number
            </p>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Account Name
            </label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) =>
                setFormData({ ...formData, account_name: e.target.value })
              }
              placeholder="Full name on account"
              maxLength={50}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/50 transition-colors"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Must match your bank account holder name
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs text-blue-300 leading-relaxed">
              <span className="font-semibold">💡 Tip:</span> Your payment details are encrypted and
              only used to process adoption payouts. You control when and how much you charge for
              Resurrection Rights.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-sans text-sm font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Payment Settings
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
