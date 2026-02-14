"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface TypingAnimationProps {
  children?: React.ReactNode
  words?: string[]
  className?: string
  speed?: number
  deleteSpeed?: number
  delay?: number
  loop?: boolean
}

export function TypingAnimation({
  children,
  words = [],
  className,
  speed = 100,
  deleteSpeed = 50,
  delay = 2000,
  loop = true,
}: TypingAnimationProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const hasWords = words.length > 0

  // Initialiser avec le premier caractère du premier mot
  useEffect(() => {
    if (hasWords && currentText === "" && currentWordIndex === 0) {
      setCurrentText(words[0][0] || "")
    }
  }, [hasWords, words, currentText, currentWordIndex])

  // Quand on change de mot, initialiser avec le premier caractère
  useEffect(() => {
    if (hasWords && currentText === "" && currentWordIndex < words.length) {
      const currentWord = words[currentWordIndex]
      if (currentWord && currentWord.length > 0) {
        setCurrentText(currentWord[0])
      }
    }
  }, [currentWordIndex, words, currentText, hasWords])

  useEffect(() => {
    if (!hasWords) return

    const currentWord = words[currentWordIndex]
    if (!currentWord) return

    const timeout = setTimeout(() => {
      // Ajouter caractère par caractère
      if (currentText.length < currentWord.length) {
        setCurrentText(currentWord.slice(0, currentText.length + 1))
      } else {
        // Mot complet, faire une pause puis passer au mot suivant en revenant au début
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current)
        }
        pauseTimeoutRef.current = setTimeout(() => {
          // Revenir au début et passer au mot suivant
          setCurrentText("")
          setCurrentWordIndex((prev) => {
            const nextIndex = prev + 1
            if (nextIndex >= words.length) {
              return loop ? 0 : prev
            }
            return nextIndex
          })
        }, delay)
      }
    }, speed)

    return () => {
      clearTimeout(timeout)
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [currentText, currentWordIndex, words, speed, delay, loop, hasWords])

  // Si children est fourni directement, l'afficher
  if (children && !hasWords) {
    return <span className={cn(className)}>{children}</span>
  }

  return (
    <span className={cn(className)}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}
