'use client';
import { useState } from 'react';
import { useSearchNavigation } from './search-navigation';
import { SlidersHorizontal, Star, X } from 'lucide-react';
import type { HotelSearchQuery } from '../schemas/search-schema';
import { filtersSchema } from '../schemas/search-schema';
import { serializeSearch } from '../url-state';
import { normalizeDigits } from '@/lib/dates/calendar';
import { formatNumber } from '../domain/search';
export function Filters({ query }: { query: HotelSearchQuery }) {
  const [min, setMin] = useState(
    query.filters.minPrice === undefined ? '' : String(query.filters.minPrice / 10),
  );
  const [max, setMax] = useState(
    query.filters.maxPrice === undefined ? '' : String(query.filters.maxPrice / 10),
  );
  const [stars, setStars] = useState(String(query.filters.stars ?? ''));
  const [error, setError] = useState('');
  const { pending, push } = useSearchNavigation();
  const active = Object.values(query.filters).filter((value) => value !== undefined).length;
  function navigate(next: HotelSearchQuery) {
    push(`/hotels?${serializeSearch(next)}`);
  }
  return (
    <aside className="filter-sidebar">
      <details className="filter-disclosure" open>
        <summary>
          <span>
            <SlidersHorizontal size={18} /> فیلترهای جست‌وجو{' '}
            {active > 0 && <b className="count-badge">{formatNumber(active)}</b>}
          </span>
          <span className="mobile-only">باز و بسته کردن</span>
        </summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const toPrice = (value: string) =>
              value === ''
                ? undefined
                : /^\d+$/.test(normalizeDigits(value))
                  ? Number(normalizeDigits(value)) * 10
                  : NaN;
            const result = filtersSchema.safeParse({
              minPrice: toPrice(min),
              maxPrice: toPrice(max),
              stars: stars ? Number(stars) : undefined,
            });
            if (!result.success) {
              setError('بازه قیمت را با عدد صحیح و ترتیب معتبر وارد کنید.');
              return;
            }
            setError('');
            navigate({ ...query, filters: result.data });
          }}
        >
          <fieldset disabled={pending}>
            <section className="filter-section">
              <h3>بودجه‌ی اقامت شما</h3>
              <p>قیمت هر شب برای یک اتاق، به تومان</p>
              <div className="price-input">
                <label htmlFor="min-price">از</label>
                <input
                  id="min-price"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'filter-error' : undefined}
                  inputMode="numeric"
                  value={min}
                  onChange={(event) => setMin(event.target.value)}
                  placeholder="بدون محدودیت"
                />
                <span>تومان</span>
              </div>
              <div className="price-input">
                <label htmlFor="max-price">تا</label>
                <input
                  id="max-price"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'filter-error' : undefined}
                  inputMode="numeric"
                  value={max}
                  onChange={(event) => setMax(event.target.value)}
                  placeholder="بدون محدودیت"
                />
                <span>تومان</span>
              </div>
            </section>
            <section className="filter-section">
              <h3>ستاره‌های هتل</h3>
              <p>اقامت دلخواهتان را پیدا کنید</p>
              <div className="star-options">
                {['', '1', '2', '3', '4', '5'].map((value) => (
                  <label key={value} className={stars === value ? 'selected' : ''}>
                    <input
                      type="radio"
                      name="stars"
                      value={value}
                      checked={stars === value}
                      onChange={() => setStars(value)}
                    />
                    {value ? (
                      <>
                        <span>{formatNumber(Number(value))}</span>
                        <Star size={13} />
                      </>
                    ) : (
                      'همه'
                    )}
                  </label>
                ))}
              </div>
            </section>
            {error && (
              <p role="alert" className="field-error" id="filter-error">
                {error}
              </p>
            )}
            <button className="button filter-apply" type="submit">
              {pending ? 'در حال اعمال…' : 'اعمال فیلترها'}
            </button>
            {active > 0 && (
              <button
                type="button"
                className="clear-filters"
                onClick={() => navigate({ ...query, filters: {} })}
              >
                <X size={14} /> پاک‌کردن فیلترها
              </button>
            )}
          </fieldset>
        </form>
      </details>
      <div className="sidebar-tip">
        <span>خوش‌سفر باشید!</span>
        <p>برای انتخاب بهتر، امتیاز و امکانات اقامتگاه‌ها را هم مقایسه کنید.</p>
        <span className="tip-line" />
      </div>
    </aside>
  );
}
export function SortControl({ query }: { query: HotelSearchQuery }) {
  const { pending, push } = useSearchNavigation();
  return (
    <label className="sort-control">
      مرتب‌سازی:
      <select
        value={query.sort}
        disabled={pending}
        onChange={(event) => {
          const sort = event.target.value === 'rating_desc' ? 'rating_desc' : 'price_asc';
          push(`/hotels?${serializeSearch({ ...query, sort })}`);
        }}
        aria-label="مرتب‌سازی نتایج"
      >
        <option value="price_asc">کمترین قیمت</option>
        <option value="rating_desc">بالاترین امتیاز</option>
      </select>
      {pending && (
        <span className="sr-only" role="status">
          در حال مرتب‌سازی
        </span>
      )}
    </label>
  );
}
