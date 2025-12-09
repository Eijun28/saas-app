'use client'

import { Carousel } from '@/components/ui/carousel'
import { Card, CardContent } from '@/components/ui/card'
import { FadeInOnScroll } from '@/components/components/landing/animations'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Sophie & Ahmed',
    role: 'Couple franco-marocain',
    content:
      'NUPLY nous a permis de trouver des prestataires qui comprenaient vraiment nos traditions. Notre mariage a été parfait, mélangeant harmonieusement nos deux cultures.',
    rating: 5,
    image: '👰‍♀️🤵‍♂️',
  },
  {
    id: 2,
    name: 'Marie & Yuki',
    role: 'Couple franco-japonais',
    content:
      'La plateforme est intuitive et le matching est vraiment intelligent. Nous avons trouvé notre photographe et notre traiteur en quelques jours seulement.',
    rating: 5,
    image: '💑',
  },
  {
    id: 3,
    name: 'Lucas & Priya',
    role: 'Couple franco-indien',
    content:
      'L\'organisation d\'un mariage multiculturel peut être stressante, mais NUPLY a tout simplifié. La messagerie intégrée et le planning nous ont fait gagner un temps précieux.',
    rating: 5,
    image: '🎎',
  },
  {
    id: 4,
    name: 'Emma & Carlos',
    role: 'Couple franco-espagnol',
    content:
      'Nous recommandons NUPLY à tous nos amis ! La communauté est bienveillante et les prestataires sont de qualité. Notre mariage a dépassé nos attentes.',
    rating: 5,
    image: '💒',
  },
]

export function TestimonialsCarousel() {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-gradient-to-b from-white to-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-6">
        <FadeInOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="px-4 py-1.5 rounded-full bg-[#E8D4EF] text-[#823F91] text-sm font-semibold">
              Témoignages
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#0B0E12] mb-4">
            Ce que disent nos couples
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Des milliers de couples nous font confiance pour organiser leur mariage de rêve.
          </p>
        </FadeInOnScroll>

        <div className="max-w-4xl mx-auto">
          <Carousel autoPlay interval={6000} showDots showArrows>
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="px-4 md:px-8 py-8">
                <Card className="border-2 border-gray-100 shadow-lg">
                  <CardContent className="p-6 md:p-8 lg:p-12">
                    <div className="flex flex-col items-center text-center space-y-6">
                      {/* Quote Icon */}
                      <div className="w-16 h-16 rounded-full bg-[#E8D4EF] flex items-center justify-center">
                        <Quote className="h-8 w-8 text-[#823F91]" />
                      </div>

                      {/* Rating */}
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>

                      {/* Content */}
                      <p className="text-base md:text-lg lg:text-xl text-[#374151] leading-relaxed max-w-2xl px-2">
                        &ldquo;{testimonial.content}&rdquo;
                      </p>

                      {/* Author */}
                      <div className="pt-4">
                        <div className="text-4xl mb-3">{testimonial.image}</div>
                        <p className="font-semibold text-[#0B0E12] text-lg">
                          {testimonial.name}
                        </p>
                        <p className="text-[#6B7280] text-sm">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  )
}

