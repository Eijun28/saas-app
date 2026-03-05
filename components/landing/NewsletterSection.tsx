import { Section } from '@/components/ui/section'
import { NewsletterForm } from '@/components/landing/NewsletterForm'

export function NewsletterSection() {
  return (
    <Section className="bg-transparent">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-3">
          Restez inspirés
        </h2>
        <p className="text-text-secondary mb-8">
          Recevez nos meilleurs conseils mariage, tendances et inspirations directement dans votre boîte mail.
        </p>
        <NewsletterForm />
        <p className="text-xs text-text-muted mt-4">
          Pas de spam. Désinscription en un clic.
        </p>
      </div>
    </Section>
  )
}
