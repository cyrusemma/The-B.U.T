'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url ?? null)

  const [form, setForm] = useState({
    display_name: profile.display_name ?? '',
    username:     profile.username ?? '',
    bio:          profile.bio ?? '',
    avatar_url:   profile.avatar_url ?? '',
  })

  const initials = (form.display_name || form.username || '?').slice(0, 2).toUpperCase()

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setError(null)
    setUploading(true)

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const ext      = file.name.split('.').pop()
      const filePath = `avatars/${user.id}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('Avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('Avatars').getPublicUrl(filePath)
      setForm((f) => ({ ...f, avatar_url: data.publicUrl }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreviewUrl(profile.avatar_url ?? null)
    } finally {
      setUploading(false)
    }
  }

  function removeAvatar() {
    setPreviewUrl(null)
    setForm((f) => ({ ...f, avatar_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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

  function close() {
    setOpen(false)
    setError(null)
    setPreviewUrl(profile.avatar_url ?? null)
    setForm({
      display_name: profile.display_name ?? '',
      username:     profile.username ?? '',
      bio:          profile.bio ?? '',
      avatar_url:   profile.avatar_url ?? '',
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-bureau-outline text-xs px-4 py-2"
      >
        Edit Profile
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="glass grain border border-white/10 rounded-xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 glass border-b border-white/5 px-6 py-5 flex items-center justify-between">
          <h2 className="font-serif text-xl text-bureau-text">Edit Profile</h2>
          <button
            type="button"
            onClick={close}
            className="p-1.5 text-bureau-dim hover:text-bureau-muted transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* ── Avatar ──────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-bureau-dim mb-4">
              Profile Photo
            </label>

            <div className="flex items-start gap-5">
              {/* Clickable avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="relative w-20 h-20 rounded-full flex-shrink-0 overflow-hidden
                           bg-bureau-gold/15 border border-bureau-gold/30
                           group hover:border-bureau-gold/60 transition-colors cursor-pointer
                           disabled:cursor-wait"
                aria-label="Change profile photo"
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Avatar preview" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <span className="font-serif text-2xl text-bureau-gold">{initials}</span>
                )}

                {/* Upload overlay */}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center
                                opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera size={18} className="text-white" />
                  )}
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                aria-label="Upload profile photo"
                className="hidden"
              />

              <div className="flex-1 space-y-2 pt-1">
                <p className="font-sans text-xs text-bureau-muted">
                  Click the photo to upload a new one. PNG, JPG or WebP, max 5MB.
                </p>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X size={12} />
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Display Name / Nickname ──────────────────────────────────────── */}
          <div>
            <label htmlFor="display-name" className="block text-[10px] font-bold uppercase tracking-widest text-bureau-dim mb-1">
              Display Name / Nickname
            </label>
            <p className="text-[0.68rem] text-bureau-dim mb-2">
              This is what others see. Use a pen name to stay anonymous.
            </p>
            <input
              id="display-name"
              value={form.display_name}
              onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
              placeholder="Your name or a pen name…"
              className="input-bureau"
            />
          </div>

          {/* ── Username ────────────────────────────────────────────────────── */}
          <div>
            <label htmlFor="username" className="block text-[10px] font-bold uppercase tracking-widest text-bureau-dim mb-1">
              Username
            </label>
            <p className="text-[0.68rem] text-bureau-dim mb-2">
              Your unique handle. Used in your public profile URL.
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bureau-dim text-sm">@</span>
              <input
                id="username"
                value={form.username}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                }))}
                placeholder="username"
                className="input-bureau pl-8"
              />
            </div>
          </div>

          {/* ── Bio ─────────────────────────────────────────────────────────── */}
          <div>
            <label htmlFor="bio" className="block text-[10px] font-bold uppercase tracking-widest text-bureau-dim mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="A few words about you and your graveyard of projects…"
              rows={3}
              className="input-bureau resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-900/40">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 glass border-t border-white/5 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={close}
            className="btn-bureau-ghost text-xs px-5 py-2.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading || !form.username}
            className="btn-bureau text-xs px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}
