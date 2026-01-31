'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { MapPin, Clock, Phone, Mail, Store, CalendarCheck, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BoutiqueData {
  has_physical_location: boolean
  boutique_name: string | null
  boutique_address: string | null
  boutique_address_complement: string | null
  boutique_postal_code: string | null
  boutique_city: string | null
  boutique_country: string | null
  boutique_phone: string | null
  boutique_email: string | null
  boutique_hours: Record<string, { open: string; close: string; closed: boolean }> | null
  boutique_notes: string | null
  boutique_appointment_only: boolean
}

interface BoutiqueEditorProps {
  userId: string
  initialData?: Partial<BoutiqueData>
  onSave?: () => void
}

const DAYS = [
  { id: 'lundi', label: 'Lundi' },
  { id: 'mardi', label: 'Mardi' },
  { id: 'mercredi', label: 'Mercredi' },
  { id: 'jeudi', label: 'Jeudi' },
  { id: 'vendredi', label: 'Vendredi' },
  { id: 'samedi', label: 'Samedi' },
  { id: 'dimanche', label: 'Dimanche' },
]

const DEFAULT_HOURS: Record<string, { open: string; close: string; closed: boolean }> = {
  lundi: { open: '09:00', close: '18:00', closed: false },
  mardi: { open: '09:00', close: '18:00', closed: false },
  mercredi: { open: '09:00', close: '18:00', closed: false },
  jeudi: { open: '09:00', close: '18:00', closed: false },
  vendredi: { open: '09:00', close: '18:00', closed: false },
  samedi: { open: '10:00', close: '17:00', closed: false },
  dimanche: { open: '10:00', close: '17:00', closed: true },
}

