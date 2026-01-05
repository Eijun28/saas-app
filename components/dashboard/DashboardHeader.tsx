"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"

interface DashboardHeaderProps {
  title: string
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-border bg-background/80 glass px-6"
    >
      <h1 className="text-xl font-semibold text-foreground tracking-tight">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="w-56 h-9 pl-9 text-sm bg-muted/50 border-0 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-smooth"
        >
          <Bell className="h-[18px] w-[18px]" />
        </Button>

        {/* User info with avatar */}
        <div className="flex items-center gap-2 ml-1">
          <div className="h-8 w-8 rounded-lg overflow-hidden">
            <img 
              src="/placeholder-avatar.jpg" 
              alt="User" 
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="h-full w-full gradient-primary flex items-center justify-center"><span class="text-xs font-medium text-primary-foreground">M</span></div>';
              }}
            />
          </div>
          <span className="text-sm font-medium text-foreground hidden lg:block">malia & djamel</span>
        </div>
      </div>
    </motion.header>
  )
}

