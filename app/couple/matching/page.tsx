'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
	Zap,
	ChevronDown,
	Circle,
	CircleDashed,
	Cloud,
	Code,
	Laptop,
	History,
	Paperclip,
	Plus,
	Loader2,
	Send,
	Wand2,
	Globe,
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useRouter } from 'next/navigation'

export default function MatchingPage() {
	const router = useRouter()
	const { user, loading: userLoading } = useUser()
	const [input, setInput] = useState('')
	const [selectedModel, setSelectedModel] = useState('Local')
	const [selectedPerformance, setSelectedPerformance] = useState('High')
	const [autoMode, setAutoMode] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleSubmit = (e?: React.FormEvent) => {
		if (e) e.preventDefault()
		if (input.trim()) {
			// Logique de soumission ici
			console.log('Message envoyé:', input)
		}
	}

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
		<div className="min-h-screen bg-white">
			<div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
				{/* En-tête */}
				<div className="mb-8">
					<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
						Commencez à trouver vos prestataires
					</h1>
					<p className="text-[#6B7280] text-lg">
						Utilisez notre intelligence artificielle pour découvrir les prestataires parfaits pour votre mariage
					</p>
				</div>

				<div className="w-full">
					<div className="bg-background border border-border rounded-2xl overflow-hidden">
						<input
							ref={fileInputRef}
							type="file"
							multiple
							className="sr-only"
							onChange={(e) => {}}
						/>

						<div className="px-3 pt-3 pb-2 grow">
							<form onSubmit={handleSubmit}>
								<Textarea
									value={input}
									onChange={(e) => setInput(e.target.value)}
									placeholder="Décrivez votre mariage : date, lieu, nombre d'invités, budget, style souhaité..."
									className="w-full bg-transparent! p-0 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder-muted-foreground resize-none border-none outline-none text-sm min-h-10 max-h-[25vh]"
									rows={1}
									onInput={(e) => {
										const target = e.target as HTMLTextAreaElement
										target.style.height = 'auto'
										target.style.height = target.scrollHeight + 'px'
									}}
								/>
							</form>
						</div>

						<div className="mb-2 px-2 flex items-center justify-between">
							<div className="flex items-center gap-1">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											type="button"
											className="h-7 w-7 p-0 rounded-full border border-border hover:bg-accent"
										>
											<Plus className="size-3" />
										</Button>
									</DropdownMenuTrigger>

									<DropdownMenuContent
										align="start"
										className="max-w-xs rounded-2xl p-1.5"
									>
										<DropdownMenuGroup className="space-y-1">
											<DropdownMenuItem
												className="rounded-[calc(1rem-6px)] text-xs"
												onClick={() => fileInputRef.current?.click()}
											>
												<Paperclip size={16} className="opacity-60" />
												Joindre des fichiers
											</DropdownMenuItem>
											<DropdownMenuItem
												className="rounded-[calc(1rem-6px)] text-xs"
												onClick={() => {}}
											>
												<Code size={16} className="opacity-60" />
												Interpréteur de code
											</DropdownMenuItem>
											<DropdownMenuItem
												className="rounded-[calc(1rem-6px)] text-xs"
												onClick={() => {}}
											>
												<Globe size={16} className="opacity-60" />
												Recherche web
											</DropdownMenuItem>
											<DropdownMenuItem
												className="rounded-[calc(1rem-6px)] text-xs"
												onClick={() => {}}
											>
												<History size={16} className="opacity-60" />
												Historique de chat
											</DropdownMenuItem>
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>

								<Button
									variant="ghost"
									size="sm"
									type="button"
									onClick={() => setAutoMode(!autoMode)}
									className={cn(
										'h-7 px-2 rounded-full border border-border hover:bg-accent ',
										{
											'bg-primary/10 text-primary border-primary/30': autoMode,
											'text-muted-foreground': !autoMode,
										}
									)}
								>
									<Wand2 className="size-3" />
									<span className="text-xs">Auto</span>
								</Button>
							</div>

							<div>
								<Button
									type="submit"
									disabled={!input.trim()}
									className="size-7 p-0 rounded-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
									onClick={() => handleSubmit()}
								>
									<Send className="size-3.5 text-white" />
								</Button>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-0 pt-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									type="button"
									className="h-6 px-2 rounded-full border border-transparent hover:bg-accent text-muted-foreground text-xs"
								>
									<Laptop className="size-3" />
									<span>{selectedModel}</span>
									<ChevronDown className="size-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								className="max-w-xs rounded-2xl p-1.5 bg-popover border-border"
							>
								<DropdownMenuGroup className="space-y-1">
									<DropdownMenuItem
										className="rounded-[calc(1rem-6px)] text-xs"
										onClick={() => setSelectedModel('Local')}
									>
										<Laptop size={16} className="opacity-60" />
										Local
									</DropdownMenuItem>
									<DropdownMenuItem
										className="rounded-[calc(1rem-6px)] text-xs"
										onClick={() => setSelectedModel('Cloud')}
									>
										<Cloud size={16} className="opacity-60" />
										Cloud
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									type="button"
									className="h-6 px-2 rounded-full border border-transparent hover:bg-accent text-muted-foreground text-xs"
								>
									<Zap className="size-3" />
									<span>{selectedPerformance}</span>
									<ChevronDown className="size-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								className="max-w-xs rounded-2xl p-1.5 bg-popover border-border"
							>
								<DropdownMenuGroup className="space-y-1">
									<DropdownMenuItem
										className="rounded-[calc(1rem-6px)] text-xs"
										onClick={() => setSelectedPerformance('High')}
									>
										<Circle size={16} className="opacity-60" />
										Élevée
									</DropdownMenuItem>
									<DropdownMenuItem
										className="rounded-[calc(1rem-6px)] text-xs"
										onClick={() => setSelectedPerformance('Medium')}
									>
										<Loader2 size={16} className="opacity-60" />
										Moyenne
									</DropdownMenuItem>
									<DropdownMenuItem
										className="rounded-[calc(1rem-6px)] text-xs"
										onClick={() => setSelectedPerformance('Low')}
									>
										<CircleDashed size={16} className="opacity-60" />
										Faible
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>

						<div className="flex-1" />
					</div>
				</div>
			</div>
		</div>
	)
}
