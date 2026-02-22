import {
  ApiError,
  ApiErrorCode,
  ApiErrors,
  isApiError,
  normalizeError,
} from '../../errors/api-errors'

describe('ApiError', () => {
  it('should create an error with correct properties', () => {
    const err = new ApiError(ApiErrorCode.NOT_FOUND, 'Not found', 404)
    expect(err.code).toBe(ApiErrorCode.NOT_FOUND)
    expect(err.message).toBe('Not found')
    expect(err.statusCode).toBe(404)
    expect(err.name).toBe('ApiError')
    expect(err).toBeInstanceOf(Error)
  })

  it('should include details when provided', () => {
    const err = new ApiError(ApiErrorCode.VALIDATION_ERROR, 'Invalid', 400, { field: 'email' })
    expect(err.details).toEqual({ field: 'email' })
  })

  it('toJSON should return correct structure without details', () => {
    const err = new ApiError(ApiErrorCode.UNAUTHORIZED, 'Non authentifié', 401)
    expect(err.toJSON()).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Non authentifié',
      },
    })
  })

  it('toJSON should include details when present', () => {
    const err = new ApiError(ApiErrorCode.VALIDATION_ERROR, 'Bad input', 400, { field: 'email' })
    expect(err.toJSON()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Bad input',
        details: { field: 'email' },
      },
    })
  })
})

describe('ApiErrors factory', () => {
  it('unauthorized should return 401', () => {
    const err = ApiErrors.unauthorized()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe(ApiErrorCode.UNAUTHORIZED)
  })

  it('forbidden should return 403', () => {
    const err = ApiErrors.forbidden()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe(ApiErrorCode.FORBIDDEN)
  })

  it('notFound should return 404', () => {
    const err = ApiErrors.notFound()
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe(ApiErrorCode.NOT_FOUND)
  })

  it('validation should return 400 with details', () => {
    const err = ApiErrors.validation('Invalid email', { field: 'email' })
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe(ApiErrorCode.VALIDATION_ERROR)
    expect(err.details).toEqual({ field: 'email' })
  })

  it('internal should return 500', () => {
    const err = ApiErrors.internal()
    expect(err.statusCode).toBe(500)
    expect(err.code).toBe(ApiErrorCode.INTERNAL_ERROR)
  })

  it('rateLimit should return 429 with retryAfter in details', () => {
    const err = ApiErrors.rateLimit('Too many requests', 60)
    expect(err.statusCode).toBe(429)
    expect(err.code).toBe(ApiErrorCode.RATE_LIMIT_EXCEEDED)
    expect(err.details).toEqual({ retryAfter: 60 })
  })

  it('factory methods accept custom messages', () => {
    const err = ApiErrors.unauthorized('Token expiré')
    expect(err.message).toBe('Token expiré')
  })
})

describe('isApiError', () => {
  it('should return true for ApiError instances', () => {
    expect(isApiError(ApiErrors.notFound())).toBe(true)
  })

  it('should return false for standard Error', () => {
    expect(isApiError(new Error('foo'))).toBe(false)
  })

  it('should return false for null', () => {
    expect(isApiError(null)).toBe(false)
  })

  it('should return false for plain objects', () => {
    expect(isApiError({ message: 'oops' })).toBe(false)
  })
})

describe('normalizeError', () => {
  it('should return the same ApiError unchanged', () => {
    const original = ApiErrors.forbidden()
    expect(normalizeError(original)).toBe(original)
  })

  it('should wrap a standard Error into ApiError with INTERNAL_ERROR', () => {
    const err = new Error('boom')
    const result = normalizeError(err)
    expect(result).toBeInstanceOf(ApiError)
    expect(result.code).toBe(ApiErrorCode.INTERNAL_ERROR)
    expect(result.statusCode).toBe(500)
  })

  it('should wrap an unknown value into ApiError', () => {
    const result = normalizeError('raw string error')
    expect(result).toBeInstanceOf(ApiError)
    expect(result.code).toBe(ApiErrorCode.INTERNAL_ERROR)
  })

  it('should wrap null into ApiError', () => {
    const result = normalizeError(null)
    expect(result).toBeInstanceOf(ApiError)
  })
})
