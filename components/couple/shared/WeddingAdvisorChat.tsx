'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/chatbot'

interface WeddingAdvisorChatProps {
  messages: ChatMessage[]
  isLoading: boolean
  onSend: (message: string) => void
}

export function WeddingAdvisorChat({ messages, isLoading, onSend }: WeddingAdvisorChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    setInput('')
    onSend(trimmed)
  }

  const handleKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (suggestion: string) => {
    if (isLoading) return
    onSend(suggestion)
  }

  const lastBotIndex = messages
    .map((m, i) => (m.role === 'bot' ? i : -1))
    .filter(i => i >= 0)
    .pop()

  return (
    <div className="flex flex-col h-full">
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {messages.map((msg, index) => {
          const isLastBot = msg.role === 'bot' && index === lastBotIndex
          const showSuggestions = isLastBot && !isLoading && msg.suggestions && msg.suggestions.length > 0

          return (
            <div key={index}>
              <div
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-[#823F91] text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>

              {showSuggestions && (
                <div className="flex flex-wrap gap-1.5 mt-2 pl-1">
                  {msg.suggestions!.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(s)}
                      disabled={isLoading}
                      className={cn(
                        'px-3 py-1 text-xs rounded-full border font-medium transition-all duration-150',
                        'border-[#823F91] text-[#823F91] bg-white',
                        'hover:bg-[#823F91] hover:text-white',
                        'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="border-t border-gray-200 p-3 flex gap-2 flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e: { target: { value: string } }) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez votre question..."
          disabled={isLoading}
          rows={1}
          className={cn(
            'flex-1 resize-none overflow-hidden text-sm',
            'border border-gray-300 rounded-xl px-3 py-2',
            'focus:outline-none focus:ring-2 focus:ring-[#823F91]/20 focus:border-[#823F91]',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            'min-h-[38px] max-h-[100px]'
          )}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="sm"
          className="self-end flex-shrink-0 bg-[#823F91] hover:bg-[#6D3478] text-white"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
