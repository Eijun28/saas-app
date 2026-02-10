'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Euro, X, Check } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ProviderPricing, PricingUnit } from '@/lib/types/pricing'
import {
  PRICING_UNITS,
  getPricingUnitConfig,
  formatPrice,
} from '@/lib/types/pricing'
import {
  addProviderPricing,
  updateProviderPricing,
  deleteProviderPricing,
} from '@/lib/actions/provider-pricing'

interface PricingEditorProps {
  providerId: string
  initialPricing: ProviderPricing[]
  onUpdate?: () => void
}

export function PricingEditor({ providerId, initialPricing, onUpdate }: PricingEditorProps) {
  const [pricings, setPricings] = useState<ProviderPricing[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state for new/editing pricing
  const [formData, setFormData] = useState({
    pricing_unit: 'forfait' as PricingUnit,
    price_min: '' as string,
    price_max: '' as string,
    label: '',
  })

  useEffect(() => {
    setPricings(initialPricing)
  }, [initialPricing])

  const resetForm = () => {
    setFormData({
      pricing_unit: 'forfait',
      price_min: '',
      price_max: '',
      label: '',
    })
  }

  const startEditing = (pricing: ProviderPricing) => {
    setEditingId(pricing.id)
    setIsAdding(false)
    setFormData({
      pricing_unit: pricing.pricing_unit,
      price_min: pricing.price_min?.toString() || '',
      price_max: pricing.price_max?.toString() || '',
      label: pricing.label || '',
    })
  }

  const startAdding = () => {
    setIsAdding(true)
    setEditingId(null)
    resetForm()
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    resetForm()
  }

  const handleSave = async () => {
    const config = getPricingUnitConfig(formData.pricing_unit)

    // Validation
    if (config.requiresPrice && !formData.price_min) {
      toast.error('Veuillez indiquer un prix')
      return
    }

    const priceMin = formData.price_min ? parseFloat(formData.price_min) : null
    const priceMax = formData.price_max ? parseFloat(formData.price_max) : null

    if (priceMin && priceMax && priceMin > priceMax) {
      toast.error('Le prix minimum ne peut pas être supérieur au maximum')
      return
    }

    setIsSaving(true)

    if (isAdding) {
      // Add new pricing
      const { data, error } = await addProviderPricing({
        pricing_unit: formData.pricing_unit,
        price_min: priceMin,
        price_max: priceMax,
        label: formData.label || null,
        is_primary: pricings.length === 0,
        display_order: pricings.length,
      })

      if (error) {
        toast.error('Erreur', { description: error })
        setIsSaving(false)
        return
      }

      if (data) {
        setPricings([...pricings, data])
        toast.success('Tarif ajouté')
        setIsAdding(false)
        resetForm()
        onUpdate?.()
      }
    } else if (editingId) {
      // Update existing pricing
      const { data, error } = await updateProviderPricing(editingId, {
        pricing_unit: formData.pricing_unit,
        price_min: priceMin,
        price_max: priceMax,
        label: formData.label || null,
      })

      if (error) {
        toast.error('Erreur', { description: error })
        setIsSaving(false)
        return
      }

      if (data) {
        setPricings(pricings.map(p => p.id === editingId ? data : p))
        toast.success('Tarif mis à jour')
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

    setPricings(pricings.filter(p => p.id !== id))
    toast.success('Tarif supprimé')
    onUpdate?.()
  }

  const config = getPricingUnitConfig(formData.pricing_unit)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Vos tarifs</Label>
          <p className="text-sm text-muted-foreground">
            Définissez vos différents tarifs
          </p>
        </div>
        {!isAdding && !editingId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startAdding}
            disabled={isSaving}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Liste des tarifs enregistrés */}
      {pricings.length > 0 && !isAdding && !editingId && (
        <div className="space-y-2">
          {pricings.map((pricing) => {
            const unitConfig = getPricingUnitConfig(pricing.pricing_unit)
            return (
              <div
                key={pricing.id}
                className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Euro className="h-4 w-4 text-[#823F91]" />
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {unitConfig.shortLabel}
                      </span>
                      <span className="text-sm text-gray-500">:</span>
                      <span className="font-semibold text-gray-900">
                        {pricing.pricing_unit === 'sur_devis' ? (
                          'Sur devis'
                        ) : pricing.price_max && pricing.price_max !== pricing.price_min ? (
                          `${formatPrice(pricing.price_min)} - ${formatPrice(pricing.price_max)}`
                        ) : (
                          formatPrice(pricing.price_min)
                        )}
                      </span>
                    </div>
                    {pricing.label && (
                      <p className="text-xs text-gray-500 mt-0.5">{pricing.label}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(pricing)}
                    className="h-8 w-8 text-gray-500 hover:text-[#823F91]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(pricing.id)}
                    disabled={isSaving}
                    className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* État vide */}
      {pricings.length === 0 && !isAdding && (
        <div className="border border-dashed rounded-xl p-6 text-center text-muted-foreground">
          <Euro className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun tarif défini</p>
          <Button
            type="button"
            variant="link"
            onClick={startAdding}
            className="text-[#823F91] mt-1"
          >
            Ajouter votre premier tarif
          </Button>
        </div>
      )}

      {/* Formulaire d'ajout/édition */}
      {(isAdding || editingId) && (
        <div className="border rounded-xl p-4 space-y-4 bg-white shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {isAdding ? 'Nouveau tarif' : 'Modifier le tarif'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={cancelEdit}
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Type de tarif */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Type de tarif</Label>
            <Select
              value={formData.pricing_unit}
              onValueChange={(value) => setFormData({ ...formData, pricing_unit: value as PricingUnit })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {PRICING_UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prix */}
          {config.requiresPrice && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">
                  Prix {config.allowRange ? 'minimum' : ''} (€)
                </Label>
                <Input
                  type="number"
                  placeholder={config.placeholder}
                  value={formData.price_min}
                  onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
              {config.allowRange && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">
                    Prix maximum (€) <span className="text-gray-400">optionnel</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder={config.placeholder}
                    value={formData.price_max}
                    onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">
              Description <span className="text-gray-400">optionnel</span>
            </Label>
            <Input
              type="text"
              placeholder="Ex: Menu standard, Formule journée..."
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            />
          </div>

          {/* Aperçu */}
          <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-500">Aperçu :</span>
            <span className="font-medium text-gray-900">
              {config.shortLabel} : {' '}
              {formData.pricing_unit === 'sur_devis' ? (
                'Sur devis'
              ) : formData.price_min ? (
                formData.price_max && formData.price_max !== formData.price_min ? (
                  `${formatPrice(parseFloat(formData.price_min))} - ${formatPrice(parseFloat(formData.price_max))}`
                ) : (
                  formatPrice(parseFloat(formData.price_min))
                )
              ) : (
                '—'
              )}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
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
