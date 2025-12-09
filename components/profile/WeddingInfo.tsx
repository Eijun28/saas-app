'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'
import { Heart, Link as LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

type WeddingInfoProps = {
  dateMarriage?: string | null
  villeMarriage?: string | null
  budgetMax?: number | null
  nombreInvites?: number | null
  typeCeremonie?: 'religieuse' | 'civile' | 'les_deux' | null
  culture?: string | null
  description?: string | null
  isEditing: boolean
  onChange: (field: string, value: any) => void
}

const TYPE_CEREMONIE_LABELS = {
  religieuse: 'Religieuse',
  civile: 'Civile',
  les_deux: 'Les deux',
}

export function WeddingInfo({
  dateMarriage,
  villeMarriage,
  budgetMax,
  nombreInvites,
  typeCeremonie,
  culture,
  description,
  isEditing,
  onChange,
}: WeddingInfoProps) {
  const router = useRouter()
  const dateMarriageDate = dateMarriage ? new Date(dateMarriage) : undefined

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-[#823F91]" />
          <CardTitle>Informations du mariage</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateMarriage">Date du mariage</Label>
            {isEditing ? (
              <DatePicker
                value={dateMarriageDate}
                onChange={(date) =>
                  onChange('dateMarriage', date?.toISOString().split('T')[0] || null)
                }
                placeholder="Sélectionner une date"
              />
            ) : (
              <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
                {dateMarriage
                  ? new Date(dateMarriage).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Non renseigné'}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="villeMarriage">Ville du mariage</Label>
            {isEditing ? (
              <Input
                id="villeMarriage"
                value={villeMarriage || ''}
                onChange={(e) => onChange('villeMarriage', e.target.value)}
                placeholder="Ville"
              />
            ) : (
              <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
                {villeMarriage || 'Non renseigné'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <div className="flex items-center gap-2">
              <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg flex-1">
                {budgetMax
                  ? budgetMax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                  : 'Non défini'}
              </p>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => router.push('/couple/budget')}
                  className="flex items-center gap-1 text-sm text-[#823F91] hover:text-[#6D3478]"
                >
                  <LinkIcon className="h-4 w-4" />
                  Gérer
                </button>
              )}
            </div>
            <p className="text-xs text-[#6B7280]">
              {isEditing
                ? 'Définissez votre budget dans la section Budget'
                : 'Gérez votre budget depuis la section Budget'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombreInvites">Nombre d'invités</Label>
            {isEditing ? (
              <Input
                id="nombreInvites"
                type="number"
                min="1"
                max="1000"
                value={nombreInvites || ''}
                onChange={(e) => onChange('nombreInvites', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
              />
            ) : (
              <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
                {nombreInvites || 'Non renseigné'}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="typeCeremonie">Type de cérémonie</Label>
          {isEditing ? (
            <Select
              value={typeCeremonie || ''}
              onValueChange={(value) =>
                onChange('typeCeremonie', value || null)
              }
            >
              <SelectTrigger id="typeCeremonie">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                <SelectItem value="religieuse">Religieuse</SelectItem>
                <SelectItem value="civile">Civile</SelectItem>
                <SelectItem value="les_deux">Les deux</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
              {typeCeremonie ? TYPE_CEREMONIE_LABELS[typeCeremonie] : 'Non renseigné'}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="culture">Culture / Style</Label>
          {isEditing ? (
            <Input
              id="culture"
              value={culture || ''}
              onChange={(e) => onChange('culture', e.target.value)}
              placeholder="Ex: Français, Marocain, Mixte..."
            />
          ) : (
            <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg">
              {culture || 'Non renseigné'}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description personnalisée</Label>
          {isEditing ? (
            <Textarea
              id="description"
              value={description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Décrivez votre mariage, vos souhaits, vos préférences..."
              rows={4}
            />
          ) : (
            <p className="text-[#111827] py-2 px-3 bg-[#F9FAFB] rounded-lg whitespace-pre-wrap">
              {description || 'Non renseigné'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

