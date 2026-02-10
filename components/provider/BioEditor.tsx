'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface BioEditorProps {
  userId: string;
  currentBio?: string;
  onSave?: () => void;
}

const MAX_BIO_LENGTH = 1000;

export function BioEditor({
  userId,
  currentBio = '',
  onSave,
}: BioEditorProps) {
  const [bio, setBio] = useState(currentBio);
  const [initialBio, setInitialBio] = useState(currentBio);
  const [isSaving, setIsSaving] = useState(false);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (isSaving || isEditingRef.current) return;

    const newBio = currentBio || '';
    if (newBio !== initialBio) {
      setBio(newBio);
      setInitialBio(newBio);
    }
  }, [currentBio, isSaving, initialBio]);

  const hasChanges = bio !== initialBio;

  async function handleSave() {
    if (bio.length > MAX_BIO_LENGTH) {
      toast.error('La bio doit faire maximum 1000 caractères');
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .update({ bio: bio.trim() || null })
        .eq('id', userId)
        .select('bio')
        .single();

      if (error) {
        console.error('Erreur sauvegarde bio:', error);
        throw new Error(error.message || 'Erreur lors de la sauvegarde');
      }

      const savedBio = data?.bio || '';
      setBio(savedBio);
      setInitialBio(savedBio);
      isEditingRef.current = false;

      toast.success('Présentation mise à jour');
      setTimeout(() => onSave?.(), 300);
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setBio(initialBio);
  }

  const bioLength = bio.length;
  const bioColor =
    bioLength > MAX_BIO_LENGTH
      ? 'text-destructive'
      : bioLength > MAX_BIO_LENGTH - 100
      ? 'text-orange-500'
      : 'text-muted-foreground';

  return (
    <div className="space-y-2">
      <Label htmlFor="bio">Présentation détaillée</Label>
      <p className="text-sm text-muted-foreground">
        Présentez votre parcours, votre approche et ce qui vous rend unique (max {MAX_BIO_LENGTH} caractères)
      </p>

      <Textarea
        id="bio"
        placeholder="Ex: Passionné de photographie depuis 10 ans, je me suis spécialisé dans les mariages multiculturels après avoir couvert des cérémonies aux quatre coins du monde. Mon approche mêle reportage authentique et portraits soignés pour capturer chaque émotion de votre journée..."
        value={bio}
        onChange={(e) => {
          isEditingRef.current = true;
          setBio(e.target.value);
        }}
        onBlur={() => {
          setTimeout(() => {
            isEditingRef.current = false;
          }, 100);
        }}
        onFocus={() => {
          isEditingRef.current = true;
        }}
        className="resize-none"
        rows={5}
      />
      <div className="flex justify-between items-center text-xs">
        <span className={bioColor}>
          {bioLength}/{MAX_BIO_LENGTH} caractères
        </span>
        {bioLength > MAX_BIO_LENGTH && (
          <span className="text-destructive font-medium">
            Trop long de {bioLength - MAX_BIO_LENGTH} caractères
          </span>
        )}
      </div>

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
            disabled={isSaving || bioLength > MAX_BIO_LENGTH}
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478]"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
}
