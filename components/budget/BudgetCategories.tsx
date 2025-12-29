'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  addBudgetCategory,
  updateCategoryBudget,
  deleteCategory,
  initializeCategories,
  type BudgetCategory,
} from '@/lib/actions/budget'
import { PREDEFINED_CATEGORIES } from '@/types/budget'
import { Plus, Trash2, Loader2 } from 'lucide-react'

type BudgetCategoriesProps = {
  categories: BudgetCategory[]
  onUpdate: () => void
}

const STATUT_LABELS = {
  non_defini: 'Non défini',
  en_cours: 'En cours',
  valide: 'Validé',
}

const STATUT_COLORS = {
  non_defini: 'outline',
  en_cours: 'warning',
  valide: 'success',
}

export function BudgetCategories({ categories, onUpdate }: BudgetCategoriesProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(false)

  // Initialiser les catégories prédéfinies si aucune n'existe
  useEffect(() => {
    if (categories.length === 0) {
      handleInitializeCategories()
    }
  }, [])

  const handleInitializeCategories = async () => {
    setInitializing(true)
    const result = await initializeCategories()
    if (result.error) {
      alert(`Erreur: ${result.error}`)
    } else {
      onUpdate()
    }
    setInitializing(false)
  }

  const handleStartEdit = (category: BudgetCategory) => {
    setEditingId(category.id)
    setEditValue(category.budget_prevu.toString())
  }

  const handleSaveEdit = async (categoryId: string) => {
    const budgetPrevu = parseFloat(editValue)
    if (isNaN(budgetPrevu) || budgetPrevu < 0) {
      alert('Veuillez entrer un montant valide')
      return
    }

    setLoading(categoryId)
    const result = await updateCategoryBudget(categoryId, budgetPrevu)
    setLoading(null)

    if (result.error) {
      alert(`Erreur: ${result.error}`)
    } else {
      setEditingId(null)
      onUpdate()
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return
    }

    setLoading(categoryId)
    const result = await deleteCategory(categoryId)
    setLoading(null)

    if (result.error) {
      alert(`Erreur: ${result.error}`)
    } else {
      onUpdate()
    }
  }

  const handleAddCategory = async () => {
    const name = prompt('Nom de la nouvelle catégorie:')
    if (!name || name.trim() === '') return

    setLoading('new')
    const result = await addBudgetCategory(name.trim())
    setLoading(null)

    if (result.error) {
      alert(`Erreur: ${result.error}`)
    } else {
      onUpdate()
    }
  }

  if (initializing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#823F91]" />
          <span className="ml-2 text-[#6B7280]">Initialisation des catégories...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Postes de dépenses</CardTitle>
            <CardDescription>
              Gérez le budget prévu pour chaque catégorie
            </CardDescription>
          </div>
          <Button
            onClick={handleAddCategory}
            disabled={loading === 'new'}
            size="sm"
            className="bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            {loading === 'new' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="ml-2">Ajouter</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280]">
            <p>Aucune catégorie définie</p>
            <Button
              onClick={handleInitializeCategories}
              className="mt-4 bg-[#823F91] hover:bg-[#6D3478] text-white"
            >
              Initialiser les catégories prédéfinies
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => {
              const budgetPrevu = Number(category.budget_prevu)
              const budgetDepense = Number(category.budget_depense)
              const pourcentage = budgetPrevu > 0 ? (budgetDepense / budgetPrevu) * 100 : 0
              const isEditing = editingId === category.id
              const isLoading = loading === category.id

              return (
                <div key={category.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-[#111827]">{category.category_name}</h3>
                      <Badge variant={STATUT_COLORS[category.statut] as any}>
                        {STATUT_LABELS[category.statut]}
                      </Badge>
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleStartEdit(category)}
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                        >
                          Modifier
                        </Button>
                        <Button
                          onClick={() => handleDelete(category.id)}
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Budget prévu"
                        className="flex-1"
                      />
                      <span className="text-[#6B7280]">€</span>
                      <Button
                        onClick={() => handleSaveEdit(category.id)}
                        disabled={isLoading}
                        size="sm"
                        className="bg-[#823F91] hover:bg-[#6D3478] text-white"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Enregistrer'
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingId(null)
                          setEditValue('')
                        }}
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                      >
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#6B7280]">Budget prévu</span>
                        <span className="font-semibold text-[#111827]">
                          {budgetPrevu.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#6B7280]">Budget dépensé</span>
                        <span className="font-semibold text-[#823F91]">
                          {budgetDepense.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </span>
                      </div>
                      {budgetPrevu > 0 && (
                        <>
                          <Progress
                            value={Math.min(pourcentage, 100)}
                            className="h-2"
                          />
                          <div className="flex items-center justify-between text-xs text-[#6B7280]">
                            <span>
                              {pourcentage.toFixed(1)}% utilisé
                              {pourcentage > 100 && (
                                <span className="text-red-600 ml-1">
                                  (dépassement de{' '}
                                  {(budgetDepense - budgetPrevu).toLocaleString('fr-FR', {
                                    style: 'currency',
                                    currency: 'EUR',
                                  })}
                                  )
                                </span>
                              )}
                            </span>
                            <span>
                              Reste:{' '}
                              {Math.max(0, budgetPrevu - budgetDepense).toLocaleString('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                              })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

