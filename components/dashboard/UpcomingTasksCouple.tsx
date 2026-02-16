'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Clock, ArrowRight, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { getWeddingTasks, toggleWeddingTask, type WeddingTask } from '@/lib/supabase/queries/wedding-tasks.queries'
import { getRelativeDueDateLabel } from '@/lib/constants/wedding-tasks'

interface UpcomingTasksCoupleProps {
  coupleId?: string | null
  weddingDate?: string | null
}

function formatDueDate(task: WeddingTask): string {
  if (task.due_date) {
    const date = new Date(task.due_date)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000)

    if (diffDays < 0) return 'En retard'
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Demain'
    if (diffDays <= 7) return `Dans ${diffDays} jours`
    if (diffDays <= 30) return `Dans ${Math.ceil(diffDays / 7)} semaines`

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  if (task.months_before_wedding != null) {
    return getRelativeDueDateLabel(task.months_before_wedding)
  }

  return ''
}

export function UpcomingTasksCouple({ coupleId, weddingDate }: UpcomingTasksCoupleProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [collapsed, setCollapsed] = useState(false)
  const [tasks, setTasks] = useState<WeddingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const loadTasks = useCallback(async () => {
    if (!coupleId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const data = await getWeddingTasks(coupleId, weddingDate)
    setTasks(data)
    setLoading(false)
  }, [coupleId, weddingDate])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleToggle = async (task: WeddingTask) => {
    const newCompleted = !task.completed
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t))
    setTogglingIds(prev => new Set(prev).add(task.id))

    const success = await toggleWeddingTask(task.id, newCompleted)
    if (!success) {
      // Revert
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !newCompleted } : t))
    }
    setTogglingIds(prev => {
      const next = new Set(prev)
      next.delete(task.id)
      return next
    })
  }

  const handleTaskClick = (task: WeddingTask) => {
    if (task.href && !task.completed) {
      router.push(task.href)
    } else {
      handleToggle(task)
    }
  }

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.priority === filter)

  const completedCount = tasks.filter(t => t.completed).length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const priorityColors = {
    high: 'bg-[#823F91]/10 text-[#6D3478]',
    medium: 'bg-[#9D5FA8]/10 text-[#9D5FA8]',
    low: 'bg-gray-100 text-gray-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col"
    >
      {/* Header - clickable on mobile to collapse */}
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className="w-full text-left bg-gradient-to-r from-[#FBF8F3] to-[#FAF9F6] px-5 py-4 border-b border-gray-100 lg:cursor-default"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] sm:text-lg font-bold text-gray-900 tracking-tight">Preparatifs</h2>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 font-medium">
              {loading ? 'Chargement...' : `${completedCount}/${totalCount} etape${totalCount > 1 ? 's' : ''} completee${completedCount > 1 ? 's' : ''}`}
            </p>
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 text-gray-400 transition-transform duration-200 lg:hidden",
            !collapsed && "rotate-180"
          )} />
        </div>

        {/* Barre de progression */}
        {totalCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-[#823F91] to-[#9D5FA8] rounded-full"
              />
            </div>
            <span className="text-xs font-semibold text-[#823F91] tabular-nums">{progress}%</span>
          </div>
        )}
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden flex flex-col flex-1"
          >
            {/* Filtres */}
            <div className="px-4 pt-4 sm:px-5 sm:pt-5">
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-full w-fit">
                {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setFilter(priority)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                      filter === priority
                        ? "bg-[#823F91] text-white shadow-sm"
                        : "text-gray-600 hover:text-[#823F91] hover:bg-gray-50"
                    )}
                  >
                    {priority === 'all' ? 'Toutes' : priority === 'high' ? 'Urgent' : priority === 'medium' ? 'Moyen' : 'Faible'}
                  </button>
                ))}
              </div>
            </div>

            {/* Liste des taches */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 text-[#823F91] animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Aucune tache trouvee</p>
                      <p className="text-xs text-gray-500">Vos preparatifs apparaitront ici</p>
                    </div>
                  ) : (
                    filteredTasks.map((task, index) => {
                      const dueLabel = formatDueDate(task)
                      const isOverdue = dueLabel === 'En retard' && !task.completed

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl transition-all group",
                            task.completed
                              ? "bg-gray-50/60 opacity-70"
                              : isOverdue
                                ? "bg-red-50/60 hover:bg-red-50/80 border border-red-100"
                                : "bg-gray-50/80 hover:bg-gray-100/80 border border-transparent hover:border-[#823F91]/10",
                            "cursor-pointer"
                          )}
                          onClick={() => handleTaskClick(task)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTaskClick(task)
                          }}
                        >
                          {/* Status indicator */}
                          <div
                            className="flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggle(task)
                            }}
                          >
                            {togglingIds.has(task.id) ? (
                              <Loader2 className="h-5 w-5 text-[#823F91] animate-spin" />
                            ) : task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-[#823F91]" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-300 hover:text-[#823F91] transition-colors" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-medium truncate",
                              task.completed ? "text-gray-500 line-through" : "text-gray-900"
                            )}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {dueLabel && (
                                <>
                                  <Clock size={12} className={cn("flex-shrink-0", isOverdue ? "text-red-400" : "text-gray-400")} />
                                  <span className={cn("text-xs", isOverdue ? "text-red-500 font-medium" : "text-gray-500")}>{dueLabel}</span>
                                </>
                              )}
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5 py-0 h-4 border-0",
                                  priorityColors[task.priority]
                                )}
                              >
                                {task.priority === "high" ? "Urgent" : task.priority === "medium" ? "Moyen" : "Faible"}
                              </Badge>
                            </div>
                          </div>

                          {/* Arrow for navigable tasks */}
                          {task.href && !task.completed && (
                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#823F91] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          )}
                        </motion.div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
