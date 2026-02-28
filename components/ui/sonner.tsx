"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const isMobile = useIsMobile()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={isMobile ? "top-center" : "bottom-right"}
      offset={isMobile ? 12 : 24}
      gap={6}
      toastOptions={{
        style: {
          background: 'white',
          color: '#1f2937',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          fontSize: isMobile ? '13px' : '14px',
          padding: isMobile ? '10px 14px' : '12px 16px',
          borderRadius: '12px',
        },
        classNames: {
          toast: 'bg-white text-gray-800 border border-gray-200 shadow-lg !rounded-xl',
          title: 'text-gray-900 font-semibold !text-[13px] leading-tight',
          description: 'text-gray-500 !text-[12px] leading-snug',
          success: 'border-l-4 border-l-green-500',
          error: 'border-l-4 border-l-red-500',
          info: 'border-l-4 border-l-blue-500',
          warning: 'border-l-4 border-l-yellow-500',
          icon: 'mt-0.5',
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
          "--width": isMobile ? "calc(100vw - 32px)" : "356px",
          "--mobile-offset": "12px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
