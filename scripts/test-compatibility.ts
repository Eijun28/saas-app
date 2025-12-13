/**
 * Script de test pour le moteur de compatibilité
 * Usage: npx tsx scripts/test-compatibility.ts
 */

import { CompatibilityEngine } from '../lib/compatibility/engine';

const engine = new CompatibilityEngine();

// Profil couple de test
const couple = {
  wedding_date: new Date('2025-06-15'),
  budget_breakdown: { photography: 4000 },
  guest_count: 150,
  location: {
    city: 'Paris',
    region: 'Île-de-France',
    coordinates: [0, 0] as [number, number],
  },
  cultural_background: ['french', 'algerian'],
  languages: ['french'],
  religions: ['muslim'],
  style_preferences: ['modern'],
  dietary_needs: ['halal'],
  category_priorities: { photography: 8 },
  flexibility_options: {
    date: false,
    budget: true,
    location: false,
  },
};

// Prestataire de test - Match parfait
const providerPerfect = {
  id: '1',
  business_name: 'Photo Parfait',
  category: 'photography',
  service_locations: ['Paris'],
  price_range: { min: 3500, max: 4500 },
  guest_capacity: { min: 100, max: 200 },
  cultural_specialties: ['algerian', 'french'],
  languages: ['french', 'arabic'],
  dietary_options: ['halal'],
  style_tags: ['modern'],
  average_rating: 4.8,
};

// Prestataire de test - Match moyen
const providerMedium = {
  id: '2',
  business_name: 'Photo Moyen',
  category: 'photography',
  service_locations: ['Lyon'], // Mauvais lieu
  price_range: { min: 2000, max: 3000 }, // Budget trop bas
  guest_capacity: { min: 50, max: 100 }, // Capacité insuffisante
  cultural_specialties: ['french'], // Pas de spécialité algérienne
  languages: ['french'],
  dietary_options: [],
  style_tags: ['traditional'], // Style différent
  average_rating: 4.2,
};

console.log('🧪 Tests du Moteur de Compatibilité\n');
console.log('=====================================\n');

// Test 1: Match parfait
console.log('📸 Test 1: Match parfait');
const resultPerfect = engine.calculateOverallCompatibility(
  couple as any,
  providerPerfect as any,
  'photography'
);
console.log('Score global:', resultPerfect.overall, '%');
console.log('Raison:', resultPerfect.reason);
console.log('Breakdown:', resultPerfect.breakdown);
console.log('✅ Score attendu: >= 85%\n');

// Test 2: Match moyen
console.log('📸 Test 2: Match moyen');
const resultMedium = engine.calculateOverallCompatibility(
  couple as any,
  providerMedium as any,
  'photography'
);
console.log('Score global:', resultMedium.overall, '%');
console.log('Raison:', resultMedium.reason);
console.log('Breakdown:', resultMedium.breakdown);
console.log('✅ Score attendu: 40-70%\n');

// Test 3: Vérification des critères
console.log('📊 Test 3: Vérification des critères');
console.log('Budget:', resultPerfect.breakdown.budget, '%');
console.log('Localisation:', resultPerfect.breakdown.location, '%');
console.log('Capacité:', resultPerfect.breakdown.capacity, '%');
console.log('Culturel:', resultPerfect.breakdown.cultural, '%');
console.log('Style:', resultPerfect.breakdown.style, '%');
console.log('');

console.log('✅ Tous les tests sont terminés !');

