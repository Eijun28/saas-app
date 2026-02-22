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

  // Vérifier que la request associée est acceptée
  if (conversation.request?.status !== 'accepted') {
    redirect('/prestataire/messagerie')
  }

  // Récupérer les messages initiaux
  const initialMessages = await getMessagesServer(conversationId)

  // Déterminer l'autre partie
  const otherPartyId = conversation.couple_id === user.id ? conversation.provider_id : conversation.couple_id

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
            id: conversation.id,
            couple_id: conversation.couple_id,
            provider_id: conversation.provider_id,
            request_id: conversation.request_id,
            created_at: conversation.created_at,
          }}
          otherParty={conversation.other_party || { id: otherPartyId, name: 'Utilisateur' }}
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
