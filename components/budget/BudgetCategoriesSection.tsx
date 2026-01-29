'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { type BudgetCategory } from '@/lib/types/budget'
import { updateCategoryBudget, deleteCategory } from '@/lib/actions/budget'
import { addCustomCategory } from '@/lib/actions/budget-categories'
import { getCategoryIcon, AVAILABLE_ICONS, getIconName } from '@/lib/constants/budget-icons'

interface BudgetCategoriesSectionProps {
  categories: BudgetCategory[]
  totalBudget: number
  onUpdate: () => void
}

export function BudgetCategoriesSection({
  categories,
  totalBudget,
  onUpdate,
}: BudgetCategoriesSectionProps) {
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editBudget, setEditBudget] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState<LucideIcon>(AVAILABLE_ICONS[AVAILABLE_ICONS.length - 1].icon)
  const [newCategoryBudget, setNewCategoryBudget] = useState('')

  // Calculer le budget total alloué
  const totalAlloue = categories.reduce((sum, cat) => sum + Number(cat.budget_prevu || 0), 0)
  const budgetRestant = totalBudget - totalAlloue

  const handleEditBudget = async (categoryId: string) => {
    const budget = parseFloat(editBudget)
    if (isNaN(budget) || budget < 0) {
      toast.error('Veuillez entrer un montant valide')
      return
    }

    setLoading(categoryId)
    const result = await updateCategoryBudget(categoryId, budget)
    setLoading(null)

    if (result.error) {
      toast.error(`Erreur: ${result.error}`)
    } else {
      setEditingCategory(null)
      setEditBudget('')
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
      toast.error(`Erreur: ${result.error}`)
    } else {
      onUpdate()
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Veuillez entrer un nom de catégorie')
      return
    }

    const budget = parseFloat(newCategoryBudget) || 0
    if (budget < 0) {
      toast.error('Le budget doit être positif')
      return
    }

    setLoading('new')
    const iconName = getIconName(newCategoryIcon)
    const result = await addCustomCategory(newCategoryName.trim(), iconName, budget)
    setLoading(null)

    if (result.error) {
      toast.error(`Erreur: ${result.error}`)
    } else {
      setIsAddingCategory(false)
      setNewCategoryName('')
      setNewCategoryIcon(AVAILABLE_ICONS[AVAILABLE_ICONS.length - 1].icon)
      setNewCategoryBudget('')
      onUpdate()
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Répartition par catégories</CardTitle>
            <CardDescription>
              Détaillez votre budget par poste de dépense
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#6B7280]">Budget alloué</p>
            <p className="text-2xl font-bold text-[#111827]">
              {totalAlloue.toLocaleString('fr-FR')} €
            </p>
            <p className="text-xs text-[#6B7280]">
              Reste: {budgetRestant.toLocaleString('fr-FR')} €
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Liste des catégories */}
        {categories.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280]">
            <p>Aucune catégorie définie</p>
          </div>
        ) : (
          categories
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map((category) => {
              const budgetPrevu = Number(category.budget_prevu || 0)
              const budgetDepense = Number(category.budget_depense || 0)
              const percentage =
                budgetPrevu > 0 ? (budgetDepense / budgetPrevu) * 100 : 0
              const isOverBudget = budgetDepense > budgetPrevu
              const isEditing = editingCategory === category.id
              const isLoading = loading === category.id

              return (
                <div
                  key={category.id}
                  className="border border-[#E5E7EB] rounded-lg p-4 space-y-3"
                >
                  {/* En-tête catégorie */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const CategoryIcon = getCategoryIcon(category.category_name, category.category_icon)
                        return <CategoryIcon className="h-6 w-6 text-[#823F91]" />
                      })()}
                      <div>
                        <h3 className="font-semibold text-[#111827]">
                          {category.category_name}
                        </h3>
                        <p className="text-sm text-[#6B7280]">
                          Budget prévu: {budgetPrevu.toLocaleString('fr-FR')} € • Dépensé:{' '}
                          {budgetDepense.toLocaleString('fr-FR')} €
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOverBudget && (
                        <Badge variant="destructive">Dépassé</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category.id)
                          setEditBudget(budgetPrevu.toString())
                        }}
                        disabled={isLoading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Édition du budget */}
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={editBudget}
                        onChange={(e) => setEditBudget(e.target.value)}
                        placeholder="Budget prévu"
                        className="flex-1"
                      />
                      <span className="text-[#6B7280]">€</span>
                      <Button
                        onClick={() => handleEditBudget(category.id)}
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
                          setEditingCategory(null)
                          setEditBudget('')
                        }}
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                      >
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Barre de progression */}
                      <div className="space-y-2">
                        <Progress
                          value={Math.min(percentage, 100)}
                          className={isOverBudget ? 'bg-red-200' : ''}
                        />
                        <div className="flex justify-between text-xs text-[#6B7280]">
                          <span>{percentage.toFixed(0)}% utilisé</span>
                          {isOverBudget && (
                            <span className="text-red-600 font-medium">
                              +{(budgetDepense - budgetPrevu).toLocaleString('fr-FR')} €
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Ouvrir modal pour ajouter prestataire
                            toast.info('Fonctionnalité à venir')
                          }}
                        >
                          Ajouter un prestataire
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Voir détails
                            toast.info('Fonctionnalité à venir')
                          }}
                        >
                          Voir détails
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
        )}

        {/* Bouton ajouter catégorie */}
        <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une catégorie personnalisée
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle catégorie</DialogTitle>
              <DialogDescription>
                Ajoutez une catégorie de dépense personnalisée
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Nom de la catégorie</Label>
                <Input
                  id="category-name"
                  placeholder="Ex: Animation enfants"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-icon">Icône</Label>
                <div className="grid grid-cols-6 gap-2 p-2 border rounded-lg">
                  {AVAILABLE_ICONS.map((iconOption) => {
                    const IconComponent = iconOption.icon
                    const isSelected = newCategoryIcon === iconOption.icon
                    return (
                      <button
                        key={iconOption.name}
                        type="button"
                        onClick={() => setNewCategoryIcon(iconOption.icon)}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? 'border-[#823F91] bg-[#823F91]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        aria-label={iconOption.label}
                      >
                        <IconComponent className={`h-5 w-5 mx-auto ${
                          isSelected ? 'text-[#823F91]' : 'text-gray-500'
                        }`} />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-budget">Budget prévu (€)</Label>
                <Input
                  id="category-budget"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="1000"
                  value={newCategoryBudget}
                  onChange={(e) => setNewCategoryBudget(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddingCategory(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={loading === 'new'}
                className="bg-[#823F91] hover:bg-[#6D3478] text-white"
              >
                {loading === 'new' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

