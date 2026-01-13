'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Lightbulb } from 'lucide-react';

interface ProfileDescriptionEditorProps {
  userId: string;
  currentDescription?: string;
  currentBio?: string;
  onSave?: () => void;
}

export function ProfileDescriptionEditor({
  userId,
  currentDescription = '',
  currentBio = '',
  onSave,
}: ProfileDescriptionEditorProps) {
  const [description, setDescription] = useState(currentDescription);
  const [bio, setBio] = useState(currentBio);
  const [initialDescription, setInitialDescription] = useState(currentDescription);
  const [initialBio, setInitialBio] = useState(currentBio);
  const [isSaving, setIsSaving] = useState(false);
  const isEditingRef = useRef(false);

  useEffect(() => {
    // Ignorer les mises à jour pendant la sauvegarde ou l'édition pour éviter les conflits
    if (isSaving || isEditingRef.current) return;
    
    const newDescription = currentDescription || '';
    const newBio = currentBio || '';
    
    // Mettre à jour uniquement si les valeurs ont vraiment changé depuis la DB
    if (newDescription !== initialDescription) {
      setDescription(newDescription);
      setInitialDescription(newDescription);
    }
    if (newBio !== initialBio) {
      setBio(newBio);
      setInitialBio(newBio);
    }
  }, [currentDescription, currentBio, isSaving, initialDescription, initialBio]);

  const hasChanges =
    description !== initialDescription || bio !== initialBio;

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
          bio: bio.trim() || null,
        })
        .eq('id', userId)
        .select('description_courte, bio')
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
        const savedBio = data.bio || '';
        
        setDescription(savedDescription);
        setBio(savedBio);
        setInitialDescription(savedDescription);
        setInitialBio(savedBio);
      } else {
        // Fallback : utiliser les valeurs locales
        const savedDescription = description.trim() || '';
        const savedBio = bio.trim() || '';
        setInitialDescription(savedDescription);
        setInitialBio(savedBio);
      }
      
      isEditingRef.current = false;
      
      toast.success('Succès', {
        description: 'Description mise à jour',
      });
      
      // Attendre un peu avant de recharger pour s'assurer que la DB est à jour
      setTimeout(() => {
        onSave?.();
      }, 500);
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
    setBio(initialBio);
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
        
        {/* Conseil pour une bonne description */}
        <div className="bg-[rgba(255,240,255,1)] border-[rgba(240,168,245,1)] text-[rgba(255,252,250,1)] rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Conseil pour une bonne description
          </h3>
          <ul className="text-sm text-[rgba(0,0,0,1)] space-y-1">
            <li>• Mentionnez votre spécialité principale</li>
            <li>• Indiquez votre expérience si pertinent</li>
            <li>• Restez concis et impactant</li>
            <li>• Exemple: "DJ spécialisé dans les mariages indiens avec 15 ans d'expérience"</li>
          </ul>
        </div>
        
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

      {/* Bio complète (optionnelle) */}
      <div className="space-y-2">
        <Label htmlFor="bio">
          Présentation complète <span className="text-muted-foreground">(optionnel)</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Développez votre expérience, votre approche, vos spécialités...
        </p>
        <Textarea
          id="bio"
          placeholder="Parlez de vous, de votre parcours, de ce qui vous différencie..."
          value={bio}
          onChange={(e) => {
            isEditingRef.current = true
            setBio(e.target.value)
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
          rows={6}
        />
        <p className="text-xs text-muted-foreground">
          {bio.length} caractères
        </p>
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
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478]"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
}

