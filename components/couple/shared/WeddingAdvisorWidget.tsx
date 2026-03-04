'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircleHeart, X, RotateCcw } from 'lucide-react'
import { useWeddingAdvisor } from '@/hooks/useWeddingAdvisor'
import { WeddingAdvisorChat } from '@/components/couple/shared/WeddingAdvisorChat'
import { cn } from '@/lib/utils'

export function WeddingAdvisorWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, isLoading, sendMessage, resetChat } = useWeddingAdvisor()

  const hasNewMessages = messages.length > 1

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Panel de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="advisor-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'bg-white rounded-2xl shadow-2xl border border-gray-200',
              'flex flex-col overflow-hidden',
              // Mobile : quasi plein écran
              'w-[calc(100vw-3rem)] max-w-[420px]',
              'h-[min(70vh,520px)]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#823F91] to-[#9333ea] flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircleHeart className="h-5 w-5 text-white" />
                <div>
                  <p className="text-sm font-semibold text-white leading-none">Conseiller Mariage</p>
                  <p className="text-xs text-white/70 mt-0.5">Nuply Wedding Advisor</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Réinitialiser la conversation"
                  title="Nouvelle conversation"
                >
                  <RotateCcw className="h-4 w-4 text-white/80" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-hidden">
              <WeddingAdvisorChat
                messages={messages}
                isLoading={isLoading}
                onSend={sendMessage}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton flottant */}
      <motion.button
        onClick={() => setIsOpen((prev: boolean) => !prev)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={cn(
          'relative flex items-center justify-center',
          'w-14 h-14 rounded-full shadow-lg',
          'bg-gradient-to-br from-[#823F91] to-[#9333ea]',
          'text-white transition-shadow hover:shadow-xl',
          'focus:outline-none focus:ring-2 focus:ring-[#823F91] focus:ring-offset-2'
        )}
        aria-label="Ouvrir le conseiller mariage"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircleHeart className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge conversation active */}
        {!isOpen && hasNewMessages && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
        )}
      </motion.button>
    </div>
  )
}
