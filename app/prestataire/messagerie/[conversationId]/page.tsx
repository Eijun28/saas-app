import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMessagesServer, getConversationsServer } from '@/lib/supabase/messaging'
import { ConversationHeader } from '@/components/messaging/ConversationHeader'
import { MessageList } from '@/components/messaging/MessageList'
import { MessageInput } from '@/components/messaging/MessageInput'

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

  return (
    <div className="flex flex-col h-screen sm:h-[calc(100vh-64px)] bg-[#F5F5F7] overflow-hidden">
      <ConversationHeader
        conversation={{
          id: conversation.id,
          couple_id: conversation.couple_id,
          provider_id: conversation.provider_id,
          request_id: conversation.request_id,
          created_at: conversation.created_at,
        }}
        otherParty={conversation.other_party || { id: otherPartyId, name: 'Utilisateur' }}
        request={conversation.request || null}
        userType="prestataire"
      />
      
      <MessageList
        conversationId={conversationId}
        initialMessages={initialMessages}
        currentUserId={user.id}
      />
      
      <MessageInput conversationId={conversationId} senderId={user.id} />
    </div>
  )
}
