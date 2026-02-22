import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversationsServer } from '@/lib/supabase/messaging-server'
import { MessagingLayout, ChatList } from '@/components/messaging'

export default async function PrestataireMessageriePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Récupérer les conversations du prestataire
  const conversations = await getConversationsServer(user.id)

  return (
    <MessagingLayout
      conversations={conversations}
      currentUserId={user.id}
      userType="prestataire"
      chatListComponent={
        <ChatList
          conversations={conversations}
          currentUserId={user.id}
          userType="prestataire"
        />
      }
    />
  )
}
