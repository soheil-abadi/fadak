import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import gregorian from 'react-date-object/calendars/gregorian';
import persianFa from 'react-date-object/locales/persian_fa';

import { isDateOnly, normalizeDigits } from './date-only';
export {
  addDays,
  dayOrdinal,
  isDateOnly,
  nightsBetween,
  normalizeDigits,
  todayInTehran,
} from './date-only';

export function toPersianDate(value: string): DateObject {
  if (!isDateOnly(value)) throw new RangeError('Invalid Gregorian date-only');
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  return new DateObject({ year, month, day, calendar: gregorian }).convert(persian, persianFa);
}
export function fromCalendarDate(value: DateObject): string {
  const result = new DateObject(value).convert(gregorian);
  return `${String(result.year).padStart(4, '0')}-${String(result.month.number).padStart(2, '0')}-${String(result.day).padStart(2, '0')}`;
}
export function formatPersianDate(value: string, format = 'D MMMM YYYY'): string {
  return toPersianDate(value).format(format);
}
export { persian, persianFa };

export function parsePersianInput(text: string): string | null {
  const normalized = normalizeDigits(text.trim());
  if (!/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(normalized)) return null;
  const [year = 0, month = 0, day = 0] = normalized.split('/').map(Number);
  const date = new DateObject({ year, month, day, calendar: persian });
  if (date.year !== year || date.month.number !== month || date.day !== day) return null;
  return fromCalendarDate(date);
}
