'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'
import {
  addProvider,
  updateProviderStatus,
  updateProvider,
  deleteProvider,
  type BudgetProvider,
} from '@/lib/actions/budget'
import { PREDEFINED_CATEGORIES } from '@/lib/types/budget'
import { Plus, Trash2, Loader2, Edit2, Check } from 'lucide-react'

type BudgetProvidersProps = {
  providers: BudgetProvider[]
  categories: string[]
  onUpdate: () => void
}

const STATUT_LABELS = {
  contacte: 'Contacté',
  devis_recu: 'Devis reçu',
  valide: 'Validé',
  paye: 'Payé',
}

const STATUT_COLORS = {
  contacte: 'outline',
  devis_recu: 'warning',
  valide: 'success',
  paye: 'default',
}

export function BudgetProviders({ providers, categories, onUpdate }: BudgetProvidersProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    devis: '',
    notes: '',
    statut: 'contacte' as const,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const devis = parseFloat(formData.devis)
    if (!formData.name.trim() || !formData.category || isNaN(devis) || devis < 0) {
      alert('Veuillez remplir tous les champs correctement')
      return
    }

    setLoading('new')
    const result = await addProvider({
      name: formData.name.trim(),
      category: formData.category,
      devis,
      statut: formData.statut,
      notes: formData.notes.trim() || undefined,
    })
    setLoading(null)

    if (result.error) {
      alert(`Erreur: ${result.error}`)
    } else {
      setFormData({
        name: '',
        category: '',
        devis: '',
        notes: '',
        statut: 'contacte',
      })
      setShowForm(false)
      onUpdate()
    }
  }

  const handleUpdateStatus = async (providerId: string, newStatus: typeof formData.statut) => {
    setLoading(providerId)
    const result = await updateProviderStatus(providerId, newStatus)
    setLoading(null)

    if (result.error) {
      alert(`Erreur: ${result.error}`)
    } else {
      onUpdate()
    }
  }

  const handleDelete = async (providerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prestataire ?')) {
      return
    }

    setLoading(providerId)
    const result = await deleteProvider(providerId)
    setLoading(null)

    if (result.error) {
      alert(`Erreur: ${result.error}`)
    } else {
      onUpdate()
    }
  }

  const handleStartEdit = (provider: BudgetProvider) => {
    setEditingId(provider.id)
    setFormData({
      name: provider.provider_name,
      category: provider.category,
      devis: provider.devis.toString(),
      notes: provider.notes || '',
      statut: provider.statut as "contacte",
    })
  }

  const handleSaveEdit = async (providerId: string) => {
    const devis = parseFloat(formData.devis)
    if (!formData.name.trim() || !formData.category || isNaN(devis) || devis < 0) {
      alert('Veuillez remplir tous les champs correctement')
      return
    }

    setLoading(providerId)
    const result = await updateProvider(providerId, {
      provider_name: formData.name.trim(),
      devis,
      notes: formData.notes.trim() || undefined,
    })
    setLoading(null)

    if (result.error) {
      alert(`Erreur: ${result.error}`)
    } else {
      setEditingId(null)
      onUpdate()
    }
  }

  const allCategories = Array.from(new Set([...PREDEFINED_CATEGORIES, ...categories]))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Prestataires</CardTitle>
            <CardDescription>
              Gérez vos prestataires et leurs devis
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            className="bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            <Plus className="h-4 w-4" />
            <span className="ml-2">Ajouter</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulaire d'ajout */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 border rounded-lg space-y-4 bg-[#F9FAFB]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider-name">Nom du prestataire</Label>
                <Input
                  id="provider-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Photographe Dupont"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger id="provider-category">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider-devis">Devis (€)</Label>
                <Input
                  id="provider-devis"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.devis}
                  onChange={(e) => setFormData({ ...formData, devis: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value: typeof formData.statut) =>
                    setFormData({ ...formData, statut: value })
                  }
                >
                  <SelectTrigger id="provider-statut">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUT_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-notes">Notes (optionnel)</Label>
              <Input
                id="provider-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading === 'new'}
                className="bg-[#823F91] hover:bg-[#6D3478] text-white"
              >
                {loading === 'new' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Ajouter
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    name: '',
                    category: '',
                    devis: '',
                    notes: '',
                    statut: 'contacte',
                  })
                }}
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </form>
        )}

        {/* Liste des prestataires */}
        {providers.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280]">
            <p>Aucun prestataire ajouté</p>
            <p className="text-sm mt-2">Cliquez sur "Ajouter" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => {
              const isEditing = editingId === provider.id
              const isLoading = loading === provider.id

              return (
                <div
                  key={provider.id}
                  className="p-4 border rounded-lg hover:bg-[#F9FAFB] transition-colors"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nom</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Devis (€)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            value={formData.devis}
                            onChange={(e) => setFormData({ ...formData, devis: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSaveEdit(provider.id)}
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
                          onClick={() => setEditingId(null)}
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-[#111827]">
                              {provider.provider_name}
                            </h3>
                            <Badge variant={STATUT_COLORS[provider.statut] as any}>
                              {STATUT_LABELS[provider.statut]}
                            </Badge>
                          </div>
                          <div className="text-sm text-[#6B7280] space-y-1">
                            <p>
                              <span className="font-medium">Catégorie:</span> {provider.category}
                            </p>
                            <p>
                              <span className="font-medium">Devis:</span>{' '}
                              {Number(provider.devis).toLocaleString('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                              })}
                            </p>
                            {provider.notes && (
                              <p>
                                <span className="font-medium">Notes:</span> {provider.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleStartEdit(provider)}
                            size="sm"
                            variant="outline"
                            disabled={isLoading}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(provider.id)}
                            size="sm"
                            variant="outline"
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-3 border-t">
                        <span className="text-xs text-[#6B7280]">Changer le statut:</span>
                        {Object.entries(STATUT_LABELS).map(([value, label]) => (
                          <Button
                            key={value}
                            onClick={() =>
                              handleUpdateStatus(provider.id, value as typeof formData.statut)
                            }
                            size="sm"
                            variant={
                              provider.statut === value ? 'default' : 'outline'
                            }
                            disabled={isLoading || provider.statut === value}
                            className={
                              provider.statut === value
                                ? 'bg-[#823F91] hover:bg-[#6D3478] text-white'
                                : ''
                            }
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </>
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

