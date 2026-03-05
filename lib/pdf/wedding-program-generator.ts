import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { ProgramItem, ProgramCategory } from '@/types/wedding-day-program'
import { CATEGORY_LABELS, formatTime, getDuration, sortProgramItems } from '@/types/wedding-day-program'

// ─── Colors ──────────────────────────────────────────────────────────────────

const PRIMARY = rgb(0.51, 0.25, 0.57)       // #823F91
const PRIMARY_LIGHT = rgb(0.91, 0.83, 0.94) // #E8D4EF
const TEXT_DARK = rgb(0.04, 0.05, 0.07)      // #0B0E12
const TEXT_MUTED = rgb(0.42, 0.42, 0.42)     // #6B6B6B
const GRAY_LINE = rgb(0.9, 0.9, 0.9)
const WHITE = rgb(1, 1, 1)

const CATEGORY_DOT_COLORS: Record<ProgramCategory, ReturnType<typeof rgb>> = {
  ceremonie:  rgb(0.58, 0.34, 0.81),
  cocktail:   rgb(0.85, 0.35, 0.58),
  repas:      rgb(0.93, 0.55, 0.25),
  animation:  rgb(0.88, 0.73, 0.25),
  logistique: rgb(0.6, 0.6, 0.6),
  beaute:     rgb(0.88, 0.4, 0.52),
  photos:     rgb(0.35, 0.55, 0.85),
  autre:      rgb(0.55, 0.55, 0.6),
}

// ─── Main generator ─────────────────────────────────────────────────────────

interface WeddingProgramPDFOptions {
  coupleNames?: string
  weddingDate?: string
}

