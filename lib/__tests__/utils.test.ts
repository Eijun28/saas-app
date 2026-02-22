import { cn, extractSupabaseError, getErrorMessage } from '../utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('should merge Tailwind classes without duplicates', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('should return empty string for no input', () => {
    expect(cn()).toBe('')
  })
})

describe('extractSupabaseError', () => {
  it('should return unknown error for null/undefined input', () => {
    expect(extractSupabaseError(null)).toEqual({ message: 'Erreur inconnue' })
    expect(extractSupabaseError(undefined)).toEqual({ message: 'Erreur inconnue' })
  })

  it('should extract message from standard Error', () => {
    const err = new Error('something went wrong')
    const result = extractSupabaseError(err)
    expect(result.message).toBe('something went wrong')
  })

  it('should extract Supabase-specific fields from Error-like object', () => {
    const err = Object.assign(new Error('db error'), {
      code: 'PGRST116',
      details: 'no rows found',
      hint: 'check the query',
    })
    const result = extractSupabaseError(err)
    expect(result.message).toBe('db error')
    expect(result.code).toBe('PGRST116')
    expect(result.details).toBe('no rows found')
    expect(result.hint).toBe('check the query')
  })

  it('should handle plain objects', () => {
    const err = { message: 'plain object error', code: '42' }
    const result = extractSupabaseError(err)
    expect(result.message).toBe('plain object error')
    expect(result.code).toBe('42')
  })

  it('should handle string primitives', () => {
    const result = extractSupabaseError('string error')
    expect(result.message).toBe('string error')
  })

  it('should handle number primitives', () => {
    const result = extractSupabaseError(500)
    expect(result.message).toBe('500')
  })
})

describe('getErrorMessage', () => {
  it('should return the message from an Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('should return a string error as-is', () => {
    expect(getErrorMessage('raw string')).toBe('raw string')
  })

  it('should return the fallback for unknown values', () => {
    expect(getErrorMessage(null)).toBe('Une erreur inattendue s\'est produite')
    expect(getErrorMessage(42)).toBe('Une erreur inattendue s\'est produite')
    expect(getErrorMessage({ code: 500 })).toBe('Une erreur inattendue s\'est produite')
  })

  it('should use a custom fallback', () => {
    expect(getErrorMessage(null, 'Erreur custom')).toBe('Erreur custom')
  })
})
