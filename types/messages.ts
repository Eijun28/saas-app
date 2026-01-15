export type UserType = 'couple' | 'prestataire'

export interface Conversation {
  id: string
  couple_id: string
  prestataire_id: string
  last_message?: string | null
  last_message_at?: string | null
  unread_count_couple?: number
  unread_count_prestataire?: number
  unread_count?: number
  created_at: string
  updated_at: string
  status?: 'active' | 'archived'
  demande_id?: string | null
  // Relations
  couple?: {
    id: string
    email?: string
    user_metadata?: {
      prenom?: string
      nom?: string
      avatar_url?: string
    }
  }
  prestataire?: {
    id: string
    email?: string
    user_metadata?: {
      prenom?: string
      nom?: string
      nom_entreprise?: string
      avatar_url?: string
    }
  }
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: UserType
  content: string
  content_type: 'text' | 'image' | 'file'
  attachments?: Attachment[]
  created_at: string
  read_at?: string | null
  // Relations
  sender?: {
    id: string
    email?: string
    user_metadata?: {
      prenom?: string
      nom?: string
      avatar_url?: string
    }
  }
}

export interface Attachment {
  name: string
  url: string
  size: number
  type: string
}

export interface ConversationListProps {
  userId: string
  userType: UserType
  onSelectConversation: (conversationId: string) => void
  selectedConversationId?: string
}

export interface MessageThreadProps {
  conversationId: string
  userId: string
  userType: UserType
}

export interface MessageInputProps {
  conversationId: string
  senderId: string
  senderType: UserType
  onMessageSent: () => void
}

export interface ConversationItemProps {
  conversation: Conversation
  userId: string
  userType: UserType
  isSelected: boolean
  onClick: () => void
}

