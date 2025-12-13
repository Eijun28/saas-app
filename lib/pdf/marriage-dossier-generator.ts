// lib/pdf/marriage-dossier-generator.ts

// COPIE-COLLE TOUT CE CODE

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface MarriageFileData {
  questionnaire_data: any
  municipality: string
  wedding_date: string
  documents_checklist: any[]
  created_at: string
}

interface UploadedDocument {
  document_type: string
  file_url: string
  original_filename: string
  uploaded_at: string
  status: string
}

export async function generateMarriageDossierPDF(
  marriageFile: MarriageFileData,
  uploadedDocs: UploadedDocument[]
): Promise<Uint8Array> {
  
  // Crée un nouveau PDF
  const pdfDoc = await PDFDocument.create()
  
  // Fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // === PAGE 1: PAGE DE GARDE ===
  await addCoverPage(pdfDoc, marriageFile, helveticaBold, helveticaFont)

  // === PAGE 2: RÉCAPITULATIF ===
  await addSummaryPage(pdfDoc, marriageFile, uploadedDocs, helveticaBold, helveticaFont)

  // === PAGE 3+: INFORMATIONS DÉTAILLÉES ===
  await addDetailsPage(pdfDoc, marriageFile, helveticaBold, helveticaFont)

  // === PAGES SUIVANTES: CHECKLIST DOCUMENTS ===
  await addChecklistPage(pdfDoc, marriageFile, uploadedDocs, helveticaBold, helveticaFont)

  // === ANNEXES: Documents uploadés ===
  await addUploadedDocuments(pdfDoc, uploadedDocs)

  // Sauvegarde le PDF
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

// === PAGE DE GARDE ===
async function addCoverPage(
  pdfDoc: PDFDocument,
  marriageFile: MarriageFileData,
  boldFont: any,
  regularFont: any
) {
  const page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  // Titre
  page.drawText('DOSSIER DE MARIAGE', {
    x: 50,
    y: height - 100,
    size: 28,
    font: boldFont,
    color: rgb(0.8, 0.2, 0.3) // Rose
  })

  // Sous-titre
  page.drawText('Constitution du dossier administratif', {
    x: 50,
    y: height - 130,
    size: 14,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4)
  })

  // Ligne séparatrice
  page.drawLine({
    start: { x: 50, y: height - 150 },
    end: { x: width - 50, y: height - 150 },
    thickness: 2,
    color: rgb(0.8, 0.2, 0.3)
  })

  const q = marriageFile.questionnaire_data

  // Informations couple
  let yPos = height - 200

  page.drawText('FUTURS ÉPOUX', {
    x: 50,
    y: yPos,
    size: 16,
    font: boldFont
  })

  yPos -= 40

  // Époux 1
  page.drawText(`${q.spouseAFirstName} ${q.spouseALastName}`, {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont
  })
  yPos -= 20
  page.drawText(`Né(e) le ${formatDate(q.spouseABirthDate)} à ${q.spouseABirthPlace}`, {
    x: 50,
    y: yPos,
    size: 11,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3)
  })
  yPos -= 18
  page.drawText(`Nationalité: ${q.spouseANationality}`, {
    x: 50,
    y: yPos,
    size: 11,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3)
  })

  yPos -= 50

  // Époux 2
  page.drawText(`${q.spouseBFirstName} ${q.spouseBLastName}`, {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont
  })
  yPos -= 20
  page.drawText(`Né(e) le ${formatDate(q.spouseBBirthDate)} à ${q.spouseBBirthPlace}`, {
    x: 50,
    y: yPos,
    size: 11,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3)
  })
  yPos -= 18
  page.drawText(`Nationalité: ${q.spouseBNationality}`, {
    x: 50,
    y: yPos,
    size: 11,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3)
  })

  yPos -= 60

  // Informations mariage
  page.drawText('MARIAGE', {
    x: 50,
    y: yPos,
    size: 16,
    font: boldFont
  })

  yPos -= 30

  page.drawText(`Ville: ${marriageFile.municipality}`, {
    x: 50,
    y: yPos,
    size: 12,
    font: regularFont
  })

  yPos -= 25

  page.drawText(`Date prévue: ${formatDate(marriageFile.wedding_date)}`, {
    x: 50,
    y: yPos,
    size: 12,
    font: regularFont
  })

  // Footer
  page.drawText('Dossier généré via NUPLY.fr', {
    x: 50,
    y: 50,
    size: 10,
    font: regularFont,
    color: rgb(0.6, 0.6, 0.6)
  })

  page.drawText(new Date().toLocaleDateString('fr-FR'), {
    x: width - 150,
    y: 50,
    size: 10,
    font: regularFont,
    color: rgb(0.6, 0.6, 0.6)
  })
}

