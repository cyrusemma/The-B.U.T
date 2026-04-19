'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatRelative } from '@/lib/utils/format'
import type { AdoptionChat, Profile } from '@/lib/types/database'

interface AdoptionDetail {
  id: string
  project_id: string
  adopter_id: string
  creator_id: string
  adoption_type: string
  status: string
  resurrected_at: string | null
  resurrection_url: string | null
  projects: { title: string; description: string | null }
  profiles: Profile  // adopter
}

interface ChatMessage extends AdoptionChat {
  profiles: Profile
}

export default function AdoptionChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const adoptionId = params.adoptionId as string
  const paymentSuccess = searchParams.get('payment') === 'success'

  const supabase = createClient()
  const [adoption, setAdoption] = useState<AdoptionDetail | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [resurrectionUrl, setResurrectionUrl] = useState('')
  const [markingResurrected, setMarkingResurrected] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setCurrentUser(profile)

    // Get adoption
    const { data: adoptionData } = await supabase
      .from('adoptions')
      .select('*, projects(title, description), profiles!adopter_id(*)')
      .eq('id', adoptionId)
      .single()

    setAdoption(adoptionData as unknown as AdoptionDetail)

    // Get messages
    const { data: msgs } = await supabase
      .from('adoption_chats')
      .select('*, profiles(*)')
      .eq('adoption_id', adoptionId)
      .order('created_at', { ascending: true })

    setMessages((msgs ?? []) as ChatMessage[])
    setLoading(false)
  }, [supabase, adoptionId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Subscribe to realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`adoption-chat-${adoptionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'adoption_chats',
          filter: `adoption_id=eq.${adoptionId}`,
        },
        async (payload) => {
          // Fetch the full message with profile
          const { data } = await supabase
            .from('adoption_chats')
            .select('*, profiles(*)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.find((m) => m.id === data.id)) return prev
              return [...prev, data as ChatMessage]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
    setMarkingResurrected(true)

    const res = await fetch(`/api/adoptions/${adoptionId}/resurrect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: resurrectionUrl }),
    })

    if (res.ok) {
      setAdoption((prev) =>
        prev ? { ...prev, resurrected_at: new Date().toISOString(), resurrection_url: resurrectionUrl } : prev
      )
    }
    setMarkingResurrected(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="w-6 h-6 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!adoption) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <p className="font-serif text-slate-400 text-xl">Adoption not found.</p>
          <Link href="/dashboard" className="text-amber-600 text-sm mt-2 block">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const isAdopter = currentUser?.id === adoption.adopter_id
  const isResurrected = !!adoption.resurrected_at

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
          ← Dashboard
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-slate-200 font-serif text-sm truncate">{adoption.projects.title}</p>
          <p className="text-slate-600 text-xs">
            {isResurrected ? '✓ Resurrected' : `${adoption.adoption_type.replace(/_/g, ' ')} · ${adoption.status}`}
          </p>
        </div>
        {isResurrected && adoption.resurrection_url && (
          <a
            href={adoption.resurrection_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-400 border border-green-700/50 rounded px-2 py-1 hover:bg-green-900/20 transition-colors"
          >
            View resurrection →
          </a>
        )}
      </div>

      {/* Payment success banner */}
      {paymentSuccess && (
        <div className="bg-green-900/20 border-b border-green-700/30 px-4 py-3 text-center">
          <p className="text-green-400 text-sm font-medium">
            Payment confirmed. The project is yours to resurrect.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 bureau-scroll max-w-2xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="font-serif text-slate-600 text-lg mb-1">The conversation begins here.</p>
            <p className="text-slate-700 text-sm">
              Introduce yourself, ask questions, coordinate the handover.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUser?.id
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isOwn && (
                  <span className="text-slate-600 text-xs px-1">
                    {msg.profiles?.display_name ?? msg.profiles?.username}
                  </span>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isOwn
                      ? 'bg-amber-600 text-slate-950 rounded-tr-sm'
                      : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                  }`}
                >
                  {msg.message_text}
                </div>
                <span className="text-slate-700 text-xs px-1">{formatRelative(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Resurrection section (adopter only) */}
      {isAdopter && !isResurrected && (
        <div className="border-t border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <input
              value={resurrectionUrl}
              onChange={(e) => setResurrectionUrl(e.target.value)}
              placeholder="https://your-resurrection-url.com"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm
                         text-slate-100 placeholder-slate-600 focus:outline-none focus:border-green-600/60"
            />
            <button
              onClick={markResurrected}
              disabled={!resurrectionUrl.trim() || markingResurrected}
              className="px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-white text-sm
                         font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {markingResurrected ? 'Marking…' : 'Mark as Resurrected'}
            </button>
          </div>
          <p className="text-slate-700 text-xs mt-1 max-w-2xl mx-auto">
            Once resurrected, share the URL here to complete the adoption.
          </p>
        </div>
      )}

      {/* Message input */}
      <div className="border-t border-slate-800 px-4 py-3">
        <form onSubmit={sendMessage} className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(e)
              }
            }}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm
                       text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-600/60
                       resize-none leading-relaxed"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950
                       font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
