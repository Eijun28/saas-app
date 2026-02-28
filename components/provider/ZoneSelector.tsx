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
import { toast } from 'sonner';
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
      toast.success('Succès', {
        description: 'Zones mises à jour',
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

  function handleCancel() {
    setSelectedIds(initialIds);
  }

  const hasChanges = JSON.stringify(selectedIds.sort()) !== JSON.stringify(initialIds.sort());

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground/60 font-light">Zone d'intervention</p>
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
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white" align="start">
            <Command className="bg-white">
              <CommandInput placeholder="Rechercher un département..." className="text-[#4A1259]" />
              <CommandEmpty className="text-[#4A1259]">Aucun département trouvé</CommandEmpty>
              <CommandList>
                {Object.entries(DEPARTEMENTS_BY_REGION).map(([region, depts]) => (
                  <CommandGroup key={region} heading={region} className="text-[#4A1259] [&_[cmdk-group-heading]]:text-[#823F91] [&_[cmdk-group-heading]]:font-semibold">
                    {depts.map(dept => (
                      <CommandItem
                        key={dept.id}
                        value={`${dept.label} ${dept.id}`}
                        onSelect={() => toggleZone(dept.id)}
                        className="text-[#4A1259] data-[selected=true]:bg-[#823F91]/10 data-[selected=true]:text-[#4A1259]"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-[#823F91]",
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
                variant="secondary"
                className="pl-3 pr-1.5 py-1.5 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="text-sm text-gray-800">{dept.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeZone(id)
                  }}
                  className="ml-0.5 p-0.5 rounded-full bg-black/15 text-gray-900 hover:bg-red-500 hover:text-white transition-colors flex-shrink-0"
                  title="Supprimer"
                >
                  <X className="h-3.5 w-3.5 text-gray-900" strokeWidth={2.5} />
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
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
}