export function BoutiqueEditor({ userId, initialData, onSave }: BoutiqueEditorProps) {
  const [hasLocation, setHasLocation] = useState(initialData?.has_physical_location || false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [boutiqueName, setBoutiqueName] = useState(initialData?.boutique_name || '')
  const [address, setAddress] = useState(initialData?.boutique_address || '')
  const [addressComplement, setAddressComplement] = useState(initialData?.boutique_address_complement || '')
  const [postalCode, setPostalCode] = useState(initialData?.boutique_postal_code || '')
  const [city, setCity] = useState(initialData?.boutique_city || '')
  const [phone, setPhone] = useState(initialData?.boutique_phone || '')
  const [email, setEmail] = useState(initialData?.boutique_email || '')
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    initialData?.boutique_hours || DEFAULT_HOURS
  )
  const [notes, setNotes] = useState(initialData?.boutique_notes || '')
  const [appointmentOnly, setAppointmentOnly] = useState(initialData?.boutique_appointment_only || false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Auto-expand when hasLocation is true and there's address data, or when user enables it
  useEffect(() => {
    if (hasLocation) {
      setIsExpanded(true)
    }
  }, [hasLocation])

  // Track changes
  useEffect(() => {
    const currentData = {
      has_physical_location: hasLocation,
      boutique_name: boutiqueName || null,
      boutique_address: address || null,
      boutique_address_complement: addressComplement || null,
      boutique_postal_code: postalCode || null,
      boutique_city: city || null,
      boutique_phone: phone || null,
      boutique_email: email || null,
      boutique_hours: hours,
      boutique_notes: notes || null,
      boutique_appointment_only: appointmentOnly,
    }

    const initial = {
      has_physical_location: initialData?.has_physical_location || false,
      boutique_name: initialData?.boutique_name || null,
      boutique_address: initialData?.boutique_address || null,
      boutique_address_complement: initialData?.boutique_address_complement || null,
      boutique_postal_code: initialData?.boutique_postal_code || null,
      boutique_city: initialData?.boutique_city || null,
      boutique_phone: initialData?.boutique_phone || null,
      boutique_email: initialData?.boutique_email || null,
      boutique_hours: initialData?.boutique_hours || DEFAULT_HOURS,
      boutique_notes: initialData?.boutique_notes || null,
      boutique_appointment_only: initialData?.boutique_appointment_only || false,
    }

    setHasChanges(JSON.stringify(currentData) !== JSON.stringify(initial))
  }, [hasLocation, boutiqueName, address, addressComplement, postalCode, city, phone, email, hours, notes, appointmentOnly, initialData])

  const updateHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({
          has_physical_location: hasLocation,
          boutique_name: boutiqueName || null,
          boutique_address: address || null,
          boutique_address_complement: addressComplement || null,
          boutique_postal_code: postalCode || null,
          boutique_city: city || null,
          boutique_country: 'France',
          boutique_phone: phone || null,
          boutique_email: email || null,
          boutique_hours: hasLocation ? hours : null,
          boutique_notes: notes || null,
          boutique_appointment_only: appointmentOnly,
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('Informations boutique mises à jour')
      setHasChanges(false)
      onSave?.()
    } catch (error: any) {
      console.error('Error saving boutique info:', error)
      toast.error('Erreur lors de la sauvegarde', {
        description: error.message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Build formatted address for display
  const formattedAddress = [address, postalCode, city].filter(Boolean).join(', ')

  // Handle click on the toggle section to expand/collapse or enable
  const handleToggleClick = () => {
    if (!hasLocation) {
      setHasLocation(true)
      setIsExpanded(true)
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toggle boutique - Clickable section */}
      <div
        className={cn(
          "rounded-xl border transition-all duration-300 overflow-hidden",
          hasLocation
            ? "bg-gradient-to-r from-[#823F91]/5 to-[#9D5FA8]/5 border-[#823F91]/20"
            : "bg-gray-50 border-gray-200 hover:border-[#823F91]/30 hover:bg-[#823F91]/5"
        )}
      >
        {/* Header - Always visible and clickable */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer group"
          onClick={handleToggleClick}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
              hasLocation
                ? "bg-gradient-to-br from-[#823F91] to-[#9D5FA8]"
                : "bg-gray-200 group-hover:bg-[#823F91]/20"
            )}>
              <Store className={cn(
                "h-5 w-5 transition-colors",
                hasLocation ? "text-white" : "text-gray-500 group-hover:text-[#823F91]"
              )} />
            </div>
            <div className="flex-1">
              <Label className="text-base font-medium cursor-pointer">Boutique / Showroom</Label>
              {!hasLocation ? (
                <p className="text-sm text-muted-foreground">
                  Cliquez pour ajouter votre lieu physique
                </p>
              ) : formattedAddress ? (
                <p className="text-sm text-[#823F91] flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {formattedAddress}
                </p>
              ) : (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <Pencil className="h-3 w-3" />
                  Cliquez pour renseigner l'adresse
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={hasLocation}
              onCheckedChange={(checked) => {
                setHasLocation(checked)
                if (checked) setIsExpanded(true)
              }}
              onClick={(e) => e.stopPropagation()}
            />
            {hasLocation && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                className="p-1 rounded-lg hover:bg-white/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Boutique details - Expandable content */}
        {hasLocation && isExpanded && (
          <div className="px-4 pb-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-[#823F91]/10 pt-4">
          {/* Nom de la boutique */}
          <div className="space-y-2">
            <Label htmlFor="boutique-name">
              Nom de la boutique <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <Input
              id="boutique-name"
              placeholder="Si différent du nom de votre entreprise"
              value={boutiqueName}
              onChange={(e) => setBoutiqueName(e.target.value)}
            />
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#823F91]" />
              <Label className="text-base">Adresse</Label>
            </div>

            <div className="grid gap-3">
              <Input
                placeholder="Numéro et rue"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input
                placeholder="Complément (bâtiment, étage...)"
                value={addressComplement}
                onChange={(e) => setAddressComplement(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Code postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
                <Input
                  placeholder="Ville"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#823F91]" />
                Téléphone
              </Label>
              <Input
                type="tel"
                placeholder="01 23 45 67 89"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#823F91]" />
                Email
              </Label>
              <Input
                type="email"
                placeholder="boutique@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Sur rendez-vous */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-5 w-5 text-amber-600" />
              <div>
                <Label className="text-base font-medium">Sur rendez-vous uniquement</Label>
                <p className="text-sm text-muted-foreground">
                  Les clients doivent prendre RDV avant de venir
                </p>
              </div>
            </div>
            <Switch
              checked={appointmentOnly}
              onCheckedChange={setAppointmentOnly}
            />
          </div>

          {/* Horaires */}
          {!appointmentOnly && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#823F91]" />
                <Label className="text-base">Horaires d'ouverture</Label>
              </div>

              <div className="space-y-2">
                {DAYS.map((day) => (
                  <div
                    key={day.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      hours[day.id]?.closed ? 'bg-gray-50 opacity-60' : 'bg-white'
                    )}
                  >
                    <div className="w-24 font-medium text-sm">{day.label}</div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hours[day.id]?.closed || false}
                        onChange={(e) => updateHours(day.id, 'closed', e.target.checked)}
                        className="rounded border-gray-300 text-[#823F91] focus:ring-[#823F91]"
                      />
                      <span className="text-sm text-gray-600">Fermé</span>
                    </label>

                    {!hours[day.id]?.closed && (
                      <div className="flex items-center gap-2 ml-auto">
                        <Input
                          type="time"
                          value={hours[day.id]?.open || '09:00'}
                          onChange={(e) => updateHours(day.id, 'open', e.target.value)}
                          className="w-28 text-sm"
                        />
                        <span className="text-gray-400">—</span>
                        <Input
                          type="time"
                          value={hours[day.id]?.close || '18:00'}
                          onChange={(e) => updateHours(day.id, 'close', e.target.value)}
                          className="w-28 text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="boutique-notes">
              Informations complémentaires <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <Textarea
              id="boutique-notes"
              placeholder="Parking disponible, accès PMR, code d'entrée..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          </div>
        )}
      </div>

      {/* Save button */}
      {hasChanges && (
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setHasLocation(initialData?.has_physical_location || false)
              setBoutiqueName(initialData?.boutique_name || '')
              setAddress(initialData?.boutique_address || '')
              setAddressComplement(initialData?.boutique_address_complement || '')
              setPostalCode(initialData?.boutique_postal_code || '')
              setCity(initialData?.boutique_city || '')
              setPhone(initialData?.boutique_phone || '')
              setEmail(initialData?.boutique_email || '')
              setHours(initialData?.boutique_hours || DEFAULT_HOURS)
              setNotes(initialData?.boutique_notes || '')
              setAppointmentOnly(initialData?.boutique_appointment_only || false)
            }}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478]"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  )
}
