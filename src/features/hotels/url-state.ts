import { createSearchSchema, filtersSchema, type HotelSearchQuery } from './schemas/search-schema';
import type { HotelError } from './domain/types';
const KEYS = [
  'city',
  'checkIn',
  'checkOut',
  'rooms',
  'guests',
  'minPrice',
  'maxPrice',
  'stars',
  'sort',
] as const;
export type QueryState =
  | { status: 'idle' }
  | { status: 'valid'; query: HotelSearchQuery }
  | { status: 'invalid'; error: HotelError };
export function parseSearchParams(params: URLSearchParams, today: string): QueryState {
  if (!KEYS.some((key) => params.has(key))) return { status: 'idle' };
  const invalid = (message: string, fieldErrors?: Record<string, string[]>): QueryState => ({
    status: 'invalid',
    error: { code: 'INVALID_INPUT', message, retryable: false, fieldErrors },
  });
  if (
    KEYS.some((key) => params.getAll(key).length > 1 || (params.has(key) && params.get(key) === ''))
  )
    return invalid('پارامتر خالی یا تکراری در نشانی جست‌وجو وجود دارد.');
  if (['rooms', 'guests'].some((key) => params.has(key) && !/^\d+$/.test(params.get(key) ?? '')))
    return invalid('تعداد اتاق و مسافر در نشانی باید عدد صحیح با ارقام لاتین باشد.');
  const search = createSearchSchema(today).safeParse({
    city: params.get('city'),
    checkIn: params.get('checkIn'),
    checkOut: params.get('checkOut'),
    rooms: params.get('rooms') ?? 1,
    guests: params.get('guests') ?? 2,
  });
  if (!search.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of search.error.issues) {
      const key = String(issue.path[0]);
      (fields[key] ??= []).push(issue.message);
    }
    return invalid('اطلاعات جست‌وجو کامل یا معتبر نیست. لطفاً فرم را اصلاح کنید.', fields);
  }
  for (const key of ['minPrice', 'maxPrice', 'stars'] as const) {
    const value = params.get(key);
    if (value !== null && !/^\d+$/.test(value)) return invalid('فیلترهای نشانی معتبر نیستند.');
  }
  const filters = filtersSchema.safeParse({
    minPrice: params.has('minPrice') ? Number(params.get('minPrice')) : undefined,
    maxPrice: params.has('maxPrice') ? Number(params.get('maxPrice')) : undefined,
    stars: params.has('stars') ? Number(params.get('stars')) : undefined,
  });
  const sort = params.get('sort') ?? 'price_asc';
  if (!filters.success || (sort !== 'price_asc' && sort !== 'rating_desc'))
    return invalid('فیلتر یا ترتیب نمایش معتبر نیست.');
  return { status: 'valid', query: { input: search.data, filters: filters.data, sort } };
}
export function serializeSearch(query: HotelSearchQuery): string {
  const params = new URLSearchParams();
  for (const key of ['city', 'checkIn', 'checkOut', 'rooms', 'guests'] as const)
    params.set(key, String(query.input[key]));
  for (const key of ['minPrice', 'maxPrice', 'stars'] as const)
    if (query.filters[key] !== undefined) params.set(key, String(query.filters[key]));
  params.set('sort', query.sort);
  return params.toString();
}
export function recordToSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }
  return params;
}
