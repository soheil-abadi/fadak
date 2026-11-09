import { describe, expect, it } from 'vitest';
import { filterAndSort, makeQuote } from './search';
import type { HotelSummary } from './types';
const input = {
  city: 'tehran' as const,
  checkIn: '2026-11-10',
  checkOut: '2026-11-12',
  rooms: 1,
  guests: 2,
};
const hotel = (id: string, price: number, rating: number, stars: 3 | 4 | 5 = 4): HotelSummary => {
  const image = { src: '/images/hotels/room.jpg', alt: 'اتاق' };
  return {
    id,
    name: id,
    city: 'tehran',
    address: 'نمونه',
    stars,
    rating,
    amenities: [],
    image,
    images: [image],
    location: { latitude: 35.7, longitude: 51.4 },
    quote: makeQuote(price, input),
  };
};
describe('pricing and result rules', () => {
  it('calculates totals in IRR for nights and every room', () => {
    expect(makeQuote(18000000, input).total.amount).toBe(36000000);
    expect(makeQuote(18000000, { ...input, rooms: 2 }).total.amount).toBe(72000000);
  });
  it('rejects unsafe arithmetic', () => {
    expect(() => makeQuote(Number.MAX_SAFE_INTEGER, input)).toThrow(RangeError);
  });
  const items = [
    hotel('tehran-02', 18000000, 8.7),
    hotel('tehran-01', 12000000, 7.8, 3),
    hotel('tehran-03', 24000000, 9.2, 5),
  ];
  it('applies inclusive price and exact-star filters', () => {
    const found = filterAndSort(items, {
      filters: { minPrice: 18000000, maxPrice: 18000000, stars: 4 },
      sort: 'price_asc',
    });
    expect(found.map((item) => item.id)).toEqual(['tehran-02']);
  });
  it('sorts by price or rating without changing input', () => {
    const before = items.map((item) => item.id);
    expect(filterAndSort(items, { filters: {}, sort: 'price_asc' })[0]?.id).toBe('tehran-01');
    expect(filterAndSort(items, { filters: {}, sort: 'rating_desc' })[0]?.id).toBe('tehran-03');
    expect(items.map((item) => item.id)).toEqual(before);
  });
  it('uses ID for ties', () => {
    expect(
      filterAndSort([hotel('tehran-02', 10, 8), hotel('tehran-01', 10, 8)], {
        filters: {},
        sort: 'price_asc',
      }).map((item) => item.id),
    ).toEqual(['tehran-01', 'tehran-02']);
  });
});
