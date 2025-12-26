import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CallToAction() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl rounded-3xl border px-6 py-12 md:py-20 lg:py-32">
        <div className="text-center">
          <h2 className="text-balance text-[120px] font-semibold lg:text-[168px]">
            Commencez votre mariage de rêve
          </h2>
          <p className="mt-4 text-gray-600 text-lg">
            Rejoignez des centaines de couples qui ont choisi NUPLY pour leur mariage multiculturel.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#823F91] hover:bg-[#6D3478]"
            >
              <Link href="/sign-up">
                <span>Commencer</span>
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
            >
              <Link href="/tarifs">
                <span>Voir les tarifs</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

