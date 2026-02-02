'use client';

import { useState, useEffect } from 'react';
import { Check, Plus, X, ChevronDown, ChevronUp, Sparkles, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  getSpecialtiesForService,
  type SpecialtyGroup,
  type SpecialtyOption,
} from '@/lib/constants/service-specialties';
import { getServiceTypeLabel } from '@/lib/constants/service-types';
import type { ProviderSpecialty, ProviderCustomSpecialty } from '@/lib/types/prestataire';

interface ServiceSpecialtiesSelectorProps {
  userId: string;
  serviceType: string;
  onSave?: () => void;
}

interface SelectedSpecialties {
  [groupId: string]: string[]; // Array of option values
}

interface CustomSpecialties {
  [groupId: string]: Array<{ label: string; value: string }>;
}

export function ServiceSpecialtiesSelector({
  userId,
  serviceType,
  onSave,
}: ServiceSpecialtiesSelectorProps) {
  const [groups, setGroups] = useState<SpecialtyGroup[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<SelectedSpecialties>({});
  const [customSpecialties, setCustomSpecialties] = useState<CustomSpecialties>({});
  const [initialSelected, setInitialSelected] = useState<SelectedSpecialties>({});
  const [initialCustom, setInitialCustom] = useState<CustomSpecialties>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [newCustomInputs, setNewCustomInputs] = useState<{ [groupId: string]: string }>({});

  // Load specialties config and saved data
  useEffect(() => {
    if (serviceType) {
      const specialtyGroups = getSpecialtiesForService(serviceType);
      setGroups(specialtyGroups);
      // Expand first 3 groups by default
      setExpandedGroups(new Set(specialtyGroups.slice(0, 3).map(g => g.id)));
      loadSavedSpecialties();
    }
  }, [serviceType, userId]);

  async function loadSavedSpecialties() {
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Load predefined specialties
      const { data: specialtiesData, error: specialtiesError } = await supabase
        .from('provider_specialties')
        .select('*')
        .eq('profile_id', userId)
        .eq('service_type', serviceType);

      if (specialtiesError) {
        console.error('Error loading specialties:', specialtiesError);
      }

      // Load custom specialties
      const { data: customData, error: customError } = await supabase
        .from('provider_custom_specialties')
        .select('*')
        .eq('profile_id', userId)
        .eq('service_type', serviceType);

      if (customError) {
        console.error('Error loading custom specialties:', customError);
      }

      // Group specialties by group_id
      const grouped: SelectedSpecialties = {};
      (specialtiesData || []).forEach((s: ProviderSpecialty) => {
        if (!grouped[s.group_id]) {
          grouped[s.group_id] = [];
        }
        grouped[s.group_id].push(s.option_value);
      });

      // Group custom specialties
      const customGrouped: CustomSpecialties = {};
      (customData || []).forEach((c: ProviderCustomSpecialty) => {
        if (!customGrouped[c.group_id]) {
          customGrouped[c.group_id] = [];
        }
        customGrouped[c.group_id].push({ label: c.custom_label, value: c.custom_value });
      });

      setSelectedSpecialties(grouped);
      setCustomSpecialties(customGrouped);
      setInitialSelected(JSON.parse(JSON.stringify(grouped)));
      setInitialCustom(JSON.parse(JSON.stringify(customGrouped)));
    } catch (error) {
      console.error('Error loading specialties:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Toggle group expansion
  function toggleGroup(groupId: string) {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }

  // Toggle option selection
  function toggleOption(group: SpecialtyGroup, optionValue: string) {
    setSelectedSpecialties(prev => {
      const current = prev[group.id] || [];

      if (group.multiSelect) {
        // Multi-select: toggle the option
        if (current.includes(optionValue)) {
          return {
            ...prev,
            [group.id]: current.filter(v => v !== optionValue),
          };
        } else {
          return {
            ...prev,
            [group.id]: [...current, optionValue],
          };
        }
      } else {
        // Single select: replace or clear
        if (current.includes(optionValue)) {
          return {
            ...prev,
            [group.id]: [],
          };
        } else {
          return {
            ...prev,
            [group.id]: [optionValue],
          };
        }
      }
    });
  }

  // Add custom specialty
  function addCustomSpecialty(groupId: string) {
    const label = newCustomInputs[groupId]?.trim();
    if (!label) return;

    // Create slug
    const value = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if already exists
    const existing = customSpecialties[groupId] || [];
    if (existing.some(c => c.value === value)) {
      toast.error('Cette spécialité personnalisée existe déjà');
      return;
    }

    setCustomSpecialties(prev => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), { label, value }],
    }));

    setNewCustomInputs(prev => ({ ...prev, [groupId]: '' }));
  }

  // Remove custom specialty
  function removeCustomSpecialty(groupId: string, value: string) {
    setCustomSpecialties(prev => ({
      ...prev,
      [groupId]: (prev[groupId] || []).filter(c => c.value !== value),
    }));
  }

  // Check if there are changes
  const hasChanges =
    JSON.stringify(selectedSpecialties) !== JSON.stringify(initialSelected) ||
    JSON.stringify(customSpecialties) !== JSON.stringify(initialCustom);

  // Save to database
  async function handleSave() {
    setIsSaving(true);
    const supabase = createClient();

    try {
      // Delete existing specialties
      await supabase
        .from('provider_specialties')
        .delete()
        .eq('profile_id', userId)
        .eq('service_type', serviceType);

      await supabase
        .from('provider_custom_specialties')
        .delete()
        .eq('profile_id', userId)
        .eq('service_type', serviceType);

      // Insert new specialties
      const specialtyInserts: Array<{
        profile_id: string;
        service_type: string;
        group_id: string;
        option_value: string;
      }> = [];

      Object.entries(selectedSpecialties).forEach(([groupId, values]) => {
        values.forEach(value => {
          specialtyInserts.push({
            profile_id: userId,
            service_type: serviceType,
            group_id: groupId,
            option_value: value,
          });
        });
      });

      if (specialtyInserts.length > 0) {
        const { error: insertError } = await supabase
          .from('provider_specialties')
          .insert(specialtyInserts);

        if (insertError) throw insertError;
      }

      // Insert custom specialties
      const customInserts: Array<{
        profile_id: string;
        service_type: string;
        group_id: string;
        custom_label: string;
        custom_value: string;
      }> = [];

      Object.entries(customSpecialties).forEach(([groupId, customs]) => {
        customs.forEach(custom => {
          customInserts.push({
            profile_id: userId,
            service_type: serviceType,
            group_id: groupId,
            custom_label: custom.label,
            custom_value: custom.value,
          });
        });
      });

      if (customInserts.length > 0) {
        const { error: customInsertError } = await supabase
          .from('provider_custom_specialties')
          .insert(customInserts);

        if (customInsertError) throw customInsertError;
      }

      setInitialSelected(JSON.parse(JSON.stringify(selectedSpecialties)));
      setInitialCustom(JSON.parse(JSON.stringify(customSpecialties)));
      toast.success('Spécialités mises à jour');
      onSave?.();
    } catch (error) {
      console.error('Error saving specialties:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }

  // Cancel changes
  function handleCancel() {
    setSelectedSpecialties(JSON.parse(JSON.stringify(initialSelected)));
    setCustomSpecialties(JSON.parse(JSON.stringify(initialCustom)));
    setNewCustomInputs({});
  }

  // Count total selected
  const totalSelected =
    Object.values(selectedSpecialties).reduce((acc, arr) => acc + arr.length, 0) +
    Object.values(customSpecialties).reduce((acc, arr) => acc + arr.length, 0);

  if (!serviceType) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        Veuillez d&apos;abord sélectionner votre type de service dans les informations professionnelles.
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        Aucune spécialité disponible pour ce type de service.
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement des spécialités...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#4A1259] flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Spécialités - {getServiceTypeLabel(serviceType)}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Précisez vos spécialités pour un matching ultra-précis avec les couples
          </p>
        </div>
        {totalSelected > 0 && (
          <Badge variant="secondary" className="bg-[#823F91]/10 text-[#823F91]">
            {totalSelected} sélectionnée{totalSelected > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Specialty Groups */}
      <div className="space-y-3">
        {groups.map(group => {
          const isExpanded = expandedGroups.has(group.id);
          const selectedInGroup = selectedSpecialties[group.id] || [];
          const customInGroup = customSpecialties[group.id] || [];
          const totalInGroup = selectedInGroup.length + customInGroup.length;

          return (
            <div
              key={group.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[#4A1259]">{group.label}</span>
                  {group.description && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      - {group.description}
                    </span>
                  )}
                  {!group.multiSelect && (
                    <Badge variant="outline" className="text-xs">
                      Choix unique
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {totalInGroup > 0 && (
                    <Badge className="bg-[#823F91] text-white text-xs">
                      {totalInGroup}
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Group Content */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {/* Predefined Options */}
                  <div className="flex flex-wrap gap-2">
                    {group.options.map(option => {
                      const isSelected = selectedInGroup.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleOption(group, option.value)}
                          className={cn(
                            'px-3 py-1.5 text-sm rounded-full border transition-all duration-200',
                            isSelected
                              ? 'bg-[#823F91] text-white border-[#823F91] shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-[#823F91]/50 hover:bg-purple-50'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom specialties for this group */}
                  {customInGroup.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed">
                      {customInGroup.map(custom => (
                        <Badge
                          key={custom.value}
                          variant="secondary"
                          className="pl-2 pr-1 py-1 flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>{custom.label}</span>
                          <button
                            type="button"
                            onClick={() => removeCustomSpecialty(group.id, custom.value)}
                            className="ml-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add custom specialty */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Ajouter une spécialité personnalisée..."
                      value={newCustomInputs[group.id] || ''}
                      onChange={e =>
                        setNewCustomInputs(prev => ({ ...prev, [group.id]: e.target.value }))
                      }
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomSpecialty(group.id);
                        }
                      }}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addCustomSpecialty(group.id)}
                      disabled={!newCustomInputs[group.id]?.trim()}
                      className="h-8 bg-[#823F91] hover:bg-[#6D3478]"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save/Cancel buttons */}
      {hasChanges && (
        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478]"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les spécialités'}
          </Button>
        </div>
      )}
    </div>
  );
}
