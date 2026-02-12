import { getDashboardUrl } from '@/lib/auth/utils';

describe('getDashboardUrl', () => {
  it('returns couple dashboard for couple role', () => {
    expect(getDashboardUrl('couple')).toBe('/couple/dashboard');
  });

  it('returns prestataire dashboard for prestataire role', () => {
    expect(getDashboardUrl('prestataire')).toBe('/prestataire/dashboard');
  });

  it('returns home for null role', () => {
    expect(getDashboardUrl(null)).toBe('/');
  });
});
