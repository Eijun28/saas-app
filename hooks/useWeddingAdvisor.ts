'use client'

import { useState, useRef } from 'react'
import type { ChatMessage } from '@/types/chatbot'

const WELCOME_MESSAGE =
  'Bonjour ! 👋 Je suis votre conseiller mariage Nuply. Je connais déjà votre profil et je suis là pour vous guider tout au long de l\'organisation. Par où voulez-vous commencer ?'

export function useWeddingAdvisor() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: WELCOME_MESSAGE,
      timestamp: new Date().toISOString(),
      suggestions: ['Check-list planning', 'Budget par poste', 'Prestataires manquants', 'Traditions culturelles'],
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const messagesRef = useRef<ChatMessage[]>(messages)
  messagesRef.current = messages

  const sendMessage = async (userMessage: string) => {
    const normalized = userMessage.normalize('NFC').trim()
    if (!normalized) return

    const newUserMsg: ChatMessage = {
      role: 'user',
      content: normalized,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messagesRef.current, newUserMsg]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const response = await fetch('/api/wedding-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      const text = await response.text()
      const data = JSON.parse(text)

      if (!response.ok) {
        throw new Error(data?.message ?? data?.error ?? `Erreur ${response.status}`)
      }

      if (!data?.message || typeof data.message !== 'string') {
        throw new Error('Réponse invalide')
      }

      const botMsg: ChatMessage = {
        role: 'bot',
        content: data.message.normalize('NFC').trim(),
        timestamp: new Date().toISOString(),
        suggestions:
          Array.isArray(data.suggestions) && data.suggestions.length > 0
            ? (data.suggestions as unknown[])
                .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
                .map(s => String(s).normalize('NFC').trim())
            : undefined,
      }

      setMessages((prev: ChatMessage[]) => [...prev, botMsg])
    } catch (error: unknown) {
      const msg =
        error instanceof Error && error.message.length < 120
          ? error.message
          : 'Une erreur est survenue. Pouvez-vous reformuler ?'

      setMessages((prev: ChatMessage[]) => [
        ...prev,
        { role: 'bot', content: msg, timestamp: new Date().toISOString() },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const resetChat = () => {
    const initial: ChatMessage[] = [
      {
        role: 'bot',
        content: WELCOME_MESSAGE,
        timestamp: new Date().toISOString(),
        suggestions: ['Check-list planning', 'Budget par poste', 'Prestataires manquants', 'Traditions culturelles'],
      },
    ]
    setMessages(initial)
    messagesRef.current = initial
    setIsLoading(false)
  }

  return { messages, isLoading, sendMessage, resetChat }
}
