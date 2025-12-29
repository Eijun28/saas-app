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
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DEPARTEMENTS, DEPARTEMENTS_BY_REGION } from '@/lib/constants/zones';

interface ZoneSelectorProps {
  userId: string;
  onSave?: () => void;
}

export function ZoneSelector({ userId, onSave }: ZoneSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialIds, setInitialIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserZones();
  }, [userId]);

  async function loadUserZones() {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('provider_zones')
      .select('zone_id')
      .eq('profile_id', userId);
    
    if (error) {
      console.error('Error loading zones:', error);
    }

    const ids = data?.map(z => z.zone_id) || [];
    setSelectedIds(ids);
    setInitialIds(ids);
    setIsLoading(false);
  }

  function toggleZone(zoneId: string) {
    setSelectedIds(prev => 
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  }

  function removeZone(zoneId: string) {
    setSelectedIds(prev => prev.filter(id => id !== zoneId));
  }

  async function handleSave() {
    setIsSaving(true);
    
    try {
      const supabase = createClient();

      // Supprimer les anciennes
      const { error: deleteError } = await supabase
        .from('provider_zones')
        .delete()
        .eq('profile_id', userId);

      if (deleteError) {
        console.error('Error deleting zones:', deleteError);
        throw deleteError;
      }

      // Insérer les nouvelles
      if (selectedIds.length > 0) {
        const inserts = selectedIds.map(zone_id => ({
          profile_id: userId,
          zone_id
        }));

        const { data, error } = await supabase
          .from('provider_zones')
          .insert(inserts)
          .select();

        if (error) {
          console.error('Error saving zones:', error);
          throw error;
        }
      }

      setInitialIds(selectedIds);
      toast({
        title: 'Succès',
        description: 'Zones mises à jour',
        variant: 'success',
      });
      onSave?.();
    } catch (error: any) {
      console.error('Save error:', error);
      const errorMessage = error?.message || error?.code || error?.details || 'Erreur lors de la sauvegarde';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedIds.length > 0
                ? `${selectedIds.length} département${selectedIds.length > 1 ? 's' : ''} sélectionné${selectedIds.length > 1 ? 's' : ''}`
                : "Sélectionnez des départements"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-lg border shadow-lg bg-white" align="start">
            <Command className="border-0 bg-transparent">
              <CommandInput placeholder="Rechercher un département..." />
              <CommandEmpty>Aucun département trouvé</CommandEmpty>
              <CommandList>
                {Object.entries(DEPARTEMENTS_BY_REGION).map(([region, depts]) => (
                  <CommandGroup key={region} heading={region} className="bg-transparent">
                    {depts.map(dept => (
                      <CommandItem
                        key={dept.id}
                        value={`${dept.label} ${dept.id}`}
                        onSelect={() => toggleZone(dept.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedIds.includes(dept.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {dept.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Badges */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map(id => {
            const dept = DEPARTEMENTS.find(d => d.id === id);
            return dept ? (
              <Badge
                key={id}
                className="pl-3 pr-2 py-1.5 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white border-0 hover:from-[#6D3478] hover:to-[#823F91] transition-all"
              >
                {dept.label}
                <button
                  onClick={() => removeZone(id)}
                  className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}

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
            disabled={isSaving}
            className="bg-[#823F91] hover:bg-[#6D3478] h-9 text-sm"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
}

