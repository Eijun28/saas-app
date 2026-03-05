/**
 * Prompt for AI-powered service generation.
 *
 * Used by the generate-services route to create realistic service offerings
 * for wedding providers based on their activity type and specialties.
 */

export const PROMPT_VERSION = '1.0.0';

export interface ServiceGeneratorParams {
  typeActivite: string;
  specialites: string;
  tarifsHabituels: string;
  autresInfo: string;
}

/**
 * Builds the prompt for generating provider services via GPT.
 */
export function buildServiceGeneratorPrompt(params: ServiceGeneratorParams): string {
  const { typeActivite, specialites, tarifsHabituels, autresInfo } = params;

  return `Tu es un expert en services de mariage. Génère une liste de 4 à 6 services réalistes et bien définis pour un prestataire de type "${typeActivite}".

Informations supplémentaires :
- Spécialités : ${specialites || 'Non précisé'}
- Fourchette de tarifs : ${tarifsHabituels || 'Non précisé'}
- Autres informations : ${autresInfo || 'Non précisé'}

Retourne UNIQUEMENT un JSON valide de cette forme (sans markdown) :
{
  "services": [
    {
      "nom": "Nom du service",
      "description": "Description détaillée du service en 1-2 phrases",
      "prix": 1500
    }
  ]
}

Règles :
- Les noms doivent être clairs et professionnels
- Les descriptions doivent être précises et commerciales
- Les prix doivent être réalistes pour le marché du mariage en France (en euros, nombre entier)
- Entre 4 et 6 services maximum
- Ne pas inclure de packages avec prix "à partir de"
- Adapter les services aux spécialités mentionnées`;
}
