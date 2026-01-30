'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Trash2, Star, GripVertical, Euro } from 'lucide-react'
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
  formatPricing,
} from '@/lib/types/pricing'
import {
  addProviderPricing,
  updateProviderPricing,
  deleteProviderPricing,
  setPrimaryPricing,
} from '@/lib/actions/provider-pricing'

interface PricingEditorProps {
  providerId: string
  initialPricing: ProviderPricing[]
  onUpdate?: () => void
}

interface LocalPricing extends Partial<ProviderPricing> {
  localId: string
  isNew?: boolean
  isEditing?: boolean
}

export function PricingEditor({ providerId, initialPricing, onUpdate }: PricingEditorProps) {
  const [pricings, setPricings] = useState<LocalPricing[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setPricings(
      initialPricing.map(p => ({
        ...p,
        localId: p.id,
        isNew: false,
        isEditing: false,
      }))
    )
  }, [initialPricing])

  const addNewPricing = () => {
    const newPricing: LocalPricing = {
      localId: `new-${Date.now()}`,
      pricing_unit: 'forfait',
      price_min: null,
      price_max: null,
      label: '',
      is_primary: pricings.length === 0, // First one is primary
      display_order: pricings.length,
      isNew: true,
      isEditing: true,
    }
    setPricings([...pricings, newPricing])
  }

  const updateLocalPricing = (localId: string, updates: Partial<LocalPricing>) => {
    setPricings(pricings.map(p =>
      p.localId === localId ? { ...p, ...updates, isEditing: true } : p
    ))
  }

  const removePricing = async (localId: string) => {
    const pricing = pricings.find(p => p.localId === localId)
    if (!pricing) return

    if (pricing.isNew) {
      setPricings(pricings.filter(p => p.localId !== localId))
      return
    }

    if (!pricing.id) return

    setIsSaving(true)
    const { error } = await deleteProviderPricing(pricing.id)
    setIsSaving(false)

    if (error) {
      toast.error('Erreur', { description: error })
      return
    }

    setPricings(pricings.filter(p => p.localId !== localId))
    toast.success('Tarif supprimé')
    onUpdate?.()
  }

  const savePricing = async (localId: string) => {
    const pricing = pricings.find(p => p.localId === localId)
    if (!pricing) return

    const config = getPricingUnitConfig(pricing.pricing_unit as PricingUnit)

    // Validation
    if (config.requiresPrice && !pricing.price_min) {
      toast.error('Erreur', { description: 'Veuillez indiquer un prix' })
      return
    }

    if (pricing.price_min && pricing.price_max && pricing.price_min > pricing.price_max) {
      toast.error('Erreur', { description: 'Le prix minimum ne peut pas être supérieur au maximum' })
      return
    }

    setIsSaving(true)

    if (pricing.isNew) {
      const { data, error } = await addProviderPricing({
        pricing_unit: pricing.pricing_unit as PricingUnit,
        price_min: pricing.price_min || null,
        price_max: pricing.price_max || null,
        label: pricing.label || null,
        is_primary: pricing.is_primary || false,
        display_order: pricing.display_order || 0,
      })

      setIsSaving(false)

      if (error) {
        toast.error('Erreur', { description: error })
        return
      }

      if (data) {
        setPricings(pricings.map(p =>
          p.localId === localId
            ? { ...data, localId: data.id, isNew: false, isEditing: false }
            : p
        ))
        toast.success('Tarif ajouté')
        onUpdate?.()
      }
    } else if (pricing.id) {
      const { data, error } = await updateProviderPricing(pricing.id, {
        pricing_unit: pricing.pricing_unit as PricingUnit,
        price_min: pricing.price_min || null,
        price_max: pricing.price_max || null,
        label: pricing.label || null,
        is_primary: pricing.is_primary || false,
      })

      setIsSaving(false)

      if (error) {
        toast.error('Erreur', { description: error })
        return
      }

      if (data) {
        setPricings(pricings.map(p =>
          p.localId === localId
            ? { ...data, localId: data.id, isNew: false, isEditing: false }
            : p
        ))
        toast.success('Tarif mis à jour')
        onUpdate?.()
      }
    }
  }

  const setAsPrimary = async (localId: string) => {
    const pricing = pricings.find(p => p.localId === localId)
    if (!pricing?.id || pricing.isNew) return

    setIsSaving(true)
    const { error } = await setPrimaryPricing(pricing.id)
    setIsSaving(false)

    if (error) {
      toast.error('Erreur', { description: error })
      return
    }

    setPricings(pricings.map(p => ({
      ...p,
      is_primary: p.localId === localId,
    })))
    toast.success('Tarif principal défini')
    onUpdate?.()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Vos tarifs</Label>
          <p className="text-sm text-muted-foreground">
            Définissez vos différents tarifs (forfait, par personne, etc.)
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addNewPricing}
          disabled={isSaving}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {pricings.length === 0 ? (
        <div className="border border-dashed rounded-xl p-6 text-center text-muted-foreground">
          <Euro className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun tarif défini</p>
          <p className="text-xs mt-1">Cliquez sur "Ajouter" pour définir vos prix</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pricings.map((pricing) => (
            <PricingItem
              key={pricing.localId}
              pricing={pricing}
              onUpdate={(updates) => updateLocalPricing(pricing.localId, updates)}
              onSave={() => savePricing(pricing.localId)}
              onRemove={() => removePricing(pricing.localId)}
              onSetPrimary={() => setAsPrimary(pricing.localId)}
              isSaving={isSaving}
              totalCount={pricings.length}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface PricingItemProps {
  pricing: LocalPricing
  onUpdate: (updates: Partial<LocalPricing>) => void
  onSave: () => void
  onRemove: () => void
  onSetPrimary: () => void
  isSaving: boolean
  totalCount: number
}

function PricingItem({
  pricing,
  onUpdate,
  onSave,
  onRemove,
  onSetPrimary,
  isSaving,
  totalCount,
}: PricingItemProps) {
  const config = getPricingUnitConfig(pricing.pricing_unit as PricingUnit)
  const showPriceInputs = config.requiresPrice

  return (
    <div
      className={cn(
        'border rounded-xl p-4 space-y-3 transition-colors',
        pricing.is_primary && 'border-[#823F91] bg-[#823F91]/5',
        pricing.isEditing && 'border-blue-300 bg-blue-50/50'
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />

        <Select
          value={pricing.pricing_unit}
          onValueChange={(value) => onUpdate({ pricing_unit: value as PricingUnit })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Type de tarif" />
          </SelectTrigger>
          <SelectContent className="!bg-white">
            {PRICING_UNITS.map((unit) => (
              <SelectItem key={unit.value} value={unit.value}>
                {unit.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          {totalCount > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onSetPrimary}
              disabled={isSaving || pricing.isNew || pricing.is_primary}
              className={cn(
                'h-8 w-8',
                pricing.is_primary && 'text-[#823F91]'
              )}
              title={pricing.is_primary ? 'Tarif principal' : 'Définir comme principal'}
            >
              <Star
                className={cn('h-4 w-4', pricing.is_primary && 'fill-current')}
              />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={isSaving}
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Price inputs */}
      {showPriceInputs && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              Prix {config.allowRange ? 'minimum' : ''} (€)
            </Label>
            <Input
              type="number"
              placeholder={config.placeholder}
              value={pricing.price_min ?? ''}
              onChange={(e) => onUpdate({
                price_min: e.target.value ? parseFloat(e.target.value) : null
              })}
              min="0"
              step="0.01"
            />
          </div>
          {config.allowRange && (
            <div>
              <Label className="text-xs text-muted-foreground">
                Prix maximum (€) <span className="opacity-50">optionnel</span>
              </Label>
              <Input
                type="number"
                placeholder={config.placeholder}
                value={pricing.price_max ?? ''}
                onChange={(e) => onUpdate({
                  price_max: e.target.value ? parseFloat(e.target.value) : null
                })}
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>
      )}

      {/* Label/description (optional) */}
      <div>
        <Label className="text-xs text-muted-foreground">
          Description <span className="opacity-50">optionnel</span>
        </Label>
        <Input
          type="text"
          placeholder="Ex: Menu standard, Formule journée..."
          value={pricing.label ?? ''}
          onChange={(e) => onUpdate({ label: e.target.value || null })}
        />
      </div>

      {/* Preview & Save */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-sm">
          <span className="text-muted-foreground">Aperçu : </span>
          <span className="font-medium">
            {pricing.pricing_unit === 'sur_devis'
              ? 'Sur devis'
              : pricing.price_min
                ? formatPricing(pricing as ProviderPricing)
                : '—'
            }
          </span>
        </div>

        {pricing.isEditing && (
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="bg-[#823F91] hover:bg-[#6D3478]"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        )}
      </div>
    </div>
  )
}
