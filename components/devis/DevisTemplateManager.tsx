'use client'

// components/devis/DevisTemplateManager.tsx
// Gestionnaire de templates de devis

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Star,
  Euro,
  Loader2,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import type { DevisTemplate, DevisTemplatePayload } from '@/types/billing'
import { cn } from '@/lib/utils'

interface DevisTemplateManagerProps {
  onTemplateSelect?: (template: DevisTemplate) => void
}

export function DevisTemplateManager({ onTemplateSelect }: DevisTemplateManagerProps) {
  const [templates, setTemplates] = useState<DevisTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DevisTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<DevisTemplatePayload>({
    name: '',
    description: '',
    is_default: false,
    title_template: '',
    description_template: '',
    default_amount: undefined,
    included_services: [],
    excluded_services: [],
    conditions: '',
    validity_days: 30,
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/devis/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error)
      toast.error('Erreur lors du chargement des modèles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      description: '',
      is_default: false,
      title_template: '',
      description_template: '',
      default_amount: undefined,
      included_services: [],
      excluded_services: [],
      conditions: '',
      validity_days: 30,
    })
    setIsModalOpen(true)
  }

  const handleEdit = (template: DevisTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      is_default: template.is_default,
      title_template: template.title_template,
      description_template: template.description_template || '',
      default_amount: template.default_amount || undefined,
      included_services: template.included_services || [],
      excluded_services: template.excluded_services || [],
      conditions: template.conditions || '',
      validity_days: template.validity_days || 30,
    })
    setIsModalOpen(true)
  }

  const handleDuplicate = (template: DevisTemplate) => {
    setEditingTemplate(null)
    setFormData({
      name: `${template.name} (copie)`,
      description: template.description || '',
      is_default: false,
      title_template: template.title_template,
      description_template: template.description_template || '',
      default_amount: template.default_amount || undefined,
      included_services: template.included_services || [],
      excluded_services: template.excluded_services || [],
      conditions: template.conditions || '',
      validity_days: template.validity_days || 30,
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.title_template) {
      toast.error('Veuillez remplir les champs obligatoires')
      return
    }

    setIsSaving(true)
    try {
      const url = editingTemplate
        ? `/api/devis/templates/${editingTemplate.id}`
        : '/api/devis/templates'

      const response = await fetch(url, {
        method: editingTemplate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      toast.success(editingTemplate ? 'Modèle mis à jour' : 'Modèle créé')
      setIsModalOpen(false)
      fetchTemplates()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (template: DevisTemplate) => {
    if (!confirm(`Supprimer le modèle "${template.name}" ?`)) return

    try {
      const response = await fetch(`/api/devis/templates/${template.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      toast.success('Modèle supprimé')
      fetchTemplates()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Modèles de devis</h3>
          <p className="text-sm text-muted-foreground">
            Créez des modèles pour générer vos devis plus rapidement
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau modèle
        </Button>
      </div>

      {/* Liste des templates */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              Aucun modèle de devis créé
            </p>
            <Button onClick={handleCreate} variant="outline">
              Créer un modèle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map(template => (
            <Card
              key={template.id}
              className={cn(
                'transition-all hover:shadow-md',
                onTemplateSelect && 'cursor-pointer'
              )}
              onClick={() => onTemplateSelect?.(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {template.is_default && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    {template.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={e => {
                        e.stopPropagation()
                        handleDuplicate(template)
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={e => {
                        e.stopPropagation()
                        handleEdit(template)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={e => {
                        e.stopPropagation()
                        handleDelete(template)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {template.title_template}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {template.default_amount && (
                      <Badge variant="outline" className="gap-1">
                        <Euro className="h-3 w-3" />
                        {formatAmount(template.default_amount)}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {template.validity_days}j validité
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {template.use_count} utilisation{template.use_count > 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal création/édition */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle de devis'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Modifiez les informations du modèle'
                : 'Créez un modèle réutilisable pour vos devis'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nom du modèle */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom du modèle *</Label>
              <Input
                id="name"
                placeholder="Ex: Formule Premium"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Description interne */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (interne)</Label>
              <Input
                id="description"
                placeholder="Note pour vous-même..."
                value={formData.description || ''}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Modèle par défaut */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Modèle par défaut</Label>
                <p className="text-xs text-muted-foreground">
                  Pré-sélectionné lors de la création de devis
                </p>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_default: checked }))}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Contenu du devis</h4>

              {/* Titre de la prestation */}
              <div className="space-y-2">
                <Label htmlFor="title_template">Titre de la prestation *</Label>
                <Input
                  id="title_template"
                  placeholder="Ex: Photographie de mariage - Formule Premium"
                  value={formData.title_template}
                  onChange={e => setFormData(prev => ({ ...prev, title_template: e.target.value }))}
                />
              </div>

              {/* Description de la prestation */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="description_template">Description</Label>
                <Textarea
                  id="description_template"
                  placeholder="Description détaillée de la prestation..."
                  rows={3}
                  value={formData.description_template || ''}
                  onChange={e => setFormData(prev => ({ ...prev, description_template: e.target.value }))}
                />
              </div>

              {/* Montant et validité */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="default_amount">Montant par défaut</Label>
                  <div className="relative">
                    <Input
                      id="default_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.default_amount || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        default_amount: parseFloat(e.target.value) || undefined,
                      }))}
                    />
                    <Euro className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validity_days">Validité (jours)</Label>
                  <Input
                    id="validity_days"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.validity_days}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      validity_days: parseInt(e.target.value) || 30,
                    }))}
                  />
                </div>
              </div>

              {/* Services inclus */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="included">Services inclus (un par ligne)</Label>
                <Textarea
                  id="included"
                  placeholder="Ex:&#10;Reportage photo 8h&#10;Album 30x30&#10;Clé USB"
                  rows={3}
                  value={(formData.included_services || []).join('\n')}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    included_services: e.target.value.split('\n').filter(s => s.trim()),
                  }))}
                />
              </div>

              {/* Conditions */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="conditions">Conditions par défaut</Label>
                <Textarea
                  id="conditions"
                  placeholder="Acompte de 30% à la commande..."
                  rows={2}
                  value={formData.conditions || ''}
                  onChange={e => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : editingTemplate ? (
                'Mettre à jour'
              ) : (
                'Créer le modèle'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
