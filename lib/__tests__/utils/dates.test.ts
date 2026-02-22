import {
  formatDateFr,
  formatDateLongFr,
  formatDateTimeFr,
  nowIso,
  isPast,
  daysUntil,
} from '../../utils/dates'

// Use a fixed date for deterministic tests
const FIXED_DATE = new Date('2025-03-15T14:30:00.000Z')
const FIXED_DATE_STR = '2025-03-15T14:30:00.000Z'

describe('formatDateFr', () => {
  it('should return empty string for null', () => {
    expect(formatDateFr(null)).toBe('')
  })

  it('should return empty string for undefined', () => {
    expect(formatDateFr(undefined)).toBe('')
  })

  it('should return empty string for invalid date string', () => {
    expect(formatDateFr('not-a-date')).toBe('')
  })

  it('should format a Date object to French locale string', () => {
    const result = formatDateFr(FIXED_DATE)
    // Result depends on locale but should be a non-empty string in dd/mm/yyyy format
    expect(result).toBeTruthy()
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('should format a date string', () => {
    const result = formatDateFr('2025-01-01')
    expect(result).toBeTruthy()
  })
})

describe('formatDateLongFr', () => {
  it('should return empty string for null', () => {
    expect(formatDateLongFr(null)).toBe('')
  })

  it('should return empty string for invalid date', () => {
    expect(formatDateLongFr('invalid')).toBe('')
  })

  it('should format a date with long month name', () => {
    const result = formatDateLongFr('2025-03-15')
    expect(result).toBeTruthy()
    expect(result).toContain('2025')
  })
})

describe('formatDateTimeFr', () => {
  it('should return empty string for null', () => {
    expect(formatDateTimeFr(null)).toBe('')
  })

  it('should format date and time with "à" separator', () => {
    const result = formatDateTimeFr(FIXED_DATE_STR)
    expect(result).toContain('à')
  })
})

describe('nowIso', () => {
  it('should return a valid ISO string', () => {
    const result = nowIso()
    expect(() => new Date(result)).not.toThrow()
    expect(new Date(result).toISOString()).toBe(result)
  })
})

describe('isPast', () => {
  it('should return false for null', () => {
    expect(isPast(null)).toBe(false)
  })

  it('should return true for a past date', () => {
    expect(isPast('2000-01-01')).toBe(true)
  })

  it('should return false for a future date', () => {
    expect(isPast('2099-12-31')).toBe(false)
  })
})

describe('daysUntil', () => {
  it('should return 0 for null', () => {
    expect(daysUntil(null)).toBe(0)
  })

  it('should return 0 for past dates', () => {
    expect(daysUntil('2000-01-01')).toBe(0)
  })

  it('should return a positive number for future dates', () => {
    expect(daysUntil('2099-12-31')).toBeGreaterThan(0)
  })
})
