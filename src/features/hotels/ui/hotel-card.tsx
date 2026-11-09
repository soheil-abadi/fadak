import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpLeft, MapPin, Star, Wifi, Coffee, Car, Waves } from 'lucide-react';
import type { HotelSummary, Amenity } from '../domain/types';
import { AMENITY_LABELS } from '../domain/types';
import type { HotelSearchQuery } from '../schemas/search-schema';
import { serializeSearch } from '../url-state';
import { formatNumber, formatPrice } from '../domain/search';
const amenityIcons = { wifi: Wifi, breakfast: Coffee, parking: Car, pool: Waves };
export function AmenityList({ amenities }: { amenities: readonly Amenity[] }) {
  return (
    <ul className="amenities">
      {amenities.map((amenity) => {
        const Icon = amenityIcons[amenity];
        return (
          <li key={amenity}>
            <Icon size={15} />
            {AMENITY_LABELS[amenity]}
          </li>
        );
      })}
    </ul>
  );
}
export function HotelCard({
  hotel,
  query,
  priority = false,
}: {
  hotel: HotelSummary;
  query: HotelSearchQuery;
  priority?: boolean;
}) {
  const href = `/hotels/${hotel.id}?${serializeSearch(query)}`;
  return (
    <article className="hotel-card" data-testid="hotel-card">
      <Link href={href} className="hotel-image" tabIndex={-1} aria-hidden="true">
        <Image
          src={hotel.image.src}
          alt={hotel.image.alt}
          fill
          sizes="(max-width: 640px) 100vw, 250px"
          priority={priority}
        />
        <span className="image-tag">
          {hotel.stars === 5
            ? 'اقامتی متفاوت'
            : hotel.stars === 4
              ? 'انتخابی دلنشین'
              : 'اقتصادی و راحت'}
        </span>
      </Link>
      <div className="hotel-info">
        <span className="hotel-stars" aria-label={`${formatNumber(hotel.stars)} ستاره`}>
          {Array.from({ length: hotel.stars }, (_, i) => (
            <Star key={i} size={12} fill="currentColor" />
          ))}
        </span>
        <h3>
          <Link href={href}>{hotel.name}</Link>
        </h3>
        <p className="hotel-address">
          <MapPin size={14} />
          {hotel.address}
        </p>
        <div className="rating-row">
          <span className="rating-score">{formatNumber(hotel.rating)}</span>
          <strong>
            {hotel.rating >= 9 ? 'فوق‌العاده' : hotel.rating >= 8 ? 'بسیار خوب' : 'خوب'}
          </strong>
          <small>امتیاز نمایشی مهمانان</small>
        </div>
        <AmenityList amenities={hotel.amenities} />
      </div>
      <div className="hotel-price">
        <small>هر شب، یک اتاق</small>
        <p>
          <strong className="numeric">{formatPrice(hotel.quote.nightlyPerRoom.amount)}</strong>
          <span>تومان</span>
        </p>
        <small>
          {formatNumber(hotel.quote.nights)} شب، {formatNumber(hotel.quote.rooms)} اتاق:{' '}
          <b className="numeric">{formatPrice(hotel.quote.total.amount)}</b> تومان
        </small>
        <Link className="button button-outline" href={href}>
          مشاهده اقامتگاه <ArrowUpLeft size={17} />
        </Link>
        <span className="price-footnote">قیمت نهایی نمایشی، بدون هزینه پنهان</span>
      </div>
    </article>
  );
}
