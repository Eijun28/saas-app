"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  // Ne pas utiliser de conteneur spécifique pour éviter les problèmes de z-index
  // Le Portal sera rendu directement dans le body
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 bg-black/50",
        className
      )}
      style={{
        zIndex: 99998,
        ...props.style,
      }}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = "default",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  size?: "sm" | "default" | "lg"
}) {
  const sizeClasses = {
    sm: "sm:max-w-[420px]",
    default: "sm:max-w-[500px]",
    lg: "sm:max-w-[600px]",
  }

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background fixed grid w-full max-w-[calc(100vw-2rem)] gap-4 rounded-xl p-4 sm:p-6",
          "border-0 shadow-[0_8px_24px_rgba(130,63,145,0.15),0_0_0_1px_rgba(130,63,145,0.1)]",
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "max-h-[85vh] sm:max-h-[75vh] overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
          sizeClasses[size],
          className
        )}
        style={{
          position: 'fixed',
          zIndex: 99999,
          ...props.style,
        } as React.CSSProperties}
        {...props}
        asChild
      >
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          transition={{
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1]
          }}
          className="w-full"
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              className="ring-offset-background focus:ring-ring absolute top-3 right-3 sm:top-4 sm:right-4 rounded-lg opacity-70 transition-all hover:opacity-100 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none p-1.5"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
