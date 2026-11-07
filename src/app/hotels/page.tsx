import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpLeft, Check, MapPin, ShieldCheck, Compass, Sparkles } from 'lucide-react';
import { SearchNavigationProvider } from '@/features/hotels/ui/search-navigation';
import { SearchForm } from '@/features/hotels/ui/search-form';
import { Filters, SortControl } from '@/features/hotels/ui/filters';
import { HotelCard } from '@/features/hotels/ui/hotel-card';
import { ResultsSkeleton } from '@/features/hotels/ui/skeleton';
import { EmptyResults, RetryError } from '@/features/hotels/ui/result-states';
import {
  parseSearchParams,
  recordToSearchParams,
  serializeSearch,
} from '@/features/hotels/url-state';
import { CITIES, cityName, type CityId } from '@/features/hotels/domain/types';
import { formatNumber } from '@/features/hotels/domain/search';
import { getHotels } from '@/features/hotels/server';
import type { HotelSearchQuery } from '@/features/hotels/schemas/search-schema';
import { addDays, formatPersianDate, todayInTehran } from '@/lib/dates/calendar';

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = recordToSearchParams(await searchParams);
  const today = todayInTehran();
  const parsed = parseSearchParams(params, today);
  const raw = Object.fromEntries(params.entries());
  const example = (city: CityId) =>
    `/hotels?${serializeSearch({ input: { city, checkIn: addDays(today, 7), checkOut: addDays(today, 9), rooms: 1, guests: 2 }, filters: {}, sort: 'price_asc' })}`;
  return (
    <SearchNavigationProvider>
      <main id="main">
        <section
          className={`search-hero ${parsed.status === 'valid' ? 'search-hero-compact' : ''}`}
        >
          <div className="container">
            <div className="breadcrumb">
              <Link href="/hotels">همراه</Link>
              <span>/</span>
              <span>هتل و اقامتگاه</span>
            </div>
            <div className="hero-heading">
              <div>
                <p className="eyebrow">
                  <span /> نزدیک‌تر به حال خوب سفر
                </p>
                <h1>
                  یک اقامت خوب،
                  <br className="mobile-only" /> شروع یک <em>سفر خوب</em>
                </h1>
                <p className="hero-description">
                  از کوچه‌های قدیمی تا ساحل آرام؛ جایی برای خاطره‌های تازه پیدا کنید.
                </p>
              </div>
              <span className="hero-stamp">
                <Compass size={32} strokeWidth={1} />
                <span>
                  هر مقصد،
                  <br />
                  یک قصه‌ی تازه
                </span>
              </span>
            </div>
            <div className="search-panel">
              <div className="search-panel-heading">
                <span>
                  <span className="panel-tab">
                    <MapPin size={17} /> هتل و اقامتگاه
                  </span>
                </span>
                <span className="panel-hint">
                  <ShieldCheck size={15} /> انتخاب ساده، سفر آسوده
                </span>
              </div>
              <SearchForm
                key={params.toString()}
                today={today}
                raw={raw}
                serverError={parsed.status === 'invalid' ? parsed.error : undefined}
              />
            </div>
            <div className="popular-links">
              <span>مقصدهای پرطرفدار:</span>
              {CITIES.slice(0, 4).map((city) => (
                <Link key={city.id} href={example(city.id)}>
                  {city.name}
                  <ArrowUpLeft size={12} />
                </Link>
              ))}
              <span className="search-trust">
                <Check size={14} /> مقایسه شفاف قیمت و امکانات
              </span>
            </div>
          </div>
        </section>
        <div className="container main-content">
          {parsed.status === 'valid' ? (
            <>
              <div className="results-heading">
                <div>
                  <p className="eyebrow">اقامت دلخواه شما</p>
                  <h2>هتل‌های {cityName(parsed.query.input.city)}</h2>
                  <p>
                    {formatPersianDate(parsed.query.input.checkIn, 'D MMMM')} تا{' '}
                    {formatPersianDate(parsed.query.input.checkOut, 'D MMMM YYYY')} <span>•</span>{' '}
                    {formatNumber(parsed.query.input.guests)} مسافر،{' '}
                    {formatNumber(parsed.query.input.rooms)} اتاق
                  </p>
                </div>
                <span className="results-note">
                  <ShieldCheck size={17} /> با خیال آسوده مقایسه کنید
                </span>
              </div>
              <div className="results-layout">
                <Filters key={serializeSearch(parsed.query)} query={parsed.query} />
                <section className="results-column" aria-label="نتایج جست‌وجوی هتل">
                  <Suspense key={serializeSearch(parsed.query)} fallback={<ResultsSkeleton />}>
                    <HotelResults query={parsed.query} />
                  </Suspense>
                </section>
              </div>
            </>
          ) : parsed.status === 'invalid' ? (
            <section className="result-state" role="alert">
              <span className="state-icon">
                <MapPin size={28} />
              </span>
              <h2>بیایید جست‌وجو را کامل کنیم</h2>
              <p>{parsed.error.message}</p>
              <Link className="text-link" href="/hotels">
                پاک‌کردن جست‌وجو
              </Link>
            </section>
          ) : (
            <section className="destination-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">به کدام حال‌وهوا سفر می‌کنید؟</p>
                  <h2>مقصد بعدی شما کجاست؟</h2>
                </div>
                <span>چهار پیشنهاد برای شروع یک قصه‌ی تازه</span>
              </div>
              <div className="destination-grid">
                {CITIES.slice(0, 4).map((city, index) => (
                  <Link href={example(city.id)} key={city.id} className="destination-card">
                    <Image
                      src={
                        index % 2 === 0 ? '/images/hotels/garden.jpg' : '/images/hotels/resort.jpg'
                      }
                      alt={`فضای نمایشی اقامت در ${city.name}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      style={{ objectPosition: `${index * 20 + 20}% center` }}
                    />
                    <div>
                      <span>{city.description}</span>
                      <h3>{city.name}</h3>
                    </div>
                    <span className="destination-arrow">
                      <ArrowUpLeft size={20} />
                    </span>
                  </Link>
                ))}
              </div>
              <div className="value-strip">
                <span>
                  <ShieldCheck size={22} />
                  <span>
                    <strong>مقایسه بدون پیچیدگی</strong>
                    <small>قیمت و امکانات در یک نگاه</small>
                  </span>
                </span>
                <span>
                  <Sparkles size={22} />
                  <span>
                    <strong>جایی برای هر سلیقه</strong>
                    <small>از اقامت اقتصادی تا تجربه‌ای متفاوت</small>
                  </span>
                </span>
                <span>
                  <Compass size={22} />
                  <span>
                    <strong>سفر به سبک خودتان</strong>
                    <small>با تاریخ و بودجه دلخواه شما</small>
                  </span>
                </span>
              </div>
            </section>
          )}
        </div>
      </main>
    </SearchNavigationProvider>
  );
}
async function HotelResults({ query }: { query: HotelSearchQuery }) {
  const result = await getHotels(query);
  if (!result.ok) return <RetryError error={result.error} />;
  return (
    <>
      <div className="results-toolbar">
        <p>
          <strong>{formatNumber(result.data.total)}</strong> اقامتگاه پیدا شد
        </p>
        <SortControl query={query} />
      </div>
      {result.data.items.length ? (
        <div className="hotel-list">
          {result.data.items.map((hotel, index) => (
            <HotelCard hotel={hotel} query={query} key={hotel.id} priority={index === 0} />
          ))}
        </div>
      ) : (
        <EmptyResults resetHref={`/hotels?${serializeSearch({ ...query, filters: {} })}`} />
      )}
      <p className="results-disclaimer">
        اطلاعات و قیمت‌ها آزمایشی‌اند و برای نمایش تجربه جست‌وجو ارائه شده‌اند.
      </p>
    </>
  );
}
