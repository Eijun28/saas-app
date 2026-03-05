import Link from 'next/link'

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-white border border-border rounded-lg p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Vous avez bien été désinscrit(e)
        </h1>
        <p className="text-text-secondary mb-6">
          Vous ne recevrez plus notre newsletter. Vous pouvez vous réinscrire à tout moment.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-[#823F91] text-white rounded-lg hover:bg-[#6D3478] transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
