import 'server-only';
import type { HotelProvider } from '@/features/hotels/application/hotel-provider';
import type { HotelDetails, HotelError, Result } from '@/features/hotels/domain/types';
import type { HotelSearchInput } from '@/features/hotels/schemas/search-schema';
import type { MockOptions } from '@/lib/env.server';
import { hotelDetailsSchema } from '@/features/hotels/schemas/hotel-schema';
import { makeQuote } from '@/features/hotels/domain/search';
import { HOTEL_FIXTURES } from './fixtures';
const fail = (
  code: HotelError['code'],
  message: string,
  retryable = false,
): { ok: false; error: HotelError } => ({ ok: false, error: { code, message, retryable } });
export function createMockProvider(options: MockOptions): HotelProvider {
  async function gate(): Promise<HotelError | null> {
    if (options.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    if (options.scenario === 'error')
      return {
        code: 'UPSTREAM_ERROR',
        message: 'دریافت هتل‌ها انجام نشد. دوباره تلاش کنید.',
        retryable: true,
      };
    if (options.scenario === 'timeout')
      return {
        code: 'TIMEOUT',
        message: 'دریافت اطلاعات بیش از حد طول کشید. دوباره تلاش کنید.',
        retryable: true,
      };
    return null;
  }
  function quoteHotel(
    hotel: (typeof HOTEL_FIXTURES)[number],
    input: HotelSearchInput,
  ): Result<HotelDetails> {
    const { nightlyAmount, ...details } = hotel;
    const parsed = hotelDetailsSchema.safeParse({
      ...details,
      quote: makeQuote(nightlyAmount, input),
    });
    return parsed.success
      ? { ok: true, data: parsed.data }
      : fail('INVALID_RESPONSE', 'پاسخ سرویس قابل پردازش نیست. دوباره تلاش کنید.', true);
  }
  const available = (hotel: (typeof HOTEL_FIXTURES)[number], input: HotelSearchInput) =>
    hotel.availableRooms >= input.rooms && hotel.maxGuestsPerRoom * input.rooms >= input.guests;
  return {
    async search(input) {
      const error = await gate();
      if (error) return { ok: false, error };
      if (options.scenario === 'empty') return { ok: true, data: { items: [], total: 0 } };
      const candidates = HOTEL_FIXTURES.filter(
        (hotel) => hotel.city === input.city && available(hotel, input),
      );
      const items: HotelDetails[] = [];
      for (const hotel of candidates) {
        const result = quoteHotel(hotel, input);
        if (!result.ok) return result;
        items.push(result.data);
      }
      return { ok: true, data: { items, total: items.length } };
    },
    async getDetails(hotelId, input) {
      const error = await gate();
      if (error) return { ok: false, error };
      const hotel = HOTEL_FIXTURES.find((item) => item.id === hotelId && item.city === input.city);
      if (!hotel) return fail('NOT_FOUND', 'اقامتگاه مورد نظر پیدا نشد.');
      if (options.scenario === 'empty' || !available(hotel, input))
        return fail('UNAVAILABLE', 'برای این اقامت ظرفیت کافی وجود ندارد. جست‌وجو را تغییر دهید.');
      return quoteHotel(hotel, input);
    },
  };
}
