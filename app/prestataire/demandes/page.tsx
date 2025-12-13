'use client'

import { motion } from 'framer-motion'
import { FadeInOnScroll, StaggeredList } from '@/components/landing/animations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Euro, MapPin, Check, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DemandesPage() {
  const demandes = [
    {
      id: 1,
      couple: 'Marie & Jean',
      date: '2024-06-15',
      budget: '€2,000 - €3,000',
      location: 'Paris',
      status: 'new',
    },
    {
      id: 2,
      couple: 'Sophie & Pierre',
      date: '2024-07-20',
      budget: '€1,500 - €2,500',
      location: 'Lyon',
      status: 'in-progress',
    },
    {
      id: 3,
      couple: 'Emma & Lucas',
      date: '2024-05-10',
      budget: '€3,000 - €4,000',
      location: 'Marseille',
      status: 'completed',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8"
    >
      <FadeInOnScroll>
        <div>
          <h1 className="text-4xl font-bold text-[#6D3478] mb-2">
            Demandes reçues
          </h1>
          <p className="text-[#374151]">
            Gérez toutes vos demandes de prestations
          </p>
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.1}>
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="new">Nouvelles</TabsTrigger>
            <TabsTrigger value="in-progress">En cours</TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            <StaggeredList staggerDelay={0.1}>
              <div className="space-y-4">
                {demandes
                  .filter((d) => d.status === 'new')
                  .map((demande) => (
                    <motion.div
                      key={demande.id}
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="mb-2">{demande.couple}</CardTitle>
                              <div className="flex flex-wrap gap-4 text-sm text-[#374151]">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(demande.date).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Euro className="h-4 w-4" />
                                  {demande.budget}
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {demande.location}
                                </div>
                              </div>
                            </div>
                            <Badge variant="default">Nouvelle</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Button className="flex-1 bg-[#6D3478] hover:bg-[#6D28D9] gap-2">
                              <Check className="h-4 w-4" />
                              Accepter
                            </Button>
                            <Button variant="outline" className="flex-1 gap-2">
                              <X className="h-4 w-4" />
                              Refuser
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </StaggeredList>
          </TabsContent>

          <TabsContent value="in-progress" className="mt-6">
            <div className="space-y-4">
              {demandes
                .filter((d) => d.status === 'in-progress')
                .map((demande) => (
                  <Card key={demande.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="mb-2">{demande.couple}</CardTitle>
                          <div className="flex flex-wrap gap-4 text-sm text-[#374151]">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(demande.date).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Euro className="h-4 w-4" />
                              {demande.budget}
                            </div>
                          </div>
                        </div>
                        <Badge variant="default">En cours</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="space-y-4">
              {demandes
                .filter((d) => d.status === 'completed')
                .map((demande) => (
                  <Card key={demande.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="mb-2">{demande.couple}</CardTitle>
                          <div className="flex flex-wrap gap-4 text-sm text-[#374151]">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(demande.date).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        <Badge variant="success">Terminée</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </FadeInOnScroll>
    </motion.div>
  )
}