export async function generateWeddingProgramPDF(
  items: ProgramItem[],
  options: WeddingProgramPDFOptions = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const sorted = sortProgramItems(items)
  const PAGE_W = 595
  const PAGE_H = 842 // A4
  const MARGIN = 50
  const CONTENT_W = PAGE_W - 2 * MARGIN

  let page = pdfDoc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  // ─── Cover / Header ──────────────────────────────────────────────────────

  // Decorative top bar
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 6,
    width: PAGE_W,
    height: 6,
    color: PRIMARY,
  })

  y -= 30

  // Title
  const title = 'Programme du Jour J'
  const titleWidth = boldFont.widthOfTextAtSize(title, 28)
  page.drawText(title, {
    x: (PAGE_W - titleWidth) / 2,
    y,
    size: 28,
    font: boldFont,
    color: PRIMARY,
  })
  y -= 10

  // Underline
  const lineX = (PAGE_W - 80) / 2
  page.drawLine({
    start: { x: lineX, y },
    end: { x: lineX + 80, y },
    thickness: 2,
    color: PRIMARY_LIGHT,
  })
  y -= 24

  // Couple names
  if (options.coupleNames) {
    const namesWidth = boldFont.widthOfTextAtSize(options.coupleNames, 16)
    page.drawText(options.coupleNames, {
      x: (PAGE_W - namesWidth) / 2,
      y,
      size: 16,
      font: boldFont,
      color: TEXT_DARK,
    })
    y -= 20
  }

  // Wedding date
  if (options.weddingDate) {
    const dateWidth = font.widthOfTextAtSize(options.weddingDate, 12)
    page.drawText(options.weddingDate, {
      x: (PAGE_W - dateWidth) / 2,
      y,
      size: 12,
      font,
      color: PRIMARY,
    })
    y -= 16
  }

  y -= 20

  // Separator
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: GRAY_LINE,
  })
  y -= 30

  // ─── Timeline items ──────────────────────────────────────────────────────

  const TIME_COL_W = 70
  const DOT_X = MARGIN + TIME_COL_W + 10
  const CARD_X = DOT_X + 20
  const CARD_W = CONTENT_W - TIME_COL_W - 30

  for (const item of sorted) {
    // Estimate height needed for this item
    const lines = estimateCardHeight(item, font, boldFont, CARD_W - 20)
    const cardH = lines * 14 + 28 // padding

    // Check page break
    if (y - cardH < MARGIN + 30) {
      // Draw footer on current page
      drawFooter(page, font, PAGE_W)
      // New page
      page = pdfDoc.addPage([PAGE_W, PAGE_H])
      y = PAGE_H - MARGIN - 20
    }

    const cardTop = y

    // Time
    const timeStr = formatTime(item.start_time)
    page.drawText(timeStr, {
      x: MARGIN,
      y: cardTop - 14,
      size: 12,
      font: boldFont,
      color: TEXT_DARK,
    })

    if (item.end_time) {
      const endStr = `→ ${formatTime(item.end_time)}`
      page.drawText(endStr, {
        x: MARGIN,
        y: cardTop - 26,
        size: 9,
        font,
        color: TEXT_MUTED,
      })
    }

    // Dot
    const dotColor = CATEGORY_DOT_COLORS[item.category] ?? CATEGORY_DOT_COLORS.autre
    page.drawCircle({
      x: DOT_X,
      y: cardTop - 12,
      size: 4,
      color: dotColor,
    })

    // Vertical line segment
    if (sorted.indexOf(item) < sorted.length - 1) {
      page.drawLine({
        start: { x: DOT_X, y: cardTop - 18 },
        end: { x: DOT_X, y: cardTop - cardH + 4 },
        thickness: 1,
        color: PRIMARY_LIGHT,
      })
    }

    // Card background
    page.drawRectangle({
      x: CARD_X,
      y: cardTop - cardH,
      width: CARD_W,
      height: cardH,
      color: rgb(0.98, 0.98, 0.98),
      borderColor: GRAY_LINE,
      borderWidth: 0.5,
    })

    // Card content
    let cy = cardTop - 16

    // Title + category
    const titleText = item.title
    page.drawText(titleText, {
      x: CARD_X + 10,
      y: cy,
      size: 11,
      font: boldFont,
      color: TEXT_DARK,
    })

    const titleW = boldFont.widthOfTextAtSize(titleText, 11)
    const catLabel = CATEGORY_LABELS[item.category]
    page.drawText(catLabel, {
      x: CARD_X + 10 + titleW + 8,
      y: cy + 1,
      size: 8,
      font,
      color: dotColor,
    })

    const duration = getDuration(item.start_time, item.end_time)
    if (duration) {
      page.drawText(duration, {
        x: CARD_X + CARD_W - 10 - font.widthOfTextAtSize(duration, 8),
        y: cy + 1,
        size: 8,
        font,
        color: TEXT_MUTED,
      })
    }

    cy -= 16

    // Description
    if (item.description) {
      const descLines = wrapText(item.description, font, 9, CARD_W - 20)
      for (const line of descLines) {
        page.drawText(line, {
          x: CARD_X + 10,
          y: cy,
          size: 9,
          font,
          color: TEXT_MUTED,
        })
        cy -= 12
      }
    }

    // Location & responsible
    if (item.location || item.responsible) {
      cy -= 2
      const metaParts: string[] = []
      if (item.location) metaParts.push(`Lieu: ${item.location}`)
      if (item.responsible) metaParts.push(`Responsable: ${item.responsible}`)
      page.drawText(metaParts.join('  |  '), {
        x: CARD_X + 10,
        y: cy,
        size: 8,
        font,
        color: TEXT_MUTED,
      })
    }

    y = cardTop - cardH - 12
  }

  // Footer
  drawFooter(page, font, PAGE_W)

  return await pdfDoc.save()
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function drawFooter(
  page: ReturnType<PDFDocument['addPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  pageW: number
) {
  const text = 'Genere avec Nuply · nuply.fr'
  const w = font.widthOfTextAtSize(text, 8)
  page.drawText(text, {
    x: (pageW - w) / 2,
    y: 25,
    size: 8,
    font,
    color: TEXT_MUTED,
  })
}

function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 5) // max 5 lines per description
}

function estimateCardHeight(
  item: ProgramItem,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  _boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>,
  cardContentW: number
): number {
  let lines = 1 // title
  if (item.description) {
    lines += wrapText(item.description, font, 9, cardContentW).length
  }
  if (item.location || item.responsible) lines += 1
  return lines
}
