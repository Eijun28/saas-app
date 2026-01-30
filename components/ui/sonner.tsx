"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'white',
          color: '#1f2937',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        classNames: {
          toast: 'bg-white text-gray-800 border border-gray-200 shadow-lg',
          title: 'text-gray-900 font-medium',
          description: 'text-gray-600',
          success: 'bg-white border-green-200',
          error: 'bg-white border-red-200',
          info: 'bg-white border-blue-200',
          warning: 'bg-white border-yellow-200',
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#1f2937",
          "--normal-border": "#e5e7eb",
          "--success-bg": "#ffffff",
          "--success-text": "#1f2937",
          "--success-border": "#86efac",
          "--error-bg": "#ffffff",
          "--error-text": "#1f2937",
          "--error-border": "#fca5a5",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
