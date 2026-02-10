'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { MapPin, Clock, Phone, Mail, Store, CalendarCheck } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      {/* Toggle boutique - carte avec ombre 3D */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-white shadow-[0_4px_20px_-4px_rgba(130,63,145,0.15)] hover:shadow-[0_8px_30px_-4px_rgba(130,63,145,0.2)] transition-shadow duration-300">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#823F91]/10 to-[#823F91]/5">
            <Store className="h-6 w-6 text-[#823F91]" />
          </div>
          <div>
            <Label className="text-base font-semibold text-gray-900">Boutique / Showroom</Label>
            <p className="text-sm text-gray-500">
              Avez-vous un lieu physique ou recevoir vos clients ?
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={hasLocation}
          onClick={() => setHasLocation(!hasLocation)}
          className={cn(
            'relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91] focus-visible:ring-offset-2',
            hasLocation ? 'bg-[#823F91]' : 'bg-gray-200'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out mt-0.5',
              hasLocation ? 'translate-x-7 ml-0.5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Boutique details */}
      {hasLocation && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
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

          {/* Sur rendez-vous - carte avec ombre 3D */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.2)] hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.25)] transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50">
                <CalendarCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900">Sur rendez-vous uniquement</Label>
                <p className="text-sm text-gray-500">
                  Les clients doivent prendre RDV avant de venir
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={appointmentOnly}
              onClick={() => setAppointmentOnly(!appointmentOnly)}
              className={cn(
                'relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                appointmentOnly ? 'bg-amber-500' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out mt-0.5',
                  appointmentOnly ? 'translate-x-7 ml-0.5' : 'translate-x-0.5'
                )}
              />
            </button>
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
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  )
}
