'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PREDEFINED_CATEGORIES, DEFAULT_CATEGORIES, type BudgetData } from '@/types/budget'

// Ré-exporter uniquement les types (pas les constantes)
export type { BudgetCategory, BudgetProvider, CoupleBudget, BudgetData } from '@/types/budget'

/**
 * Récupère toutes les données budget de l'utilisateur
 */
export async function getBudgetData(): Promise<BudgetData | null> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return null
    }

    // Récupérer le budget global
    const { data: budget, error: budgetError } = await supabase
      .from('couple_budgets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (budgetError && budgetError.code !== 'PGRST116') {
      console.error('Error fetching budget:', budgetError)
    }

    // Récupérer les catégories
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
    }

    // Récupérer les prestataires
    const { data: providers, error: providersError } = await supabase
      .from('budget_providers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (providersError) {
      console.error('Error fetching providers:', providersError)
    }

    // Calculer le total dépensé (prestataires validés ou payés)
    const totalDepense = (providers || [])
      .filter(p => ['valide', 'paye'].includes(p.statut))
      .reduce((sum, p) => sum + Number(p.devis), 0)

    const budgetMax = budget ? Number(budget.budget_max) : 0
    const budgetRestant = budgetMax - totalDepense
    const pourcentageUtilise = budgetMax > 0 ? (totalDepense / budgetMax) * 100 : 0

    return {
      budget: budget || null,
      categories: categories || [],
      providers: providers || [],
      totalDepense,
      budgetRestant,
      pourcentageUtilise,
    }
  } catch (error) {
    console.error('Error in getBudgetData:', error)
    return null
  }
}

/**
 * Met à jour ou crée le budget global du couple
 */
export async function updateBudget(budgetMin: number, budgetMax: number) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    if (budgetMin < 0 || budgetMax < 0 || budgetMin > budgetMax) {
      return { error: 'Budget invalide' }
    }

    const { error } = await supabase
      .from('couple_budgets')
      .upsert({
        user_id: user.id,
        budget_min: budgetMin,
        budget_max: budgetMax,
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error updating budget:', error)
      return { error: error.message }
    }

    revalidatePath('/couple/budget')
    revalidatePath('/couple/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error in updateBudget:', error)
    return { error: 'Erreur lors de la mise à jour du budget' }
  }
}

/**
 * Ajoute une catégorie de budget
 */
export async function addBudgetCategory(categoryName: string, budgetPrevu: number = 0) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    // Vérifier si la catégorie existe déjà
    const { data: existing } = await supabase
      .from('budget_categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('category_name', categoryName)
      .single()

    if (existing) {
      return { error: 'Cette catégorie existe déjà' }
    }

    const { data, error } = await supabase
      .from('budget_categories')
      .insert({
        user_id: user.id,
        category_name: categoryName,
        budget_prevu: budgetPrevu,
        budget_depense: 0,
        statut: budgetPrevu > 0 ? 'en_cours' : 'non_defini',
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding category:', error)
      return { error: error.message }
    }

    revalidatePath('/couple/budget')
    return { success: true, data }
  } catch (error) {
    console.error('Error in addBudgetCategory:', error)
    return { error: 'Erreur lors de l\'ajout de la catégorie' }
  }
}

/**
 * Met à jour le budget prévu d'une catégorie
 */
export async function updateCategoryBudget(categoryId: string, budgetPrevu: number) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    const statut = budgetPrevu > 0 ? 'en_cours' : 'non_defini'

    const { error } = await supabase
      .from('budget_categories')
      .update({
        budget_prevu: budgetPrevu,
        statut,
      })
      .eq('id', categoryId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating category:', error)
      return { error: error.message }
    }

    revalidatePath('/couple/budget')
    return { success: true }
  } catch (error) {
    console.error('Error in updateCategoryBudget:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }
}

/**
 * Supprime une catégorie
 */
export async function deleteCategory(categoryId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    const { error } = await supabase
      .from('budget_categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting category:', error)
      return { error: error.message }
    }

    revalidatePath('/couple/budget')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteCategory:', error)
    return { error: 'Erreur lors de la suppression' }
  }
}

/**
 * Ajoute un prestataire au budget
 */
export async function addProvider(provider: {
  name: string
  category: string
  devis: number
  statut?: 'contacte' | 'devis_recu' | 'valide' | 'paye'
  notes?: string
}) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    if (provider.devis < 0) {
      return { error: 'Le devis doit être positif' }
    }

    // Vérifier si la catégorie existe, sinon la créer
    const { data: category } = await supabase
      .from('budget_categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('category_name', provider.category)
      .single()

    if (!category) {
      // Créer la catégorie automatiquement
      await addBudgetCategory(provider.category, 0)
    }

    const { data, error } = await supabase
      .from('budget_providers')
      .insert({
        user_id: user.id,
        provider_name: provider.name,
        category: provider.category,
        devis: provider.devis,
        statut: provider.statut || 'contacte',
        notes: provider.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding provider:', error)
      return { error: error.message }
    }

    revalidatePath('/couple/budget')
    return { success: true, data }
  } catch (error) {
    console.error('Error in addProvider:', error)
    return { error: 'Erreur lors de l\'ajout du prestataire' }
  }
}

/**
 * Met à jour le statut d'un prestataire
 */
export async function updateProviderStatus(
  providerId: string,
  statut: 'contacte' | 'devis_recu' | 'valide' | 'paye'
) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    const { error } = await supabase
      .from('budget_providers')
      .update({ statut })
      .eq('id', providerId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating provider:', error)
      return { error: error.message }
    }

    revalidatePath('/couple/budget')
    return { success: true }
  } catch (error) {
    console.error('Error in updateProviderStatus:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }
}

/**
 * Met à jour un prestataire (nom, devis, notes)
 */
export async function updateProvider(
  providerId: string,
  updates: {
    provider_name?: string
    devis?: number
    notes?: string
  }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    const { error } = await supabase
      .from('budget_providers')
      .update(updates)
      .eq('id', providerId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating provider:', error)
      return { error: error.message }
    }

    revalidatePath('/couple/budget')
    return { success: true }
  } catch (error) {
    console.error('Error in updateProvider:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }
}

/**
 * Supprime un prestataire
 */
export async function deleteProvider(providerId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié' }
    }

    const { error } = await supabase
      .from('budget_providers')
      .delete()
      .eq('id', providerId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting provider:', error)
      return { error: error.message }
    }

    revalidatePath('/couple/budget')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteProvider:', error)
    return { error: 'Erreur lors de la suppression' }
  }
}

/**
 * Initialise les catégories prédéfinies pour un utilisateur
 */
export async function initializeCategories() {
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

    const { error } = await supabase
      .from('budget_categories')
      .insert(
        toCreate.map((cat, index) => ({
          user_id: user.id,
          category_name: cat.name,
          category_icon: cat.icon,
          budget_prevu: 0,
          budget_depense: 0,
          order_index: index,
          statut: 'non_defini',
        }))
      )

    if (error) {
      console.error('Error initializing categories:', error)
      return { error: error.message }
    }

    revalidatePath('/couple/budget')
    return { success: true }
  } catch (error) {
    console.error('Error in initializeCategories:', error)
    return { error: 'Erreur lors de l\'initialisation' }
  }
}

