import { describe, expect, it } from 'vitest';
import { createSearchSchema } from './search-schema';
import { addDays } from '@/lib/dates/calendar';
const today = '2026-11-07';
const valid = { city: 'tehran', checkIn: today, checkOut: addDays(today, 2), rooms: 1, guests: 2 };
const schema = createSearchSchema(today);
describe('shared search validation', () => {
  it('normalizes Persian form numbers', () => {
    expect(schema.parse({ ...valid, rooms: '۱', guests: '٢' })).toEqual(valid);
  });
  it.each([
    { city: 'london' },
    { rooms: 0 },
    { rooms: 1.5 },
    { guests: '2x' },
    { rooms: 3, guests: 2 },
    { checkIn: addDays(today, -1) },
    { checkOut: today },
    { checkOut: addDays(today, 31) },
    { checkOut: '2027-02-30' },
    { checkIn: addDays(today, 365), checkOut: addDays(today, 366) },
  ])('rejects invalid request %j', (override) => {
    expect(schema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
  it.each([1, 30])('accepts stay length %i', (days) => {
    expect(schema.safeParse({ ...valid, checkOut: addDays(today, days) }).success).toBe(true);
  });
  it('accepts the inclusive horizon with checkout on day 365', () => {
    expect(
      schema.safeParse({ ...valid, checkIn: addDays(today, 364), checkOut: addDays(today, 365) })
        .success,
    ).toBe(true);
  });
  it('allows valid occupancy requests that a provider cannot fulfill', () => {
    expect(schema.safeParse({ ...valid, guests: 3 }).success).toBe(true);
  });
});
