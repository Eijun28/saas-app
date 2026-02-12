/**
 * Tests for the chatbot API route.
 * We mock OpenAI and rate-limiting to test the route logic in isolation.
 */

// Mock dependencies
jest.mock('@/lib/rate-limit', () => ({
  chatbotLimiter: {
    check: jest.fn().mockReturnValue(true),
    getResetTime: jest.fn().mockReturnValue(60),
  },
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    critical: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/api-error-handler', () => ({
  handleApiError: jest.fn().mockReturnValue(
    new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  ),
}));

jest.mock('@/lib/chatbot/service-prompts', () => ({
  getServiceSpecificPrompt: jest.fn().mockReturnValue(''),
  shouldAskQuestion: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/matching/market-averages', () => ({
  calculateMarketAverage: jest.fn().mockResolvedValue(null),
  formatBudgetGuideMessage: jest.fn().mockReturnValue('Budget info'),
}));

jest.mock('@/lib/constants/service-types', () => ({
  getServiceTypeLabel: jest.fn((s: string) => s),
}));

// Mock OpenAI
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

import { POST } from '@/app/api/chatbot/route';
import { chatbotLimiter } from '@/lib/rate-limit';

// Helper to create a NextRequest-like object
function createRequest(body: Record<string, unknown>) {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers(),
  } as any;
}

describe('POST /api/chatbot', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // ─── Rate limiting ─────────────────────────────────────────────

  it('returns 429 when rate limited', async () => {
    (chatbotLimiter.check as jest.Mock).mockReturnValueOnce(false);
    const request = createRequest({ messages: [{ role: 'user', content: 'test' }] });
    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  // ─── API key check ────────────────────────────────────────────

  it('returns 503 when no OpenAI API key', async () => {
    delete process.env.OPENAI_API_KEY;
    const request = createRequest({ messages: [{ role: 'user', content: 'test' }] });
    const response = await POST(request);
    expect(response.status).toBe(503);
  });

  // ─── Input validation ─────────────────────────────────────────

  it('returns 400 for invalid JSON body', async () => {
    const request = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      headers: new Headers(),
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Format');
  });

  it('returns 400 for empty messages array', async () => {
    const request = createRequest({ messages: [] });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for non-array messages', async () => {
    const request = createRequest({ messages: 'not an array' });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 when all messages are filtered out (empty content)', async () => {
    const request = createRequest({
      messages: [{ role: 'user', content: '' }, { role: 'user', content: '   ' }],
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  // ─── Successful response ──────────────────────────────────────

  it('returns parsed JSON response from OpenAI', async () => {
    const aiResponse = {
      message: 'Bonjour, que recherchez-vous ?',
      extracted_data: { service_type: 'photographe' },
      next_action: 'continue',
      question_count: 1,
    };
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(aiResponse) } }],
    });

    const request = createRequest({
      messages: [{ role: 'user', content: 'Je cherche un photographe' }],
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('Bonjour, que recherchez-vous ?');
    expect(body.next_action).toBe('continue');
  });

  // ─── OpenAI error handling ────────────────────────────────────

  it('returns 503 when OpenAI API fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('OpenAI rate limit'));

    const request = createRequest({
      messages: [{ role: 'user', content: 'test' }],
    });
    const response = await POST(request);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toContain('IA');
  });

  it('returns 500 when OpenAI returns empty content', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    const request = createRequest({
      messages: [{ role: 'user', content: 'test' }],
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it('returns 500 when OpenAI returns invalid JSON', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'not valid json {{{' } }],
    });

    const request = createRequest({
      messages: [{ role: 'user', content: 'test' }],
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain('Format');
  });

  // ─── Confirmation detection ───────────────────────────────────

  it('forces validation when user confirms after bot asks', async () => {
    const aiResponse = {
      message: 'Parfait, je lance la recherche !',
      extracted_data: { service_type: 'photographe' },
      next_action: 'continue', // AI returned continue, but user confirmed
      question_count: 3,
    };
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(aiResponse) } }],
    });

    const request = createRequest({
      messages: [
        { role: 'bot', content: 'Je lance la recherche ?' },
        { role: 'user', content: 'oui' },
      ],
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.next_action).toBe('validate');
  });

  // ─── Couple profile pre-fill ──────────────────────────────────

  it('pre-fills extracted data from couple profile', async () => {
    const aiResponse = {
      message: 'Quel style ?',
      extracted_data: {},
      next_action: 'continue',
      question_count: 1,
    };
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(aiResponse) } }],
    });

    const request = createRequest({
      messages: [{ role: 'user', content: 'Je cherche un photographe' }],
      couple_profile: {
        cultures: ['maghrebin'],
        wedding_date: '2025-09-15',
        wedding_city: 'Paris',
        guest_count: 150,
      },
    });
    const response = await POST(request);
    const body = await response.json();
    expect(body.extracted_data.cultures).toEqual(['maghrebin']);
    expect(body.extracted_data.wedding_date).toBe('2025-09-15');
    expect(body.extracted_data.wedding_city).toBe('Paris');
    expect(body.extracted_data.guest_count).toBe(150);
    expect(body.extracted_data.auto_filled_from_profile).toBe(true);
  });

  // ─── Message truncation ───────────────────────────────────────

  it('truncates messages longer than 200 characters', async () => {
    const longMessage = 'A'.repeat(300);
    const aiResponse = {
      message: longMessage,
      extracted_data: {},
      next_action: 'continue',
      question_count: 1,
    };
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(aiResponse) } }],
    });

    const request = createRequest({
      messages: [{ role: 'user', content: 'test' }],
    });
    const response = await POST(request);
    const body = await response.json();
    expect(body.message.length).toBeLessThanOrEqual(200);
    expect(body.message).toMatch(/\.\.\.$/);
  });

  // ─── Markdown code block stripping ────────────────────────────

  it('handles OpenAI response wrapped in markdown code blocks', async () => {
    const aiResponse = {
      message: 'Bonjour !',
      extracted_data: {},
      next_action: 'continue',
    };
    const wrappedContent = '```json\n' + JSON.stringify(aiResponse) + '\n```';
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: wrappedContent } }],
    });

    const request = createRequest({
      messages: [{ role: 'user', content: 'salut' }],
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('Bonjour !');
  });
});
