// lib/pdf/facture-generator.ts
// Générateur PDF professionnel pour les factures

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'
import type { FacturePdfData } from '@/types/billing'

// Couleurs du thème Nuply
const COLORS = {
  primary: rgb(0.51, 0.25, 0.57), // #823F91
  secondary: rgb(0.62, 0.37, 0.66), // #9D5FA8
  text: rgb(0.2, 0.2, 0.2),
  textLight: rgb(0.4, 0.4, 0.4),
  textMuted: rgb(0.6, 0.6, 0.6),
  border: rgb(0.85, 0.85, 0.85),
  background: rgb(0.98, 0.98, 0.98),
  accent: rgb(0.04, 0.47, 0.25), // vert succès (paiement)
  accentLight: rgb(0.92, 0.98, 0.94),
}

// Dimensions A4
const A4_WIDTH = 595
const A4_HEIGHT = 842
const MARGIN = 50

/**
 * Génère un PDF de facture professionnel
 */
export async function generateFacturePdf(data: FacturePdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
  let yPos = A4_HEIGHT - MARGIN

  yPos = drawHeader(page, data, helvetica, helveticaBold, yPos)
  yPos = drawParties(page, data, helvetica, helveticaBold, yPos)
  yPos = drawServices(page, data, helvetica, helveticaBold, yPos)
  yPos = drawTotals(page, data, helvetica, helveticaBold, yPos)

  if (data.prestataireIban) {
    yPos = drawPaymentInfo(page, data, helvetica, helveticaBold, yPos)
  }

  if (data.conditions || data.paymentTerms) {
    yPos = drawConditions(page, data, helvetica, helveticaBold, yPos)
  }

  drawFooter(page, data, helvetica)

  return await pdfDoc.save()
}

/**
 * En-tête : FACTURE + numéro + dates
 */
function drawHeader(
  page: PDFPage,
  data: FacturePdfData,
  font: PDFFont,
  boldFont: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize()
  const rightX = width - MARGIN

  // Titre FACTURE
  page.drawText('FACTURE', {
    x: MARGIN,
    y: yPos,
    size: 32,
    font: boldFont,
    color: COLORS.primary,
  })

  // Numéro facture (droite)
  page.drawText(`N° ${data.factureNumber}`, {
    x: rightX - 160,
    y: yPos,
    size: 14,
    font: boldFont,
    color: COLORS.text,
  })

  yPos -= 25

  // Date d'émission
  page.drawText(`Date d'émission : ${formatDate(data.issueDate)}`, {
    x: rightX - 210,
    y: yPos,
    size: 10,
    font,
    color: COLORS.textLight,
  })

  yPos -= 15

  // Date d'échéance (mise en avant si présente)
  if (data.dueDate) {
    const isOverdue = data.dueDate < new Date()
    page.drawText(`Échéance : ${formatDate(data.dueDate)}`, {
      x: rightX - 210,
      y: yPos,
      size: 10,
      font: isOverdue ? boldFont : font,
      color: isOverdue ? rgb(0.8, 0.1, 0.1) : COLORS.textLight,
    })
    yPos -= 15
  }

  // Ligne de séparation
  yPos -= 10
  page.drawLine({
    start: { x: MARGIN, y: yPos },
    end: { x: width - MARGIN, y: yPos },
    thickness: 2,
    color: COLORS.primary,
  })

  return yPos - 25
}

/**
 * Blocs Émetteur et Destinataire
 */
function drawParties(
  page: PDFPage,
  data: FacturePdfData,
  font: PDFFont,
  boldFont: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize()
  const colWidth = (width - MARGIN * 2 - 40) / 2
  const startY = yPos
  let leftY = yPos
  let rightY = yPos

  // === ÉMETTEUR (gauche) ===
  page.drawText('ÉMETTEUR', {
    x: MARGIN,
    y: leftY,
    size: 10,
    font: boldFont,
    color: COLORS.primary,
  })
  leftY -= 18

  page.drawText(data.prestataireName, {
    x: MARGIN,
    y: leftY,
    size: 12,
    font: boldFont,
    color: COLORS.text,
  })
  leftY -= 16

  if (data.prestataireAddress) {
    for (const line of wrapText(data.prestataireAddress, font, 9, colWidth)) {
      page.drawText(line, { x: MARGIN, y: leftY, size: 9, font, color: COLORS.textLight })
      leftY -= 13
    }
  }

  if (data.prestataireEmail) {
    page.drawText(data.prestataireEmail, { x: MARGIN, y: leftY, size: 9, font, color: COLORS.textLight })
    leftY -= 13
  }

  if (data.prestataireSiret) {
    page.drawText(`SIRET : ${data.prestataireSiret}`, { x: MARGIN, y: leftY, size: 8, font, color: COLORS.textMuted })
    leftY -= 11
  }

  if (data.prestataireTva) {
    page.drawText(`N° TVA : ${data.prestataireTva}`, { x: MARGIN, y: leftY, size: 8, font, color: COLORS.textMuted })
    leftY -= 11
  }

  // === DESTINATAIRE (droite) ===
  const rightX = width / 2 + 20

  page.drawText('DESTINATAIRE', {
    x: rightX,
    y: rightY,
    size: 10,
    font: boldFont,
    color: COLORS.primary,
  })
  rightY -= 18

  page.drawText(data.clientName, {
    x: rightX,
    y: rightY,
    size: 12,
    font: boldFont,
    color: COLORS.text,
  })
  rightY -= 16

  if (data.clientAddress) {
    for (const line of wrapText(data.clientAddress, font, 9, colWidth)) {
      page.drawText(line, { x: rightX, y: rightY, size: 9, font, color: COLORS.textLight })
      rightY -= 13
    }
  }

  if (data.clientEmail) {
    page.drawText(data.clientEmail, { x: rightX, y: rightY, size: 9, font, color: COLORS.textLight })
    rightY -= 13
  }

  if (data.clientPhone) {
    page.drawText(data.clientPhone, { x: rightX, y: rightY, size: 9, font, color: COLORS.textLight })
    rightY -= 13
  }

  return Math.min(leftY, rightY) - 35
}

