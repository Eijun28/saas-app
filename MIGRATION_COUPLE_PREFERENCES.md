# Migration vers couple_preferences - Guide de migration du code

## 📋 Résumé

Cette migration déplace les données redondantes de la table `couples` vers `couple_preferences` pour une meilleure normalisation de la base de données.

## 🔄 Changements dans le schéma

### Colonnes supprimées de `couples` :
- `cultures` (ARRAY) → migré vers `couple_preferences.cultural_preferences->cultures`
- `religions` (ARRAY) → migré vers `couple_preferences.cultural_preferences->religions` et `religious_ceremony`
- `cultural_requirements` (TEXT) → migré vers `couple_preferences.cultural_preferences->cultural_requirements`
- `wedding_style` (TEXT) → migré vers `couple_preferences.wedding_description`
- `ambiance` (TEXT) → migré vers `couple_preferences.wedding_description`
- `color_theme` (TEXT) → migré vers `couple_preferences.wedding_description`
- `services_needed` (ARRAY) → migré vers `couple_preferences.essential_services`
- `service_priorities` (ARRAY) → migré vers `couple_preferences.service_priorities` (JSONB)
- `budget_flexibility` (TEXT) → migré vers `couple_preferences.budget_breakdown->flexibility`
- `planning_stage` (TEXT) → migré vers `couple_preferences.onboarding_step` (INTEGER)
- `profile_completion` (INTEGER) → migré vers `couple_preferences.completion_percentage`

