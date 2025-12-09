'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { User } from 'lucide-react'

type PersonalInfoProps = {
  prenom: string
  nom: string
  email: string
  telephone?: string | null
  dateNaissance?: string | null
  adresse?: string | null
  isEditing: boolean
  onChange: (field: string, value: any) => void
}

export function PersonalInfo({
  prenom,
  nom,
  email,
  telephone,
  dateNaissance,
  adresse,
  isEditing,
  onChange,
}: PersonalInfoProps) {
  const dateNaissanceDate = dateNaissance ? new Date(dateNaissance) : undefined

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-[#823F91]" />
          <CardTitle>Informations personnelles</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prenom">Prénom</Label>
            {isEditing ? (
              <Input
                id="prenom"
                value={prenom}
                onChange={(e) => onChange('prenom', e.target.value)}
                placeholder="Votre prénom"
              />
            ) : (
              <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
                {prenom || 'Non renseigné'}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            {isEditing ? (
              <Input
                id="nom"
                value={nom}
                onChange={(e) => onChange('nom', e.target.value)}
                placeholder="Votre nom"
              />
            ) : (
              <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
                {nom || 'Non renseigné'}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <p className="text-[#6B7280] py-2 px-3 bg-[#F9FAFB] rounded-lg">
            {email}
            <span className="ml-2 text-xs text-[#9CA3AF]">(non modifiable)</span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="telephone">Téléphone</Label>
          {isEditing ? (
            <Input
              id="telephone"
              type="tel"
              value={telephone || ''}
              onChange={(e) => onChange('telephone', e.target.value)}
              placeholder="+33 6 12 34 56 78"
            />
          ) : (
            <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
              {telephone || 'Non renseigné'}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateNaissance">Date de naissance</Label>
          {isEditing ? (
            <DatePicker
              value={dateNaissanceDate}
              onChange={(date) => onChange('dateNaissance', date?.toISOString().split('T')[0] || null)}
              placeholder="Sélectionner une date"
            />
          ) : (
            <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
              {dateNaissance
                ? new Date(dateNaissance).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Non renseigné'}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="adresse">Adresse</Label>
          {isEditing ? (
            <Input
              id="adresse"
              value={adresse || ''}
              onChange={(e) => onChange('adresse', e.target.value)}
              placeholder="Votre adresse complète"
            />
          ) : (
            <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
              {adresse || 'Non renseigné'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

