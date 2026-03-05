'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface TypingIndicatorProps {
  typingUsers: { userId: string; userName: string }[]
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0].userName} est en train d'ecrire`
      : `${typingUsers.map(u => u.userName).join(', ')} ecrivent`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-2 px-4 py-1.5"
      >
        <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-2xl rounded-bl-sm">
          <span className="flex gap-0.5">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </span>
        </div>
        <span className="text-[11px] text-gray-400 italic">{label}</span>
      </motion.div>
    </AnimatePresence>
  )
}
