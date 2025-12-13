// app/dashboard/dossier-mariage/questionnaire/page.tsx
// COPIE-COLLE TOUT CE CODE

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ArrowRight, Loader2, LayoutDashboard } from 'lucide-react'

// Schema de validation
const questionnaireSchema = z.object({
  spouseAFirstName: z.string().min(2, 'Prénom requis'),
  spouseALastName: z.string().min(2, 'Nom requis'),
  spouseABirthDate: z.string().min(1, 'Date requise'),
  spouseABirthPlace: z.string().min(2, 'Lieu requis'),
  spouseANationality: z.string().min(2, 'Nationalité requise'),
  spouseAMaritalStatus: z.enum(['single', 'divorced', 'widowed']),

  spouseBFirstName: z.string().min(2, 'Prénom requis'),
  spouseBLastName: z.string().min(2, 'Nom requis'),
  spouseBBirthDate: z.string().min(1, 'Date requise'),
  spouseBBirthPlace: z.string().min(2, 'Lieu requis'),
  spouseBNationality: z.string().min(2, 'Nationalité requise'),
  spouseBMaritalStatus: z.enum(['single', 'divorced', 'widowed']),

  municipality: z.string().min(2, 'Ville requise'),
  municipalityPostalCode: z.string().min(5, 'Code postal requis'),
  weddingDate: z.string().min(1, 'Date requise'),
})

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>

export default function QuestionnairePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      spouseAMaritalStatus: 'single',
      spouseBMaritalStatus: 'single',
    },
  })

  const onSubmit = async (data: QuestionnaireFormData) => {
    setLoading(true)

    try {
      const supabase = createClient()

      // Récupère l'utilisateur
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert('Vous devez être connecté')
        router.push('/sign-in')
        return
      }

      // Appelle l'API pour créer le dossier
      const response = await fetch('/api/marriage-admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          questionnaireData: data,
        }),
      })

      // Vérifier que la réponse est OK avant de parser le JSON
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Erreur création dossier'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch {
          errorMessage = errorText || `Erreur ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      console.log('✅ Dossier créé:', result.data)

      // Redirige vers la checklist
      router.push('/dashboard/dossier-mariage/checklist')
    } catch (error: any) {
      console.error('❌ Erreur:', error)
      alert('Erreur: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <div className="flex gap-2 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/couple/dashboard')}
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Retour au Dashboard
        </Button>
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Questionnaire de Mariage</h1>
        <p className="text-muted-foreground">
          Répondez à quelques questions pour personnaliser votre checklist
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step >= s ? 'bg-[#823F91] text-white' : 'bg-gray-200 text-gray-600'}
            `}
            >
              {s}
            </div>
            {s < 3 && <div className="w-12 h-1 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* STEP 1: Spouse A */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informations - Conjoint(e) 1</CardTitle>
              <CardDescription>Vos informations personnelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseAFirstName">Prénom</Label>
                  <Input {...register('spouseAFirstName')} placeholder="Karim" />
                  {errors.spouseAFirstName && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.spouseAFirstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="spouseALastName">Nom</Label>
                  <Input {...register('spouseALastName')} placeholder="Dupont" />
                  {errors.spouseALastName && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.spouseALastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseABirthDate">Date de naissance</Label>
                  <Input type="date" {...register('spouseABirthDate')} />
                  {errors.spouseABirthDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.spouseABirthDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="spouseABirthPlace">Lieu de naissance</Label>
                  <Input {...register('spouseABirthPlace')} placeholder="Roubaix" />
                  {errors.spouseABirthPlace && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.spouseABirthPlace.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseANationality">Nationalité</Label>
                  <Input {...register('spouseANationality')} placeholder="FR, MA, DZ..." />
                  {errors.spouseANationality && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.spouseANationality.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Situation matrimoniale</Label>
                  <Select
                    onValueChange={(value) => setValue('spouseAMaritalStatus', value as any)}
                    defaultValue="single"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Célibataire</SelectItem>
                      <SelectItem value="divorced">Divorcé(e)</SelectItem>
                      <SelectItem value="widowed">Veuf/Veuve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="button"
                className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white"
                onClick={() => setStep(2)}
              >
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Spouse B */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Informations - Conjoint(e) 2</CardTitle>
              <CardDescription>Informations de votre partenaire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseBFirstName">Prénom</Label>
                  <Input {...register('spouseBFirstName')} placeholder="Marie" />
                  {errors.spouseBFirstName && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.spouseBFirstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="spouseBLastName">Nom</Label>
                  <Input {...register('spouseBLastName')} placeholder="Martin" />
                  {errors.spouseBLastName && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.spouseBLastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseBBirthDate">Date de naissance</Label>
                  <Input type="date" {...register('spouseBBirthDate')} />
                  {errors.spouseBBirthDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.spouseBBirthDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="spouseBBirthPlace">Lieu de naissance</Label>
                  <Input {...register('spouseBBirthPlace')} placeholder="Paris" />
                  {errors.spouseBBirthPlace && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.spouseBBirthPlace.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseBNationality">Nationalité</Label>
                  <Input {...register('spouseBNationality')} placeholder="FR, MA, DZ..." />
                  {errors.spouseBNationality && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.spouseBNationality.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Situation matrimoniale</Label>
                  <Select
                    onValueChange={(value) => setValue('spouseBMaritalStatus', value as any)}
                    defaultValue="single"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Célibataire</SelectItem>
                      <SelectItem value="divorced">Divorcé(e)</SelectItem>
                      <SelectItem value="widowed">Veuf/Veuve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Précédent
                </Button>

                <Button
                  type="button"
                  className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white"
                  onClick={() => setStep(3)}
                >
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Marriage Info */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Informations du Mariage</CardTitle>
              <CardDescription>Où et quand souhaitez-vous vous marier ?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="municipality">Ville du mariage</Label>
                  <Input {...register('municipality')} placeholder="Roubaix" />
                  {errors.municipality && (
                    <p className="text-sm text-red-600 mt-1">{errors.municipality.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="municipalityPostalCode">Code postal</Label>
                  <Input {...register('municipalityPostalCode')} placeholder="59100" />
                  {errors.municipalityPostalCode && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.municipalityPostalCode.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="weddingDate">Date souhaitée</Label>
                <Input type="date" {...register('weddingDate')} />
                {errors.weddingDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.weddingDate.message}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Précédent
                </Button>

                <Button
                  type="submit"
                  className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer Mon Dossier'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}

