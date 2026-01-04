'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Settings, X } from 'lucide-react'
import { useState } from 'react'

type PreferencesProps = {
  prestatairesRecherches?: string[]
  couleursMariage?: string[]
  theme?: string | null
  notificationsEmail?: boolean
  isEditing: boolean
  onChange: (field: string, value: any) => void
}

const PRESTATAIRES_TYPES = [
  'Photographe',
  'Vidéaste',
  'Traiteur',
  'Fleuriste',
  'DJ',
  'Musicien',
  'Décorateur',
  'Organisateur',
  'Maquilleur',
  'Coiffeur',
  'Transport',
  'Lieu de réception',
]

export function Preferences({
  prestatairesRecherches = [],
  couleursMariage = [],
  theme,
  notificationsEmail = true,
  isEditing,
  onChange,
}: PreferencesProps) {
  const [newColor, setNewColor] = useState('')
  const [newPrestataire, setNewPrestataire] = useState('')

  const handleAddColor = () => {
    if (newColor.trim() && !couleursMariage.includes(newColor.trim())) {
      onChange('couleursMariage', [...couleursMariage, newColor.trim()])
      setNewColor('')
    }
  }

  const handleRemoveColor = (color: string) => {
    onChange(
      'couleursMariage',
      couleursMariage.filter((c) => c !== color)
    )
  }

  const handleTogglePrestataire = (prestataire: string) => {
    if (prestatairesRecherches.includes(prestataire)) {
      onChange(
        'prestatairesRecherches',
        prestatairesRecherches.filter((p) => p !== prestataire)
      )
    } else {
      onChange('prestatairesRecherches', [...prestatairesRecherches, prestataire])
    }
  }

  const handleAddCustomPrestataire = () => {
    if (newPrestataire.trim() && !prestatairesRecherches.includes(newPrestataire.trim())) {
      onChange('prestatairesRecherches', [...prestatairesRecherches, newPrestataire.trim()])
      setNewPrestataire('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-[#823F91]" />
          <CardTitle>Préférences</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Types de prestataires recherchés */}
        <div className="space-y-3">
          <Label>Types de prestataires recherchés</Label>
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {PRESTATAIRES_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTogglePrestataire(type)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      prestatairesRecherches.includes(type)
                        ? 'bg-[#823F91] text-white'
                        : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newPrestataire}
                  onChange={(e) => setNewPrestataire(e.target.value)}
                  placeholder="Ajouter un prestataire personnalisé"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCustomPrestataire()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomPrestataire}
                  className="px-4 py-2 bg-[#823F91] text-white rounded-lg hover:bg-[#6D3478] text-sm"
                >
                  Ajouter
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {prestatairesRecherches.length > 0 ? (
                prestatairesRecherches.map((prestataire) => (
                  <Badge key={prestataire} variant="secondary">
                    {prestataire}
                  </Badge>
                ))
              ) : (
                <p className="text-[#6B7280]">Aucun prestataire sélectionné</p>
              )}
            </div>
          )}
        </div>

        {/* Couleurs du mariage */}
        <div className="space-y-3">
          <Label>Couleurs du mariage</Label>
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {couleursMariage.map((color) => (
                  <Badge
                    key={color}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {color}
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(color)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="Ajouter une couleur (ex: Violet, Blanc, Or...)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddColor()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-4 py-2 bg-[#823F91] text-white rounded-lg hover:bg-[#6D3478] text-sm"
                >
                  Ajouter
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {couleursMariage.length > 0 ? (
                couleursMariage.map((color) => (
                  <Badge key={color} variant="secondary">
                    {color}
                  </Badge>
                ))
              ) : (
                <p className="text-[#6B7280]">Aucune couleur définie</p>
              )}
            </div>
          )}
        </div>

        {/* Thème du mariage */}
        <div className="space-y-2">
          <Label htmlFor="theme">Thème du mariage</Label>
          {isEditing ? (
            <Input
              id="theme"
              value={theme || ''}
              onChange={(e) => onChange('theme', e.target.value)}
              placeholder="Ex: Bohème, Classique, Moderne, Vintage..."
            />
          ) : (
            <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
              {theme || 'Non renseigné'}
            </p>
          )}
        </div>

        {/* Notifications email */}
        <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">Notifications par email</Label>
            <p className="text-sm text-[#6B7280]">
              Recevez des notifications importantes par email
            </p>
          </div>
          {isEditing ? (
            <Switch
              id="notifications"
              checked={notificationsEmail}
              onCheckedChange={(checked) => onChange('notificationsEmail', checked)}
            />
          ) : (
            <Badge variant={notificationsEmail ? 'default' : 'outline'}>
              {notificationsEmail ? 'Activé' : 'Désactivé'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

