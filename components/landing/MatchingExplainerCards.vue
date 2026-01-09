<template>
  <section class="w-full py-12 md:py-16 bg-background relative overflow-hidden">
    <div class="container mx-auto px-4 md:px-6 relative z-10">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
        <FlipCard
          v-for="(card, index) in cardsData"
          :key="index"
          :card-data="card"
          :delay="index * 0.15"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Rocket, Users, Briefcase, CheckCircle, Sparkles, TrendingUp, Target } from 'lucide-vue-next'
import FlipCard from './FlipCard.vue'

interface Feature {
  icon: any
  text: string
}

interface CardData {
  icon: any
  title: string
  subtitle: string
  description: string
  features: Feature[]
  gradientColors: {
    from: string
    via: string
    to: string
  }
  glowColor: string
}

const cardsData: CardData[] = [
  {
    icon: Users,
    title: 'Pour les Couples',
    subtitle: 'Trouvez vos prestataires idéaux',
    description: 'Décrivez votre événement en 30 secondes et laissez notre algorithme intelligent trouver les prestataires parfaits.',
    features: [
      { icon: Rocket, text: 'Quiz rapide de 3 questions' },
      { icon: Target, text: 'Matching instantané et personnalisé' },
      { icon: CheckCircle, text: 'Profils vérifiés et avis certifiés' }
    ],
    gradientColors: {
      from: '#823F91',
      via: '#c081e3',
      to: '#823F91'
    },
    glowColor: 'rgba(130,63,145,0.6)'
  },
  {
    icon: Briefcase,
    title: 'Pour les Prestataires',
    subtitle: 'Recevez des demandes qualifiées',
    description: 'Créez votre profil et recevez automatiquement des demandes qui correspondent exactement à vos services.',
    features: [
      { icon: Target, text: 'Leads 100% qualifiés et ciblés' },
      { icon: Sparkles, text: 'Zéro prospection nécessaire' },
      { icon: TrendingUp, text: '+40% de réservations en moyenne' }
    ],
    gradientColors: {
      from: '#c081e3',
      via: '#823F91',
      to: '#c081e3'
    },
    glowColor: 'rgba(192,129,227,0.6)'
  }
]
</script>

<style scoped>
/* Respect de prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
