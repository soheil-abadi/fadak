import { describe, expect, it } from 'vitest';
import { createMockProvider } from './mock-provider';
import { HOTEL_FIXTURES } from './fixtures';
import { searchHotels } from '@/features/hotels/application/search-hotels';
import type { HotelProvider } from '@/features/hotels/application/hotel-provider';
const input = {
  city: 'tehran' as const,
  checkIn: '2026-11-10',
  checkOut: '2026-11-12',
  rooms: 1,
  guests: 2,
};
const provider = createMockProvider({ scenario: 'success', delayMs: 0 });
describe('mock provider and service boundary', () => {
  it('contains 12 varied fixtures and returns only the requested city', async () => {
    expect(HOTEL_FIXTURES).toHaveLength(12);
    const result = await provider.search(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toHaveLength(3);
      expect(result.data.items.every((item) => item.city === 'tehran')).toBe(true);
    }
  });
  it('returns empty success for missing supply and insufficient occupancy', async () => {
    for (const request of [
      { ...input, city: 'isfahan' as const },
      { ...input, guests: 3 },
    ])
      expect(await provider.search(request)).toEqual({ ok: true, data: { items: [], total: 0 } });
  });
  it('filters room inventory and recalculates quotes without mutating fixtures', async () => {
    const before = JSON.stringify(HOTEL_FIXTURES);
    const result = await provider.search({ ...input, rooms: 5, guests: 10 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0]?.quote.total.amount).toBe(265000000);
    }
    expect(JSON.stringify(HOTEL_FIXTURES)).toBe(before);
  });
  it.each([
    ['error', 'UPSTREAM_ERROR'],
    ['timeout', 'TIMEOUT'],
  ] as const)('returns retryable %s scenario', async (scenario, code) => {
    const result = await createMockProvider({ scenario, delayMs: 0 }).search(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(code);
      expect(result.error.retryable).toBe(true);
    }
  });
  it('distinguishes missing detail from unavailable capacity', async () => {
    const missing = await provider.getDetails('kish-01', input);
    const unavailable = await provider.getDetails('tehran-01', { ...input, rooms: 2, guests: 4 });
    expect(!missing.ok && missing.error.code).toBe('NOT_FOUND');
    expect(!unavailable.ok && unavailable.error.code).toBe('UNAVAILABLE');
  });
  it('applies filters and sort after provider normalization', async () => {
    const result = await searchHotels(
      { input, filters: { stars: 4 }, sort: 'rating_desc' },
      provider,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.items.map((item) => item.stars)).toEqual([4]);
  });
  it('rejects malformed external data instead of passing it to UI', async () => {
    const broken: HotelProvider = {
      ...provider,
      async search() {
        return {
          ok: true,
          data: {
            items: [
              {
                ...HOTEL_FIXTURES[0]!,
                quote: {
                  nightlyPerRoom: { amount: -10, currency: 'IRR' },
                  nights: 2,
                  rooms: 1,
                  total: { amount: -20, currency: 'IRR' },
                },
              },
            ],
            total: 1,
          },
        };
      },
    };
    expect(await searchHotels({ input, filters: {}, sort: 'price_asc' }, broken)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_RESPONSE' },
    });
  });
});
