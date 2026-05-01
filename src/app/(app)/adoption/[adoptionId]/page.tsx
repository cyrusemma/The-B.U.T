'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { formatRelative } from '@/lib/utils/format'
import type { AdoptionChat, Profile } from '@/lib/types/database'
import BureauNavbar from '@/components/bureau/BureauNavbar'

interface AdoptionDetail {
  id: string
  project_id: string
  adopter_id: string
  creator_id: string
  adoption_type: string
  status: string
  resurrected_at: string | null
  resurrection_url: string | null
  ip_transfer_agreement_signed: boolean
  ip_transfer_signed_at: string | null
  projects: { title: string; description: string | null }
  profiles: Profile
}

interface ChatMessage extends AdoptionChat {
  profiles: Profile
}

export default function AdoptionChatPage() {
  const params        = useParams()
  const searchParams  = useSearchParams()
  const adoptionId    = params.adoptionId as string
  const paymentSuccess = searchParams.get('payment') === 'success'

  const supabase = createClient()
  const [adoption, setAdoption]               = useState<AdoptionDetail | null>(null)
  const [messages, setMessages]               = useState<ChatMessage[]>([])
  const [currentUser, setCurrentUser]         = useState<Profile | null>(null)
  const [messageText, setMessageText]         = useState('')
  const [sending, setSending]                 = useState(false)
  const [resurrectionUrl, setResurrectionUrl] = useState('')
  const [agreementSigned, setAgreementSigned] = useState(false)
  const [resurrectionError, setResurrectionError] = useState<string | null>(null)
  const [markingResurrected, setMarkingResurrected] = useState(false)
  const [loading, setLoading]                 = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    setCurrentUser(profile)

    const { data: adoptionData } = await supabase
      .from('adoptions')
      .select('*, projects(title, description), profiles!adopter_id(*)')
      .eq('id', adoptionId).single()
    setAdoption(adoptionData as unknown as AdoptionDetail)

    const { data: msgs } = await supabase
      .from('adoption_chats')
      .select('*, profiles(*)')
      .eq('adoption_id', adoptionId)
      .order('created_at', { ascending: true })
    setMessages((msgs ?? []) as unknown as ChatMessage[])
    setLoading(false)
  }, [supabase, adoptionId])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { scrollToBottom() }, [messages])

  // Realtime subscription — logic unchanged
  useEffect(() => {
    const channel = supabase
      .channel(`adoption-chat-${adoptionId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'adoption_chats',
        filter: `adoption_id=eq.${adoptionId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('adoption_chats').select('*, profiles(*)')
          .eq('id', (payload.new as { id: string }).id)
          .single() as unknown as { data: ChatMessage | null }
        if (data) {
          setMessages((prev) => prev.find((m) => m.id === data.id) ? prev : [...prev, data])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, adoptionId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim() || !currentUser) return
    setSending(true)
    const res = await fetch(`/api/adoptions/${adoptionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageText: messageText.trim() }),
    })
    if (res.ok) setMessageText('')
    setSending(false)
  }

  async function markResurrected() {
    if (!resurrectionUrl.trim()) return
    if (
      adoption?.adoption_type === 'resurrection_rights' &&
      !agreementSigned &&
      !adoption.ip_transfer_agreement_signed
    ) {
      setResurrectionError('Acknowledge the IP transfer agreement before completing this resurrection.')
      return
    }

    setResurrectionError(null)
    setMarkingResurrected(true)
    const res = await fetch(`/api/adoptions/${adoptionId}/resurrect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: resurrectionUrl, agreementSigned }),
    })
    if (res.ok) {
      const now = new Date().toISOString()
      setAdoption((prev) =>
        prev
          ? {
              ...prev,
              resurrected_at: now,
              resurrection_url: resurrectionUrl,
              status: 'resurrected',
              ip_transfer_agreement_signed:
                prev.ip_transfer_agreement_signed || prev.adoption_type === 'resurrection_rights',
              ip_transfer_signed_at: prev.ip_transfer_signed_at ?? now,
            }
          : prev
      )
    } else {
      const data = await res.json().catch(() => null)
      setResurrectionError(data?.error ?? 'Could not mark this project as resurrected.')
    }
    setMarkingResurrected(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bureau-void">
        <div className="w-6 h-6 border-2 border-bureau-gold/30 border-t-bureau-gold rounded-full animate-spin" />
      </div>
    )
  }

  if (!adoption) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bureau-void">
        <div className="text-center">
          <p className="font-serif text-bureau-muted text-xl mb-3">Adoption not found.</p>
          <Link href="/dashboard" className="btn-bureau text-sm">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const isAdopter    = currentUser?.id === adoption.adopter_id
  const isResurrected = !!adoption.resurrected_at
  const requiresIpAgreement =
    adoption.adoption_type === 'resurrection_rights' && !adoption.ip_transfer_agreement_signed

  return (
    <div className="min-h-screen flex flex-col bg-bureau-void">
      <BureauNavbar user={currentUser} />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-bureau-surface/60 backdrop-blur-md px-6 py-3
                      flex items-center gap-4 mt-[72px]">
        <Link
          href="/dashboard"
          className="font-sans text-xs uppercase tracking-widest text-bureau-dim
                     hover:text-bureau-muted transition-colors flex-shrink-0"
        >
          ← Dashboard
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-sm text-bureau-text truncate">{adoption.projects.title}</p>
          <p className="font-sans text-[10px] uppercase tracking-wide text-bureau-dim">
            {isResurrected ? '✦ Resurrected' : `${adoption.adoption_type.replace(/_/g, ' ')} · ${adoption.status}`}
          </p>
        </div>
        {isResurrected && adoption.resurrection_url && (
          <a
            href={adoption.resurrection_url}
            target="_blank"
            rel="noopener noreferrer"
            className="badge badge-green badge-sm flex-shrink-0"
          >
            View resurrection →
          </a>
        )}
      </div>

      {/* Payment success banner */}
      {paymentSuccess && (
        <div className="border-b border-bureau-green/20 bg-bureau-green/5 px-6 py-3 text-center">
          <p className="font-sans text-sm text-bureau-green">
            Payment confirmed. The project is yours to resurrect.
          </p>
        </div>
      )}

      {/* ── Main: side-by-side on desktop ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Project info panel (desktop) */}
        <aside className="hidden lg:flex w-72 flex-col border-r border-white/10 bg-bureau-surface/30 p-6 gap-5">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
              Project
            </p>
            <h2 className="font-serif text-lg text-bureau-text leading-snug">
              {adoption.projects.title}
            </h2>
            {adoption.projects.description && (
              <p className="font-sans text-xs text-bureau-muted mt-2 leading-relaxed line-clamp-4">
                {adoption.projects.description}
              </p>
            )}
          </div>

          <div className="section-divider" />

          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
              Adoption Type
            </p>
            <span className="badge badge-muted badge-sm">
              {adoption.adoption_type.replace(/_/g, ' ')}
            </span>
          </div>

          {isResurrected ? (
            <div className="card-green rounded p-4">
              <p className="font-sans text-xs text-bureau-green font-semibold mb-1">✦ Resurrected</p>
              {adoption.resurrection_url && (
                <a
                  href={adoption.resurrection_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-xs text-bureau-green/70 hover:text-bureau-green transition-colors break-all"
                >
                  {adoption.resurrection_url}
                </a>
              )}
            </div>
          ) : (
            <div className="glass rounded p-4">
              <p className="font-sans text-xs text-bureau-dim leading-relaxed">
                Use this chat to coordinate the handover. When the project is live,
                mark it as resurrected.
              </p>
              {adoption.adoption_type === 'resurrection_rights' && (
                <p className="mt-3 font-sans text-xs text-bureau-gold/80 leading-relaxed">
                  Resurrection rights require an IP transfer acknowledgement before final archival closure.
                </p>
              )}
            </div>
          )}
        </aside>

        {/* ── Chat column ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-3 bureau-scroll">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <p className="font-serif text-bureau-dim text-lg mb-1">The conversation begins here.</p>
                <p className="font-sans text-xs text-bureau-dim/60">
                  Introduce yourself, ask questions, coordinate the handover.
                </p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isOwn = msg.sender_id === currentUser?.id
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i < 5 ? i * 0.04 : 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[72%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && (
                      <span className="font-sans text-[10px] text-bureau-dim px-1">
                        {msg.profiles?.display_name ?? msg.profiles?.username}
                      </span>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl font-sans text-sm leading-relaxed
                      ${isOwn
                        ? 'bg-bureau-gold text-black rounded-tr-sm'
                        : 'glass text-bureau-text rounded-tl-sm border border-white/10'}`}
                    >
                      {msg.message_text}
                    </div>
                    <span className="font-sans text-[10px] text-bureau-dim/50 px-1">
                      {formatRelative(msg.created_at)}
                    </span>
                  </div>
                </motion.div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Resurrection section (adopter only) */}
          {isAdopter && !isResurrected && (
            <div className="border-t border-white/10 bg-bureau-surface/30 px-4 md:px-6 py-3">
              {requiresIpAgreement && (
                <label className="mx-auto mb-3 flex max-w-2xl cursor-pointer items-start gap-3 rounded border border-bureau-gold/20 bg-bureau-gold/5 p-3">
                  <input
                    type="checkbox"
                    checked={agreementSigned}
                    onChange={(e) => {
                      setAgreementSigned(e.target.checked)
                      setResurrectionError(null)
                    }}
                    className="mt-1 h-4 w-4 rounded border-bureau-gold/40 bg-bureau-void text-bureau-gold focus:ring-bureau-gold"
                  />
                  <span className="font-sans text-xs leading-relaxed text-bureau-muted">
                    I acknowledge the Resurrection Rights transfer for this artifact and confirm that
                    the resurrection URL represents my completed revival work.
                  </span>
                </label>
              )}

              <div className="max-w-2xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={resurrectionUrl}
                  onChange={(e) => setResurrectionUrl(e.target.value)}
                  placeholder="https://your-resurrection-url.com"
                  className="input-bureau flex-1 text-xs py-2"
                />
                <button
                  type="button"
                  onClick={markResurrected}
                  disabled={!resurrectionUrl.trim() || markingResurrected || (requiresIpAgreement && !agreementSigned)}
                  className="px-4 py-2 rounded bg-bureau-green hover:bg-emerald-400
                             text-black font-sans text-xs font-bold uppercase tracking-wide
                             transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {markingResurrected ? 'Marking…' : 'Mark Resurrected'}
                </button>
              </div>
              {resurrectionError && (
                <p className="mx-auto mt-2 max-w-2xl font-sans text-xs text-red-400">
                  {resurrectionError}
                </p>
              )}
              <p className="font-sans text-[10px] text-bureau-dim/60 mt-1 max-w-2xl mx-auto">
                Share the live URL here to complete the adoption.
              </p>
            </div>
          )}

          {/* Message input */}
          <div className="border-t border-white/10 px-4 md:px-6 py-3">
            <form onSubmit={sendMessage} className="max-w-2xl mx-auto flex items-end gap-3">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) }
                }}
                placeholder="Type a message…"
                rows={1}
                className="input-bureau flex-1 resize-none leading-relaxed py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className="btn-bureau py-2.5 px-4 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
