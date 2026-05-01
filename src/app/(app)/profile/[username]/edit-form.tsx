'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types/database'

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    display_name: profile.display_name ?? '',
    username: profile.username ?? '',
    bio: profile.bio ?? '',
  })

  async function handleSave() {
    setSaving(true)
    setError(null)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to save')
      setSaving(false)
      return
    }

    setOpen(false)
    setSaving(false)
    router.push(`/profile/${form.username}`)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded border border-slate-600 text-slate-400
                   hover:border-amber-600/50 hover:text-amber-400 transition-colors"
      >
        Edit Profile
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="font-serif text-xl text-slate-100 mb-5">Edit Profile</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="display-name" className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              id="display-name"
              value={form.display_name}
              onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
              placeholder="Your name"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2.5
                         text-slate-100 placeholder-slate-600 text-sm focus:outline-none
                         focus:border-amber-600/60"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-sm">@</span>
              <input
                id="username"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                placeholder="username"
                className="w-full bg-slate-800 border border-slate-700 rounded-md pl-7 pr-4 py-2.5
                           text-slate-100 placeholder-slate-600 text-sm focus:outline-none
                           focus:border-amber-600/60"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
              Bio
            </label>
            <textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="A few words about you and your graveyard of projects…"
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2.5
                         text-slate-100 placeholder-slate-600 text-sm focus:outline-none
                         focus:border-amber-600/60 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setOpen(false)}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors px-3 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.username}
            className="btn-bureau text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
