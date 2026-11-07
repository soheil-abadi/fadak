import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayOrdinal,
  fromCalendarDate,
  isDateOnly,
  nightsBetween,
  normalizeDigits,
  parsePersianInput,
  todayInTehran,
  toPersianDate,
} from './calendar';
describe('date-only and Persian calendar contract', () => {
  it.each([
    ['1403/1/1', '2024-03-20'],
    ['1404/1/1', '2025-03-21'],
    ['1403/12/30', '2025-03-20'],
  ])('converts the independent fixture %s to %s and back', (persian, gregorian) => {
    expect(parsePersianInput(persian)).toBe(gregorian);
    expect(fromCalendarDate(toPersianDate(gregorian))).toBe(gregorian);
  });
  it.each(['2027-02-30', '2026-13-01', '2026-1-01', 'not-a-date'])(
    'rejects impossible or malformed date %s',
    (value) => {
      expect(isDateOnly(value)).toBe(false);
      expect(() => dayOrdinal(value)).toThrow(RangeError);
    },
  );
  it('does not mutate a selected calendar object on conversion', () => {
    const selected = toPersianDate('2026-11-10');
    const before = selected.format('YYYY/MM/DD');
    expect(fromCalendarDate(selected)).toBe('2026-11-10');
    expect(selected.format('YYYY/MM/DD')).toBe(before);
  });
  it('counts calendar days over DST and year boundaries', () => {
    expect(nightsBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('uses Tehran day even near UTC midnight', () => {
    expect(todayInTehran(new Date('2026-11-07T21:00:00Z'))).toBe('2026-11-08');
    expect(todayInTehran(new Date('2026-11-07T19:00:00Z'))).toBe('2026-11-07');
  });
  it('normalizes Persian and Arabic digits and rejects invalid Persian dates', () => {
    expect(normalizeDigits('۱۲٣٤')).toBe('1234');
    expect(parsePersianInput('۱۴۰۳/۰۱/۰۱')).toBe('2024-03-20');
    expect(parsePersianInput('1404/12/30')).toBeNull();
    expect(parsePersianInput('1405/13/1')).toBeNull();
  });
});
