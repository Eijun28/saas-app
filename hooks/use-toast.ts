"use client"

import * as React from "react"

export type ToastActionElement = React.ReactElement

export type ToastVariant = "default" | "destructive" | "success"

export interface ToastProps {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: ToastVariant
  duration?: number
}

// Simple toast implementation compatible with shadcn/ui API
const toastQueue: Array<ToastProps & { id: string }> = []
const listeners: Array<(toasts: Array<ToastProps & { id: string }>) => void> = []

function genId() {
  return Math.random().toString(36).substring(7)
}

function addToast(props: ToastProps) {
  const id = props.id || genId()
  const toast = { ...props, id }
  toastQueue.push(toast)
  
  // Notify listeners
  listeners.forEach((listener) => listener([...toastQueue]))
  
  // Auto remove after duration (default 5 seconds)
  const duration = props.duration || 5000
  setTimeout(() => {
    const index = toastQueue.findIndex((t) => t.id === id)
    if (index > -1) {
      toastQueue.splice(index, 1)
      listeners.forEach((listener) => listener([...toastQueue]))
    }
  }, duration)
  
  return {
    id,
    dismiss: () => {
      const index = toastQueue.findIndex((t) => t.id === id)
      if (index > -1) {
        toastQueue.splice(index, 1)
        listeners.forEach((listener) => listener([...toastQueue]))
      }
    },
    update: (newProps: Partial<ToastProps>) => {
      const index = toastQueue.findIndex((t) => t.id === id)
      if (index > -1) {
        toastQueue[index] = { ...toastQueue[index], ...newProps }
        listeners.forEach((listener) => listener([...toastQueue]))
      }
    },
  }
}

export function useToast() {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([])

  React.useEffect(() => {
    // Initialize with current queue
    setToasts([...toastQueue])
    
    // Add listener
    const listener = (newToasts: Array<ToastProps & { id: string }>) => {
      setToasts(newToasts)
    }
    listeners.push(listener)
    
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    toast: addToast,
    toasts,
    dismiss: (toastId?: string) => {
      if (toastId) {
        const index = toastQueue.findIndex((t) => t.id === toastId)
        if (index > -1) {
          toastQueue.splice(index, 1)
          listeners.forEach((listener) => listener([...toastQueue]))
        }
      } else {
        toastQueue.length = 0
        listeners.forEach((listener) => listener([]))
      }
    },
  }
}

export { toast }
