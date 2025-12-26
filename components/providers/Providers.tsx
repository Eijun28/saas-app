"use client"

import * as React from "react"
import { X } from "lucide-react"

export interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

const ToastContext = React.createContext<{
  toast: (props: ToastProps) => void
}>({
  toast: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([])

  const toast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(7)
    const newToast = { ...props, id }
    setToasts((prev) => [...prev, newToast])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border p-4 shadow-lg min-w-[300px] max-w-md relative ${
              t.variant === "destructive"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-green-200 bg-green-50 text-green-900"
            }`}
          >
            <button
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            {t.title && <div className="font-semibold pr-6">{t.title}</div>}
            {t.description && <div className="text-sm mt-1">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return React.useContext(ToastContext)
}

export function Toaster() {
  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}