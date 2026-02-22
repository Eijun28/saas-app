'use client'

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, UserPlus, Eye, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { type BudgetCategory, type BudgetProvider } from '@/lib/types/budget'
import { updateCategoryBudget, deleteCategory, addProvider, updateProviderStatus, deleteProvider } from '@/lib/actions/budget'
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

  // États pour "Ajouter un prestataire"
  const [addProviderCategoryId, setAddProviderCategoryId] = useState<string | null>(null)
  const [addProviderCategoryName, setAddProviderCategoryName] = useState('')
  const [providerName, setProviderName] = useState('')
  const [providerDevis, setProviderDevis] = useState('')
  const [providerStatut, setProviderStatut] = useState<'contacte' | 'devis_recu' | 'valide' | 'paye'>('contacte')
  const [providerNotes, setProviderNotes] = useState('')
  const [loadingProvider, setLoadingProvider] = useState(false)

  // États pour "Voir détails"
  const [detailCategoryId, setDetailCategoryId] = useState<string | null>(null)
  const [detailCategoryName, setDetailCategoryName] = useState('')
  const [categoryProviders, setCategoryProviders] = useState<BudgetProvider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)

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

  const openAddProvider = (categoryId: string, categoryName: string) => {
    setAddProviderCategoryId(categoryId)
    setAddProviderCategoryName(categoryName)
    setProviderName('')
    setProviderDevis('')
    setProviderStatut('contacte')
    setProviderNotes('')
  }

  const handleAddProvider = async () => {
    if (!providerName.trim()) {
      toast.error('Veuillez entrer un nom de prestataire')
      return
    }
    const devis = parseFloat(providerDevis) || 0
    if (devis < 0) {
      toast.error('Le montant doit être positif')
      return
    }

    setLoadingProvider(true)
    const result = await addProvider({
      name: providerName.trim(),
      category: addProviderCategoryName,
      devis,
      statut: providerStatut,
      notes: providerNotes.trim() || undefined,
    })
    setLoadingProvider(false)

    if (result.error) {
      toast.error(`Erreur: ${result.error}`)
    } else {
      toast.success('Prestataire ajouté au budget')
      setAddProviderCategoryId(null)
      onUpdate()
    }
  }

  const openCategoryDetail = async (categoryId: string, categoryName: string) => {
    setDetailCategoryId(categoryId)
    setDetailCategoryName(categoryName)
    setCategoryProviders([])
    setLoadingProviders(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('budget_providers')
      .select('*')
      .eq('category', categoryName)
      .order('created_at', { ascending: false })

    setLoadingProviders(false)
    setCategoryProviders(data || [])
  }

  const handleProviderStatusChange = async (
    providerId: string,
    statut: 'contacte' | 'devis_recu' | 'valide' | 'paye'
  ) => {
    const result = await updateProviderStatus(providerId, statut)
    if (result.error) {
      toast.error(`Erreur: ${result.error}`)
    } else {
      setCategoryProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, statut } : p))
      )
      onUpdate()
    }
  }

  const handleProviderDelete = async (providerId: string) => {
    if (!confirm('Supprimer ce prestataire du budget ?')) return
    const result = await deleteProvider(providerId)
    if (result.error) {
      toast.error(`Erreur: ${result.error}`)
    } else {
      toast.success('Prestataire supprimé')
      setCategoryProviders((prev) => prev.filter((p) => p.id !== providerId))
      onUpdate()
    }
  }

  const statutLabel: Record<string, string> = {
    contacte: 'Contacté',
    devis_recu: 'Devis reçu',
    valide: 'Validé',
    paye: 'Payé',
  }

  const statutColor: Record<string, string> = {
    contacte: 'bg-gray-100 text-gray-700',
    devis_recu: 'bg-blue-100 text-blue-700',
    valide: 'bg-green-100 text-green-700',
    paye: 'bg-purple-100 text-purple-700',
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
                          onClick={() => openAddProvider(category.id, category.category_name)}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                          Ajouter un prestataire
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCategoryDetail(category.id, category.category_name)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
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

      {/* Modal Ajouter un prestataire */}
      <Dialog open={!!addProviderCategoryId} onOpenChange={(open) => !open && setAddProviderCategoryId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un prestataire</DialogTitle>
            <DialogDescription>
              Catégorie : <strong>{addProviderCategoryName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider-name">Nom du prestataire</Label>
              <Input
                id="provider-name"
                placeholder="Ex: Studio Photo Martin"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-devis">Montant du devis (€)</Label>
              <Input
                id="provider-devis"
                type="number"
                min="0"
                step="100"
                placeholder="2500"
                value={providerDevis}
                onChange={(e) => setProviderDevis(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={providerStatut}
                onValueChange={(v) => setProviderStatut(v as typeof providerStatut)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacte">Contacté</SelectItem>
                  <SelectItem value="devis_recu">Devis reçu</SelectItem>
                  <SelectItem value="valide">Validé</SelectItem>
                  <SelectItem value="paye">Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-notes">Notes (optionnel)</Label>
              <Input
                id="provider-notes"
                placeholder="Remarques, conditions..."
                value={providerNotes}
                onChange={(e) => setProviderNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProviderCategoryId(null)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddProvider}
              disabled={loadingProvider}
              className="bg-[#823F91] hover:bg-[#6D3478] text-white"
            >
              {loadingProvider ? (
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

      {/* Modal Voir détails */}
      <Dialog open={!!detailCategoryId} onOpenChange={(open) => !open && setDetailCategoryId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails — {detailCategoryName}</DialogTitle>
            <DialogDescription>
              Prestataires associés à cette catégorie
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {loadingProviders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#823F91]" />
              </div>
            ) : categoryProviders.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">
                <p className="text-sm">Aucun prestataire pour cette catégorie.</p>
                <p className="text-xs mt-1">Utilisez "Ajouter un prestataire" pour en ajouter un.</p>
              </div>
            ) : (
              categoryProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="border border-[#E5E7EB] rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#111827] truncate">{provider.provider_name}</p>
                      <p className="text-sm text-[#6B7280]">
                        {Number(provider.devis).toLocaleString('fr-FR')} €
                      </p>
                      {provider.notes && (
                        <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-2">{provider.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleProviderDelete(provider.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Select
                    value={provider.statut}
                    onValueChange={(v) =>
                      handleProviderStatusChange(provider.id, v as typeof provider.statut)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacte">Contacté</SelectItem>
                      <SelectItem value="devis_recu">Devis reçu</SelectItem>
                      <SelectItem value="valide">Validé</SelectItem>
                      <SelectItem value="paye">Payé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDetailCategoryId(null)
                openAddProvider(detailCategoryId!, detailCategoryName)
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un prestataire
            </Button>
            <Button variant="outline" onClick={() => setDetailCategoryId(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

