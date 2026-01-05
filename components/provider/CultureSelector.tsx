'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CULTURES } from '@/lib/constants/cultures';

interface CultureSelectorProps {
  userId: string;
  onSave?: () => void;
}

export function CultureSelector({ userId, onSave }: CultureSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialIds, setInitialIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les cultures au mount
  useEffect(() => {
    loadUserCultures();
  }, [userId]);

  async function loadUserCultures() {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('provider_cultures')
      .select('culture_id')
      .eq('profile_id', userId);
    
    if (error) {
      console.error('Error loading cultures:', error);
    }
    const ids = data?.map(c => c.culture_id) || [];
    setSelectedIds(ids);
    setInitialIds(ids);
    setIsLoading(false);
  }

  // Toggle une culture dans la sélection locale
  function toggleCulture(cultureId: string) {
    setSelectedIds(prev => 
      prev.includes(cultureId)
        ? prev.filter(id => id !== cultureId)
        : [...prev, cultureId]
    );
  }

  // Retirer une culture via le badge
  function removeCulture(cultureId: string) {
    setSelectedIds(prev => prev.filter(id => id !== cultureId));
  }

  // Sauvegarder en DB
  async function handleSave() {
    setIsSaving(true);
    
    try {
      const supabase = createClient();
      
      // 1. Supprimer toutes les anciennes
      const { error: deleteError } = await supabase
        .from('provider_cultures')
        .delete()
        .eq('profile_id', userId);

      if (deleteError) {
        console.error('Error deleting cultures:', deleteError);
        throw deleteError;
      }

      // 2. Insérer les nouvelles
      if (selectedIds.length > 0) {
        const inserts = selectedIds.map(culture_id => ({
          profile_id: userId,
          culture_id
        }));
        const { data, error } = await supabase
          .from('provider_cultures')
          .insert(inserts)
          .select();
        
        if (error) {
          console.error('Error saving cultures:', error);
          throw error;
        }
      }

      setInitialIds(selectedIds);
      toast.success('Succès', {
        description: 'Cultures mises à jour',
      });
      onSave?.();
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

  // Annuler les modifications
  function handleCancel() {
    setSelectedIds(initialIds);
  }

  const hasChanges = JSON.stringify(selectedIds.sort()) !== JSON.stringify(initialIds.sort());

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        {/* Combobox */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedIds.length > 0
                ? `${selectedIds.length} culture${selectedIds.length > 1 ? 's' : ''} sélectionnée${selectedIds.length > 1 ? 's' : ''}`
                : "Sélectionnez des cultures"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white" align="start">
            <Command className="bg-white">
              <CommandInput placeholder="Rechercher une culture..." className="text-[#4A1259]" />
              <CommandEmpty className="text-[#4A1259]">Aucune culture trouvée</CommandEmpty>
              <CommandGroup className="text-[#4A1259]">
                {CULTURES.map(culture => (
                  <CommandItem
                    key={culture.id}
                    value={culture.label}
                    onSelect={() => {
                      toggleCulture(culture.id);
                    }}
                    className="text-[#4A1259] data-[selected=true]:bg-[#823F91]/10 data-[selected=true]:text-[#4A1259]"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-[#823F91]",
                        selectedIds.includes(culture.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {culture.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Badges des cultures sélectionnées */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map(id => {
            const culture = CULTURES.find(c => c.id === id);
            return culture ? (
              <Badge
                key={id}
                variant="secondary"
                className="pl-3 pr-2 py-1"
              >
                {culture.label}
                <button
                  onClick={() => removeCulture(id)}
                  className="ml-2 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {/* Boutons Annuler/Enregistrer */}
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
            disabled={isSaving}
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478]"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
}
