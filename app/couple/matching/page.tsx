'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTextArea,
} from '@/components/ui/chat-input'
import { Sparkles, MessageSquare, Bot } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
}

export default function MatchingPage() {
	const router = useRouter()
	const { user, loading: userLoading } = useUser()
	const [messages, setMessages] = useState<Message[]>([
		{
			id: '1',
			role: 'assistant',
			content: 'Bonjour ! Je suis votre conseiller en mariage virtuel. Dites-moi tout sur votre projet de mariage : la date, le lieu, le nombre d\'invités, votre budget, et vos préférences. Je vais vous aider à trouver les prestataires parfaits ! 💍✨',
			timestamp: new Date(),
		},
	])
	const [inputValue, setInputValue] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	// Redirection si non connecté
	if (!userLoading && !user) {
		router.push('/sign-in')
		return null
	}

	const handleSubmit = async () => {
		if (!inputValue.trim() || isLoading) return

		const userMessage: Message = {
			id: Date.now().toString(),
			role: 'user',
			content: inputValue.trim(),
			timestamp: new Date(),
		}

		setMessages((prev) => [...prev, userMessage])
		setInputValue('')
		setIsLoading(true)

		// Simuler une réponse de l'assistant (à remplacer par l'API de matching plus tard)
		setTimeout(() => {
			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: 'assistant',
				content: 'Merci pour ces informations ! Je prends note de vos besoins. Le système de matching va analyser votre demande et vous proposer les prestataires les plus adaptés. En attendant, avez-vous d\'autres détails à partager sur votre mariage ?',
				timestamp: new Date(),
			}
			setMessages((prev) => [...prev, assistantMessage])
			setIsLoading(false)
			toast.success('Message envoyé', {
				description: 'Votre demande a été enregistrée',
			})
		}, 1500)
	}

	if (userLoading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<p className="text-[#6B7280]">Chargement...</p>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-white">
			<div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
				{/* En-tête */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-8"
				>
					<div className="flex items-center gap-3 mb-4">
						<div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center hover-gradient-purple">
							<Sparkles className="h-6 w-6 text-white" />
						</div>
						<div>
							<p className="text-[#6B7280]">
								Parlez avec votre conseiller virtuel pour décrire votre mariage
							</p>
						</div>
					</div>
				</motion.div>

				{/* Zone de chat */}
				<Card className="border-gray-200 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bot className="h-5 w-5 text-[#823F91]" />
							Conversation avec votre conseiller
						</CardTitle>
						<CardDescription>
							Décrivez votre mariage en détail pour obtenir des recommandations personnalisées
						</CardDescription>
					</CardHeader>
					<CardContent>
						{/* Messages */}
						<div className="space-y-4 mb-6 min-h-[400px] max-h-[600px] overflow-y-auto pr-2">
							{messages.map((message) => (
								<motion.div
									key={message.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className={`flex gap-3 ${
										message.role === 'user' ? 'justify-end' : 'justify-start'
									}`}
								>
									{message.role === 'assistant' && (
										<div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
											<Bot className="h-4 w-4 text-white" />
										</div>
									)}
									<div
										className={`max-w-[80%] rounded-2xl px-4 py-3 ${
											message.role === 'user'
												? 'bg-[#823F91] text-white'
												: 'bg-gray-100 text-gray-900'
										}`}
									>
										<p className="text-sm whitespace-pre-wrap">{message.content}</p>
										<p
											className={`text-xs mt-2 ${
												message.role === 'user'
													? 'text-white/70'
													: 'text-gray-500'
											}`}
										>
											{message.timestamp.toLocaleTimeString('fr-FR', {
												hour: '2-digit',
												minute: '2-digit',
											})}
										</p>
									</div>
									{message.role === 'user' && (
										<div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
											<MessageSquare className="h-4 w-4 text-gray-600" />
										</div>
									)}
								</motion.div>
							))}
							{isLoading && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="flex gap-3 justify-start"
								>
									<div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
										<Bot className="h-4 w-4 text-white" />
									</div>
									<div className="bg-gray-100 rounded-2xl px-4 py-3">
										<div className="flex gap-1">
											<div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
											<div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
											<div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
										</div>
									</div>
								</motion.div>
							)}
						</div>

						{/* Input de chat */}
						<div className="border-t border-gray-200 pt-4">
							<ChatInput
								variant="default"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onSubmit={handleSubmit}
								loading={isLoading}
								onStop={() => setIsLoading(false)}
							>
								<ChatInputTextArea 
									placeholder="Décrivez votre mariage : date, lieu, nombre d'invités, budget, style souhaité..." 
									rows={2}
								/>
								<ChatInputSubmit />
							</ChatInput>
						</div>
					</CardContent>
				</Card>

				{/* Informations supplémentaires */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="mt-6"
				>
					<Card className="border-gray-200 bg-gray-50">
						<CardContent className="pt-6">
							<p className="text-sm text-[#6B7280] text-center">
								💡 <strong>Astuce :</strong> Plus vous décrivez votre mariage en détail, plus nos recommandations seront précises. 
								Parlez-nous de votre style, vos couleurs préférées, vos traditions, et tout ce qui compte pour vous !
							</p>
						</CardContent>
					</Card>
				</motion.div>
			</div>
		</div>
	)
}

