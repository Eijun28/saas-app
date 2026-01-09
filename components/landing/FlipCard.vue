<template>
  <div
    class="perspective-[2000px] w-full"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      class="relative h-[420px] md:h-[460px] w-full max-w-sm mx-auto transition-transform duration-1000 ease-in-out"
      :class="{
        '[transform:rotateY(180deg)]': isFlipped,
        '[transform:rotateY(0deg)]': !isFlipped
      }"
      style="transform-style: preserve-3d;"
    >
      <!-- FRONT FACE - Face avant avec icône et description -->
      <div
        class="absolute inset-0 backface-hidden rounded-2xl p-6 md:p-8 bg-white border-2 border-[#c081e3]/30 shadow-lg overflow-hidden transition-all duration-500"
        :class="{
          'shadow-[0_0_30px_rgba(168,85,247,0.4),0_0_60px_rgba(168,85,247,0.2),inset_0_0_30px_rgba(168,85,247,0.15)] border-[#c081e3]/50': isHovered,
          'shadow-[0_0_20px_rgba(168,85,247,0.3),0_0_40px_rgba(168,85,247,0.15),inset_0_0_20px_rgba(168,85,247,0.1)]': !isHovered
        }"
        style="transform: rotateY(0deg); backface-visibility: hidden; -webkit-backface-visibility: hidden;"
      >
        <!-- Gradient background subtil -->
        <div
          class="absolute inset-0 opacity-5"
          :style="gradientStyle"
        />

        <!-- Glow effect autour de la carte -->
        <div
          class="absolute -inset-1 rounded-2xl opacity-5 blur-2xl transition-opacity duration-500"
          :class="{ 'opacity-10': isHovered }"
          :style="glowStyle"
        />

        <!-- Icône principale avec glow intensifié -->
        <div class="relative mb-6 md:mb-8">
          <div
            class="w-16 h-16 md:w-20 md:h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg relative z-10 ring-2 ring-[#c081e3]/20 transition-all duration-500"
            :class="{ 'scale-110 ring-[#c081e3]/40': isHovered }"
            :style="iconBoxShadow"
          >
            <component
              :is="cardData.icon"
              class="w-8 h-8 md:w-10 md:h-10 text-white transition-transform duration-300"
              :class="{ 'scale-110': isHovered }"
            />
          </div>
          <!-- Glow effect derrière l'icône -->
          <div
            class="absolute inset-0 w-18 h-18 md:w-24 md:h-24 mx-auto -translate-x-1 -translate-y-1 rounded-2xl blur-xl opacity-30 transition-opacity duration-500"
            :class="{ 'opacity-50': isHovered }"
            :style="gradientStyle"
          />
        </div>

        <!-- Texte avec hiérarchie améliorée -->
        <div class="relative z-10 text-center space-y-3 md:space-y-4">
          <h3 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight transition-colors duration-300">
            {{ cardData.title }}
          </h3>
          <p class="text-sm md:text-base text-gray-700 leading-relaxed px-2 md:px-4 font-medium">
            {{ cardData.description }}
          </p>
        </div>

        <!-- Indicateur hover amélioré -->
        <div class="absolute bottom-4 md:bottom-6 left-0 right-0 text-center">
          <div
            class="inline-flex items-center gap-2 text-xs md:text-sm text-gray-500 transition-all duration-300"
            :class="{ 'text-[#c081e3] scale-105': isHovered }"
          >
            <Sparkles
              class="w-3 h-3 md:w-4 md:h-4 transition-transform duration-300"
              :class="{ 'animate-pulse': isHovered }"
            />
            <span class="font-medium">Survolez pour voir les détails</span>
          </div>
        </div>
      </div>

      <!-- BACK FACE - Face arrière avec features et CTA -->
      <div
        class="absolute inset-0 backface-hidden rounded-2xl p-6 md:p-8 overflow-hidden flex flex-col transition-all duration-500"
        :style="backFaceStyle"
      >
        <!-- Pattern overlay -->
        <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

        <!-- Features avec stagger animation et hover states -->
        <div class="relative z-10 space-y-3 md:space-y-4 flex-1">
          <div
            v-for="(feature, index) in cardData.features"
            :key="index"
            class="flex items-start gap-3 md:gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 transition-all duration-300 cursor-pointer group"
            :class="{
              'bg-white/20 border-white/40 scale-[1.02] shadow-lg': hoveredFeatureIndex === index,
              'hover:bg-white/15 hover:border-white/30': hoveredFeatureIndex !== index
            }"
            @mouseenter="handleFeatureHover(index)"
            @mouseleave="handleFeatureHover(null)"
            :style="{
              transitionDelay: `${index * 50}ms`
            }"
          >
            <div
              class="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 transition-all duration-300"
              :class="{
                'bg-white/30 scale-110': hoveredFeatureIndex === index
              }"
            >
              <component
                :is="feature.icon"
                class="w-4 h-4 md:w-5 md:h-5 text-white transition-transform duration-300"
                :class="{
                  'scale-110 rotate-3': hoveredFeatureIndex === index
                }"
              />
            </div>
            <p
              class="text-sm md:text-base text-white font-semibold leading-snug transition-all duration-300"
              :class="{
                'text-white scale-[1.01]': hoveredFeatureIndex === index
              }"
            >
              {{ feature.text }}
            </p>
          </div>
        </div>

        <!-- Footer CTA amélioré -->
        <div class="relative z-10 mt-4 md:mt-6">
          <NuxtLink
            to="/sign-up"
            class="w-full py-3 md:py-4 px-4 md:px-6 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold text-sm md:text-base hover:bg-white/30 hover:border-white/40 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 group/cta focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            <span class="transition-transform duration-300 group-hover/cta:scale-105">En savoir plus</span>
            <Sparkles
              class="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover/cta:rotate-12 group-hover/cta:scale-110"
            />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'

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

const props = defineProps<{
  cardData: CardData
  delay?: number
}>()

const isFlipped = ref(false)
const isHovered = ref(false)
const hoveredFeatureIndex = ref<number | null>(null)

const gradientStyle = computed(() => ({
  background: `linear-gradient(to bottom right, ${props.cardData.gradientColors.from}, ${props.cardData.gradientColors.via}, ${props.cardData.gradientColors.to})`
}))

const glowStyle = computed(() => ({
  background: `linear-gradient(to right, ${props.cardData.gradientColors.from}, ${props.cardData.gradientColors.via}, ${props.cardData.gradientColors.to})`
}))

const iconBoxShadow = computed(() => ({
  ...gradientStyle.value,
  boxShadow: isHovered.value
    ? '0 0 25px rgba(168, 85, 247, 0.5)'
    : '0 0 15px rgba(168, 85, 247, 0.3)'
}))

const backFaceStyle = computed(() => ({
  transform: 'rotateY(180deg)',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  ...gradientStyle.value,
  boxShadow: `0 0 20px ${props.cardData.glowColor}, 0 0 40px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)`
}))

const handleMouseEnter = () => {
  isHovered.value = true
  isFlipped.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
  isFlipped.value = false
  hoveredFeatureIndex.value = null
}

const handleFeatureHover = (index: number | null) => {
  hoveredFeatureIndex.value = index
}
</script>

<style scoped>
.perspective-[2000px] {
  perspective: 2000px;
}

.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* Respect de prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Amélioration de l'accessibilité pour les écrans tactiles */
@media (hover: none) {
  .perspective-[2000px]:active {
    transform: scale(0.98);
  }
}
</style>
