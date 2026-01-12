'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Instagram, Facebook, Globe, Linkedin, Music2 } from 'lucide-react'

interface SocialLinksEditorProps {
  userId: string
  currentLinks?: {
    instagram_url?: string | null
    facebook_url?: string | null
    website_url?: string | null
    linkedin_url?: string | null
    tiktok_url?: string | null
  }
  onSave?: () => void
}

export function SocialLinksEditor({ userId, currentLinks = {}, onSave }: SocialLinksEditorProps) {
  const [links, setLinks] = useState({
    instagram_url: currentLinks?.instagram_url || '',
    facebook_url: currentLinks?.facebook_url || '',
    website_url: currentLinks?.website_url || '',
    linkedin_url: currentLinks?.linkedin_url || '',
    tiktok_url: currentLinks?.tiktok_url || '',
  })

  const [initialLinks, setInitialLinks] = useState({
    instagram_url: currentLinks?.instagram_url || '',
    facebook_url: currentLinks?.facebook_url || '',
    website_url: currentLinks?.website_url || '',
    linkedin_url: currentLinks?.linkedin_url || '',
    tiktok_url: currentLinks?.tiktok_url || '',
  })

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const newLinks = {
      instagram_url: currentLinks?.instagram_url || '',
      facebook_url: currentLinks?.facebook_url || '',
      website_url: currentLinks?.website_url || '',
      linkedin_url: currentLinks?.linkedin_url || '',
      tiktok_url: currentLinks?.tiktok_url || '',
    }

    // Mettre à jour seulement si les valeurs initiales ont changé
    if (JSON.stringify(initialLinks) !== JSON.stringify(newLinks)) {
      if (JSON.stringify(links) === JSON.stringify(initialLinks)) {
        setLinks(newLinks)
      }
      setInitialLinks(newLinks)
    }
  }, [currentLinks])

  const hasChanges = JSON.stringify(links) !== JSON.stringify(initialLinks)

  function validateUrl(url: string): boolean {
    if (!url.trim()) return true // Les URLs sont optionnelles
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  function normalizeUrl(url: string): string | null {
    if (!url.trim()) return null
    const trimmed = url.trim()
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed
    }
    return `https://${trimmed}`
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    // Valider toutes les URLs
    const urlsToValidate = [
      { key: 'instagram_url', value: links.instagram_url, label: 'Instagram' },
      { key: 'facebook_url', value: links.facebook_url, label: 'Facebook' },
      { key: 'website_url', value: links.website_url, label: 'Site web' },
      { key: 'linkedin_url', value: links.linkedin_url, label: 'LinkedIn' },
      { key: 'tiktok_url', value: links.tiktok_url, label: 'TikTok' },
    ]

    for (const { value, label } of urlsToValidate) {
      if (value && !validateUrl(value)) {
        toast.error('Erreur', {
          description: `L'URL ${label} n'est pas valide`,
        })
        return
      }
    }

    setIsSaving(true)
    const supabase = createClient()

    const updateData: Record<string, string | null> = {}
    for (const { key, value } of urlsToValidate) {
      updateData[key] = normalizeUrl(value)
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      
      // Message d'erreur plus détaillé pour aider au débogage
      let errorMessage = 'Erreur lors de la sauvegarde'
      if (error.code === '42703') {
        errorMessage = 'Erreur : Les colonnes de réseaux sociaux n\'existent pas dans la base de données. Veuillez contacter le support.'
      } else if (error.code === '42501') {
        errorMessage = 'Erreur : Vous n\'avez pas les permissions nécessaires pour modifier ce profil.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error('Erreur', {
        description: errorMessage,
      })
      setIsSaving(false)
      return
    }

    setInitialLinks(links)
    toast.success('Succès', {
      description: 'Liens de réseaux sociaux mis à jour',
    })
    setIsSaving(false)
    onSave?.()
  }

  const socialFields = [
    {
      key: 'instagram_url' as const,
      label: 'Instagram',
      icon: Instagram,
      placeholder: 'instagram.com/votre-profil',
      color: 'text-pink-500',
    },
    {
      key: 'facebook_url' as const,
      label: 'Facebook',
      icon: Facebook,
      placeholder: 'facebook.com/votre-page',
      color: 'text-blue-600',
    },
    {
      key: 'website_url' as const,
      label: 'Site web',
      icon: Globe,
      placeholder: 'votresite.com',
      color: 'text-green-600',
    },
    {
      key: 'linkedin_url' as const,
      label: 'LinkedIn',
      icon: Linkedin,
      placeholder: 'linkedin.com/in/votre-profil',
      color: 'text-blue-700',
    },
    {
      key: 'tiktok_url' as const,
      label: 'TikTok',
      icon: Music2,
      placeholder: 'tiktok.com/@votre-profil',
      color: 'text-black',
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold text-[#823F91]">
          Réseaux sociaux et site web
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Ajoutez vos liens pour permettre aux clients de vous découvrir sur vos réseaux
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {socialFields.map((field) => {
          const Icon = field.icon
          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${field.color}`} />
                {field.label}
              </Label>
              <Input
                id={field.key}
                type="url"
                placeholder={field.placeholder}
                value={links[field.key]}
                onChange={(e) =>
                  setLinks((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                className="w-full"
              />
            </div>
          )
        })}
      </div>

      {hasChanges && (
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              setLinks(initialLinks)
            }}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            size="sm"
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
