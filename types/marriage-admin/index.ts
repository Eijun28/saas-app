export type MarriageFileStatus = 'draft' | 'in_progress' | 'submitted' | 'approved'

export type DocumentStatus = 'missing' | 'uploaded' | 'pending_validation' | 'validated' | 'expired'

export type DocumentCategory = 'identity' | 'civil_status' | 'address' | 'witnesses' | 'other'

export interface QuestionnaireData {
  spouseAFirstName: string
  spouseALastName: string
  spouseABirthDate: string
  spouseABirthPlace: string
  spouseANationality: string
  spouseAMaritalStatus: 'single' | 'divorced' | 'widowed'

  spouseBFirstName: string
  spouseBLastName: string
  spouseBBirthDate: string
  spouseBBirthPlace: string
  spouseBNationality: string
  spouseBMaritalStatus: 'single' | 'divorced' | 'widowed'

  municipality: string
  municipalityPostalCode: string
  weddingDate: string
}

export interface DocumentRequirement {
  id: string
  label: string
  description: string
  required: boolean
  bothSpouses: boolean
  expiryMonths?: number
  aiGeneratable: boolean
  category: DocumentCategory
  helpText?: string
}

export interface MarriageFile {
  id: string
  couple_id: string
  municipality: string
  municipality_postal_code?: string
  wedding_date: string
  status: MarriageFileStatus
  questionnaire_data: QuestionnaireData
  documents_checklist: DocumentRequirement[]
  progress_percentage: number
  created_at: string
  updated_at: string
}

export interface UploadedDocument {
  id: string
  marriage_file_id: string
  couple_id: string
  document_type: string
  file_url: string
  original_filename: string
  file_size?: number
  mime_type?: string
  expiry_date?: string
  status: DocumentStatus
  uploaded_at: string
  validated_at?: string
}
