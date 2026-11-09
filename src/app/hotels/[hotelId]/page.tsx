import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  MapPin,
  Star,
  ShieldCheck,
  BedDouble,
  CalendarDays,
  Users,
} from 'lucide-react';
import { getHotelProvider } from '@/features/hotels/server';
import {
  parseSearchParams,
  recordToSearchParams,
  serializeSearch,
} from '@/features/hotels/url-state';
import { AmenityList } from '@/features/hotels/ui/hotel-card';
import { HotelGallery } from '@/features/hotels/ui/hotel-gallery';
import { HotelMapLoader } from '@/features/hotels/ui/hotel-map-loader';
import { ReservationPreview } from '@/features/hotels/ui/reservation-preview';
import { RetryError } from '@/features/hotels/ui/result-states';
import { cityName } from '@/features/hotels/domain/types';
import { formatNumber, formatPrice } from '@/features/hotels/domain/search';
import { formatPersianDate, todayInTehran } from '@/lib/dates/calendar';
export default async function HotelDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { hotelId } = await params;
  const parsed = parseSearchParams(recordToSearchParams(await searchParams), todayInTehran());
  if (parsed.status !== 'valid')
    return (
      <main id="main" className="container">
        <div className="result-state">
          <h1>ابتدا تاریخ اقامت را مشخص کنید</h1>
          <p>
            {parsed.status === 'invalid'
              ? parsed.error.message
              : 'برای مشاهده قیمت و ظرفیت، مقصد و تاریخ سفر را انتخاب کنید.'}
          </p>
          <Link className="button" href="/hotels">
            بازگشت به جست‌وجو
          </Link>
        </div>
      </main>
    );
  const result = await getHotelProvider().getDetails(hotelId, parsed.query.input);
  if (!result.ok && result.error.code === 'NOT_FOUND') notFound();
  if (!result.ok)
    return (
      <main id="main" className="container">
        <RetryError error={result.error} />
      </main>
    );
  const hotel = result.data;
  const input = parsed.query.input;
  const backHref = `/hotels?${serializeSearch(parsed.query)}`;
  return (
    <main id="main" className="container details-page">
      <Link href={backHref} className="back-link">
        <ArrowRight size={16} /> بازگشت به هتل‌های {cityName(hotel.city)}
      </Link>
      <div className="details-title">
        <div>
          <span className="hotel-stars" aria-label={`${formatNumber(hotel.stars)} ستاره`}>
            {Array.from({ length: hotel.stars }, (_, i) => (
              <Star key={i} size={14} fill="currentColor" />
            ))}
          </span>
          <h1>{hotel.name}</h1>
          <p>
            <MapPin size={16} />
            {hotel.address}
          </p>
        </div>
        <span className="details-rating">
          <b>{formatNumber(hotel.rating)}</b>
          <span>
            امتیاز نمایشی<small>از ۱۰ امتیاز</small>
          </span>
        </span>
      </div>
      <HotelGallery name={hotel.name} images={hotel.images} />
      <div className="details-layout">
        <section>
          <p className="eyebrow">درباره اقامتگاه</p>
          <h2>آرامش را به برنامه سفرتان اضافه کنید</h2>
          <p className="hotel-description">{hotel.description}</p>
          <h3>امکانات اقامتگاه</h3>
          <AmenityList amenities={hotel.amenities} />
          <div className="stay-features">
            <span>
              <BedDouble size={23} />
              <strong>اتاق دو نفره</strong>
              <small>مدل اتاق یکسان در این نمایش</small>
            </span>
            <span>
              <Users size={23} />
              <strong>
                {formatNumber(input.guests)} مسافر، {formatNumber(input.rooms)} اتاق
              </strong>
              <small>ظرفیت بررسی‌شده برای جست‌وجوی شما</small>
            </span>
            <span>
              <CalendarDays size={23} />
              <strong>{formatNumber(hotel.quote.nights)} شب اقامت</strong>
              <small>از ورود تا روز خروج</small>
            </span>
          </div>
          <h3>موقعیت نمایشی</h3>
          <HotelMapLoader name={hotel.name} location={hotel.location} />
          <div className="detail-notice">
            <ShieldCheck size={22} />
            <p>
              این تجربه برای مقایسه و پیش‌نمایش اقامت طراحی شده است. ظرفیت، امتیاز و قیمت‌ها آزمایشی
              هستند و امکان رزرو واقعی وجود ندارد.
            </p>
          </div>
        </section>
        <aside className="booking-card">
          <span className="eyebrow">خلاصه اقامت شما</span>
          <p className="booking-rate">
            <strong className="numeric">{formatPrice(hotel.quote.nightlyPerRoom.amount)}</strong>{' '}
            تومان{' '}
            <small>هر شب، یک اتاق</small>
          </p>
          <dl className="booking-summary">
            <div>
              <dt>ورود</dt>
              <dd>{formatPersianDate(input.checkIn, 'D MMMM YYYY')}</dd>
            </div>
            <div>
              <dt>خروج</dt>
              <dd>{formatPersianDate(input.checkOut, 'D MMMM YYYY')}</dd>
            </div>
            <div>
              <dt>
                {formatNumber(hotel.quote.nights)} شب × {formatNumber(input.rooms)} اتاق
              </dt>
              <dd>
                <span className="numeric">{formatPrice(hotel.quote.total.amount)}</span> تومان
              </dd>
            </div>
            <div className="summary-total">
              <dt>مبلغ کل اقامت</dt>
              <dd>
                <span className="numeric">{formatPrice(hotel.quote.total.amount)}</span>{' '}
                <small>تومان</small>
              </dd>
            </div>
          </dl>
          <ReservationPreview hotel={hotel} input={input} />
          <p className="booking-note">
            <ShieldCheck size={14} /> بدون پرداخت؛ فقط پیش‌نمایش
          </p>
          <Link className="text-link" href={backHref}>
            تغییر تاریخ یا انتخاب اقامتگاه دیگر
          </Link>
        </aside>
      </div>
    </main>
  );
}
