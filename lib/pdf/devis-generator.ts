// lib/pdf/devis-generator.ts
// Générateur PDF professionnel pour les devis

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'
import type { DevisPdfData } from '@/types/billing'

// Couleurs du thème Nuply
const COLORS = {
  primary: rgb(0.51, 0.25, 0.57), // #823F91
  secondary: rgb(0.62, 0.37, 0.66), // #9D5FA8
  text: rgb(0.2, 0.2, 0.2),
  textLight: rgb(0.4, 0.4, 0.4),
  textMuted: rgb(0.6, 0.6, 0.6),
  border: rgb(0.85, 0.85, 0.85),
  background: rgb(0.98, 0.98, 0.98),
  success: rgb(0.13, 0.55, 0.13),
}

// Dimensions A4
const A4_WIDTH = 595
const A4_HEIGHT = 842
const MARGIN = 50

/**
 * Génère un PDF de devis professionnel
 */
export async function generateDevisPdf(data: DevisPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Page principale
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])

  let yPos = A4_HEIGHT - MARGIN

  // === HEADER ===
  yPos = drawHeader(page, data, helvetica, helveticaBold, yPos)

  // === INFOS PRESTATAIRE & CLIENT ===
  yPos = drawParties(page, data, helvetica, helveticaBold, yPos)

  // === CONTENU DEVIS ===
  yPos = drawContent(page, data, helvetica, helveticaBold, yPos)

  // === MONTANT TOTAL ===
  yPos = drawTotal(page, data, helvetica, helveticaBold, yPos)

  // === CONDITIONS ===
  if (data.conditions) {
    yPos = drawConditions(page, data, helvetica, helveticaBold, yPos)
  }

  // === FOOTER ===
  drawFooter(page, data, helvetica)

  return await pdfDoc.save()
}

/**
 * Header avec logo et titre DEVIS
 */
function drawHeader(
  page: PDFPage,
  data: DevisPdfData,
  font: PDFFont,
  boldFont: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize()

  // Titre DEVIS
  page.drawText('DEVIS', {
    x: MARGIN,
    y: yPos,
    size: 32,
    font: boldFont,
    color: COLORS.primary,
  })

  // Numéro et dates alignés à droite
  const rightX = width - MARGIN

  page.drawText(`N° ${data.devisNumber}`, {
    x: rightX - 150,
    y: yPos,
    size: 14,
    font: boldFont,
    color: COLORS.text,
  })

  yPos -= 25

  page.drawText(`Date d'émission : ${formatDate(data.createdAt)}`, {
    x: rightX - 200,
    y: yPos,
    size: 10,
    font: font,
    color: COLORS.textLight,
  })

  yPos -= 15

  page.drawText(`Valable jusqu'au : ${formatDate(data.validUntil)}`, {
    x: rightX - 200,
    y: yPos,
    size: 10,
    font: font,
    color: COLORS.textLight,
  })

  // Ligne de séparation
  yPos -= 25
  page.drawLine({
    start: { x: MARGIN, y: yPos },
    end: { x: width - MARGIN, y: yPos },
    thickness: 2,
    color: COLORS.primary,
  })

  return yPos - 30
}

/**
 * Blocs Prestataire et Client côte à côte
 */
function drawParties(
  page: PDFPage,
  data: DevisPdfData,
  font: PDFFont,
  boldFont: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize()
  const colWidth = (width - MARGIN * 2 - 40) / 2

  // === PRESTATAIRE (gauche) ===
  const leftX = MARGIN

  page.drawText('ÉMETTEUR', {
    x: leftX,
    y: yPos,
    size: 10,
    font: boldFont,
    color: COLORS.primary,
  })

  yPos -= 18

  page.drawText(data.prestataireName, {
    x: leftX,
    y: yPos,
    size: 12,
    font: boldFont,
    color: COLORS.text,
  })

  yPos -= 16

  if (data.prestataireAddress) {
    const lines = wrapText(data.prestataireAddress, font, 10, colWidth)
    for (const line of lines) {
      page.drawText(line, {
        x: leftX,
        y: yPos,
        size: 10,
        font: font,
        color: COLORS.textLight,
      })
      yPos -= 14
    }
  }

  if (data.prestataireEmail) {
    page.drawText(data.prestataireEmail, {
      x: leftX,
      y: yPos,
      size: 10,
      font: font,
      color: COLORS.textLight,
    })
    yPos -= 14
  }

  if (data.prestataireSiret) {
    page.drawText(`SIRET : ${data.prestataireSiret}`, {
      x: leftX,
      y: yPos,
      size: 9,
      font: font,
      color: COLORS.textMuted,
    })
    yPos -= 12
  }

  if (data.prestataireTva) {
    page.drawText(`N° TVA : ${data.prestataireTva}`, {
      x: leftX,
      y: yPos,
      size: 9,
      font: font,
      color: COLORS.textMuted,
    })
  }

  // === CLIENT (droite) ===
  const rightX = width / 2 + 20
  let clientY = yPos + 76 // Remonter pour aligner avec le prestataire

  page.drawText('DESTINATAIRE', {
    x: rightX,
    y: clientY,
    size: 10,
    font: boldFont,
    color: COLORS.primary,
  })

  clientY -= 18

  page.drawText(data.clientName, {
    x: rightX,
    y: clientY,
    size: 12,
    font: boldFont,
    color: COLORS.text,
  })

  clientY -= 16

  const clientLines = wrapText(data.clientAddress, font, 10, colWidth)
  for (const line of clientLines) {
    page.drawText(line, {
      x: rightX,
      y: clientY,
      size: 10,
      font: font,
      color: COLORS.textLight,
    })
    clientY -= 14
  }

  if (data.clientEmail) {
    page.drawText(data.clientEmail, {
      x: rightX,
      y: clientY,
      size: 10,
      font: font,
      color: COLORS.textLight,
    })
    clientY -= 14
  }

  if (data.clientPhone) {
    page.drawText(data.clientPhone, {
      x: rightX,
      y: clientY,
      size: 10,
      font: font,
      color: COLORS.textLight,
    })
  }

  return Math.min(yPos, clientY) - 40
}

