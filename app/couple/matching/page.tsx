'use client'

import { useUser } from '@/hooks/use-user'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function MatchingPage() {
	const router = useRouter()
	const { user, loading: userLoading } = useUser()

	// Redirection si non connecté
	if (!userLoading && !user) {
		router.push('/sign-in')
		return null
	}

	if (userLoading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<p className="text-[#6B7280]">Chargement...</p>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-white flex items-center justify-center">
			<div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 text-center">
				<div className="mb-6">
					<Loader2 className="size-16 mx-auto text-[#6B7280] animate-spin mb-4" />
					<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
						Page temporairement indisponible
					</h1>
					<p className="text-[#6B7280] text-lg">
						La fonctionnalité de matching IA est en cours de développement.
						<br />
						Elle sera bientôt disponible.
					</p>
				</div>
			</div>
		</div>
	)
}
