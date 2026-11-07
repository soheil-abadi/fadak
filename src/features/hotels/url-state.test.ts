import { describe, expect, it } from 'vitest';
import { parseSearchParams, recordToSearchParams, serializeSearch } from './url-state';
import type { HotelSearchQuery } from './schemas/search-schema';
const today = '2026-11-07';
const query: HotelSearchQuery = {
  input: { city: 'tehran', checkIn: '2026-11-10', checkOut: '2026-11-12', rooms: 1, guests: 2 },
  filters: { minPrice: 10000000, maxPrice: 30000000, stars: 4 },
  sort: 'rating_desc',
};
describe('URL contract', () => {
  it('round-trips every persisted search field', () => {
    expect(parseSearchParams(new URLSearchParams(serializeSearch(query)), today)).toEqual({
      status: 'valid',
      query,
    });
  });
  it('preserves duplicate keys from Next searchParams for validation', () => {
    expect(
      parseSearchParams(recordToSearchParams({ city: ['tehran', 'kish'] }), today).status,
    ).toBe('invalid');
  });
  it('uses idle for absent known keys and ignores unknown keys', () => {
    expect(parseSearchParams(new URLSearchParams('utm_source=demo'), today).status).toBe('idle');
    const params = new URLSearchParams(serializeSearch(query));
    params.set('extra', 'something');
    const parsed = parseSearchParams(params, today);
    expect(parsed.status).toBe('valid');
    if (parsed.status === 'valid') expect(serializeSearch(parsed.query)).not.toContain('extra');
  });
  it.each(['city=tehran', 'city=', 'sort=price_asc'])('rejects incomplete search %s', (value) => {
    expect(parseSearchParams(new URLSearchParams(value), today).status).toBe('invalid');
  });
  it.each([
    ['minPrice', '-10'],
    ['maxPrice', '12.5'],
    ['minPrice', '11'],
    ['minPrice', '99999999999999999999999999'],
    ['stars', '7'],
    ['sort', 'random'],
    ['rooms', '۱'],
    ['guests', '2.5'],
  ])('rejects invalid %s=%s', (key, value) => {
    const params = new URLSearchParams(serializeSearch(query));
    params.set(key, value);
    expect(parseSearchParams(params, today).status).toBe('invalid');
  });
  it('rejects reversed price bounds', () => {
    const params = new URLSearchParams(serializeSearch(query));
    params.set('minPrice', '40000000');
    expect(parseSearchParams(params, today).status).toBe('invalid');
  });
  it('defaults missing counts and sort', () => {
    const params = new URLSearchParams(serializeSearch(query));
    ['rooms', 'guests', 'sort'].forEach((key) => params.delete(key));
    const parsed = parseSearchParams(params, today);
    expect(parsed.status).toBe('valid');
    if (parsed.status === 'valid') {
      expect(parsed.query.input.rooms).toBe(1);
      expect(parsed.query.input.guests).toBe(2);
      expect(parsed.query.sort).toBe('price_asc');
    }
  });
});