/**
 * Liste des services
 */
function drawServices(
  page: PDFPage,
  data: FacturePdfData,
  font: PDFFont,
  boldFont: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize()
  const contentWidth = width - MARGIN * 2

  // En-tête section
  page.drawRectangle({
    x: MARGIN,
    y: yPos - 22,
    width: contentWidth,
    height: 26,
    color: COLORS.primary,
  })

  page.drawText('DÉTAIL DE LA PRESTATION', {
    x: MARGIN + 10,
    y: yPos - 13,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  })

  yPos -= 40

  // Titre de la prestation
  page.drawText(data.title, {
    x: MARGIN,
    y: yPos,
    size: 12,
    font: boldFont,
    color: COLORS.text,
  })
  yPos -= 18

  // Services inclus
  if (data.includedServices.length > 0) {
    page.drawText('Prestations incluses :', {
      x: MARGIN,
      y: yPos,
      size: 9,
      font: boldFont,
      color: COLORS.accent,
    })
    yPos -= 14

    for (const service of data.includedServices) {
      const lines = wrapText(`• ${service}`, font, 9, contentWidth - 20)
      for (const line of lines) {
        page.drawText(line, { x: MARGIN + 10, y: yPos, size: 9, font, color: COLORS.text })
        yPos -= 12
      }
    }
  }

  return yPos - 20
}

/**
 * Tableau des totaux (HT, TVA, TTC)
 */
function drawTotals(
  page: PDFPage,
  data: FacturePdfData,
  font: PDFFont,
  boldFont: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize()

  // Ligne de séparation
  page.drawLine({
    start: { x: MARGIN, y: yPos },
    end: { x: width - MARGIN, y: yPos },
    thickness: 0.5,
    color: COLORS.border,
  })

  yPos -= 20

  const tableX = width - MARGIN - 220
  const valueX = width - MARGIN - 10

  // Lignes du tableau financier
  const rows: { label: string; value: string; bold?: boolean; highlight?: boolean }[] = []

  rows.push({
    label: 'Total HT',
    value: formatAmount(data.amountHt, data.currency),
  })

  if (data.tvaRate > 0) {
    rows.push({
      label: `TVA (${data.tvaRate}%)`,
      value: formatAmount(data.amountTva, data.currency),
    })
    rows.push({
      label: 'Total TTC',
      value: formatAmount(data.amountTtc, data.currency),
      bold: true,
      highlight: true,
    })
  } else {
    // Auto-entrepreneur / non assujetti TVA
    rows.push({
      label: 'TVA non applicable',
      value: 'Art. 293 B CGI',
    })
    rows.push({
      label: 'TOTAL À PAYER',
      value: formatAmount(data.amountHt, data.currency),
      bold: true,
      highlight: true,
    })
  }

  for (const row of rows) {
    if (row.highlight) {
      // Encadré coloré pour le total final
      page.drawRectangle({
        x: tableX - 10,
        y: yPos - 22,
        width: width - MARGIN - tableX + 10,
        height: 28,
        color: COLORS.primary,
      })

      page.drawText(row.label, {
        x: tableX,
        y: yPos - 12,
        size: 11,
        font: boldFont,
        color: rgb(1, 1, 1),
      })

      const valueWidth = boldFont.widthOfTextAtSize(row.value, 14)
      page.drawText(row.value, {
        x: valueX - valueWidth,
        y: yPos - 13,
        size: 14,
        font: boldFont,
        color: rgb(1, 1, 1),
      })

      yPos -= 38
    } else {
      page.drawText(row.label, {
        x: tableX,
        y: yPos,
        size: 10,
        font: row.bold ? boldFont : font,
        color: COLORS.textLight,
      })

      const valueWidth = (row.bold ? boldFont : font).widthOfTextAtSize(row.value, 10)
      page.drawText(row.value, {
        x: valueX - valueWidth,
        y: yPos,
        size: 10,
        font: row.bold ? boldFont : font,
        color: COLORS.text,
      })

      yPos -= 18
    }
  }

  return yPos - 15
}