// === PAGE RÉCAPITULATIF ===
async function addSummaryPage(
  pdfDoc: PDFDocument,
  marriageFile: MarriageFileData,
  uploadedDocs: UploadedDocument[],
  boldFont: any,
  regularFont: any
) {
  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()

  let yPos = height - 80

  // Titre
  page.drawText('RÉCAPITULATIF DU DOSSIER', {
    x: 50,
    y: yPos,
    size: 20,
    font: boldFont
  })

  yPos -= 50

  // Statut
  const requiredDocs = marriageFile.documents_checklist.filter(d => d.required)
  const uploadedCount = uploadedDocs.filter(d => d.status === 'validated').length
  const progress = Math.round((uploadedCount / requiredDocs.length) * 100)

  page.drawText(`Progression: ${progress}%`, {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: progress === 100 ? rgb(0, 0.6, 0) : rgb(0.8, 0.5, 0)
  })

  yPos -= 30

  page.drawText(`${uploadedCount} / ${requiredDocs.length} documents validés`, {
    x: 50,
    y: yPos,
    size: 12,
    font: regularFont
  })

  yPos -= 50

  // Liste des documents
  page.drawText('DOCUMENTS FOURNIS', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont
  })

  yPos -= 30

  for (const doc of uploadedDocs) {
    if (yPos < 100) break // Évite débordement

    const docInfo = marriageFile.documents_checklist.find(d => d.id === doc.document_type)
    if (!docInfo) continue

    // Symbole check
    page.drawText(doc.status === 'validated' ? '✓' : '○', {
      x: 50,
      y: yPos,
      size: 12,
      font: regularFont,
      color: doc.status === 'validated' ? rgb(0, 0.6, 0) : rgb(0.5, 0.5, 0.5)
    })

    // Nom document
    page.drawText(docInfo.label, {
      x: 70,
      y: yPos,
      size: 11,
      font: regularFont
    })

    // Statut
    const statusText = doc.status === 'validated' ? 'Validé' : 'En attente'
    page.drawText(statusText, {
      x: width - 150,
      y: yPos,
      size: 10,
      font: regularFont,
      color: doc.status === 'validated' ? rgb(0, 0.6, 0) : rgb(0.8, 0.5, 0)
    })

    yPos -= 25
  }

  // Footer
  page.drawText('Page 2', {
    x: width / 2 - 20,
    y: 30,
    size: 10,
    font: regularFont,
    color: rgb(0.6, 0.6, 0.6)
  })
}

// === PAGE DÉTAILS ===
async function addDetailsPage(
  pdfDoc: PDFDocument,
  marriageFile: MarriageFileData,
  boldFont: any,
  regularFont: any
) {
  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()

  let yPos = height - 80

  page.drawText('INFORMATIONS DÉTAILLÉES', {
    x: 50,
    y: yPos,
    size: 20,
    font: boldFont
  })

  yPos -= 50

  const q = marriageFile.questionnaire_data

  // Époux 1
  page.drawText('ÉPOUX 1', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.8, 0.2, 0.3)
  })

  yPos -= 30

  const spouse1Details = [
    ['Nom:', `${q.spouseALastName}`],
    ['Prénom:', `${q.spouseAFirstName}`],
    ['Date de naissance:', formatDate(q.spouseABirthDate)],
    ['Lieu de naissance:', q.spouseABirthPlace],
    ['Nationalité:', q.spouseANationality],
    ['Situation matrimoniale:', getMaritalStatusLabel(q.spouseAMaritalStatus)]
  ]

  for (const [label, value] of spouse1Details) {
    page.drawText(label, {
      x: 70,
      y: yPos,
      size: 11,
      font: boldFont
    })

    page.drawText(value, {
      x: 250,
      y: yPos,
      size: 11,
      font: regularFont
    })

    yPos -= 22
  }

  yPos -= 30

  // Époux 2
  page.drawText('ÉPOUX 2', {
    x: 50,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0.8, 0.2, 0.3)
  })

  yPos -= 30

  const spouse2Details = [
    ['Nom:', `${q.spouseBLastName}`],
    ['Prénom:', `${q.spouseBFirstName}`],
    ['Date de naissance:', formatDate(q.spouseBBirthDate)],
    ['Lieu de naissance:', q.spouseBBirthPlace],
    ['Nationalité:', q.spouseBNationality],
    ['Situation matrimoniale:', getMaritalStatusLabel(q.spouseBMaritalStatus)]
  ]

  for (const [label, value] of spouse2Details) {
    page.drawText(label, {
      x: 70,
      y: yPos,
      size: 11,
      font: boldFont
    })

    page.drawText(value, {
      x: 250,
      y: yPos,
      size: 11,
      font: regularFont
    })

    yPos -= 22
  }

  // Footer
  page.drawText('Page 3', {
    x: width / 2 - 20,
    y: 30,
    size: 10,
    font: regularFont,
    color: rgb(0.6, 0.6, 0.6)
  })
}

