'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Package,
  Euro,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProviderPricing } from '@/lib/types/pricing'
import { formatPrice } from '@/lib/types/pricing'
import {
  addProviderPricing,
  updateProviderPricing,
  deleteProviderPricing,
} from '@/lib/actions/provider-pricing'

interface ForfaitsManagerProps {
  providerId: string
  initialPricings: ProviderPricing[]
  onUpdate?: () => void
}

interface ForfaitFormData {
  label: string
  price_min: string
  price_max: string
  description: string
  forfait_items: string[]
  newItem: string
}

const EMPTY_FORM: ForfaitFormData = {
  label: '',
  price_min: '',
  price_max: '',
  description: '',
  forfait_items: [],
  newItem: '',
}

export function ForfaitsManager({ providerId, initialPricings, onUpdate }: ForfaitsManagerProps) {
  // Filtrer uniquement les forfaits
  const [forfaits, setForfaits] = useState<ProviderPricing[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<ForfaitFormData>(EMPTY_FORM)

  useEffect(() => {
    setForfaits(initialPricings.filter(p => p.pricing_unit === 'forfait'))
  }, [initialPricings])

  const resetForm = () => setForm(EMPTY_FORM)

  const startAdding = () => {
    setIsAdding(true)
    setEditingId(null)
    resetForm()
  }

  const startEditing = (p: ProviderPricing) => {
    setEditingId(p.id)
    setIsAdding(false)
    setForm({
      label: p.label || '',
      price_min: p.price_min?.toString() || '',
      price_max: p.price_max?.toString() || '',
      description: p.description || '',
      forfait_items: p.forfait_items || [],
      newItem: '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    resetForm()
  }

  const addItem = () => {
    const item = form.newItem.trim()
    if (!item) return
    setForm(prev => ({ ...prev, forfait_items: [...prev.forfait_items, item], newItem: '' }))
  }

  const removeItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      forfait_items: prev.forfait_items.filter((_, i) => i !== index),
    }))
  }

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast.error('Veuillez nommer votre forfait')
      return
    }
    if (!form.price_min && !form.price_max) {
      toast.error('Veuillez indiquer un prix')
      return
    }

    const priceMin = form.price_min ? parseFloat(form.price_min) : null
    const priceMax = form.price_max ? parseFloat(form.price_max) : null

    if (priceMin && priceMax && priceMin > priceMax) {
      toast.error('Le prix minimum ne peut pas être supérieur au maximum')
      return
    }

    setIsSaving(true)

    const payload = {
      pricing_unit: 'forfait' as const,
      label: form.label.trim(),
      price_min: priceMin,
      price_max: priceMax,
      description: form.description.trim() || null,
      forfait_items: form.forfait_items.length > 0 ? form.forfait_items : null,
      is_primary: forfaits.length === 0 && isAdding,
      display_order: forfaits.length,
    }

    if (isAdding) {
      const { data, error } = await addProviderPricing(payload)
      if (error) {
        toast.error('Erreur', { description: error })
        setIsSaving(false)
        return
      }
      if (data) {
        setForfaits(prev => [...prev, data])
        toast.success('Forfait créé')
        setIsAdding(false)
        resetForm()
        onUpdate?.()
      }
    } else if (editingId) {
      const { data, error } = await updateProviderPricing(editingId, payload)
      if (error) {
        toast.error('Erreur', { description: error })
        setIsSaving(false)
        return
      }
      if (data) {
        setForfaits(prev => prev.map(p => p.id === editingId ? data : p))
        toast.success('Forfait mis à jour')
        setEditingId(null)
        resetForm()
        onUpdate?.()
      }
    }

    setIsSaving(false)
  }

  const handleDelete = async (id: string) => {
    setIsSaving(true)
    const { error } = await deleteProviderPricing(id)
    setIsSaving(false)
    if (error) {
      toast.error('Erreur', { description: error })
      return
    }
    setForfaits(prev => prev.filter(p => p.id !== id))
    toast.success('Forfait supprimé')
    onUpdate?.()
  }

  const isFormOpen = isAdding || !!editingId

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Vos forfaits</Label>
          <p className="text-sm text-muted-foreground">
            Créez des formules clés-en-main avec liste de prestations incluses
          </p>
        </div>
        {!isFormOpen && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startAdding}
            disabled={isSaving}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau forfait
          </Button>
        )}
      </div>

      {/* Liste des forfaits */}
      {forfaits.length > 0 && !isFormOpen && (
        <div className="space-y-3">
          {forfaits.map((forfait) => (
            <div
              key={forfait.id}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden group hover:border-[#823F91]/40 transition-colors"
            >
              {/* Card header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#823F91]/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#823F91]/10">
                    <Package className="h-4 w-4 text-[#823F91]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{forfait.label}</p>
                    <div className="flex items-center gap-1 text-sm text-[#823F91] font-medium mt-0.5">
                      <Euro className="h-3 w-3" />
                      {forfait.price_min && forfait.price_max && forfait.price_min !== forfait.price_max
                        ? `${formatPrice(forfait.price_min)} – ${formatPrice(forfait.price_max)}`
                        : forfait.price_min
                          ? formatPrice(forfait.price_min)
                          : 'Sur devis'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(forfait)}
                    className="h-8 w-8 text-gray-500 hover:text-[#823F91]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(forfait.id)}
                    disabled={isSaving}
                    className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Description + items */}
              {(forfait.description || (forfait.forfait_items && forfait.forfait_items.length > 0)) && (
                <div className="px-4 pb-4 pt-2 space-y-2">
                  {forfait.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">{forfait.description}</p>
                  )}
                  {forfait.forfait_items && forfait.forfait_items.length > 0 && (
                    <ul className="space-y-1">
                      {forfait.forfait_items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* État vide */}
      {forfaits.length === 0 && !isFormOpen && (
        <div className="border border-dashed rounded-xl p-6 text-center text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Aucun forfait défini</p>
          <p className="text-xs text-gray-400 mt-1">
            Créez des formules tout-compris pour faciliter le choix des mariés
          </p>
          <Button
            type="button"
            variant="link"
            onClick={startAdding}
            className="text-[#823F91] mt-2"
          >
            Créer mon premier forfait
          </Button>
        </div>
      )}

      {/* Formulaire */}
      {isFormOpen && (
        <div className="border rounded-xl p-4 space-y-4 bg-white shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-[#823F91]" />
              {isAdding ? 'Nouveau forfait' : 'Modifier le forfait'}
            </span>
            <Button type="button" variant="ghost" size="icon" onClick={cancelEdit} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Nom du forfait */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Nom du forfait *</Label>
            <Input
              placeholder="Ex : Formule Essentielle, Pack Mariage Complet..."
              value={form.label}
              onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
            />
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Prix minimum (€) *</Label>
              <Input
                type="number"
                placeholder="1500"
                value={form.price_min}
                onChange={(e) => setForm(prev => ({ ...prev, price_min: e.target.value }))}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">
                Prix maximum (€) <span className="text-gray-400">optionnel</span>
              </Label>
              <Input
                type="number"
                placeholder="2500"
                value={form.price_max}
                onChange={(e) => setForm(prev => ({ ...prev, price_max: e.target.value }))}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">
              Description <span className="text-gray-400">optionnel</span>
            </Label>
            <Textarea
              placeholder="Décrivez ce que comprend ce forfait en quelques mots..."
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Prestations incluses */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              Prestations incluses <span className="text-gray-400">optionnel</span>
            </Label>

            {/* Existing items */}
            {form.forfait_items.length > 0 && (
              <ul className="space-y-1.5">
                {form.forfait_items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 py-1 px-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    <span className="flex-1">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add item */}
            <div className="flex gap-2">
              <Input
                placeholder="Ex : 8h de couverture photo, Livraison en 6 semaines..."
                value={form.newItem}
                onChange={(e) => setForm(prev => ({ ...prev, newItem: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItem()
                  }
                }}
                className="text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addItem}
                disabled={!form.newItem.trim()}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Aperçu du prix */}
          {(form.price_min || form.price_max) && (
            <div className="flex items-center gap-2 py-2 px-3 bg-[#823F91]/5 rounded-lg text-sm border border-[#823F91]/20">
              <Euro className="h-3.5 w-3.5 text-[#823F91]" />
              <span className="text-gray-500">Prix affiché :</span>
              <span className="font-semibold text-[#823F91]">
                {form.price_min && form.price_max && form.price_min !== form.price_max
                  ? `${formatPrice(parseFloat(form.price_min))} – ${formatPrice(parseFloat(form.price_max))}`
                  : form.price_min
                    ? formatPrice(parseFloat(form.price_min))
                    : form.price_max
                      ? formatPrice(parseFloat(form.price_max))
                      : '—'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEdit}
              disabled={isSaving}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white gap-2"
            >
              <Check className="h-4 w-4" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