/**
 * Contenu du devis : titre, description, services
 */
function drawContent(
  page: PDFPage,
  data: DevisPdfData,
  font: PDFFont,
  boldFont: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize()
  const contentWidth = width - MARGIN * 2

  // Titre de la prestation
  page.drawText('PRESTATION', {
    x: MARGIN,
    y: yPos,
    size: 12,
    font: boldFont,
    color: COLORS.primary,
  })

  yPos -= 20

  // Cadre pour le titre
  page.drawRectangle({
    x: MARGIN,
    y: yPos - 25,
    width: contentWidth,
    height: 30,
    color: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
  })

  page.drawText(data.title, {
    x: MARGIN + 10,
    y: yPos - 15,
    size: 14,
    font: boldFont,
    color: COLORS.text,
  })

  yPos -= 45

  // Description
  if (data.description) {
    const descLines = wrapText(data.description, font, 10, contentWidth - 20)
    for (const line of descLines) {
      page.drawText(line, {
        x: MARGIN + 10,
        y: yPos,
        size: 10,
        font: font,
        color: COLORS.textLight,
      })
      yPos -= 14
    }
    yPos -= 10
  }

  // Services inclus
  if (data.includedServices && data.includedServices.length > 0) {
    yPos -= 10

    page.drawText('Services inclus :', {
      x: MARGIN,
      y: yPos,
      size: 10,
      font: boldFont,
      color: COLORS.success,
    })

    yPos -= 16

    for (const service of data.includedServices) {
      page.drawText(`• ${service}`, {
        x: MARGIN + 15,
        y: yPos,
        size: 10,
        font: font,
        color: COLORS.text,
      })
      yPos -= 14
    }
  }

  // Services exclus
  if (data.excludedServices && data.excludedServices.length > 0) {
    yPos -= 10

    page.drawText('Non inclus :', {
      x: MARGIN,
      y: yPos,
      size: 10,
      font: boldFont,
      color: COLORS.textMuted,
    })

    yPos -= 16

    for (const service of data.excludedServices) {
      page.drawText(`• ${service}`, {
        x: MARGIN + 15,
        y: yPos,
        size: 10,
        font: font,
        color: COLORS.textMuted,
      })
      yPos -= 14
    }
  }

  return yPos - 20
}

/**
 * Montant total avec encadré
 */
function drawTotal(
  page: PDFPage,
  data: DevisPdfData,
  font: PDFFont,
  boldFont: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize()

  // Ligne de séparation
  page.drawLine({
    start: { x: MARGIN, y: yPos },
    end: { x: width - MARGIN, y: yPos },
    thickness: 1,
    color: COLORS.border,
  })

  yPos -= 30

  // Encadré total
  const boxWidth = 200
  const boxX = width - MARGIN - boxWidth

  page.drawRectangle({
    x: boxX,
    y: yPos - 40,
    width: boxWidth,
    height: 50,
    color: COLORS.primary,
  })

  page.drawText('TOTAL HT', {
    x: boxX + 15,
    y: yPos - 15,
    size: 12,
    font: font,
    color: rgb(1, 1, 1),
  })

  const amountText = formatAmount(data.amount, data.currency)
  page.drawText(amountText, {
    x: boxX + 15,
    y: yPos - 35,
    size: 18,
    font: boldFont,
    color: rgb(1, 1, 1),
  })

  return yPos - 60
}

/**
 * Conditions générales
 */
function drawConditions(
  page: PDFPage,
  data: DevisPdfData,
  font: PDFFont,
  boldFont: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize()
  const contentWidth = width - MARGIN * 2

  page.drawText('CONDITIONS', {
    x: MARGIN,
    y: yPos,
    size: 10,
    font: boldFont,
    color: COLORS.primary,
  })

  yPos -= 16

  if (data.conditions) {
    const lines = wrapText(data.conditions, font, 9, contentWidth)
    for (const line of lines) {
      page.drawText(line, {
        x: MARGIN,
        y: yPos,
        size: 9,
        font: font,
        color: COLORS.textMuted,
      })
      yPos -= 12
    }
  }

  return yPos - 10
}

/**
 * Footer avec mentions légales
 */
function drawFooter(page: PDFPage, data: DevisPdfData, font: PDFFont): void {
  const { width } = page.getSize()

  // Ligne de séparation
  page.drawLine({
    start: { x: MARGIN, y: 80 },
    end: { x: width - MARGIN, y: 80 },
    thickness: 0.5,
    color: COLORS.border,
  })

  // Mentions légales
  const mentions = [
    `Devis valable jusqu'au ${formatDate(data.validUntil)}. Acceptation par signature.`,
    'Généré via NUPLY.fr - Plateforme de mariage multiculturel',
  ]

  let footerY = 65

  for (const mention of mentions) {
    page.drawText(mention, {
      x: MARGIN,
      y: footerY,
      size: 8,
      font: font,
      color: COLORS.textMuted,
    })
    footerY -= 12
  }

  // Numéro de page
  page.drawText('Page 1/1', {
    x: width - MARGIN - 40,
    y: 40,
    size: 8,
    font: font,
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
    currency: currency,
  }).format(amount)
}

/**
 * Wraps text to fit within a given width
 */
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}