// === PAGE CHECKLIST ===
async function addChecklistPage(
  pdfDoc: PDFDocument,
  marriageFile: MarriageFileData,
  uploadedDocs: UploadedDocument[],
  boldFont: any,
  regularFont: any
) {
  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()

  let yPos = height - 80

  page.drawText('CHECKLIST COMPLÈTE', {
    x: 50,
    y: yPos,
    size: 20,
    font: boldFont
  })

  yPos -= 50

  // Grouper par catégorie
  const categories = {
    identity: 'Identité',
    civil_status: 'État Civil',
    address: 'Domicile',
    witnesses: 'Témoins',
    other: 'Autres'
  }

  for (const [catKey, catLabel] of Object.entries(categories)) {
    const catDocs = marriageFile.documents_checklist.filter(d => d.category === catKey)
    if (catDocs.length === 0) continue

    if (yPos < 150) {
      // Nouvelle page si nécessaire
      const newPage = pdfDoc.addPage([595, 842])
      yPos = height - 80
    }

    page.drawText(catLabel.toUpperCase(), {
      x: 50,
      y: yPos,
      size: 12,
      font: boldFont,
      color: rgb(0.8, 0.2, 0.3)
    })

    yPos -= 25

    for (const doc of catDocs) {
      const uploaded = uploadedDocs.find(u => u.document_type === doc.id)
      const symbol = uploaded ? '✓' : '○'
      const color = uploaded ? rgb(0, 0.6, 0) : rgb(0.7, 0.7, 0.7)

      page.drawText(symbol, {
        x: 70,
        y: yPos,
        size: 10,
        font: regularFont,
        color
      })

      page.drawText(doc.label, {
        x: 90,
        y: yPos,
        size: 10,
        font: regularFont
      })

      if (doc.required) {
        page.drawText('(Obligatoire)', {
          x: width - 150,
          y: yPos,
          size: 9,
          font: regularFont,
          color: rgb(0.8, 0, 0)
        })
      }

      yPos -= 20
    }

    yPos -= 15
  }

  // Footer
  page.drawText('Page 4', {
    x: width / 2 - 20,
    y: 30,
    size: 10,
    font: regularFont,
    color: rgb(0.6, 0.6, 0.6)
  })
}

// === ANNEXE: Documents uploadés ===
async function addUploadedDocuments(
  pdfDoc: PDFDocument,
  uploadedDocs: UploadedDocument[]
) {
  for (const doc of uploadedDocs) {
    try {
      // Télécharge le fichier
      const response = await fetch(doc.file_url)
      const arrayBuffer = await response.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)

      // Si c'est un PDF, on le merge
      if (doc.file_url.toLowerCase().endsWith('.pdf')) {
        const uploadedPdf = await PDFDocument.load(bytes)
        const copiedPages = await pdfDoc.copyPages(uploadedPdf, uploadedPdf.getPageIndices())
        copiedPages.forEach(page => pdfDoc.addPage(page))
      }
      // Si c'est une image, on l'ajoute
      else if (doc.file_url.match(/\.(jpg|jpeg|png)$/i)) {
        const image = doc.file_url.toLowerCase().endsWith('.png')
          ? await pdfDoc.embedPng(bytes)
          : await pdfDoc.embedJpg(bytes)

        const page = pdfDoc.addPage([595, 842])
        const { width, height } = page.getSize()

        // Calcule dimensions pour fit
        const imgRatio = image.width / image.height
        const pageRatio = width / height

        let imgWidth, imgHeight

        if (imgRatio > pageRatio) {
          imgWidth = width - 100
          imgHeight = imgWidth / imgRatio
        } else {
          imgHeight = height - 100
          imgWidth = imgHeight * imgRatio
        }

        page.drawImage(image, {
          x: (width - imgWidth) / 2,
          y: (height - imgHeight) / 2,
          width: imgWidth,
          height: imgHeight
        })

        // Titre du document
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
        page.drawText(doc.original_filename, {
          x: 50,
          y: height - 40,
          size: 10,
          font: helvetica,
          color: rgb(0.3, 0.3, 0.3)
        })
      }
    } catch (error) {
      console.error('Erreur ajout document:', doc.original_filename, error)
    }
  }
}

// === UTILS ===
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function getMaritalStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    single: 'Célibataire',
    divorced: 'Divorcé(e)',
    widowed: 'Veuf/Veuve'
  }
  return labels[status] || status
}

