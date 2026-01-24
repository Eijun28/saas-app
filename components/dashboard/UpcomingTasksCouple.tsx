'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Task {
  id: number
  title: string
  dueDate: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
}

interface UpcomingTasksCoupleProps {
  tasks?: Task[]
  onTaskToggle?: (id: number) => void
}

export function UpcomingTasksCouple({ tasks = [], onTaskToggle }: UpcomingTasksCoupleProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.priority === filter)
  
  const remainingCount = tasks.filter(t => !t.completed).length

  const priorityColors = {
    high: 'bg-red-50 text-red-700',
    medium: 'bg-yellow-50 text-yellow-700',
    low: 'bg-gray-50 text-gray-700',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-xl p-4 sm:p-5 lg:p-6 border-0 shadow-[0_2px_8px_rgba(130,63,145,0.08)] hover:shadow-[0_4px_12px_rgba(130,63,145,0.12)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Tâches à venir</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {remainingCount} {remainingCount > 1 ? 'tâches' : 'tâche'} restante{remainingCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
          <Button
            key={priority}
            variant={filter === priority ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(priority)}
            className={cn(
              "text-xs h-7",
              filter === priority 
                ? "bg-[#823F91] text-white border-0 hover:bg-[#6D3478] shadow-[0_2px_4px_rgba(130,63,145,0.2)]" 
                : "border-0 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(130,63,145,0.05)] hover:shadow-[0_2px_6px_rgba(130,63,145,0.12),0_0_0_1px_rgba(130,63,145,0.1)]"
            )}
          >
            {priority === 'all' ? 'Toutes' : priority === 'high' ? 'Urgent' : priority === 'medium' ? 'Moyen' : 'Faible'}
          </Button>
        ))}
      </div>

      {/* Liste des tâches */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aucune tâche trouvée</p>
        ) : (
          filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                "flex items-start gap-3 p-3 sm:p-4 rounded-xl transition-all border-0",
                task.completed
                  ? "bg-gray-50/50 opacity-60 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                  : "bg-white shadow-[0_1px_3px_rgba(130,63,145,0.08)] hover:shadow-[0_2px_6px_rgba(130,63,145,0.12)]"
              )}
            >
              <button 
                onClick={() => onTaskToggle?.(task.id)}
                className="mt-0.5 flex-shrink-0"
              >
                {task.completed ? (
                  <CheckCircle2 className="text-[#823F91]" size={20} />
                ) : (
                  <Circle className="text-gray-400 hover:text-[#823F91] transition-colors" size={20} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm sm:text-base",
                  task.completed ? "text-gray-500 line-through" : "text-gray-900"
                )}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-500">{task.dueDate}</span>
                  </div>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs px-2 py-0.5 h-5 border-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
                      priorityColors[task.priority].replace('border-', 'shadow-[0_1px_2px_rgba(0,0,0,0.1)] ')
                    )}
                  >
                    {task.priority === "high" ? "Urgent" : task.priority === "medium" ? "Moyen" : "Faible"}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
