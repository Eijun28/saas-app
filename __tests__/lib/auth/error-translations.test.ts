import { translateAuthError } from '@/lib/auth/error-translations';

describe('translateAuthError', () => {
  it('returns generic message for null/undefined', () => {
    expect(translateAuthError(null)).toBe('Une erreur est survenue. Veuillez réessayer.');
    expect(translateAuthError(undefined)).toBe('Une erreur est survenue. Veuillez réessayer.');
  });

  // ─── Connexion errors ─────────────────────────────────────────

  it('translates invalid login credentials', () => {
    expect(translateAuthError('Invalid login credentials')).toContain('identifiants');
  });

  it('translates email not confirmed', () => {
    expect(translateAuthError('email not confirmed')).toContain('confirmé');
  });

  it('translates rate limit', () => {
    expect(translateAuthError('Too many requests')).toContain('patienter');
  });

  // ─── Signup errors ────────────────────────────────────────────

  it('translates user already registered', () => {
    expect(translateAuthError('User already registered')).toContain('déjà utilisé');
  });

  it('translates email already exists', () => {
    expect(translateAuthError('email already exists')).toContain('déjà utilisé');
  });

  it('translates weak password', () => {
    expect(translateAuthError('password is too weak')).toContain('faible');
  });

  it('translates password required', () => {
    expect(translateAuthError('password is required')).toContain('requis');
  });

  // ─── Format errors ────────────────────────────────────────────

  it('translates invalid email', () => {
    expect(translateAuthError('invalid email address')).toContain('valide');
  });

  it('translates email required', () => {
    expect(translateAuthError('email is required')).toContain('requise');
  });

  // ─── Config errors ────────────────────────────────────────────

  it('translates API key issues', () => {
    expect(translateAuthError('Invalid API key')).toContain('support');
  });

  // ─── Network errors ───────────────────────────────────────────

  it('translates network errors', () => {
    expect(translateAuthError('network error')).toContain('connexion');
  });

  it('translates timeout errors', () => {
    expect(translateAuthError('request timeout')).toContain('temps');
  });

  // ─── Session errors ───────────────────────────────────────────

  it('translates session expired', () => {
    expect(translateAuthError('session has expired')).toContain('reconnect');
  });

  it('translates auth session missing', () => {
    expect(translateAuthError('Auth session missing')).toContain('reconnect');
  });

  // ─── DB errors ────────────────────────────────────────────────

  it('translates foreign key constraint errors', () => {
    expect(translateAuthError('violates foreign key constraint')).toContain('support');
  });

  it('translates unique constraint errors', () => {
    // Note: "constraint" alone matches foreign key first in the translation chain
    // so we test with "already exists" which hits the unique constraint branch
    expect(translateAuthError('record already exists')).toContain('déjà utilisée');
  });

  it('translates column not found errors', () => {
    expect(translateAuthError('column does not exist')).toContain('support');
  });

  it('translates relation not found errors', () => {
    expect(translateAuthError('relation does not exist')).toContain('support');
  });

  // ─── Email errors ─────────────────────────────────────────────

  it('translates email send failure', () => {
    expect(translateAuthError('email send failed')).toContain('email');
  });

  // ─── Callback errors ──────────────────────────────────────────

  it('translates callback errors', () => {
    expect(translateAuthError('callback_error')).toContain('confirmation');
  });

  // ─── Pass-through for already translated messages ─────────────

  it('passes through already-french messages', () => {
    expect(translateAuthError('Erreur lors de la connexion')).toBe('Erreur lors de la connexion');
    expect(translateAuthError('Échec du traitement')).toBe('Échec du traitement');
    expect(translateAuthError('Cet email est pris')).toBe('Cet email est pris');
  });

  // ─── Fallback ─────────────────────────────────────────────────

  it('returns generic message for unknown errors', () => {
    expect(translateAuthError('some_random_error_code')).toContain('réessayer');
  });
});
