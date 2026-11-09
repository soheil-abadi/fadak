export const CITIES = [
  { id: 'tehran', name: 'تهران', description: 'شهر همیشه بیدار' },
  { id: 'mashhad', name: 'مشهد', description: 'سفر به آرامش' },
  { id: 'shiraz', name: 'شیراز', description: 'در هوای شعر و بهار' },
  { id: 'kish', name: 'کیش', description: 'آفتاب، دریا و آرامش' },
  { id: 'isfahan', name: 'اصفهان', description: 'نصف جهان، تمام زیبایی' },
] as const;
export type CityId = (typeof CITIES)[number]['id'];
export type HotelSort = 'price_asc' | 'rating_desc';
export type StarRating = 1 | 2 | 3 | 4 | 5;
export type Amenity = 'wifi' | 'parking' | 'breakfast' | 'pool';
export const AMENITY_LABELS: Record<Amenity, string> = {
  wifi: 'اینترنت رایگان',
  parking: 'پارکینگ',
  breakfast: 'صبحانه',
  pool: 'استخر',
};
export interface Money {
  readonly amount: number;
  readonly currency: 'IRR';
}
export interface StayQuote {
  readonly nightlyPerRoom: Money;
  readonly nights: number;
  readonly rooms: number;
  readonly total: Money;
}
export interface HotelImage {
  readonly src: string;
  readonly alt: string;
}
export interface HotelLocation {
  readonly latitude: number;
  readonly longitude: number;
}
export interface HotelSummary {
  readonly id: string;
  readonly name: string;
  readonly city: CityId;
  readonly address: string;
  readonly stars: StarRating;
  readonly rating: number;
  readonly amenities: readonly Amenity[];
  readonly image: HotelImage;
  readonly images: readonly HotelImage[];
  readonly location: HotelLocation;
  readonly quote: StayQuote;
}
export interface HotelDetails extends HotelSummary {
  readonly description: string;
  readonly availableRooms: number;
  readonly maxGuestsPerRoom: number;
}
export interface HotelSearchResponse {
  readonly items: readonly HotelSummary[];
  readonly total: number;
}
export type HotelErrorCode =
  'INVALID_INPUT' | 'TIMEOUT' | 'UPSTREAM_ERROR' | 'INVALID_RESPONSE' | 'NOT_FOUND' | 'UNAVAILABLE';
export interface HotelError {
  readonly code: HotelErrorCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
}
export type Result<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: HotelError };
export const cityName = (id: CityId) => CITIES.find((city) => city.id === id)?.name ?? id;
