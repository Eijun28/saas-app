import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingSpinner({ className, size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  if (text) {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-[#E8D4EF] border-t-[#6D3478]",
            sizeClasses[size],
            className
          )}
        />
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-[#E8D4EF] border-t-[#6D3478]",
        sizeClasses[size],
        className
      )}
    />
  )
}

