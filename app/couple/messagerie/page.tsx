import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversationsServer } from '@/lib/supabase/messaging'
import { MessagingLayout, ChatList } from '@/components/messaging'

export default async function CoupleMessageriePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Récupérer les conversations du couple
  const conversations = await getConversationsServer(user.id)

  return (
    <MessagingLayout
      conversations={conversations}
      currentUserId={user.id}
      userType="couple"
      chatListComponent={
        <ChatList
          conversations={conversations}
          currentUserId={user.id}
          userType="couple"
        />
      }
    />
  )
}
