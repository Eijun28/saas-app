'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, Loader2 } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useIsMobile } from '@/hooks/use-mobile'
import { useChat } from '@ai-sdk/react'

export function ChatbotAdvisor() {
  const { user } = useUser()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const hasGreeted = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, input, setInput, handleSubmit, isLoading, append, status } = useChat({
    api: '/api/chatbot-advisor',
    body: { user_id: user?.id },
  })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Send greeting when chatbot opens for the first time
  useEffect(() => {
    if (isOpen && !hasGreeted.current && user?.id) {
      hasGreeted.current = true
      append({ role: 'user', content: 'Bonjour' })
    }
  }, [isOpen, user?.id, append])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Filter out the initial greeting from display
  const displayMessages = messages.filter((msg, i) => {
    if (i === 0 && msg.role === 'user' && msg.content === 'Bonjour') return false
    return true
  })

  const isStreaming = status === 'streaming'

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
              bottom: 'calc(64px + env(safe-area-inset-bottom))',
              left: '12px',
              right: '12px',
              height: 'min(520px, calc(100dvh - 100px))',
              borderRadius: '1rem',
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
                  <p className="text-white/70 text-xs">
                    {isStreaming ? 'En train de répondre...' : 'Optimise ton profil'}
                  </p>
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
              {displayMessages.map((msg) => (
                <div
                  key={msg.id}
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

              {isLoading && displayMessages.length === 0 && (
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