/**
 * Informations de paiement (IBAN / BIC)
 */
function drawPaymentInfo(
  page: PDFPage,
  data: FacturePdfData,
  font: PDFFont,
  boldFont: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize()
  const contentWidth = width - MARGIN * 2

  // Cadre paiement
  page.drawRectangle({
    x: MARGIN,
    y: yPos - 65,
    width: contentWidth,
    height: 70,
    color: COLORS.accentLight,
    borderColor: rgb(0.6, 0.85, 0.7),
    borderWidth: 1,
  })

  page.drawText('RÈGLEMENT', {
    x: MARGIN + 12,
    y: yPos - 16,
    size: 9,
    font: boldFont,
    color: COLORS.accent,
  })

  if (data.prestataireBankName) {
    page.drawText(data.prestataireBankName, {
      x: MARGIN + 12,
      y: yPos - 30,
      size: 9,
      font,
      color: COLORS.text,
    })
  }

  if (data.prestataireIban) {
    page.drawText(`IBAN : ${data.prestataireIban}`, {
      x: MARGIN + 12,
      y: yPos - 43,
      size: 9,
      font: boldFont,
      color: COLORS.text,
    })
  }

  if (data.prestataireBic) {
    page.drawText(`BIC : ${data.prestataireBic}`, {
      x: MARGIN + 12,
      y: yPos - 56,
      size: 9,
      font,
      color: COLORS.text,
    })
  }

  // Montant en évidence côté droit
  const amount = data.tvaRate > 0 ? data.amountTtc : data.amountHt
  const amountText = formatAmount(amount, data.currency)
  const amountWidth = boldFont.widthOfTextAtSize(amountText, 16)

  page.drawText('À RÉGLER', {
    x: width - MARGIN - amountWidth - 10,
    y: yPos - 22,
    size: 8,
    font,
    color: COLORS.accent,
  })

  page.drawText(amountText, {
    x: width - MARGIN - amountWidth,
    y: yPos - 38,
    size: 16,
    font: boldFont,
    color: COLORS.accent,
  })

  return yPos - 85
}

/**
 * Conditions et modalités de paiement
 */
function drawConditions(
  page: PDFPage,
  data: FacturePdfData,
  font: PDFFont,
  boldFont: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize()
  const contentWidth = width - MARGIN * 2

  if (data.paymentTerms) {
    page.drawText('Modalités de paiement', {
      x: MARGIN,
      y: yPos,
      size: 9,
      font: boldFont,
      color: COLORS.primary,
    })
    yPos -= 14

    for (const line of wrapText(data.paymentTerms, font, 9, contentWidth)) {
      page.drawText(line, { x: MARGIN, y: yPos, size: 9, font, color: COLORS.textLight })
      yPos -= 12
    }
    yPos -= 5
  }

  if (data.conditions) {
    page.drawText('Conditions', {
      x: MARGIN,
      y: yPos,
      size: 9,
      font: boldFont,
      color: COLORS.primary,
    })
    yPos -= 14

    for (const line of wrapText(data.conditions, font, 8, contentWidth)) {
      page.drawText(line, { x: MARGIN, y: yPos, size: 8, font, color: COLORS.textMuted })
      yPos -= 11
    }
  }

  return yPos - 10
}

/**
 * Footer légal
 */
function drawFooter(page: PDFPage, data: FacturePdfData, font: PDFFont): void {
  const { width } = page.getSize()

  page.drawLine({
    start: { x: MARGIN, y: 80 },
    end: { x: width - MARGIN, y: 80 },
    thickness: 0.5,
    color: COLORS.border,
  })

  const mentions = [
    `Facture N° ${data.factureNumber} — Émise le ${formatDate(data.issueDate)}${data.dueDate ? ` — Échéance ${formatDate(data.dueDate)}` : ''}`,
    'Générée via NUPLY.fr — Plateforme de mariage multiculturel',
  ]

  let footerY = 65
  for (const mention of mentions) {
    page.drawText(mention, {
      x: MARGIN,
      y: footerY,
      size: 7.5,
      font,
      color: COLORS.textMuted,
    })
    footerY -= 11
  }

  page.drawText('Page 1/1', {
    x: width - MARGIN - 40,
    y: 40,
    size: 8,
    font,
    color: COLORS.textMuted,
  })
}

// === UTILS ===

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount)
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }

  if (current) lines.push(current)
  return lines
}
