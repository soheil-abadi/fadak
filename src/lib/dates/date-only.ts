const DAY_MS = 86_400_000;
export function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}
export function dayOrdinal(value: string): number {
  if (!isDateOnly(value)) throw new RangeError('Invalid Gregorian date-only');
  return Date.parse(`${value}T00:00:00.000Z`) / DAY_MS;
}
export function addDays(value: string, days: number): string {
  return new Date((dayOrdinal(value) + days) * DAY_MS).toISOString().slice(0, 10);
}
export function nightsBetween(start: string, end: string): number {
  return dayOrdinal(end) - dayOrdinal(start);
}
export function todayInTehran(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'gregory',
    numberingSystem: 'latn',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);
}
