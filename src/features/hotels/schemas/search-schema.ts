import { z } from 'zod';
import { addDays, isDateOnly, nightsBetween, normalizeDigits } from '@/lib/dates/date-only';

const integer = (min: number, max: number, message: string) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && /^\d+$/.test(normalizeDigits(value))
        ? Number(normalizeDigits(value))
        : value,
    z.number({ error: message }).int(message).min(min, message).max(max, message),
  );
const dateOnly = z
  .string({ error: 'تاریخ معتبر انتخاب کنید.' })
  .refine(isDateOnly, 'تاریخ معتبر انتخاب کنید.');
export function createSearchSchema(today: string) {
  return z
    .object({
      city: z.enum(['tehran', 'mashhad', 'shiraz', 'kish', 'isfahan'], {
        error: 'مقصد سفر را انتخاب کنید.',
      }),
      checkIn: dateOnly,
      checkOut: dateOnly,
      rooms: integer(1, 5, 'تعداد اتاق باید بین ۱ تا ۵ باشد.'),
      guests: integer(1, 10, 'تعداد مسافر باید بین ۱ تا ۱۰ باشد.'),
    })
    .superRefine((value, context) => {
      if (value.guests < value.rooms)
        context.addIssue({
          code: 'custom',
          path: ['guests'],
          message: 'برای هر اتاق حداقل یک مسافر انتخاب کنید.',
        });
      if (!isDateOnly(value.checkIn) || !isDateOnly(value.checkOut)) return;
      if (value.checkIn < today)
        context.addIssue({
          code: 'custom',
          path: ['checkIn'],
          message: 'تاریخ ورود نمی‌تواند در گذشته باشد.',
        });
      const nights = nightsBetween(value.checkIn, value.checkOut);
      if (nights < 1)
        context.addIssue({
          code: 'custom',
          path: ['checkOut'],
          message: 'تاریخ خروج باید پس از ورود باشد.',
        });
      if (nights > 30)
        context.addIssue({
          code: 'custom',
          path: ['checkOut'],
          message: 'حداکثر مدت اقامت ۳۰ شب است.',
        });
      if (value.checkIn > addDays(today, 365) || value.checkOut > addDays(today, 365))
        context.addIssue({
          code: 'custom',
          path: ['checkOut'],
          message: 'بازه رزرو باید در ۳۶۵ روز آینده باشد.',
        });
    });
}
export type HotelSearchInput = z.output<ReturnType<typeof createSearchSchema>>;
const price = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).multipleOf(10);
export const filtersSchema = z
  .object({
    minPrice: price.optional(),
    maxPrice: price.optional(),
    stars: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
      .optional(),
  })
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    { message: 'حداقل قیمت نباید از حداکثر بیشتر باشد.', path: ['minPrice'] },
  );
export type HotelFilters = z.infer<typeof filtersSchema>;
export interface HotelSearchQuery {
  input: HotelSearchInput;
  filters: HotelFilters;
  sort: 'price_asc' | 'rating_desc';
}
