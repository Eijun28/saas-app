'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Plus, Trash2, ChevronDown, ChevronRight, Calendar, Flag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  toggleWeddingTask,
  addWeddingTask,
  deleteWeddingTask,
} from '@/lib/supabase/queries/wedding-tasks.queries'
import { TASK_CATEGORY_LABELS, type WeddingTaskCategory } from '@/lib/constants/wedding-tasks'
import type { WeddingTask } from '@/lib/supabase/queries/wedding-tasks.queries'

// ─── Couleurs priorité ────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { label: 'Urgent',  color: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-200' },
  medium: { label: 'Moyen',   color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  low:    { label: 'Faible',  color: 'text-gray-400',  bg: 'bg-gray-50',  border: 'border-gray-200' },
}

// ─── Ligne de tâche ───────────────────────────────────────────────────────────

function TaskRow({
  task,
  coupleId,
  onToggle,
  onDelete,
}: {
  task: WeddingTask
  coupleId: string
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}) {
  const [toggling,  setToggling]  = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const priority = PRIORITY_CONFIG[task.priority]

  const handleToggle = async () => {
    setToggling(true)
    const ok = await toggleWeddingTask(task.id, !task.completed)
    if (ok) onToggle(task.id, !task.completed)
    else toast.error('Erreur lors de la mise à jour')
    setToggling(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const ok = await deleteWeddingTask(task.id)
    if (ok) {
      onDelete(task.id)
      toast.success('Tâche supprimée')
    } else {
      toast.error('Erreur lors de la suppression')
    }
    setDeleting(false)
  }

  const dueDateLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    : null

  const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-xl border transition-all',
        task.completed
          ? 'bg-gray-50/60 border-gray-100 opacity-60'
          : 'bg-white border-gray-100 hover:border-[#823F91]/20 hover:shadow-sm'
      )}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggling}
        className={cn(
          'mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all',
          task.completed
            ? 'bg-[#823F91] border-[#823F91]'
            : 'border-gray-300 hover:border-[#823F91]'
        )}
        aria-label={task.completed ? 'Marquer comme à faire' : 'Marquer comme fait'}
      >
        {task.completed && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </button>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'text-sm font-medium',
            task.completed ? 'line-through text-gray-400' : 'text-gray-900'
          )}>
            {task.title}
          </span>
          <span className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
            priority.color, priority.bg, priority.border
          )}>
            {priority.label}
          </span>
        </div>

        {task.description && (
          <p className="text-[12px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1">
          {dueDateLabel && (
            <span className={cn(
              'flex items-center gap-1 text-[11px]',
              isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'
            )}>
              <Calendar className="h-3 w-3" />
              {dueDateLabel}
              {isOverdue && ' · En retard'}
            </span>
          )}
          {task.href && (
            <a
              href={task.href}
              className="text-[11px] text-[#823F91] hover:underline"
            >
              Voir →
            </a>
          )}
        </div>
      </div>

      {/* Supprimer */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
        aria-label="Supprimer la tâche"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

// ─── Groupe de catégorie ──────────────────────────────────────────────────────

function CategoryGroup({
  category,
  tasks,
  coupleId,
  onToggle,
  onDelete,
}: {
  category: string
  tasks: WeddingTask[]
  coupleId: string
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const done  = tasks.filter(t => t.completed).length
  const total = tasks.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header groupe */}
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50/80 hover:bg-gray-50 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
        <span className="text-sm font-semibold text-gray-800 flex-1">{category}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{done}/{total}</span>
          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#823F91] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-[#823F91] w-8 text-right">{pct}%</span>
        </div>
      </button>

      {/* Tâches */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-2 space-y-1">
              <AnimatePresence>
                {tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    coupleId={coupleId}
                    onToggle={onToggle}
                    onDelete={onDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Formulaire ajout rapide ──────────────────────────────────────────────────

function QuickAddForm({
  coupleId,
  onAdded,
}: {
  coupleId: string
  onAdded: (task: WeddingTask) => void
}) {
  const [open,     setOpen]     = useState(false)
  const [title,    setTitle]    = useState('')
  const [category, setCategory] = useState<WeddingTaskCategory>('general')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [saving,   setSaving]   = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const task = await addWeddingTask(coupleId, { title: title.trim(), category, priority })
    if (task) {
      onAdded(task)
      setTitle('')
      toast.success('Tâche ajoutée')
    } else {
      toast.error('Erreur lors de l\'ajout')
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-[#823F91] hover:text-[#6D3478] py-2 px-3 rounded-xl hover:bg-[#823F91]/5 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Ajouter une tâche personnalisée
      </button>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      onSubmit={handleAdd}
      className="p-4 rounded-2xl border border-[#823F91]/20 bg-[#823F91]/5 space-y-3"
    >
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Titre de la tâche…"
        className="rounded-xl bg-white"
        maxLength={200}
        autoFocus
      />
      <div className="flex gap-3">
        <Select value={category} onValueChange={v => setCategory(v as WeddingTaskCategory)}>
          <SelectTrigger className="rounded-xl bg-white flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(TASK_CATEGORY_LABELS) as [WeddingTaskCategory, string][]).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={v => setPriority(v as 'high' | 'medium' | 'low')}>
          <SelectTrigger className="rounded-xl bg-white w-36">
            <Flag className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">Urgent</SelectItem>
            <SelectItem value="medium">Moyen</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={!title.trim() || saving}
          className="flex-1 rounded-xl bg-[#823F91] hover:bg-[#6D3478]"
        >
          {saving ? 'Ajout…' : 'Ajouter'}
        </Button>
      </div>
    </motion.form>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface ChecklistViewProps {
  tasks: WeddingTask[]
  coupleId: string
}

export function ChecklistView({ tasks: initialTasks, coupleId }: ChecklistViewProps) {
  const [tasks, setTasks] = useState<WeddingTask[]>(initialTasks)
  const [filterMode, setFilterMode] = useState<'all' | 'todo' | 'done'>('all')

  const handleToggle = (id: string, completed: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
  }

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const handleAdded = (task: WeddingTask) => {
    setTasks(prev => [...prev, task])
  }

  // Stats globales
  const done  = tasks.filter(t => t.completed).length
  const total = tasks.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  // Filtrage
  const filteredTasks = tasks.filter(t => {
    if (filterMode === 'todo') return !t.completed
    if (filterMode === 'done') return t.completed
    return true
  })

  // Groupement par catégorie
  const grouped = useMemo(() => {
    const map = new Map<string, WeddingTask[]>()
    for (const task of filteredTasks) {
      const label = TASK_CATEGORY_LABELS[task.category as WeddingTaskCategory] ?? task.category
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(task)
    }
    return map
  }, [filteredTasks])

  return (
    <div className="space-y-6">
      {/* Barre de progression globale */}
      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-[#823F91]/5 to-[#E8D4EF]/30 border border-[#823F91]/10"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Progression globale</span>
            <span className="text-lg font-bold text-[#823F91]">{pct}%</span>
          </div>
          <div className="h-2.5 bg-white/80 rounded-full overflow-hidden border border-[#823F91]/10">
            <motion.div
              className="h-full bg-[#823F91] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[12px] text-gray-500 mt-1.5">
            {done} tâche{done > 1 ? 's' : ''} complétée{done > 1 ? 's' : ''} sur {total}
          </p>
        </motion.div>
      )}

      {/* Filtres */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center p-0.5 bg-gray-100 rounded-full">
          {([
            ['all',  'Toutes'],
            ['todo', 'À faire'],
            ['done', 'Faites'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilterMode(value)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
                filterMode === value
                  ? 'bg-[#823F91] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <QuickAddForm coupleId={coupleId} onAdded={handleAdded} />
      </div>

      {/* Groupes */}
      {grouped.size === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Check className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {filterMode === 'done' ? 'Aucune tâche complétée' : 'Aucune tâche à faire'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([category, catTasks]) => (
            <CategoryGroup
              key={category}
              category={category}
              tasks={catTasks}
              coupleId={coupleId}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
