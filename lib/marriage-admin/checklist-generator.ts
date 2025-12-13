// lib/marriage-admin/checklist-generator.ts
// COPIE-COLLE TOUT CE CODE

import { QuestionnaireData, DocumentRequirement } from '@/types/marriage-admin'

export function generateDocumentChecklist(data: QuestionnaireData): DocumentRequirement[] {
  const checklist: DocumentRequirement[] = []

  // ===== DOCUMENTS OBLIGATOIRES =====
  checklist.push(
    {
      id: 'id_card',
      label: 'Pièce d\'identité',
      description: 'CNI ou passeport valide',
      required: true,
      bothSpouses: true,
      aiGeneratable: false,
      category: 'identity',
      helpText: 'Recto-verso en couleur'
    },
    {
      id: 'birth_certificate',
      label: 'Acte de naissance',
      description: 'Copie intégrale < 3 mois',
      required: true,
      bothSpouses: true,
      expiryMonths: 3,
      aiGeneratable: true,
      category: 'civil_status',
      helpText: 'À commander à votre mairie de naissance'
    },
    {
      id: 'address_proof',
      label: 'Justificatif de domicile',
      description: 'Facture < 3 mois',
      required: true,
      bothSpouses: true,
      expiryMonths: 3,
      aiGeneratable: true,
      category: 'address'
    },
    {
      id: 'witnesses_list',
      label: 'Liste des témoins',
      description: '2 à 4 témoins',
      required: true,
      bothSpouses: false,
      aiGeneratable: true,
      category: 'witnesses'
    }
  )

  // ===== SI BINATIONAL =====
  if (data.spouseANationality !== 'FR') {
    checklist.push(
      {
        id: 'birth_cert_translated_a',
        label: `Acte traduit (${data.spouseAFirstName})`,
        description: 'Traducteur assermenté',
        required: true,
        bothSpouses: false,
        aiGeneratable: false,
        category: 'civil_status'
      },
      {
        id: 'certificate_custom_a',
        label: `Certificat coutume (${data.spouseAFirstName})`,
        description: 'Consulat/ambassade',
        required: true,
        bothSpouses: false,
        aiGeneratable: false,
        category: 'civil_status',
        helpText: 'Délai: 2-4 semaines'
      }
    )
  }

  if (data.spouseBNationality !== 'FR') {
    checklist.push(
      {
        id: 'birth_cert_translated_b',
        label: `Acte traduit (${data.spouseBFirstName})`,
        description: 'Traducteur assermenté',
        required: true,
        bothSpouses: false,
        aiGeneratable: false,
        category: 'civil_status'
      },
      {
        id: 'certificate_custom_b',
        label: `Certificat coutume (${data.spouseBFirstName})`,
        description: 'Consulat/ambassade',
        required: true,
        bothSpouses: false,
        aiGeneratable: false,
        category: 'civil_status'
      }
    )
  }

  // ===== SI DIVORCÉ =====
  if (data.spouseAMaritalStatus === 'divorced') {
    checklist.push({
      id: 'divorce_judgment_a',
      label: `Jugement divorce (${data.spouseAFirstName})`,
      description: 'Copie intégrale',
      required: true,
      bothSpouses: false,
      aiGeneratable: false,
      category: 'civil_status'
    })
  }

  if (data.spouseBMaritalStatus === 'divorced') {
    checklist.push({
      id: 'divorce_judgment_b',
      label: `Jugement divorce (${data.spouseBFirstName})`,
      description: 'Copie intégrale',
      required: true,
      bothSpouses: false,
      aiGeneratable: false,
      category: 'civil_status'
    })
  }

  // ===== SI VEUF =====
  if (data.spouseAMaritalStatus === 'widowed') {
    checklist.push({
      id: 'death_cert_a',
      label: `Acte décès (${data.spouseAFirstName})`,
      description: 'Copie intégrale',
      required: true,
      bothSpouses: false,
      aiGeneratable: false,
      category: 'civil_status'
    })
  }

  if (data.spouseBMaritalStatus === 'widowed') {
    checklist.push({
      id: 'death_cert_b',
      label: `Acte décès (${data.spouseBFirstName})`,
      description: 'Copie intégrale',
      required: true,
      bothSpouses: false,
      aiGeneratable: false,
      category: 'civil_status'
    })
  }

  return checklist
}

export function calculateProgress(
  checklist: DocumentRequirement[],
  uploadedDocs: any[]
): number {
  const required = checklist.filter(d => d.required)
  const completed = required.filter(doc => {
    const uploaded = uploadedDocs.find(u => u.document_type === doc.id)
    return uploaded && uploaded.status === 'validated'
  })

  if (required.length === 0) return 0
  return Math.round((completed.length / required.length) * 100)
}
