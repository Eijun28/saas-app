'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Eye, Plus, Upload, Trash2, Sparkles, 
  MessageSquare, Pencil, X, Check 
} from 'lucide-react'
import { LoadingSpinner } from '@/components/prestataire/shared/LoadingSpinner'
import { EmptyState } from '@/components/prestataire/shared/EmptyState'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { AIAgentChat } from '@/components/prestataire/profil/AIAgentChat'
import { ServiceDialog } from '@/components/prestataire/profil/ServiceDialog'
import { ServiceImportDialog } from '@/components/prestataire/profil/ServiceImportDialog'
import type { Prestataire, Service, UIState } from '@/lib/types/prestataire'

interface ServiceData {
  id: string
  nom: string
  description: string
  prix: number
}

export default function ProfilPublicPage() {
  const { user } = useUser()
  const [profil, setProfil] = useState({
    description: '',
    services: [] as ServiceData[],
    portfolio: [] as File[]
  })
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([])
  const [uiState, setUiState] = useState<UIState>({
    loading: 'idle',
    error: null,
  })
  
  // États pour les modes édition
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [tempDescription, setTempDescription] = useState('')
  
  // État pour l'agent IA
  const [isAgentOpen, setIsAgentOpen] = useState(false)

  // États pour les services
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [isServiceImportDialogOpen, setIsServiceImportDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceData | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // TODO: Fetch prestataire from Supabase
  useEffect(() => {
    const fetchProfil = async () => {
      if (!user) return
      
      setUiState({ loading: 'loading', error: null })
      
      try {
        const supabase = createClient()
        // const { data, error } = await supabase
        //   .from('prestataires')
        //   .select('*')
        //   .eq('id', user.id)
        //   .single()
        
        setUiState({ loading: 'success', error: null })
      } catch (error) {
        setUiState({ loading: 'error', error: 'Erreur de chargement' })
      }
    }

    fetchProfil()
  }, [user])

  // Handlers pour la section À propos
  const handleStartEditDescription = () => {
    setTempDescription(profil.description)
    setEditingSection('description')
  }

  const handleSaveDescription = async () => {
    setProfil({ ...profil, description: tempDescription })
    setEditingSection(null)
    
    // TODO: Sauvegarder dans Supabase
    // Table: prestataires, Column: description
    if (user) {
      try {
        const supabase = createClient()
        // await supabase
        //   .from('prestataires')
        //   .update({ description: tempDescription })
        //   .eq('id', user.id)
      } catch (error) {
        console.error('Erreur sauvegarde description:', error)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
    setTempDescription('')
  }

  // Handlers pour le portfolio
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validation des fichiers
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} n'est pas une image valide`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} est trop volumineux (max 5MB)`)
        return false
      }
      return true
    })

    setProfil({
      ...profil,
      portfolio: [...profil.portfolio, ...validFiles]
    })
    
    // Créer les previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPortfolioPreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (index: number) => {
    // TODO: Supprimer de Supabase Storage si c'est une image existante
    setProfil({ 
      ...profil, 
      portfolio: profil.portfolio.filter((_, i) => i !== index) 
    })
    setPortfolioPreviews(portfolioPreviews.filter((_, i) => i !== index))
  }

  const handleApplySuggestion = (suggestion: any) => {
    if (suggestion?.type === 'description' && suggestion?.data?.improved_text) {
      setTempDescription(suggestion.data.improved_text)
      setEditingSection('description')
      setIsAgentOpen(false)
    }
  }

  // Handlers pour les services
  const handleAddService = () => {
    setEditingService(null)
    setIsServiceDialogOpen(true)
  }

  const handleEditService = (service: ServiceData) => {
    setEditingService(service)
    setIsServiceDialogOpen(true)
  }

  const handleSaveService = async (serviceData: Omit<ServiceData, 'id'>) => {
    if (!user) return

    try {
      const supabase = createClient()
      
      if (editingService) {
        // TODO: Mettre à jour le service dans Supabase
        // await supabase
        //   .from('services')
        //   .update(serviceData)
        //   .eq('id', editingService.id)
        //   .eq('prestataire_id', user.id)

        // Mise à jour locale
        setProfil({
          ...profil,
          services: profil.services.map(s =>
            s.id === editingService.id
              ? { ...s, ...serviceData }
              : s
          )
        })
      } else {
        // TODO: Créer le service dans Supabase
        // const { data, error } = await supabase
        //   .from('services')
        //   .insert({
        //     prestataire_id: user.id,
        //     ...serviceData
        //   })
        //   .select()
        //   .single()

        // Création locale
        const newService: ServiceData = {
          id: Date.now().toString(),
          ...serviceData
        }
        setProfil({
          ...profil,
          services: [...profil.services, newService]
        })
      }

      setEditingService(null)
    } catch (error) {
      console.error('Erreur sauvegarde service:', error)
      alert('Erreur lors de la sauvegarde du service')
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return

    if (!user) return

    try {
      const supabase = createClient()
      // TODO: Supprimer le service dans Supabase
      // await supabase
      //   .from('services')
      //   .delete()
      //   .eq('id', serviceId)
      //   .eq('prestataire_id', user.id)

      // Suppression locale
      setProfil({
        ...profil,
        services: profil.services.filter(s => s.id !== serviceId)
      })
    } catch (error) {
      console.error('Erreur suppression service:', error)
      alert('Erreur lors de la suppression du service')
    }
  }

  const handleImportServices = (services: Omit<ServiceData, 'id'>[]) => {
    if (!user) return

    try {
      // TODO: Créer les services dans Supabase
      // const supabase = createClient()
      // await supabase
      //   .from('services')
      //   .insert(
      //     services.map(s => ({
      //       prestataire_id: user.id,
      //       ...s
      //     }))
      //   )

      // Import local
      const newServices: ServiceData[] = services.map((s, index) => ({
        id: `${Date.now()}_${index}`,
        ...s
      }))

      setProfil({
        ...profil,
        services: [...profil.services, ...newServices]
      })

      alert(`${services.length} service${services.length > 1 ? 's' : ''} importé${services.length > 1 ? 's' : ''} avec succès !`)
    } catch (error) {
      console.error('Erreur import services:', error)
      alert('Erreur lors de l\'import des services')
    }
  }

  if (uiState.loading === 'loading') {
    return <LoadingSpinner size="lg" text="Chargement du profil..." />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Profil public
          </h1>
          <p className="text-muted-foreground text-lg">
            Gérez votre profil visible par les couples
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-gray-300 hover:bg-gray-50">
            <Eye className="h-4 w-4" />
            Aperçu
          </Button>
        </div>
      </motion.div>

      {/* 1. Assistant IA - Cliquable pour ouvrir le chat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
        className="cursor-pointer"
        onClick={() => setIsAgentOpen(true)}
      >
        <Card className="border-[#823F91]/20 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Assistant IA
                </h3>
                <p className="text-muted-foreground mb-4">
                  Optimisez votre profil avec l'aide de notre assistant IA. Cliquez pour discuter.
                </p>
                <div className="flex items-center gap-2 text-[#823F91] font-medium">
                  <MessageSquare className="h-4 w-4" />
                  <span>Démarrer la conversation →</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2. Section À propos - Éditable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className={cn(
          "border-border/10 transition-all duration-300",
          editingSection !== 'description' && "hover:shadow-md hover:border-[#823F91]/20 cursor-pointer group"
        )}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">À propos</CardTitle>
            {editingSection !== 'description' && (
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEditDescription}
                  className="gap-2 text-[#823F91]"
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
              </motion.div>
            )}
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {editingSection === 'description' ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <Textarea
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    placeholder="Décrivez votre activité, votre expérience, votre style..."
                    className="min-h-[150px] resize-none"
                    autoFocus
                  />
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSaveDescription}
                      className="bg-[#823F91] hover:bg-[#6D3478] gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Enregistrer
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="reading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleStartEditDescription}
                  className="cursor-pointer"
                >
                  {profil.description ? (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {profil.description}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Cliquez pour ajouter une description de votre activité...
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. Section Services & Tarifs - Cliquable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="border-border/10 hover:shadow-md hover:border-[#823F91]/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Services & Tarifs</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-gray-300"
                onClick={() => setIsServiceImportDialogOpen(true)}
              >
                <Upload className="h-4 w-4" />
                Importer
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-gray-300"
                onClick={handleAddService}
              >
                <Plus className="h-4 w-4" />
                Ajouter un service
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {profil.services.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Aucun service ajouté pour le moment
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setIsServiceImportDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    Importer des services
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={handleAddService}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter manuellement
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {profil.services.map((service) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/10 hover:bg-gray-50 transition-all cursor-pointer group"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{service.nom}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-semibold text-[#823F91]">
                        {service.prix.toFixed(2)}€
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditService(service)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteService(service.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {/* TODO: CRUD services in Supabase - table: services */}
          </CardContent>
        </Card>
      </motion.div>

      {/* 4. Section Portfolio - Cliquable pour upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="border-border/10 hover:shadow-md hover:border-[#823F91]/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Portfolio</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-gray-300"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Ajouter des photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </CardHeader>
          <CardContent>
            {portfolioPreviews.length === 0 && profil.portfolio.length === 0 ? (
              <div 
                className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#823F91] hover:bg-purple-50/50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  Aucune photo dans votre portfolio
                </p>
                <p className="text-sm text-muted-foreground">
                  Cliquez ou glissez-déposez vos photos ici
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {portfolioPreviews.map((preview, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer"
                  >
                    <Image
                      src={preview}
                      alt={`Portfolio ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-white hover:bg-red-600"
                        onClick={() => handleDeletePhoto(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {/* TODO: Upload images to Supabase Storage - bucket: portfolio */}
          </CardContent>
        </Card>
      </motion.div>

      {/* Agent IA Modal/Drawer */}
      {/* Utiliser une clé pour forcer la réinitialisation à chaque ouverture */}
      {isAgentOpen && (
        <AIAgentChat 
          key={isAgentOpen ? 'chat-open' : 'chat-closed'}
          isOpen={isAgentOpen} 
          onClose={() => setIsAgentOpen(false)}
          currentProfile={profil}
          onApplySuggestion={handleApplySuggestion}
        />
      )}

      {/* Dialog Service */}
      <ServiceDialog
        isOpen={isServiceDialogOpen}
        onClose={() => {
          setIsServiceDialogOpen(false)
          setEditingService(null)
        }}
        onSave={handleSaveService}
        service={editingService}
      />

      {/* Dialog Import Services */}
      <ServiceImportDialog
        isOpen={isServiceImportDialogOpen}
        onClose={() => setIsServiceImportDialogOpen(false)}
        onImportServices={handleImportServices}
      />
    </div>
  )
}
