'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Save, Check, ListChecks, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getServiceFieldGroups,
  hasServiceFields,
  type ServiceFieldConfig,
  type ServiceFieldGroup,
} from '@/lib/constants/service-fields'

interface ServiceDetailsEditorProps {
  userId: string
  serviceType: string
  onSave?: () => void
}

export function ServiceDetailsEditor({
  userId,
  serviceType,
  onSave,
}: ServiceDetailsEditorProps) {
  const [details, setDetails] = useState<Record<string, unknown>>({})
  const [initialDetails, setInitialDetails] = useState<Record<string, unknown>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasExistingRecord, setHasExistingRecord] = useState(false)

  const fieldGroups = getServiceFieldGroups(serviceType)

  // Load existing data
  useEffect(() => {
    async function loadDetails() {
      setIsLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('provider_service_details')
        .select('details')
        .eq('profile_id', userId)
        .maybeSingle()

      if (data?.details) {
        const loaded = data.details as Record<string, unknown>
        setDetails(loaded)
        setInitialDetails(loaded)
        setHasExistingRecord(true)
      }
      setIsLoading(false)
    }

    if (userId && serviceType) {
      loadDetails()
    }
  }, [userId, serviceType])

  const hasChanges = JSON.stringify(details) !== JSON.stringify(initialDetails)

  const updateField = useCallback((key: string, value: unknown) => {
    setDetails(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleMultiSelectValue = useCallback((key: string, value: string) => {
    setDetails(prev => {
      const current = (prev[key] as string[]) || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [key]: updated }
    })
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      if (hasExistingRecord) {
        const { error } = await supabase
          .from('provider_service_details')
          .update({
            details,
            service_type: serviceType,
          })
          .eq('profile_id', userId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('provider_service_details')
          .insert({
            profile_id: userId,
            service_type: serviceType,
            details,
          })

        if (error) throw error
        setHasExistingRecord(true)
      }

      setInitialDetails(details)
      toast.success('Détails métier enregistrés')
      onSave?.()
    } catch (error: any) {
      console.error('Error saving service details:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  if (!hasServiceFields(serviceType)) {
    return (
      <div className="text-center py-6">
        <div className="p-3 rounded-full bg-gray-100 inline-flex mb-3">
          <AlertCircle className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm text-muted-foreground">
          Aucun détail spécifique disponible pour ce type de métier.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {fieldGroups.map((group, groupIdx) => (
        <FieldGroupRenderer
          key={groupIdx}
          group={group}
          details={details}
          onUpdateField={updateField}
          onToggleMultiSelect={toggleMultiSelectValue}
        />
      ))}

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="gap-2 bg-[#823F91] hover:bg-[#6D3478] text-white"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer les détails
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Sub-components for rendering field groups and individual fields
// ============================================================

function FieldGroupRenderer({
  group,
  details,
  onUpdateField,
  onToggleMultiSelect,
}: {
  group: ServiceFieldGroup
  details: Record<string, unknown>
  onUpdateField: (key: string, value: unknown) => void
  onToggleMultiSelect: (key: string, value: string) => void
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-[#823F91]" />
        {group.title}
      </h4>
      {group.description && (
        <p className="text-xs text-muted-foreground -mt-2">{group.description}</p>
      )}
      <div className="space-y-4">
        {group.fields.map(field => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={details[field.key]}
            onUpdate={(value) => onUpdateField(field.key, value)}
            onToggleMultiSelect={(value) => onToggleMultiSelect(field.key, value)}
          />
        ))}
      </div>
    </div>
  )
}

function FieldRenderer({
  field,
  value,
  onUpdate,
  onToggleMultiSelect,
}: {
  field: ServiceFieldConfig
  value: unknown
  onUpdate: (value: unknown) => void
  onToggleMultiSelect: (value: string) => void
}) {
  switch (field.type) {
    case 'multi-select':
      return (
        <MultiSelectField
          field={field}
          selectedValues={(value as string[]) || []}
          onToggle={onToggleMultiSelect}
        />
      )
    case 'single-select':
      return (
        <SingleSelectField
          field={field}
          value={(value as string) || ''}
          onUpdate={onUpdate}
        />
      )
    case 'number':
      return (
        <NumberField
          field={field}
          value={value as number | undefined}
          onUpdate={onUpdate}
        />
      )
    case 'boolean':
      return (
        <BooleanField
          field={field}
          value={(value as boolean) || false}
          onUpdate={onUpdate}
        />
      )
    case 'text':
      return (
        <TextField
          field={field}
          value={(value as string) || ''}
          onUpdate={onUpdate}
        />
      )
    default:
      return null
  }
}

function MultiSelectField({
  field,
  selectedValues,
  onToggle,
}: {
  field: ServiceFieldConfig
  selectedValues: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        {field.label}
        {selectedValues.length > 0 && (
          <span className="ml-2 text-xs text-[#823F91] font-normal">
            ({selectedValues.length} sélectionné{selectedValues.length > 1 ? 's' : ''})
          </span>
        )}
      </Label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {field.options?.map(option => {
          const isSelected = selectedValues.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                'border cursor-pointer',
                isSelected
                  ? 'bg-[#823F91]/10 border-[#823F91]/30 text-[#823F91]'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#823F91]/20 hover:bg-[#823F91]/5'
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SingleSelectField({
  field,
  value,
  onUpdate,
}: {
  field: ServiceFieldConfig
  value: string
  onUpdate: (value: unknown) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{field.label}</Label>
      <Select value={value} onValueChange={onUpdate}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sélectionner..." />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function NumberField({
  field,
  value,
  onUpdate,
}: {
  field: ServiceFieldConfig
  value: number | undefined
  onUpdate: (value: unknown) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{field.label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value
            onUpdate(v === '' ? undefined : Number(v))
          }}
          placeholder={field.placeholder || ''}
          min={field.min}
          max={field.max}
          className="max-w-[200px]"
        />
        {field.suffix && (
          <span className="text-sm text-muted-foreground">{field.suffix}</span>
        )}
      </div>
    </div>
  )
}

function BooleanField({
  field,
  value,
  onUpdate,
}: {
  field: ServiceFieldConfig
  value: boolean
  onUpdate: (value: unknown) => void
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Checkbox
        id={field.key}
        checked={value}
        onCheckedChange={onUpdate}
      />
      <Label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor={field.key}>
        {field.label}
      </Label>
    </div>
  )
}

function TextField({
  field,
  value,
  onUpdate,
}: {
  field: ServiceFieldConfig
  value: string
  onUpdate: (value: unknown) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{field.label}</Label>
      <Input
        value={value}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder={field.placeholder || ''}
      />
    </div>
  )
}
