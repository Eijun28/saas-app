'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface InlineEditableCellProps {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  type?: 'text' | 'date' | 'number' | 'email'
  className?: string
}

export function InlineEditableCell({ value, onSave, placeholder = '-', type = 'text', className }: InlineEditableCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    setDraft(value)
  }, [value])

  const handleBlur = () => {
    setEditing(false)
    if (draft !== value) {
      onSave(draft)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
    if (e.key === 'Escape') {
      setDraft(value)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full bg-transparent border-b border-[#823F91]/30 text-sm py-0.5 px-0 outline-none focus:border-[#823F91]',
          className
        )}
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        'cursor-text text-sm hover:bg-gray-50 rounded px-1 -mx-1 py-0.5 transition-colors inline-block min-w-[20px]',
        !value && 'text-gray-300 italic',
        className
      )}
      title="Cliquez pour modifier"
    >
      {value || placeholder}
    </span>
  )
}
