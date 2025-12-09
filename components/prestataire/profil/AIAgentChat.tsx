'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Send, Sparkles, Loader2, X, 
  CheckCircle2, Copy, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestion?: {
    type: 'description' | 'service' | 'general'
    action: string
    data?: any
  }
}

interface AIAgentChatProps {
  isOpen: boolean
  onClose: () => void
  currentProfile: {
    description: string
    services: any[]
    portfolio: File[]
  }
  onApplySuggestion?: (suggestion: Message['suggestion']) => void
}

const PROMPT_SUGGESTIONS = [
  "Comment améliorer ma description ?",
  "Aide-moi à fixer mes tarifs",
  "Quels services devrais-je proposer ?",
  "Comment me démarquer de la concurrence ?",
]

export function AIAgentChat({ 
  isOpen, 
  onClose, 
  currentProfile,
  onApplySuggestion 
}: AIAgentChatProps) {
  const STORAGE_KEY = 'nuply_agent_chat_messages'
  
  // Message de bienvenue
  const getWelcomeMessage = (): Message[] => [{
    id: '1',
    role: 'assistant',
    content: "Bonjour ! Je suis votre assistant IA. Je peux vous aider à optimiser votre profil pour attirer plus de clients. Comment puis-je vous aider aujourd'hui ?",
    timestamp: new Date(),
  }]

  const [messages, setMessages] = useState<Message[]>(getWelcomeMessage())
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const prevIsOpenRef = useRef<boolean>(false)

  // Réinitialiser la conversation quand on OUVRE le drawer (nouvelle session)
  useEffect(() => {
    // Si on passe de fermé à ouvert, réinitialiser
    if (!prevIsOpenRef.current && isOpen) {
      const welcomeMessage = getWelcomeMessage()
      setMessages(welcomeMessage)
      setInputValue('')
      // Nettoyer localStorage pour être sûr
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    // Mettre à jour la ref
    prevIsOpenRef.current = isOpen
  }, [isOpen])

  // Sauvegarder les messages dans localStorage uniquement pendant la session active
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0 && isOpen) {
      // Ne sauvegarder que si on a plus que le message de bienvenue
      if (messages.length > 1) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      }
    }
  }, [messages, isOpen])

  // Nettoyer localStorage quand on ferme
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [isOpen])

  // Auto-scroll vers le bas quand nouveau message
  useEffect(() => {
    if (scrollAreaRef.current && isOpen) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight
        }, 100)
      }
    }
  }, [messages, isOpen])

  // Fonction pour réinitialiser la conversation manuellement
  const handleClearChat = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer toute la conversation ?')) {
      const welcomeMessage: Message[] = [{
        id: '1',
        role: 'assistant',
        content: "Bonjour ! Je suis votre assistant IA. Je peux vous aider à optimiser votre profil pour attirer plus de clients. Comment puis-je vous aider aujourd'hui ?",
        timestamp: new Date(),
      }]
      setMessages(welcomeMessage)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  // Envoyer un message à n8n
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // TODO: Remplacer par votre webhook n8n
      const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/agent-profil'
      
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          context: {
            description: currentProfile.description,
            services_count: currentProfile.services.length,
            portfolio_count: currentProfile.portfolio.length,
          },
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Erreur réseau')
      }

      const data = await response.json()

      // Ajouter la réponse de l'assistant
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || 'Réponse reçue',
        timestamp: new Date(),
        suggestion: data.suggestion // Si n8n renvoie une suggestion structurée
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      
      // Message d'erreur fallback
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé, je rencontre un problème technique. Veuillez réessayer dans un instant. Assurez-vous que votre webhook n8n est correctement configuré.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt)
  }

  const handleApplySuggestion = (suggestion: Message['suggestion']) => {
    if (suggestion && onApplySuggestion) {
      onApplySuggestion(suggestion)
    }
  }

  // Handler pour la fermeture avec réinitialisation
  const handleClose = (open?: boolean) => {
    // Si on ferme (quand open devient false ou quand on clique sur X)
    // onOpenChange est appelé avec false quand on ferme
    if (open === false) {
      // Réinitialiser les messages immédiatement
      const welcomeMessage = getWelcomeMessage()
      setMessages(welcomeMessage)
      setInputValue('')
      // Nettoyer localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    // Appeler le callback parent pour mettre à jour l'état
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[600px] p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-[#823F91] to-[#9D5FA8]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-white text-lg">
                  Assistant IA
                </SheetTitle>
                <SheetDescription className="text-white/80 text-sm">
                  Optimisez votre profil avec l'IA
                </SheetDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-white hover:bg-white/20"
                title="Effacer la conversation"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClose(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea 
          className="flex-1 px-6 py-4" 
          ref={scrollAreaRef}
        >
          <div className="space-y-6">
            {messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                isLast={index === messages.length - 1}
                onApplySuggestion={handleApplySuggestion}
              />
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <Avatar className="h-8 w-8 border-2 border-[#823F91]">
                  <AvatarFallback className="bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[#823F91]" />
                  <span className="text-sm text-gray-600">En train d'écrire...</span>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-6 py-3 border-t border-b bg-gray-50">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Suggestions rapides:
            </p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="text-xs hover:bg-[#823F91] hover:text-white hover:border-[#823F91] transition-colors"
                  disabled={isLoading}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-6 py-4 border-t bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage(inputValue)
            }}
            className="flex gap-3"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-[#823F91] hover:bg-[#6D3478]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Composant MessageBubble
function MessageBubble({ 
  message, 
  isLast,
  onApplySuggestion 
}: { 
  message: Message
  isLast: boolean
  onApplySuggestion?: (suggestion: Message['suggestion']) => void
}) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 border-2 border-gray-200">
        <AvatarFallback className={cn(
          isUser 
            ? "bg-gray-200 text-gray-700" 
            : "bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white"
        )}>
          {isUser ? "Vous" : "AI"}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div className={cn(
        "flex-1 space-y-2",
        isUser ? "items-end" : "items-start"
      )}>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-3 max-w-[80%]",
            isUser 
              ? "bg-[#823F91] text-white rounded-tr-sm"
              : "bg-gray-100 text-gray-900 rounded-tl-sm"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Suggestion action */}
          {message.suggestion && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <Button
                size="sm"
                variant="outline"
                className="w-full bg-white hover:bg-gray-50"
                onClick={() => onApplySuggestion?.(message.suggestion)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Appliquer cette suggestion
              </Button>
            </div>
          )}
        </div>

        {/* Timestamp & Actions */}
        <div className={cn(
          "flex items-center gap-2 px-2",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span className="text-xs text-gray-500">
            {message.timestamp.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          {!isUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 px-2 text-xs"
            >
              {copied ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

