'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Check, ExternalLink, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRelative } from '@/lib/utils/format'
import type { AdoptionChat, Profile } from '@/lib/types/database'
import PageWrapper from '@/components/bureau/PageWrapper'

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
  projects: { id: string; title: string; description: string | null }
  adopter: Profile
  creator: Profile
}

interface ChatMessage extends AdoptionChat {
  profiles: Profile
}

export default function AdoptionChatPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const adoptionId   = params.adoptionId as string
  const paymentSuccess = searchParams.get('payment') === 'success'

  const supabase = createClient()
  const [adoption, setAdoption]       = useState<AdoptionDetail | null>(null)
  const [messages, setMessages]       = useState<ChatMessage[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending]         = useState(false)
  const [resurrectionUrl, setResurrectionUrl] = useState('')
  const [agreementSigned, setAgreementSigned] = useState(false)
  const [resurrectionError, setResurrectionError] = useState<string | null>(null)
  const [markingResurrected, setMarkingResurrected] = useState(false)
  const [loading, setLoading]         = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profile }, { data: adoptionData }, { data: msgs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('adoptions')
        .select('*, projects!project_id(id, title, description), adopter:profiles!adopter_id(*), creator:profiles!creator_id(*)')
        .eq('id', adoptionId)
        .single(),
      supabase
        .from('adoption_chats')
        .select('*, profiles(*)')
        .eq('adoption_id', adoptionId)
        .order('created_at', { ascending: true }),
    ])

    setCurrentUser(profile)
    setAdoption(adoptionData as unknown as AdoptionDetail)
    setMessages((msgs ?? []) as unknown as ChatMessage[])
    setLoading(false)
  }, [supabase, adoptionId])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Real-time subscription — fires for BOTH adopter and creator
  useEffect(() => {
    const channel = supabase
      .channel(`adoption-chat-${adoptionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'adoption_chats',
        filter: `adoption_id=eq.${adoptionId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('adoption_chats')
          .select('*, profiles(*)')
          .eq('id', (payload.new as { id: string }).id)
          .single() as unknown as { data: ChatMessage | null }
        if (data) {
          setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data])
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
    if (adoption?.adoption_type === 'resurrection_rights' && !agreementSigned && !adoption.ip_transfer_agreement_signed) {
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
      setAdoption(prev => prev ? {
        ...prev,
        resurrected_at: now,
        resurrection_url: resurrectionUrl,
        status: 'resurrected',
        ip_transfer_agreement_signed: prev.ip_transfer_agreement_signed || prev.adoption_type === 'resurrection_rights',
        ip_transfer_signed_at: prev.ip_transfer_signed_at ?? now,
      } : prev)
    } else {
      const data = await res.json().catch(() => null)
      setResurrectionError(data?.error ?? 'Could not mark this project as resurrected.')
    }
    setMarkingResurrected(false)
  }

  if (loading) {
    return (
      <PageWrapper user={currentUser}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-bureau-gold/30 border-t-bureau-gold rounded-full animate-spin" />
            <p className="text-sm text-bureau-dim font-serif">Retrieving artifact…</p>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (!adoption) {
    return (
      <PageWrapper user={currentUser}>
        <div className="min-h-[60vh] flex items-center justify-center text-center">
          <div>
            <p className="font-serif text-bureau-dim text-lg mb-4">Adoption record not found.</p>
            <Link href="/dashboard" className="btn-bureau-ghost text-xs px-4 py-2">
              ← Return to Dashboard
            </Link>
          </div>
        </div>
      </PageWrapper>
    )
  }

  const isAdopter    = currentUser?.id === adoption.adopter_id
  const isCreator    = currentUser?.id === adoption.creator_id
  const isParticipant = isAdopter || isCreator
  const isResurrected = !!adoption.resurrected_at
  const requiresIpAgreement = adoption.adoption_type === 'resurrection_rights' && !adoption.ip_transfer_agreement_signed

  // The "other person" in the conversation
  const counterpart = isAdopter ? adoption.creator : adoption.adopter
  const counterpartInitial = (counterpart?.display_name ?? counterpart?.username ?? '?').charAt(0).toUpperCase()

  return (
    <PageWrapper user={currentUser}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-6">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-bureau-dim hover:text-bureau-gold transition-colors"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>

          <div className="flex items-center gap-3">
            {isResurrected && adoption.resurrection_url && (
              <a
                href={adoption.resurrection_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bureau-green/10
                           border border-bureau-green/30 text-bureau-green text-xs font-sans uppercase tracking-wide
                           hover:bg-bureau-green/20 transition-colors"
              >
                <Check size={12} />
                View Resurrection
              </a>
            )}
            <Link
              href={`/morgue/${adoption.projects.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5
                         border border-white/10 text-bureau-dim text-xs font-sans uppercase tracking-wide
                         hover:text-bureau-text hover:border-white/20 transition-colors"
            >
              <ExternalLink size={12} />
              View Project
            </Link>
          </div>
        </div>

        {/* Payment success banner */}
        {paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-5 py-3.5 rounded-lg bg-bureau-green/10 border border-bureau-green/30 text-center"
          >
            <p className="font-sans text-sm text-bureau-green font-medium">
              Payment confirmed — the project awaits resurrection.
            </p>
          </motion.div>
        )}

        {/* Non-participant warning */}
        {!isParticipant && (
          <div className="mb-6 px-5 py-3.5 rounded-lg bg-amber-600/10 border border-amber-600/30 text-center">
            <p className="font-sans text-sm text-bureau-gold">
              You are viewing this adoption as an observer.
            </p>
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 h-[calc(100vh-14rem)] min-h-[580px]">

          {/* ── Left: Project + role info ────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">

            {/* Project card */}
            <div className="glass grain rounded-xl border border-white/10 p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className={`inline-flex px-2.5 py-1 rounded text-[0.62rem] font-bold uppercase tracking-widest
                  ${isResurrected
                    ? 'bg-bureau-green/10 border border-bureau-green/30 text-bureau-green'
                    : 'bg-white/5 border border-white/10 text-bureau-dim'
                  }`}>
                  {isResurrected ? 'Resurrected' : adoption.adoption_type.replace(/_/g, ' ')}
                </span>
              </div>

              <h1 className="font-serif text-2xl text-bureau-text mb-3 leading-tight">
                {adoption.projects.title}
              </h1>

              {adoption.projects.description && (
                <p className="font-sans text-sm text-bureau-muted leading-relaxed mb-5">
                  {adoption.projects.description}
                </p>
              )}

              <div className="space-y-3 pt-4 border-t border-white/5">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-1">Status</p>
                  <p className="font-sans text-sm text-bureau-text">
                    {isResurrected ? 'Resurrected' : adoption.status === 'active' ? 'Active Adoption' : adoption.status}
                  </p>
                </div>

                <div>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-1">
                    {isAdopter ? 'Creator' : 'Adopter'}
                  </p>
                  <p className="font-sans text-sm text-bureau-text">
                    {counterpart?.display_name ?? counterpart?.username ?? 'Unknown'}
                  </p>
                </div>

                {isResurrected && adoption.resurrection_url && (
                  <div>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-1">Resurrection URL</p>
                    <a
                      href={adoption.resurrection_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-bureau-gold hover:text-amber-400 break-all transition-colors"
                    >
                      {adoption.resurrection_url}
                    </a>
                  </div>
                )}
              </div>

              {!isResurrected && isAdopter && (
                <div className="mt-5 p-3.5 rounded-lg bg-white/3 border border-white/8">
                  <p className="font-sans text-xs text-bureau-muted leading-relaxed">
                    <span className="text-bureau-gold font-semibold">Next step:</span>{' '}
                    Chat with the creator. When ready, submit your resurrection URL below.
                  </p>
                </div>
              )}

              {!isResurrected && isCreator && (
                <div className="mt-5 p-3.5 rounded-lg bg-white/3 border border-white/8">
                  <p className="font-sans text-xs text-bureau-muted leading-relaxed">
                    <span className="text-bureau-gold font-semibold">Someone wants to resurrect your project.</span>{' '}
                    Chat with them and guide them to bring it back to life.
                  </p>
                </div>
              )}
            </div>

            {/* IP agreement (resurrection rights adoptions) */}
            {adoption.adoption_type === 'resurrection_rights' && !isResurrected && isAdopter && (
              <div className="glass grain rounded-xl border border-bureau-gold/20 p-6">
                <h3 className="font-serif text-lg text-bureau-gold italic mb-3">
                  Ritual of Continuation
                </h3>
                <div className="bg-white/3 border border-white/8 p-4 rounded-lg space-y-3">
                  <p className="font-sans text-xs leading-relaxed text-bureau-muted">
                    I, the undersigned Adopter, do hereby swear to take up the mantle of this unfinished work. I acknowledge the dust gathered, the intent unfulfilled, and the ghosts of original ambition.
                  </p>
                  <p className="font-sans text-xs leading-relaxed text-bureau-muted">
                    By engaging this protocol, I assume all intellectual and ethereal burdens associated with this artifact.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Chat ──────────────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col glass grain rounded-xl border border-white/10 overflow-hidden">

            {/* Chat header */}
            <div className="px-6 py-4 border-b border-white/5 bg-white/2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-bureau-gold/15 border border-bureau-gold/30
                                flex items-center justify-center overflow-hidden shrink-0">
                  {counterpart?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={counterpart.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif text-sm text-bureau-gold">{counterpartInitial}</span>
                  )}
                </div>
                <div>
                  <p className="font-sans text-sm font-medium text-bureau-text">
                    {counterpart?.display_name ?? counterpart?.username ?? 'Unknown'}
                  </p>
                  <p className="font-sans text-[0.65rem] text-bureau-dim">
                    {isAdopter ? 'Project Creator' : 'Adopter'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <p className="font-serif text-xl text-bureau-dim mb-2">Connection established</p>
                    <p className="font-sans text-sm text-bureau-dim/60">The conversation begins here.</p>
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUser?.id
                  const senderInitial = (msg.profiles?.display_name ?? msg.profiles?.username ?? '?').charAt(0).toUpperCase()

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                        {msg.profiles?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-serif text-[10px] text-bureau-dim">{senderInitial}</span>
                        )}
                      </div>

                      <div className={`flex flex-col gap-1 max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl font-sans text-sm leading-relaxed
                          ${isOwn
                            ? 'bg-bureau-gold text-black rounded-tr-none'
                            : 'bg-white/8 border border-white/10 text-bureau-text rounded-tl-none'
                          }`}>
                          {msg.message_text}
                        </div>
                        <span className="font-sans text-[0.6rem] text-bureau-dim px-1">
                          {formatRelative(msg.created_at)}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Resurrection URL input — adopter only */}
            {isAdopter && !isResurrected && (
              <div className="border-t border-white/5 bg-white/2 px-6 py-4 space-y-3">
                {requiresIpAgreement && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreementSigned}
                      onChange={(e) => {
                        setAgreementSigned(e.target.checked)
                        setResurrectionError(null)
                      }}
                      className="mt-1 w-4 h-4 rounded accent-bureau-gold shrink-0"
                    />
                    <span className="font-sans text-xs leading-relaxed text-bureau-muted">
                      I acknowledge the IP transfer agreement and confirm this resurrection URL represents my completed work.
                    </span>
                  </label>
                )}

                <div className="flex gap-2">
                  <input
                    value={resurrectionUrl}
                    onChange={(e) => setResurrectionUrl(e.target.value)}
                    placeholder="https://your-resurrection-url.com"
                    className="input-bureau flex-1 text-xs py-2.5"
                  />
                  <button
                    type="button"
                    onClick={markResurrected}
                    disabled={!resurrectionUrl.trim() || markingResurrected || (requiresIpAgreement && !agreementSigned)}
                    className="px-4 py-2.5 rounded-lg bg-bureau-green hover:bg-emerald-400 text-black
                               font-sans text-xs font-bold uppercase tracking-wide transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {markingResurrected ? 'Marking…' : 'Mark Resurrected'}
                  </button>
                </div>

                {resurrectionError && (
                  <p className="font-sans text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded">
                    {resurrectionError}
                  </p>
                )}
              </div>
            )}

            {/* Message input — both parties */}
            {isParticipant && (
              <div className="border-t border-white/5 bg-white/2 px-6 py-4 shrink-0">
                <form onSubmit={sendMessage} className="flex items-end gap-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage(e)
                      }
                    }}
                    placeholder={isCreator ? 'Reply to the adopter…' : 'Message the creator…'}
                    rows={1}
                    className="input-bureau flex-1 resize-none text-sm py-2.5"
                  />
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={!messageText.trim() || sending}
                    className="p-2.5 rounded-lg bg-white/8 border border-white/10 hover:bg-white/15
                               hover:border-bureau-gold/40 text-bureau-muted hover:text-bureau-gold
                               transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
