import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMessagesServer, getConversationsServer } from '@/lib/supabase/messaging-server'
import { MessagingLayout, ChatList, ChatHeader, ChatMessages, ChatInput } from '@/components/messaging'

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>
}

export default async function PrestataireConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Vérifier que la conversation existe et appartient à l'utilisateur
  const conversations = await getConversationsServer(user.id)
  const conversation = conversations.find((c) => c.id === conversationId)

  if (!conversation) {
    notFound()
  }

  // Non-null assertion: notFound() throws so conversation is guaranteed defined here
  const safeConversation = conversation!

  // Vérifier que la request associée est acceptée
  if (safeConversation.request?.status !== 'accepted') {
    redirect('/prestataire/messagerie')
  }

  // Récupérer les messages initiaux
  const initialMessages = await getMessagesServer(conversationId)

  // Déterminer l'autre partie
  const otherPartyId = safeConversation.couple_id === user.id ? safeConversation.provider_id : safeConversation.couple_id

  // Récupérer toutes les conversations pour la liste
  const allConversations = await getConversationsServer(user.id)

  return (
    <MessagingLayout
      conversations={allConversations}
      currentUserId={user.id}
      userType="prestataire"
      selectedConversationId={conversationId}
      chatListComponent={
        <ChatList
          conversations={allConversations}
          currentUserId={user.id}
          userType="prestataire"
          selectedConversationId={conversationId}
        />
      }
    >
      <div className="flex flex-col h-full bg-white overflow-hidden">
        <ChatHeader
          conversation={{
            id: safeConversation.id,
            couple_id: safeConversation.couple_id,
            provider_id: safeConversation.provider_id,
            request_id: safeConversation.request_id,
            created_at: safeConversation.created_at,
          }}
          otherParty={safeConversation.other_party || { id: otherPartyId, name: 'Utilisateur' }}
          userType="prestataire"
        />

        <ChatMessages
          conversationId={conversationId}
          initialMessages={initialMessages}
          currentUserId={user.id}
        />

        <ChatInput conversationId={conversationId} senderId={user.id} />
      </div>
    </MessagingLayout>
  )
}
