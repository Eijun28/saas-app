/**
 * Tests for auth actions - signUp validation logic
 * The Supabase calls are mocked to isolate the validation layer.
 */

// Mock all external dependencies before imports
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));
jest.mock('@/lib/email/resend', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
}));
jest.mock('@/lib/email/confirmation', () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue({ success: true }),
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
jest.mock('@/lib/auth/error-translations', () => ({
  translateAuthError: jest.fn((msg: string) => `translated: ${msg}`),
}));
jest.mock('@/lib/auth/utils', () => ({
  getUserRoleServer: jest.fn().mockResolvedValue({ role: 'couple', coupleId: 'test-id' }),
  getDashboardUrl: jest.fn((role: string) => `/${role}/dashboard`),
}));
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

import { signUp, signIn } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Helper to create a mock Supabase client
function createMockSupabase(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      signUp: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            identities: [{ id: '1' }],
            email_confirmed_at: null,
          },
        },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
      ...overrides,
    },
  };
}

function createMockAdminClient() {
  return {
    auth: {
      admin: {
        getUserById: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
        deleteUser: jest.fn().mockResolvedValue({ error: null }),
        createUser: jest.fn(),
        updateUserById: jest.fn(),
      },
    },
    from: jest.fn().mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'pref-id' }, error: null }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  };
}

describe('signUp - validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(createMockSupabase());
    (createAdminClient as jest.Mock).mockReturnValue(createMockAdminClient());
  });

  it('rejects invalid email format', async () => {
    const result = await signUp('not-an-email', 'password123', 'couple', {
      prenom: 'Jean',
      nom: 'Dupont',
    });
    expect(result).toEqual({ error: 'Email invalide' });
  });

  it('rejects empty email', async () => {
    const result = await signUp('', 'password123', 'couple', {
      prenom: 'Jean',
      nom: 'Dupont',
    });
    expect(result).toEqual({ error: 'Email invalide' });
  });

  it('rejects invalid role', async () => {
    const result = await signUp('test@example.com', 'password123', 'admin' as any, {
      prenom: 'Jean',
      nom: 'Dupont',
    });
    expect(result).toEqual({ error: 'Type utilisateur non autorisé' });
  });

  it('rejects couple with missing prenom', async () => {
    const result = await signUp('test@example.com', 'password123', 'couple', {
      prenom: '',
      nom: 'Dupont',
    });
    expect(result).toEqual({ error: 'Les noms des partenaires sont requis' });
  });

  it('rejects couple with missing nom', async () => {
    const result = await signUp('test@example.com', 'password123', 'couple', {
      prenom: 'Jean',
      nom: '   ',
    });
    expect(result).toEqual({ error: 'Les noms des partenaires sont requis' });
  });

  it('rejects prestataire with missing prenom', async () => {
    const result = await signUp('test@example.com', 'password123', 'prestataire', {
      prenom: '',
      nom: 'Dupont',
    });
    expect(result).toEqual({ error: 'Le prénom et le nom sont requis pour les prestataires' });
  });

  it('rejects prestataire with invalid SIRET (not 14 digits)', async () => {
    const result = await signUp('test@example.com', 'password123', 'prestataire', {
      prenom: 'Jean',
      nom: 'Dupont',
      siret: '123',
    });
    expect(result).toEqual({ error: 'Le numéro SIRET doit contenir 14 chiffres' });
  });

  it('accepts prestataire with valid 14-digit SIRET', async () => {
    const result = await signUp('test@example.com', 'password123', 'prestataire', {
      prenom: 'Jean',
      nom: 'Dupont',
      siret: '12345678901234',
    });
    // Should not return SIRET error — proceeds to Supabase signUp
    expect(result).not.toEqual(expect.objectContaining({ error: expect.stringContaining('SIRET') }));
  });

  it('sanitizes names to 100 chars max for couples', async () => {
    const longName = 'A'.repeat(200);
    await signUp('test@example.com', 'password123', 'couple', {
      prenom: longName,
      nom: 'Dupont',
    });
    // signUp should have been called on Supabase — the profile data would be truncated
    const mockSupabase = await (createClient as jest.Mock).mock.results[0].value;
    const signUpCall = mockSupabase.auth.signUp.mock.calls[0][0];
    expect(signUpCall.options.data.prenom.length).toBe(100);
  });
});

describe('signUp - duplicate user detection', () => {
  it('detects already registered user via empty identities', async () => {
    const mockSupabase = createMockSupabase();
    (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'test-id',
          email: 'test@example.com',
          identities: [], // empty = already registered
          email_confirmed_at: null,
        },
      },
      error: null,
    });
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const result = await signUp('test@example.com', 'password123', 'couple', {
      prenom: 'Jean',
      nom: 'Dupont',
    });
    expect(result.error).toContain('déjà utilisé');
  });
});

describe('signUp - Supabase auth error handling', () => {
  it('returns translated error on Supabase signUp failure', async () => {
    const mockSupabase = createMockSupabase();
    (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    });
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const result = await signUp('test@example.com', 'password123', 'couple', {
      prenom: 'Jean',
      nom: 'Dupont',
    });
    expect(result.error).toBe('translated: User already registered');
  });

  it('returns error when no user is created', async () => {
    const mockSupabase = createMockSupabase();
    (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: null,
    });
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const result = await signUp('test@example.com', 'password123', 'couple', {
      prenom: 'Jean',
      nom: 'Dupont',
    });
    expect(result.error).toContain('Échec');
  });
});

describe('signIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns translated error on signIn failure', async () => {
    const mockSupabase = createMockSupabase({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      }),
    });
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const result = await signIn('test@example.com', 'wrong-password');
    expect(result.error).toBe('translated: Invalid login credentials');
  });

  it('returns success with redirect for valid login', async () => {
    const mockSupabase = createMockSupabase();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const result = await signIn('test@example.com', 'password123');
    expect(result.success).toBe(true);
    expect(result.redirectTo).toBeDefined();
  });
});
