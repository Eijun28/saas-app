import { createClient } from '@/lib/supabase/client'
import { DEFAULT_WEDDING_TASKS, calculateDueDate } from '@/lib/constants/wedding-tasks'

export interface WeddingTask {
  id: string
  couple_id: string
  title: string
  description: string | null
  category: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  completed_at: string | null
  due_date: string | null
  months_before_wedding: number | null
  sort_order: number
  is_default: boolean
  href: string | null
  created_at: string
  updated_at: string
}

/**
 * Charge les tâches de mariage d'un couple.
 * Si le couple n'a pas encore de tâches, initialise la checklist par défaut.
 */
export async function getWeddingTasks(coupleId: string, weddingDate?: string | null): Promise<WeddingTask[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('wedding_tasks')
    .select('*')
    .eq('couple_id', coupleId)
    .order('sort_order', { ascending: true })
    .order('months_before_wedding', { ascending: false })

  if (error) {
    // Table doesn't exist yet
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('Table wedding_tasks non disponible. Migration 061 requise.')
      return []
    }
    console.error('Erreur chargement tâches:', error)
    return []
  }

  // Si pas de tâches, initialiser la checklist par défaut
  if (!data || data.length === 0) {
    return await initializeDefaultTasks(coupleId, weddingDate)
  }

  return data as WeddingTask[]
}

/**
 * Initialise les tâches par défaut pour un couple.
 */
async function initializeDefaultTasks(coupleId: string, weddingDate?: string | null): Promise<WeddingTask[]> {
  const supabase = createClient()

  const inserts = DEFAULT_WEDDING_TASKS.map((task, index) => ({
    couple_id: coupleId,
    title: task.title,
    description: task.description || null,
    category: task.category,
    priority: task.priority,
    completed: false,
    due_date: weddingDate ? calculateDueDate(weddingDate, task.months_before_wedding) : null,
    months_before_wedding: task.months_before_wedding,
    sort_order: index,
    is_default: true,
    href: task.href || null,
  }))

  const { data, error } = await supabase
    .from('wedding_tasks')
    .insert(inserts)
    .select()

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('Table wedding_tasks non disponible. Migration 061 requise.')
      return []
    }
    console.error('Erreur initialisation tâches:', error)
    return []
  }

  return (data as WeddingTask[]) || []
}

/**
 * Met à jour le statut completed d'une tâche.
 */
export async function toggleWeddingTask(taskId: string, completed: boolean): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('wedding_tasks')
    .update({ completed })
    .eq('id', taskId)

  if (error) {
    console.error('Erreur toggle tâche:', error)
    return false
  }

  return true
}

/**
 * Ajoute une tâche personnalisée.
 */
export async function addWeddingTask(
  coupleId: string,
  task: {
    title: string
    description?: string
    category?: string
    priority?: 'high' | 'medium' | 'low'
    due_date?: string
  }
): Promise<WeddingTask | null> {
  const supabase = createClient()

  // Get max sort_order
  const { data: existing } = await supabase
    .from('wedding_tasks')
    .select('sort_order')
    .eq('couple_id', coupleId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data, error } = await supabase
    .from('wedding_tasks')
    .insert({
      couple_id: coupleId,
      title: task.title,
      description: task.description || null,
      category: task.category || 'general',
      priority: task.priority || 'medium',
      due_date: task.due_date || null,
      sort_order: nextOrder,
      is_default: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Erreur ajout tâche:', error)
    return null
  }

  return data as WeddingTask
}

/**
 * Supprime une tâche.
 */
export async function deleteWeddingTask(taskId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('wedding_tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Erreur suppression tâche:', error)
    return false
  }

  return true
}

/**
 * Recalcule les due_dates des tâches par défaut quand la date de mariage change.
 */
export async function recalculateTaskDueDates(coupleId: string, weddingDate: string): Promise<boolean> {
  const supabase = createClient()

  const { data: tasks, error: fetchError } = await supabase
    .from('wedding_tasks')
    .select('id, months_before_wedding')
    .eq('couple_id', coupleId)
    .eq('is_default', true)
    .not('months_before_wedding', 'is', null)

  if (fetchError || !tasks) {
    console.error('Erreur recalcul dates:', fetchError)
    return false
  }

  const updates = tasks.map(task =>
    supabase
      .from('wedding_tasks')
      .update({ due_date: calculateDueDate(weddingDate, task.months_before_wedding!) })
      .eq('id', task.id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some(r => r.error)

  if (hasError) {
    console.error('Erreurs lors du recalcul des dates')
    return false
  }

  return true
}
