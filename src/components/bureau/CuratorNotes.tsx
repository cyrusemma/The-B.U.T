'use client'

import { useState } from 'react'
import { MessageSquare, Lock, Unlock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CuratorNote {
  id: string
  project_id: string
  curator_id: string
  content: string
  is_public: boolean
  created_at: string
  curator: {
    username: string
    display_name: string | null
  }
}

interface CuratorNotesProps {
  projectId: string
  notes: CuratorNote[]
  isOwner: boolean
  currentUserId: string | null
}

export default function CuratorNotes({ projectId, notes, isOwner, currentUserId }: CuratorNotesProps) {
  const [newNote, setNewNote] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [displayNotes, setDisplayNotes] = useState(notes)

  async function addNote() {
    if (!newNote.trim() || !currentUserId) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('curator_notes')
        .insert({
          project_id: projectId,
          curator_id: currentUserId,
          content: newNote,
          is_public: isPublic,
        })
        .select('*, curator:curator_id(username, display_name)')
        .single()

      if (data) {
        setDisplayNotes([...displayNotes, data as unknown as CuratorNote])
        setNewNote('')
      }
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setLoading(false)
    }
  }

  const publicNotes = displayNotes.filter((n) => n.is_public)
  const hasPrivateNotes = displayNotes.some((n) => !n.is_public && n.curator_id === currentUserId)

  return (
    <section className="glass grain rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-bureau-gold" />
        <h3 className="font-serif text-lg text-bureau-text">Curator Notes</h3>
        {hasPrivateNotes && (
          <span className="ml-auto text-xs px-2 py-1 rounded bg-bureau-gold/20 border border-bureau-gold/30 text-bureau-gold font-sans">
            You have private notes
          </span>
        )}
      </div>

      {/* Add Note Form */}
      {isOwner && currentUserId && (
        <div className="mb-6 pb-6 border-b border-white/10">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a curator's note... (e.g., diagnosis, resurrection ideas, historical context)"
            className="input-bureau w-full resize-none px-4 py-3 text-sm"
            rows={3}
          />

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-sans transition-all ${
                isPublic
                  ? 'bg-green-600/20 border border-green-600/30 text-green-400'
                  : 'bg-amber-600/20 border border-amber-600/30 text-amber-400'
              }`}
            >
              {isPublic ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isPublic ? 'Public' : 'Private'}
            </button>

            <button
              onClick={addNote}
              disabled={!newNote.trim() || loading}
              className="btn-bureau px-4 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </div>
      )}

      {/* Notes Display */}
      <div className="space-y-4">
        {publicNotes.length === 0 && !isOwner ? (
          <p className="text-bureau-dim text-sm text-center py-6">No curator notes yet.</p>
        ) : publicNotes.length === 0 ? (
          <p className="text-bureau-dim text-sm text-center py-6">
            Share your insights when you add a public note.
          </p>
        ) : (
          publicNotes.map((note) => (
            <div key={note.id} className="bg-bureau-card/70 border border-white/10 rounded p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-semibold text-sm text-bureau-text">
                    {note.curator.display_name || note.curator.username}
                  </span>
                  {!note.is_public && (
                    <Lock className="w-3 h-3 text-bureau-gold" aria-label="Private note" />
                  )}
                </div>
                <span className="text-xs text-bureau-dim font-sans">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="font-sans text-sm text-bureau-muted leading-relaxed">{note.content}</p>
            </div>
          ))
        )}

        {/* Private notes section for owner */}
        {isOwner && displayNotes.some((n) => !n.is_public) && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="font-sans text-xs uppercase tracking-widest text-bureau-dim mb-3 flex items-center gap-2">
              <Lock className="w-3 h-3" />
              Your Private Notes
            </h4>
            <div className="space-y-3">
              {displayNotes
                .filter((n) => !n.is_public && n.curator_id === currentUserId)
                .map((note) => (
                  <div key={note.id} className="bg-bureau-card/40 border border-white/10 rounded p-3">
                    <p className="font-sans text-sm text-bureau-muted leading-relaxed">{note.content}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
