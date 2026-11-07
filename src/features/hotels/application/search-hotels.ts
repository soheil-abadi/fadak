import type { HotelProvider } from './hotel-provider';
import type { HotelSearchQuery } from '../schemas/search-schema';
import type { HotelSearchResponse, Result } from '../domain/types';
import { hotelSummarySchema } from '../schemas/hotel-schema';
import { filterAndSort } from '../domain/search';
export async function searchHotels(
  query: HotelSearchQuery,
  provider: HotelProvider,
): Promise<Result<HotelSearchResponse>> {
  const result = await provider.search(query.input);
  if (!result.ok) return result;
  const parsed = hotelSummarySchema.array().safeParse(result.data.items);
  if (!parsed.success)
    return {
      ok: false,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'پاسخ سرویس قابل پردازش نیست. دوباره تلاش کنید.',
        retryable: true,
      },
    };
  const items = filterAndSort(parsed.data, query);
  return { ok: true, data: { items, total: items.length } };
}
