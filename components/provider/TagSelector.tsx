'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Plus, Tag as TagIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import type { Tag, TagCategory } from '@/lib/types/prestataire';

// Type pour la réponse Supabase avec jointure tags
interface ProviderTagJoinResult {
  tag_id: string
  tags: Tag | null
}

interface TagSelectorProps {
  userId: string;
  maxTags?: number;
  onSave?: () => void;
}

const TAG_CATEGORIES: { id: TagCategory; label: string; icon: string }[] = [
  { id: 'style', label: 'Style', icon: '🎨' },
  { id: 'ambiance', label: 'Ambiance', icon: '✨' },
  { id: 'service', label: 'Services', icon: '🛠️' },
  { id: 'specialite', label: 'Spécialités', icon: '⭐' },
  { id: 'qualite', label: 'Qualités', icon: '💎' },
];

export function TagSelector({ userId, maxTags = 15, onSave }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [initialTagIds, setInitialTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TagCategory | 'all'>('all');

  // Load tags on mount
  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    setIsLoading(true);
    const supabase = createClient();

    // Load only predefined tags (shared) — custom tags are private per user
    const { data: predefinedTags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('is_predefined', true)
      .order('usage_count', { ascending: false });

    if (tagsError) {
      console.error('Error loading tags:', tagsError);
    }

    // Load user's selected tags (includes their own custom tags)
    const { data: userTagsData, error: userTagsError } = await supabase
      .from('provider_tags')
      .select('tag_id, tags(*)')
      .eq('profile_id', userId) as unknown as { data: ProviderTagJoinResult[] | null; error: Error | null };

    if (userTagsError) {
      console.error('Error loading user tags:', userTagsError);
    }

    const userTags: Tag[] = (userTagsData || [])
      .filter((pt): pt is ProviderTagJoinResult & { tags: Tag } => pt.tags !== null)
      .map(pt => pt.tags);

    // Merge: predefined tags + user's own custom tags (deduplicated)
    const predefined = predefinedTags || [];
    const userCustomTags = userTags.filter(t => !t.is_predefined);
    const mergedTagIds = new Set(predefined.map(t => t.id));
    const allMerged = [...predefined];
    for (const tag of userCustomTags) {
      if (!mergedTagIds.has(tag.id)) {
        allMerged.push(tag);
      }
    }
    setAllTags(allMerged);

    setSelectedTags(userTags);
    setInitialTagIds(userTags.map(t => t.id));

    setIsLoading(false);
  }

  // Toggle tag selection
  function toggleTag(tag: Tag) {
    if (selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
    } else {
      if (selectedTags.length >= maxTags) {
        toast.error('Limite atteinte', {
          description: `Maximum ${maxTags} tags autorisés`,
        });
        return;
      }
      setSelectedTags(prev => [...prev, tag]);
    }
  }

  // Remove tag via badge
  function removeTag(tagId: string) {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
  }

  // Create a new custom tag
  async function createCustomTag() {
    const label = newTagInput.trim();
    if (!label) return;

    // Check if tag already exists
    const existingTag = allTags.find(
      t => t.label.toLowerCase() === label.toLowerCase()
    );
    if (existingTag) {
      if (!selectedTags.find(t => t.id === existingTag.id)) {
        toggleTag(existingTag);
      }
      setNewTagInput('');
      toast.info('Ce tag existe déjà et a été ajouté');
      return;
    }

    if (selectedTags.length >= maxTags) {
      toast.error('Limite atteinte', {
        description: `Maximum ${maxTags} tags autorisés`,
      });
      return;
    }

    setIsCreatingTag(true);
    const supabase = createClient();

    // Create slug from label
    const slug = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data, error } = await supabase
      .from('tags')
      .insert({
        label,
        slug,
        is_predefined: false,
        category: null, // Custom tags have no category
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      if (error.code === '23505') {
        toast.error('Ce tag existe déjà');
      } else {
        toast.error('Erreur lors de la création du tag');
      }
    } else if (data) {
      setAllTags(prev => [...prev, data]);
      setSelectedTags(prev => [...prev, data]);
      setNewTagInput('');
      toast.success('Tag créé et ajouté');
    }

    setIsCreatingTag(false);
  }

  // Save to database
  async function handleSave() {
    setIsSaving(true);

    try {
      const supabase = createClient();

      // Delete all existing provider_tags
      const { error: deleteError } = await supabase
        .from('provider_tags')
        .delete()
        .eq('profile_id', userId);

      if (deleteError) {
        console.error('Error deleting tags:', deleteError);
        throw deleteError;
      }

      // Insert new tags
      if (selectedTags.length > 0) {
        const inserts = selectedTags.map(tag => ({
          profile_id: userId,
          tag_id: tag.id,
        }));

        const { error: insertError } = await supabase
          .from('provider_tags')
          .insert(inserts);

        if (insertError) {
          console.error('Error saving tags:', insertError);
          throw insertError;
        }
      }

      setInitialTagIds(selectedTags.map(t => t.id));
      toast.success('Tags mis à jour');
      onSave?.();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }

  // Cancel changes
  function handleCancel() {
    const initialTags = allTags.filter(t => initialTagIds.includes(t.id));
    setSelectedTags(initialTags);
  }

  const hasChanges =
    JSON.stringify(selectedTags.map(t => t.id).sort()) !==
    JSON.stringify(initialTagIds.sort());

  // Filter tags by category
  const filteredTags =
    activeCategory === 'all'
      ? allTags
      : allTags.filter(t => t.category === activeCategory);

  // Group predefined tags by category for display
  const predefinedByCategory = TAG_CATEGORIES.map(cat => ({
    ...cat,
    tags: allTags.filter(t => t.category === cat.id && t.is_predefined),
  }));

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <p className="text-sm text-muted-foreground">
        Ajoutez des tags pour décrire votre style et vos services. Les couples pourront vous trouver plus facilement.
      </p>

      {/* Category filter buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory('all')}
          className={activeCategory === 'all' ? 'bg-[#823F91] hover:bg-[#6D3478]' : ''}
        >
          Tous
        </Button>
        {TAG_CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
            className={activeCategory === cat.id ? 'bg-[#823F91] hover:bg-[#6D3478]' : ''}
          >
            {cat.icon} {cat.label}
          </Button>
        ))}
      </div>

      {/* Search and select tags */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedTags.length > 0
              ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} sélectionné${selectedTags.length > 1 ? 's' : ''}`
              : 'Rechercher ou ajouter des tags...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white" align="start">
          <Command className="bg-white">
            <CommandInput placeholder="Rechercher un tag..." className="text-[#4A1259]" />
            <CommandEmpty className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Aucun tag trouvé</p>
              <p className="text-xs text-muted-foreground">Créez un tag personnalisé ci-dessous</p>
            </CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {filteredTags.map(tag => (
                <CommandItem
                  key={tag.id}
                  value={tag.label}
                  onSelect={() => {
                    toggleTag(tag);
                  }}
                  className="text-[#4A1259] data-[selected=true]:bg-[#823F91]/10"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 text-[#823F91]',
                      selectedTags.find(t => t.id === tag.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span>{tag.label}</span>
                  {tag.is_predefined && (
                    <Sparkles className="ml-auto h-3 w-3 text-amber-500" />
                  )}
                  {tag.usage_count > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({tag.usage_count})
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick add predefined tags by category */}
      <div className="space-y-3">
        {predefinedByCategory
          .filter(cat => cat.tags.length > 0)
          .filter(cat => activeCategory === 'all' || activeCategory === cat.id)
          .map(cat => (
            <div key={cat.id}>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {cat.icon} {cat.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cat.tags.map(tag => {
                  const isSelected = selectedTags.find(t => t.id === tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-full border transition-colors',
                        isSelected
                          ? 'bg-[#823F91] text-white border-[#823F91]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#823F91]/50 hover:bg-purple-50'
                      )}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* Create custom tag */}
      <div className="flex gap-2">
        <Input
          placeholder="Créer un tag personnalisé..."
          value={newTagInput}
          onChange={e => setNewTagInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              createCustomTag();
            }
          }}
          className="flex-1"
        />
        <Button
          onClick={createCustomTag}
          disabled={!newTagInput.trim() || isCreatingTag}
          className="bg-[#823F91] hover:bg-[#6D3478] text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Créer
        </Button>
      </div>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Tags sélectionnés ({selectedTags.length}/{maxTags})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="pl-3 pr-1.5 py-1.5 flex items-center gap-1 bg-[#823F91]/10 text-[#823F91] hover:bg-[#823F91]/20 transition-colors"
              >
                <TagIcon className="h-3 w-3 mr-1" />
                <span className="text-sm">{tag.label}</span>
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeTag(tag.id);
                  }}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 text-gray-900 transition-colors"
                  title="Supprimer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Save/Cancel buttons */}
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
