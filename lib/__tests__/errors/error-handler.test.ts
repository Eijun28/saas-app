import { handleApiError, withErrorHandling } from '../../errors/error-handler'
import { ApiErrors, ApiErrorCode } from '../../errors/api-errors'

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: ResponseInit) => ({ body, init })),
  },
}))

// Mock logger to avoid Sentry calls in tests
jest.mock('../../logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    critical: jest.fn(),
  },
}))

const { NextResponse } = require('next/server')

describe('handleApiError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return a JSON response for ApiError', () => {
    const err = ApiErrors.notFound('Utilisateur introuvable')
    handleApiError(err)

    expect(NextResponse.json).toHaveBeenCalledWith(
      err.toJSON(),
      expect.objectContaining({ status: 404 })
    )
  })

  it('should return 500 for a generic Error', () => {
    const err = new Error('something broke')
    handleApiError(err)

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: ApiErrorCode.INTERNAL_ERROR }),
      }),
      expect.objectContaining({ status: 500 })
    )
  })

  it('should return 500 for unknown non-Error values', () => {
    handleApiError('unexpected string')

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: ApiErrorCode.INTERNAL_ERROR }),
      }),
      expect.objectContaining({ status: 500 })
    )
  })

  it('should include Retry-After header for rate limit errors', () => {
    const err = ApiErrors.rateLimit('Trop de requêtes', 30)
    handleApiError(err)

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Retry-After': '30' }),
      })
    )
  })
})

describe('withErrorHandling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should pass through successful handler result', async () => {
    const fakeResponse = { body: { ok: true }, init: { status: 200 } }
    const handler = jest.fn().mockResolvedValue(fakeResponse)
    const wrapped = withErrorHandling(handler)

    const result = await wrapped('arg1', 'arg2')
    expect(result).toBe(fakeResponse)
    expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should catch errors and call handleApiError', async () => {
    const handler = jest.fn().mockRejectedValue(ApiErrors.unauthorized())
    const wrapped = withErrorHandling(handler)

    await wrapped()

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: ApiErrorCode.UNAUTHORIZED }),
      }),
      expect.objectContaining({ status: 401 })
    )
  })

  it('should catch generic errors and return 500', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('boom'))
    const wrapped = withErrorHandling(handler)

    await wrapped()

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: ApiErrorCode.INTERNAL_ERROR }),
      }),
      expect.objectContaining({ status: 500 })
    )
  })
})
