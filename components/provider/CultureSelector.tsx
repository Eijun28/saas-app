'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Info } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CULTURES, CULTURE_CATEGORIES, getSubcategories, getCultureById } from '@/lib/constants/cultures';

export type ExpertiseLevel = 'specialise' | 'experimente';

export interface CultureWithExpertise {
  culture_id: string;
  expertise_level: ExpertiseLevel;
}

const EXPERTISE_LABELS: Record<ExpertiseLevel, string> = {
  specialise: 'Spécialisé',
  experimente: 'Expérimenté',
};

const EXPERTISE_DESCRIPTIONS: Record<ExpertiseLevel, string> = {
  specialise: 'Je connais les traditions et je travaille régulièrement avec cette culture',
  experimente: 'J\'ai déjà réalisé des prestations pour cette culture',
};

const MAX_TOTAL = 8;
const MAX_SPECIALISE = 3;
const MAX_EXPERIMENTE = 5;

interface CultureSelectorProps {
  userId: string;
  onSave?: () => void;
  /** Mode compact pour l'onboarding (pas de combobox recherche) */
  compact?: boolean;
}

export function CultureSelector({ userId, onSave, compact = false }: CultureSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedCultures, setSelectedCultures] = useState<CultureWithExpertise[]>([]);
  const [initialCultures, setInitialCultures] = useState<CultureWithExpertise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedExpertise, setSelectedExpertise] = useState<ExpertiseLevel>('experimente');

  const specialiseCount = selectedCultures.filter(c => c.expertise_level === 'specialise').length;
  const experimenteCount = selectedCultures.filter(c => c.expertise_level === 'experimente').length;

  useEffect(() => {
    loadUserCultures();
  }, [userId]);

  async function loadUserCultures() {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('provider_cultures')
      .select('culture_id, expertise_level')
      .eq('profile_id', userId);

    if (error) {
      console.error('Error loading cultures:', error);
    }
    const cultures = (data || []).map(c => ({
      culture_id: c.culture_id,
      expertise_level: (c.expertise_level || 'experimente') as ExpertiseLevel,
    }));
    setSelectedCultures(cultures);
    setInitialCultures(cultures);
    setIsLoading(false);
  }

  function canAddCulture(expertiseLevel: ExpertiseLevel): boolean {
    if (selectedCultures.length >= MAX_TOTAL) return false;
    if (expertiseLevel === 'specialise' && specialiseCount >= MAX_SPECIALISE) return false;
    if (expertiseLevel === 'experimente' && experimenteCount >= MAX_EXPERIMENTE) return false;
    return true;
  }

  function addCulture(cultureId: string, expertiseLevel: ExpertiseLevel) {
    if (selectedCultures.some(c => c.culture_id === cultureId)) {
      toast.info('Cette culture est déjà sélectionnée');
      return;
    }
    if (!canAddCulture(expertiseLevel)) {
      if (selectedCultures.length >= MAX_TOTAL) {
        toast.error(`Maximum ${MAX_TOTAL} cultures au total`);
      } else if (expertiseLevel === 'specialise') {
        toast.error(`Maximum ${MAX_SPECIALISE} cultures en "Spécialisé"`);
      } else {
        toast.error(`Maximum ${MAX_EXPERIMENTE} cultures en "Expérimenté"`);
      }
      return;
    }
    setSelectedCultures(prev => [...prev, { culture_id: cultureId, expertise_level: expertiseLevel }]);
  }

  function removeCulture(cultureId: string) {
    setSelectedCultures(prev => prev.filter(c => c.culture_id !== cultureId));
  }

  function handleAddCulture() {
    if (selectedSubcategory) {
      addCulture(selectedSubcategory, selectedExpertise);
      setSelectedSubcategory('');
      setSelectedCategory('');
    } else if (selectedCategory) {
      const category = CULTURE_CATEGORIES.find(cat => cat.id === selectedCategory);
      if (category && (!category.subcategories || category.subcategories.length === 0)) {
        addCulture(selectedCategory, selectedExpertise);
        setSelectedCategory('');
      } else {
        toast.info('Veuillez sélectionner une sous-catégorie');
      }
    }
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from('provider_cultures')
        .delete()
        .eq('profile_id', userId);

      if (deleteError) {
        console.error('Error deleting cultures:', deleteError);
        throw deleteError;
      }

      if (selectedCultures.length > 0) {
        const inserts = selectedCultures.map(c => ({
          profile_id: userId,
          culture_id: c.culture_id,
          expertise_level: c.expertise_level,
        }));
        const { error } = await supabase
          .from('provider_cultures')
          .insert(inserts)
          .select();

        if (error) {
          console.error('Error saving cultures:', error);
          throw error;
        }
      }

      setInitialCultures(selectedCultures);
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

  function handleCancel() {
    setSelectedCultures(initialCultures);
  }

  const hasChanges = JSON.stringify(
    [...selectedCultures].sort((a, b) => a.culture_id.localeCompare(b.culture_id))
  ) !== JSON.stringify(
    [...initialCultures].sort((a, b) => a.culture_id.localeCompare(b.culture_id))
  );

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Compteurs */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={cn(
          "px-2 py-1 rounded-full border",
          selectedCultures.length >= MAX_TOTAL ? "bg-red-50 border-red-200 text-red-700" : "bg-gray-50 border-gray-200 text-gray-600"
        )}>
          {selectedCultures.length}/{MAX_TOTAL} cultures
        </span>
        <span className={cn(
          "px-2 py-1 rounded-full border",
          specialiseCount >= MAX_SPECIALISE ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-600"
        )}>
          {specialiseCount}/{MAX_SPECIALISE} spécialisé
        </span>
        <span className={cn(
          "px-2 py-1 rounded-full border",
          experimenteCount >= MAX_EXPERIMENTE ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600"
        )}>
          {experimenteCount}/{MAX_EXPERIMENTE} expérimenté
        </span>
      </div>

      {/* Dropdowns en cascade */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Sélection de la catégorie */}
          <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedSubcategory(''); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              {CULTURE_CATEGORIES.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sélection de la sous-catégorie */}
          {selectedCategory && (
            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sous-catégorie" />
              </SelectTrigger>
              <SelectContent>
                {getSubcategories(selectedCategory).map(subcategory => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Niveau d'expertise + bouton ajouter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={selectedExpertise} onValueChange={(v) => setSelectedExpertise(v as ExpertiseLevel)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="specialise">
                <div className="flex flex-col">
                  <span className="font-medium">Spécialisé</span>
                </div>
              </SelectItem>
              <SelectItem value="experimente">
                <div className="flex flex-col">
                  <span className="font-medium">Expérimenté</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleAddCulture}
            disabled={!selectedSubcategory && !selectedCategory}
            className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            Ajouter
          </Button>
        </div>

        {/* Explication du niveau choisi */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
          <Info className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            {EXPERTISE_DESCRIPTIONS[selectedExpertise]}
          </p>
        </div>
      </div>

      {/* Combobox de recherche (masqué en mode compact) */}
      {!compact && (
        <div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedCultures.length > 0
                  ? `${selectedCultures.length} culture${selectedCultures.length > 1 ? 's' : ''} sélectionnée${selectedCultures.length > 1 ? 's' : ''}`
                  : "Rechercher une culture..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white" align="start">
              <Command className="bg-white">
                <CommandInput placeholder="Rechercher une culture..." className="text-[#4A1259]" />
                <CommandEmpty className="text-[#4A1259]">Aucune culture trouvée</CommandEmpty>
                <CommandGroup className="text-[#4A1259]">
                  {CULTURES.map(culture => {
                    const isSelected = selectedCultures.some(c => c.culture_id === culture.id);
                    return (
                      <CommandItem
                        key={culture.id}
                        value={culture.label}
                        onSelect={() => {
                          if (isSelected) {
                            removeCulture(culture.id);
                          } else {
                            addCulture(culture.id, selectedExpertise);
                          }
                          setOpen(false);
                        }}
                        className="text-[#4A1259] data-[selected=true]:bg-[#823F91]/10 data-[selected=true]:text-[#4A1259]"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-[#823F91]",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {culture.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Badges des cultures sélectionnées */}
      {selectedCultures.length > 0 && (
        <div className="space-y-2">
          {/* Spécialisé */}
          {selectedCultures.filter(c => c.expertise_level === 'specialise').length > 0 && (
            <div>
              <p className="text-xs font-medium text-purple-700 mb-1.5">Spécialisé</p>
              <div className="flex flex-wrap gap-2">
                {selectedCultures.filter(c => c.expertise_level === 'specialise').map(c => {
                  const culture = getCultureById(c.culture_id);
                  return culture ? (
                    <Badge
                      key={c.culture_id}
                      variant="secondary"
                      className="pl-3 pr-1.5 py-1.5 flex items-center gap-1 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      <span className="text-sm text-purple-800">{culture.label}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeCulture(c.culture_id);
                        }}
                        className="ml-0.5 flex-shrink-0 text-gray-900 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Expérimenté */}
          {selectedCultures.filter(c => c.expertise_level === 'experimente').length > 0 && (
            <div>
              <p className="text-xs font-medium text-blue-700 mb-1.5">Expérimenté</p>
              <div className="flex flex-wrap gap-2">
                {selectedCultures.filter(c => c.expertise_level === 'experimente').map(c => {
                  const culture = getCultureById(c.culture_id);
                  return culture ? (
                    <Badge
                      key={c.culture_id}
                      variant="secondary"
                      className="pl-3 pr-1.5 py-1.5 flex items-center gap-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-sm text-blue-800">{culture.label}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeCulture(c.culture_id);
                        }}
                        className="ml-0.5 flex-shrink-0 text-gray-900 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
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
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478] text-white"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
}
