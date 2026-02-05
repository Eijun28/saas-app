'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Task {
  id: number
  title: string
  dueDate: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  href?: string
}

interface UpcomingTasksCoupleProps {
  tasks?: Task[]
  onTaskToggle?: (id: number) => void
}

export function UpcomingTasksCouple({ tasks = [], onTaskToggle }: UpcomingTasksCoupleProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.priority === filter)

  const completedCount = tasks.filter(t => t.completed).length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const priorityColors = {
    high: 'bg-red-50 text-red-700',
    medium: 'bg-yellow-50 text-yellow-700',
    low: 'bg-gray-50 text-gray-700',
  }

  const handleTaskClick = (task: Task) => {
    if (task.href && !task.completed) {
      router.push(task.href)
    } else if (onTaskToggle) {
      onTaskToggle(task.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col"
    >
      {/* Header avec fond ivoire */}
      <div className="bg-gradient-to-r from-[#FFFDF7] to-[#FFF9EE] px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Preparatifs</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {completedCount}/{totalCount} etape{totalCount > 1 ? 's' : ''} completee{completedCount > 1 ? 's' : ''}
            </p>
          </div>
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
      </div>

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
            filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all group",
                  task.completed
                    ? "bg-gray-50/60 opacity-70"
                    : "bg-gray-50/80 hover:bg-gray-100/80 border border-transparent hover:border-[#823F91]/10",
                  task.href && !task.completed && "cursor-pointer"
                )}
                onClick={() => handleTaskClick(task)}
                role={task.href && !task.completed ? "button" : undefined}
                tabIndex={task.href && !task.completed ? 0 : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && task.href && !task.completed) {
                    handleTaskClick(task)
                  }
                }}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-[#823F91]" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
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
                    <Clock size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">{task.dueDate}</span>
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
            ))
          )}
        </div>
      </div>
    </motion.div>
  )
}
