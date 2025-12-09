'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_CATEGORIES } from '@/lib/types/budget'

/**
 * Initialise les catégories par défaut avec icônes
 */
export async function initializeDefaultCategories() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    // Vérifier quelles catégories existent déjà
    const { data: existing } = await supabase
      .from('budget_categories')
      .select('category_name')
      .eq('user_id', user.id)

    const existingNames = (existing || []).map(c => c.category_name)
    const toCreate = DEFAULT_CATEGORIES.filter(c => !existingNames.includes(c.name))

    if (toCreate.length === 0) {
      return { success: true, message: 'Toutes les catégories existent déjà' }
    }

    // Insérer les catégories avec gestion des doublons
    for (let i = 0; i < toCreate.length; i++) {
      const cat = toCreate[i]
      await supabase
        .from('budget_categories')
        .insert({
          user_id: user.id,
          category_name: cat.name,
          category_icon: cat.icon,
          budget_prevu: 0,
          budget_depense: 0,
          order_index: i,
          statut: 'non_defini',
        })
        .select()
        .single()
      // Ignorer les erreurs de duplicate (contrainte unique)
    }

    revalidatePath('/dashboard/budget')
    return { success: true }
  } catch (error: any) {
    console.error('Error in initializeDefaultCategories:', error)
    return { error: error.message || 'Erreur lors de l\'initialisation' }
  }
}

/**
 * Ajoute une catégorie personnalisée
 */
export async function addCustomCategory(name: string, icon: string, budgetPrevu: number) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    // Récupérer le dernier order_index
    const { data: lastCategory } = await supabase
      .from('budget_categories')
      .select('order_index')
      .eq('user_id', user.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextOrderIndex = lastCategory ? (lastCategory.order_index || 0) + 1 : 0

    const { error } = await supabase
      .from('budget_categories')
      .insert({
        user_id: user.id,
        category_name: name,
        category_icon: icon || '📦',
        budget_prevu: budgetPrevu,
        budget_depense: 0,
        order_index: nextOrderIndex,
        statut: budgetPrevu > 0 ? 'en_cours' : 'non_defini',
      })

    if (error) {
      console.error('Error adding custom category:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/budget')
    return { success: true }
  } catch (error: any) {
    console.error('Error in addCustomCategory:', error)
    return { error: error.message || 'Erreur lors de l\'ajout de la catégorie' }
  }
}