### Table supprimée :
- `couples_archive_2026_01_05` (table d'archive temporaire)

## 📝 Fichiers à mettre à jour

### 1. `app/couple/profil/page.tsx` (CRITIQUE)

**Changements nécessaires :**

#### Chargement des données (fonction `loadProfile`) :
```typescript
// AVANT
const { data, error } = await supabase
  .from('couples')
  .select('*')
  .eq('user_id', user.id)
  .single()

// APRÈS
const { data: coupleData, error: coupleError } = await supabase
  .from('couples')
  .select(`
    *,
    preferences:couple_preferences(*)
  `)
  .eq('user_id', user.id)
  .single()

// Extraire les données depuis couple_preferences
const prefs = coupleData?.preferences || {}
const culturalPrefs = (prefs.cultural_preferences || {}) as any

setFormData({
  // ... données de couples (inchangées)
  partner_1_name: coupleData.partner_1_name || '',
  partner_2_name: coupleData.partner_2_name || '',
  // ...
  
  // Données depuis couple_preferences
  cultures: culturalPrefs.cultures || [],
  religions: culturalPrefs.religions || [],
  cultural_requirements: culturalPrefs.cultural_requirements || '',
  wedding_style: extractWeddingStyle(prefs.wedding_description),
  ambiance: extractAmbiance(prefs.wedding_description),
  color_theme: extractColorTheme(prefs.wedding_description),
  services_needed: prefs.essential_services || [],
  service_priorities: convertServicePrioritiesToArray(prefs.service_priorities),
  budget_flexibility: prefs.budget_breakdown?.flexibility || '',
  planning_stage: mapOnboardingStepToPlanningStage(prefs.onboarding_step),
  profile_completion: prefs.completion_percentage || 0,
})
```

#### Sauvegarde des données (fonction `handleSave`) :
```typescript
// AVANT
const { error } = await supabase
  .from('couples')
  .update({
    // ... tous les champs
    cultures: formData.cultures || [],
    religions: formData.religions || [],
    // ...
  })
  .eq('user_id', user.id)

// APRÈS
// 1. Mettre à jour couples (données de base uniquement)
const { error: coupleError } = await supabase
  .from('couples')
  .update({
    partner_1_name: formData.partner_1_name.trim(),
    partner_2_name: formData.partner_2_name.trim(),
    wedding_date: formData.wedding_date || null,
    wedding_city: formData.wedding_city || null,
    wedding_region: formData.wedding_region || null,
    wedding_country: formData.wedding_country || 'France',
    guest_count: formData.guest_count || null,
    wedding_type: formData.wedding_type || null,
    budget_min: formData.budget_min || null,
    budget_max: formData.budget_max || null,
    budget_total: formData.budget_total || null,
    other_services_text: formData.other_services_text || null,
    updated_at: new Date().toISOString(),
  })
  .eq('user_id', user.id)

// 2. Mettre à jour ou créer couple_preferences
const completion = calculateCompletion(formData)
const culturalPrefs = {
  cultures: formData.cultures || [],
  religions: formData.religions || [],
  cultural_requirements: formData.cultural_requirements || null,
  religious_ceremony: formData.religions?.[0] || null,
}

const weddingDesc = buildWeddingDescription(
  formData.wedding_style,
  formData.ambiance,
  formData.color_theme
)

const servicePriorities = convertArrayToServicePriorities(formData.service_priorities)

const budgetBreakdown = {
  flexibility: formData.budget_flexibility || null,
  total: {
    min: formData.budget_min || 0,
    max: formData.budget_max || 0,
  }
}

// Récupérer le couple_id
const { data: couple } = await supabase
  .from('couples')
  .select('id')
  .eq('user_id', user.id)
  .single()

// Vérifier si couple_preferences existe
const { data: existingPrefs } = await supabase
  .from('couple_preferences')
  .select('id')
  .eq('couple_id', couple.id)
  .single()

if (existingPrefs) {
  // Mettre à jour
  const { error: prefsError } = await supabase
    .from('couple_preferences')
    .update({
      cultural_preferences: culturalPrefs,
      essential_services: formData.services_needed || [],
      service_priorities: servicePriorities,
      wedding_description: weddingDesc,
      budget_breakdown: budgetBreakdown,
      completion_percentage: completion,
      onboarding_step: mapPlanningStageToOnboardingStep(formData.planning_stage),
      profile_completed: completion >= 80,
      updated_at: new Date().toISOString(),
    })
    .eq('couple_id', couple.id)
} else {
  // Créer
  const { error: prefsError } = await supabase
    .from('couple_preferences')
    .insert({
      couple_id: couple.id,
      cultural_preferences: culturalPrefs,
      essential_services: formData.services_needed || [],
      service_priorities: servicePriorities,
      wedding_description: weddingDesc,
      budget_breakdown: budgetBreakdown,
      completion_percentage: completion,
      onboarding_step: mapPlanningStageToOnboardingStep(formData.planning_stage),
      profile_completed: completion >= 80,
    })
}
```

#### Fonctions utilitaires à ajouter :
```typescript
function extractWeddingStyle(description: string | null): string {
  if (!description) return ''
  const match = description.match(/Style: ([^|]+)/)
  return match ? match[1].trim() : ''
}

function extractAmbiance(description: string | null): string {
  if (!description) return ''
  const match = description.match(/Ambiance: ([^|]+)/)
  return match ? match[1].trim() : ''
}

function extractColorTheme(description: string | null): string {
  if (!description) return ''
  const match = description.match(/Couleurs: (.+)/)
  return match ? match[1].trim() : ''
}

function buildWeddingDescription(style: string, ambiance: string, colors: string): string | null {
  const parts: string[] = []
  if (style) parts.push(`Style: ${style}`)
  if (ambiance) parts.push(`Ambiance: ${ambiance}`)
  if (colors) parts.push(`Couleurs: ${colors}`)
  return parts.length > 0 ? parts.join(' | ') : null
}

function convertServicePrioritiesToArray(priorities: any): string[] {
  if (!priorities || typeof priorities !== 'object') return []
  return Object.keys(priorities)
}

function convertArrayToServicePriorities(priorities: string[]): any {
  if (!priorities || !Array.isArray(priorities)) return {}
  const result: any = {}
  priorities.forEach(service => {
    result[service] = 'medium' // valeur par défaut
  })
  return result
}

function mapOnboardingStepToPlanningStage(step: number | null): string {
  if (step === null || step === undefined) return ''
  const mapping: Record<number, string> = {
    0: 'just_engaged',
    1: 'planning_started',
    2: 'almost_ready',
    3: 'last_minute',
  }
  return mapping[step] || ''
}

function mapPlanningStageToOnboardingStep(stage: string | null): number {
  if (!stage) return 0
  const mapping: Record<string, number> = {
    'just_engaged': 0,
    'planning_started': 1,
    'almost_ready': 2,
    'last_minute': 3,
  }
  return mapping[stage] || 0
}
```

## ✅ Checklist de migration

- [ ] Exécuter la migration SQL `016_cleanup_redundant_columns.sql`
- [ ] Mettre à jour `app/couple/profil/page.tsx` pour charger depuis `couple_preferences`
- [ ] Mettre à jour `app/couple/profil/page.tsx` pour sauvegarder dans `couple_preferences`
- [ ] Ajouter les fonctions utilitaires dans `app/couple/profil/page.tsx`
- [ ] Tester le chargement du profil
- [ ] Tester la sauvegarde du profil
- [ ] Vérifier que les autres fichiers n'utilisent pas ces colonnes
- [ ] Mettre à jour les types TypeScript si nécessaire

## ⚠️ Notes importantes

1. **Compatibilité** : La migration SQL préserve toutes les données existantes
2. **Rétrocompatibilité** : Le code doit être mis à jour AVANT d'exécuter la migration SQL pour éviter les erreurs
3. **Tests** : Tester soigneusement le chargement et la sauvegarde après la migration
