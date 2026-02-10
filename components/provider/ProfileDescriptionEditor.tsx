'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ProfileDescriptionEditorProps {
  userId: string;
  currentDescription?: string;
  onSave?: () => void;
}

export function ProfileDescriptionEditor({
  userId,
  currentDescription = '',
  onSave,
}: ProfileDescriptionEditorProps) {
  const [description, setDescription] = useState(currentDescription);
  const [initialDescription, setInitialDescription] = useState(currentDescription);
  const [isSaving, setIsSaving] = useState(false);
  const isEditingRef = useRef(false);

  useEffect(() => {
    // Ignorer les mises à jour pendant la sauvegarde ou l'édition pour éviter les conflits
    if (isSaving || isEditingRef.current) return;
    
    const newDescription = currentDescription || '';
    
    // Mettre à jour uniquement si les valeurs ont vraiment changé depuis la DB
    if (newDescription !== initialDescription) {
      setDescription(newDescription);
      setInitialDescription(newDescription);
    }
  }, [currentDescription, isSaving, initialDescription]);

  const hasChanges = description !== initialDescription;

  async function handleSave() {
    if (description.length > 150) {
      toast.error('Erreur', {
        description: 'La description courte doit faire maximum 150 caractères',
      });
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .update({
          description_courte: description.trim() || null,
        })
        .eq('id', userId)
        .select('description_courte')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        // Message d'erreur plus détaillé pour aider au débogage
        let errorMessage = 'Erreur lors de la sauvegarde';
        if (error.code === '42703') {
          errorMessage = 'Erreur : Une ou plusieurs colonnes n\'existent pas dans la base de données. Veuillez contacter le support.';
        } else if (error.code === '42501') {
          errorMessage = 'Erreur : Vous n\'avez pas les permissions nécessaires pour modifier ce profil.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      // Mettre à jour les valeurs initiales avec les données retournées de la DB
      if (data) {
        const savedDescription = data.description_courte || '';
        
        setDescription(savedDescription);
        setInitialDescription(savedDescription);
      } else {
        // Fallback : utiliser les valeurs locales
        const savedDescription = description.trim() || '';
        setDescription(savedDescription);
        setInitialDescription(savedDescription);
      }
      
      // Réinitialiser immédiatement pour permettre les mises à jour depuis props
      isEditingRef.current = false;
      
      toast.success('Succès', {
        description: 'Description mise à jour',
      });
      
      // Attendre un peu avant de recharger pour s'assurer que la DB est à jour
      // Réduire à 300ms pour un affichage plus rapide
      setTimeout(() => {
        onSave?.();
      }, 300);
    } catch (error: any) {
      console.error('Save error:', error);
      const errorMessage = error?.message || error?.code || error?.details || 'Erreur lors de la sauvegarde';
      toast.error('Erreur', {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setDescription(initialDescription);
  }

  const descriptionLength = description.length;
  const descriptionColor =
    descriptionLength > 150
      ? 'text-destructive'
      : descriptionLength > 130
      ? 'text-orange-500'
      : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      {/* Description courte */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description courte <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Une phrase qui résume votre activité (max 150 caractères)
        </p>
        
        <Textarea
          id="description"
          placeholder="Ex: Photographe spécialisé dans les mariages multiculturels"
          value={description}
          onChange={(e) => {
            isEditingRef.current = true
            setDescription(e.target.value)
          }}
          onBlur={() => {
            setTimeout(() => {
              isEditingRef.current = false
            }, 100)
          }}
          onFocus={() => {
            isEditingRef.current = true
          }}
          className="resize-none"
          rows={2}
        />
        <div className="flex justify-between items-center text-xs">
          <span className={descriptionColor}>
            {descriptionLength}/150 caractères
          </span>
          {descriptionLength > 150 && (
            <span className="text-destructive font-medium">
              Trop long de {descriptionLength - 150} caractères
            </span>
          )}
        </div>
      </div>

      {/* Boutons */}
      {hasChanges && (
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || descriptionLength > 150}
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
}

