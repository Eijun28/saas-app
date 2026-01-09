export interface EarlyAdopterProgram {
  id: string
  total_slots: number
  used_slots: number
  trial_duration_days: number
  program_active: boolean
  created_at: string
  updated_at: string
}

export interface EarlyAdopterNotification {
  id: string
  user_id: string
  notification_type: 'welcome' | 'reminder_30d' | 'reminder_14d' | 'reminder_7d' | 'reminder_1d' | 'expired'
  sent_at: string
  read_at: string | null
  created_at: string
}

export type SubscriptionTier = 'free' | 'early_adopter' | 'pro' | 'premium'
