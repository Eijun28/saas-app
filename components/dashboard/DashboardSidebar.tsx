"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Home,
  Sparkles,
  Calendar,
  MessageSquare,
  FileText,
  DollarSign,
  User,
  ChevronLeft,
  LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export interface SidebarItem {
  title: string
  icon: LucideIcon
  href: string
  badge?: string
}

interface DashboardSidebarProps {
  items?: SidebarItem[]
  logo?: string
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

const defaultItems: SidebarItem[] = [
  { title: "Accueil", icon: Home, href: "/dashboard" },
  { title: "Nuply Matching", icon: Sparkles, href: "/dashboard/matching", badge: "Nouveau" },
  { title: "Calendrier", icon: Calendar, href: "/dashboard/calendrier" },
  { title: "Messages", icon: MessageSquare, href: "/dashboard/messages" },
  { title: "Demandes & Devis", icon: FileText, href: "/dashboard/demandes" },
  { title: "Budget", icon: DollarSign, href: "/dashboard/budget" },
  { title: "Profil", icon: User, href: "/dashboard/profil" },
]

export function DashboardSidebar({ 
  items = defaultItems, 
  logo = "NUPLY",
  collapsed: externalCollapsed,
  onCollapse
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  
  // Utiliser le state externe si fourni, sinon utiliser le state interne
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed
  
  const handleCollapse = (value: boolean) => {
    if (onCollapse) {
      onCollapse(value)
    } else {
      setInternalCollapsed(value)
    }
  }

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          "flex h-[60px] items-center border-b border-border",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          <Link href="/dashboard" className="flex items-center">
            <motion.span 
              className="text-xl font-semibold text-gradient tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {collapsed ? logo.charAt(0) : logo}
            </motion.span>
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCollapse(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-smooth flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="flex justify-center py-2 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCollapse(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-smooth"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className={cn(
          "flex-1 py-4 space-y-1",
          collapsed ? "px-2" : "px-3"
        )}>
          {items.map((item, index) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: index * 0.04,
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1] as const
                }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-xl text-[13px] font-medium transition-smooth",
                    collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-primary/[0.08] text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-lg transition-smooth flex-shrink-0",
                      collapsed ? "h-10 w-10" : "h-9 w-9",
                      isActive
                        ? "gradient-primary shadow-glow"
                        : "bg-muted/80 group-hover:bg-muted"
                    )}
                  >
                    <Icon className={cn(
                      "h-[18px] w-[18px] transition-smooth flex-shrink-0",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                  </div>
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={cn(
          "border-t border-border",
          collapsed ? "p-2" : "p-4"
        )}>
          <div className={cn(
            "flex items-center rounded-lg bg-muted/40",
            collapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
          )}>
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-foreground">N</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">Pro Plan</p>
                <p className="text-[11px] text-muted-foreground">Upgrade</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

