'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, Loader2 } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useIsMobile } from '@/hooks/use-mobile'

interface Message {
  role: 'bot' | 'user'
  content: string
}

export function ChatbotAdvisor() {
  const { user } = useUser()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Send greeting when chatbot opens for the first time
  useEffect(() => {
    if (isOpen && !hasGreeted && user?.id) {
      setHasGreeted(true)
      sendMessage('Bonjour', true)
    }
  }, [isOpen, hasGreeted, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  async function sendMessage(content: string, isGreeting = false) {
    if (!user?.id) return

    const userMessage: Message = { role: 'user', content }

    // For greeting, we send the message but don't show it in the UI
    const newMessages = isGreeting ? [] : [...messages, userMessage]
    if (!isGreeting) {
      setMessages(newMessages)
    }
    setInput('')
    setIsLoading(true)

    try {
      const messagesToSend = isGreeting
        ? [{ role: 'user', content }]
        : [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chatbot-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSend,
          user_id: user.id,
        }),
      })

      const data = await res.json()

      if (res.ok && data.message) {
        const botMessage: Message = { role: 'bot', content: data.message }
        setMessages((prev) => [...prev, ...(isGreeting ? [] : []), botMessage])
        if (isGreeting) {
          setMessages([botMessage])
        }
      } else {
        const errorMsg: Message = {
          role: 'bot',
          content: data.message || 'Désolé, une erreur est survenue. Réessaie dans quelques instants.',
        }
        setMessages((prev) => (isGreeting ? [errorMsg] : [...prev, errorMsg]))
      }
    } catch {
      const errorMsg: Message = {
        role: 'bot',
        content: 'Erreur de connexion. Vérifie ta connexion internet et réessaie.',
      }
      setMessages((prev) => (isGreeting ? [errorMsg] : [...prev, errorMsg]))
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    sendMessage(trimmed)
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed z-[201] w-14 h-14 rounded-full bg-[#823F91] hover:bg-[#6D3478] text-white shadow-lg shadow-[#823F91]/30 flex items-center justify-center transition-colors"
            style={{
              bottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom))' : '24px',
              right: isMobile ? '16px' : '24px',
            }}
            aria-label="Ouvrir le conseiller IA"
          >
            <Bot className="h-7 w-7" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[201] bg-white shadow-2xl shadow-black/15 border border-gray-200 flex flex-col overflow-hidden"
            style={isMobile ? {
              inset: 0,
              borderRadius: 0,
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
            } : {
              bottom: '24px',
              right: '24px',
              width: '360px',
              height: '520px',
              maxWidth: 'calc(100vw - 2rem)',
              maxHeight: 'calc(100vh - 4rem)',
              borderRadius: '1rem',
            }}
          >
            {/* Header */}
            <div className="bg-[#823F91] px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Conseiller IA</h3>
                  <p className="text-white/70 text-xs">Optimise ton profil</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1b3d9 transparent' }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#823F91] text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-[#823F91]/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#823F91]/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#823F91]/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pose ta question..."
                  disabled={isLoading}
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#823F91]/30 focus:border-[#823F91]/50 disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-[#823F91] hover:bg-[#6D3478] text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  aria-label="Envoyer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
