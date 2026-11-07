import type { HotelSummary, StayQuote } from './types';
import type { HotelFilters, HotelSearchInput, HotelSearchQuery } from '../schemas/search-schema';
import { nightsBetween } from '@/lib/dates/date-only';
export function makeQuote(nightlyAmount: number, input: HotelSearchInput): StayQuote {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const total = nightlyAmount * nights * input.rooms;
  if (!Number.isSafeInteger(total) || total < 0) throw new RangeError('Invalid quote');
  return {
    nightlyPerRoom: { amount: nightlyAmount, currency: 'IRR' },
    nights,
    rooms: input.rooms,
    total: { amount: total, currency: 'IRR' },
  };
}
export function matchesFilters(hotel: HotelSummary, filters: HotelFilters): boolean {
  return (
    (filters.minPrice === undefined || hotel.quote.nightlyPerRoom.amount >= filters.minPrice) &&
    (filters.maxPrice === undefined || hotel.quote.nightlyPerRoom.amount <= filters.maxPrice) &&
    (filters.stars === undefined || hotel.stars === filters.stars)
  );
}
export function filterAndSort(
  items: readonly HotelSummary[],
  query: Pick<HotelSearchQuery, 'filters' | 'sort'>,
): HotelSummary[] {
  return items
    .filter((hotel) => matchesFilters(hotel, query.filters))
    .sort((a, b) => {
      const difference =
        query.sort === 'price_asc'
          ? a.quote.nightlyPerRoom.amount - b.quote.nightlyPerRoom.amount
          : b.rating - a.rating;
      return difference || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    });
}
export const formatNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value);
export const formatPrice = (amountIrr: number) => formatNumber(amountIrr / 10);
