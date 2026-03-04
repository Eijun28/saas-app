'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Note {
  id: string
  content: string
  author_id: string
  created_at: string
}

interface RequestNotesProps {
  requestId: string
}

export function RequestNotes({ requestId }: RequestNotesProps) {
  const [notes,   setNotes]   = useState<Note[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/prestataire/requests/${requestId}/notes`)
        if (res.ok) {
          const json = await res.json()
          setNotes(json.notes ?? [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [requestId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/prestataire/requests/${requestId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || 'Erreur'); return }
      setNotes((prev: Note[]) => [...prev, json.note as Note])
      setContent('')
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await fetch(`/api/prestataire/requests/${requestId}/notes?noteId=${noteId}`, { method: 'DELETE' })
      setNotes((prev: Note[]) => prev.filter((n: Note) => n.id !== noteId))
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col gap-3">
      {/* Fil de notes */}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-gray-300">
            <StickyNote className="h-8 w-8 mb-2" />
            <p className="text-[12px]">Aucune note — commencez à documenter</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notes.map((note: Note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group relative p-3 bg-amber-50 border border-amber-100 rounded-xl"
              >
                <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap pr-6">
                  {note.content}
                </p>
                <p className="text-[10px] text-amber-400 mt-1.5">{formatTime(note.created_at)}</p>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-amber-300 hover:text-red-400 rounded-md hover:bg-red-50"
                  aria-label="Supprimer la note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <form onSubmit={handleSend} className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          placeholder="Ajouter une note interne…"
          rows={2}
          className="resize-none text-sm rounded-xl flex-1"
          maxLength={2000}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || sending}
          className="self-end bg-[#823F91] hover:bg-[#6D3478] rounded-xl h-9 w-9 flex-shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
      <p className="text-[10px] text-gray-400">Entrée pour envoyer · Shift+Entrée pour saut de ligne</p>
    </div>
  )
}
