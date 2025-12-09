'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { staggerCards, scrollFadeIn, cardHover } from '@/lib/animations'
import { COPY } from '@/lib/constants'
import { Check } from 'lucide-react'
import { useState } from 'react'

export function Pricing() {
  const [activeTab, setActiveTab] = useState('couple')

  return (
    <section id="pricing" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={scrollFadeIn}
          initial="initial"
          whileInView="whileInView"
          viewport={scrollFadeIn.viewport}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B0E12] mb-6">
            Tarifs
          </h2>
          <p className="text-base md:text-lg text-[#6B7280] max-w-2xl mx-auto">
            Choisissez le plan qui correspond à vos besoins
          </p>
        </motion.div>

        <div className="flex justify-center mb-12">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full max-w-md"
          >
            <TabsList className="w-full bg-gray-100 p-1.5 rounded-lg">
              <TabsTrigger
                value="couple"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#823F91]"
              >
                Couple
              </TabsTrigger>
              <TabsTrigger
                value="prestataire"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#823F91]"
              >
                Prestataire
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Tabs value={activeTab}>
              <TabsContent value="couple" className="mt-0">
                <motion.div
                  variants={staggerCards}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
                >
                  {COPY.pricing.couple.map((plan, index) => (
                    <motion.div
                      key={index}
                      variants={cardHover}
                      initial="initial"
                      whileHover="hover"
                      className="relative"
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 right-4 bg-[#823F91] text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Populaire
                        </div>
                      )}
                      <Card
                        className={`h-full border-2 transition-all duration-300 ${
                          plan.popular
                            ? 'border-[#823F91] shadow-xl shadow-[#823F91]/20'
                            : 'border-gray-200 hover:border-[#E8D4EF]'
                        }`}
                      >
                        <CardHeader className="text-center pb-4">
                          <CardTitle className="text-2xl md:text-3xl font-bold text-[#0B0E12] mb-2">
                            {plan.name}
                          </CardTitle>
                          <div className="flex items-baseline justify-center gap-2">
                            <span className="text-3xl md:text-4xl font-bold text-[#0B0E12]">
                              {plan.price === '0' ? 'Gratuit' : `€${plan.price}`}
                            </span>
                            {plan.price !== '0' && (
                              <span className="text-base text-[#6B7280]">/{plan.period}</span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <ul className="space-y-3">
                            {plan.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start gap-3">
                                <Check className="h-4 w-4 text-[#823F91] flex-shrink-0 mt-0.5" />
                                <span className="text-sm md:text-base text-[#6B7280]">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button
                            className={`w-full py-6 text-base font-semibold ${
                              plan.popular
                                ? 'bg-[#823F91] hover:bg-[#6D3478] text-white'
                                : 'bg-white border-2 border-[#823F91] text-[#823F91] hover:bg-[#E8D4EF]/50'
                            }`}
                          >
                            {plan.price === '0' ? 'Commencer gratuitement' : 'Choisir ce plan'}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="prestataire" className="mt-0">
                <motion.div
                  variants={staggerCards}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
                >
                  {COPY.pricing.prestataire.map((plan, index) => (
                    <motion.div
                      key={index}
                      variants={cardHover}
                      initial="initial"
                      whileHover="hover"
                      className="relative"
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 right-4 bg-[#823F91] text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Populaire
                        </div>
                      )}
                      <Card
                        className={`h-full border-2 transition-all duration-300 ${
                          plan.popular
                            ? 'border-[#823F91] shadow-xl shadow-[#823F91]/20'
                            : 'border-gray-200 hover:border-[#E8D4EF]'
                        }`}
                      >
                        <CardHeader className="text-center pb-4">
                          <CardTitle className="text-2xl md:text-3xl font-bold text-[#0B0E12] mb-2">
                            {plan.name}
                          </CardTitle>
                          <div className="flex items-baseline justify-center gap-2">
                            <span className="text-3xl md:text-4xl font-bold text-[#0B0E12]">
                              €{plan.price}
                            </span>
                            <span className="text-base text-[#6B7280]">/{plan.period}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <ul className="space-y-3">
                            {plan.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start gap-3">
                                <Check className="h-4 w-4 text-[#823F91] flex-shrink-0 mt-0.5" />
                                <span className="text-sm md:text-base text-[#6B7280]">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button
                            className={`w-full py-6 text-base font-semibold ${
                              plan.popular
                                ? 'bg-[#823F91] hover:bg-[#6D3478] text-white'
                                : 'bg-white border-2 border-[#823F91] text-[#823F91] hover:bg-[#E8D4EF]/50'
                            }`}
                          >
                            Choisir ce plan
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

