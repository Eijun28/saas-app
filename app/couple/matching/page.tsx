'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Bot } from 'lucide-react'
import { GradientAIChatInput } from '@/components/ui/gradient-ai-chat-input'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export default function MatchingPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll vers le haut au chargement de la page
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    // Message d'accueil au chargement
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          content: 'Bonjour ! Comment puis-je vous aider à trouver les prestataires parfaits pour votre mariage ?',
          role: 'assistant',
          timestamp: new Date(),
        },
      ])
    }
  }, [])

  useEffect(() => {
    // Scroll vers le bas uniquement quand de nouveaux messages sont ajoutés (pas au chargement initial)
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Simuler une réponse de l'IA (à remplacer par un vrai appel API)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Je comprends votre demande. Laissez-moi rechercher les meilleurs prestataires correspondant à vos critères...',
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="w-full -m-8">
      <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)] flex flex-col px-8 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-4xl font-semibold text-[#0D0D0D] mb-2">
            Matching IA
          </h1>
          <p className="text-[#4A4A4A]">
            Discutez avec notre IA pour trouver les prestataires parfaits
          </p>
        </motion.div>

        <Card className="flex-1 flex flex-col border-gray-200 overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Zone de messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-[#823F91] flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-[#823F91] text-white'
                        : 'bg-[#E8D4EF] text-[#0D0D0D]'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === 'user'
                          ? 'text-white/70'
                          : 'text-[#4A4A4A]'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-600">Vous</span>
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="h-8 w-8 rounded-full bg-[#823F91] flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-[#E8D4EF] rounded-lg p-4">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-[#823F91] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 bg-[#823F91] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 bg-[#823F91] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Barre de discussion avec GradientAIChatInput */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <GradientAIChatInput
                placeholder="Tapez votre message..."
                onSend={handleSend}
                disabled={isLoading}
                enableAnimations={true}
                className="w-full"
                dropdownOptions={[
                  { id: "option1", label: "Recherche générale", value: "general" },
                  { id: "option2", label: "Par budget", value: "budget" },
                  { id: "option3", label: "Par localisation", value: "location" },
                ]}
                onOptionSelect={(option) => {
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
