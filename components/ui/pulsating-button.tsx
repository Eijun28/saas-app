"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PulsatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  href?: string
}

export function PulsatingButton({
  children,
  className,
  href,
  ...props
}: PulsatingButtonProps) {
  const baseClasses = cn(
    "relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "bg-[#823F91] hover:bg-[#6D3478] text-white",
    "px-8 py-6 text-lg",
    className
  )

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      <span
        className={cn(
          "absolute inset-0 rounded-md",
          "bg-[#823F91]",
          "animate-ping opacity-75"
        )}
        aria-hidden="true"
      />
    </>
  )

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {content}
      </a>
    )
  }
  
  return (
    <button className={baseClasses} {...props}>
      {content}
    </button>
  )
}

