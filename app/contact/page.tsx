'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Particles from '@/components/Particles'
import { toast } from 'sonner'
import { Loader2, Mail, Send } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }

      toast.success('Votre message a été envoyé avec succès !')
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue lors de l\'envoi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background" style={{ position: 'relative' }}>
      {/* Background de particules - couvre toute la page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ width: '100vw', height: '100vh' }}>
        <Particles
          particleCount={200}
          particleSpread={10}
          speed={0.24}
          particleColors={["#823F91","#c081e3","#823F91"]}
          moveParticlesOnHover={false}
          particleHoverFactor={1}
          alphaParticles={false}
          particleBaseSize={50}
          sizeRandomness={0.5}
          cameraDistance={20}
          disableRotation={false}
          className=""
        />
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 pt-24 md:pt-32 pb-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
              style={{ color: '#823F91' }}
            >
              Contactez-nous
            </h1>
            <p 
              className="text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'hsl(var(--beige-800))' }}
            >
              Une question ? Une suggestion ? Nous sommes là pour vous aider.
            </p>
          </motion.div>

          {/* Formulaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 lg:p-10 border border-white/20"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div>
                <label 
                  htmlFor="name" 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#823F91' }}
                >
                  Nom complet *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Votre nom"
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#823F91' }}
                >
                  Email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>

              {/* Sujet */}
              <div>
                <label 
                  htmlFor="subject" 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#823F91' }}
                >
                  Sujet *
                </label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="De quoi souhaitez-vous nous parler ?"
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>

              {/* Message */}
              <div>
                <label 
                  htmlFor="message" 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#823F91' }}
                >
                  Message *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Votre message..."
                  rows={6}
                  className="w-full resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Bouton d'envoi */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-8 py-6 text-base font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'hsl(var(--violet-500))',
                    boxShadow: '0 4px 12px hsl(var(--violet-500) / 0.25)',
                    color: 'rgba(255, 255, 255, 1)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Lien Instagram */}
            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: 'hsl(var(--beige-700))' }}>
                Contactez-nous sur{' '}
                <a 
                  href="https://www.instagram.com/nuply.fr/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:underline"
                  style={{ color: '#823F91' }}
                >
                  Instagram
                </a>
              </p>
            </div>

            {/* Informations de contact */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'hsl(var(--beige-700))' }}>
                <Mail className="h-4 w-4" />
                <span>Ou envoyez-nous un email directement à</span>
                <a 
                  href="mailto:contact@nuply.fr" 
                  className="font-semibold hover:underline"
                  style={{ color: '#823F91' }}
                >
                  contact@nuply.fr
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
