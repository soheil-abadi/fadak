'use client';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useSearchNavigation } from './search-navigation';
import { SlidersHorizontal, Star, X } from 'lucide-react';
import type { HotelSearchQuery } from '../schemas/search-schema';
import { filtersSchema } from '../schemas/search-schema';
import { serializeSearch } from '../url-state';
import { normalizeDigits } from '@/lib/dates/calendar';
import { formatNumber } from '../domain/search';

function digitsOnly(value: string) {
  return normalizeDigits(value).replace(/\D/g, '');
}
function displayPrice(value: string) {
  return value === '' ? '' : formatNumber(Number(value));
}

function subscribeMobile(onStoreChange: () => void) {
  const media = window.matchMedia('(max-width: 640px)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}
function useIsMobile() {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia('(max-width: 640px)').matches,
    () => false,
  );
}

function FilterPanel({
  query,
  idPrefix,
  onApplied,
  footer,
}: {
  query: HotelSearchQuery;
  idPrefix: string;
  onApplied?: () => void;
  footer?: ReactNode;
}) {
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
  const minId = `${idPrefix}-min-price`;
  const maxId = `${idPrefix}-max-price`;
  const errorId = `${idPrefix}-filter-error`;
  function navigate(next: HotelSearchQuery) {
    push(`/hotels?${serializeSearch(next)}`);
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const toPrice = (value: string) =>
          value === '' ? undefined : /^\d+$/.test(value) ? Number(value) * 10 : NaN;
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
        onApplied?.();
      }}
    >
      <fieldset disabled={pending}>
        <section className="filter-section">
          <h3>بودجه‌ی اقامت شما</h3>
          <p>قیمت هر شب برای یک اتاق، به تومان</p>
          <div className="price-input">
            <label htmlFor={minId}>از</label>
            <input
              id={minId}
              className="numeric-input"
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              inputMode="numeric"
              dir="ltr"
              value={displayPrice(min)}
              onChange={(event) => setMin(digitsOnly(event.target.value))}
              placeholder="بدون محدودیت"
            />
            <span>تومان</span>
          </div>
          <div className="price-input">
            <label htmlFor={maxId}>تا</label>
            <input
              id={maxId}
              className="numeric-input"
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              inputMode="numeric"
              dir="ltr"
              value={displayPrice(max)}
              onChange={(event) => setMax(digitsOnly(event.target.value))}
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
                  name={`${idPrefix}-stars`}
                  value={value}
                  checked={stars === value}
                  onChange={() => setStars(value)}
                />
                {value ? (
                  <>
                    <span className="numeric">{formatNumber(Number(value))}</span>
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
          <p role="alert" className="field-error" id={errorId}>
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
            onClick={() => {
              navigate({ ...query, filters: {} });
              onApplied?.();
            }}
          >
            <X size={14} /> پاک‌کردن فیلترها
          </button>
        )}
        {footer}
      </fieldset>
    </form>
  );
}

export function Filters({ query }: { query: HotelSearchQuery }) {
  const isMobile = useIsMobile();
  return (
    <aside className="filter-sidebar" inert={isMobile ? true : undefined}>
      <div className="filter-panel-card">
        <div className="filter-panel-heading">
          <span>
            <SlidersHorizontal size={18} /> فیلترهای جست‌وجو{' '}
            {Object.values(query.filters).some((value) => value !== undefined) && (
              <b className="count-badge">
                {formatNumber(
                  Object.values(query.filters).filter((value) => value !== undefined).length,
                )}
              </b>
            )}
          </span>
        </div>
        <FilterPanel query={query} idPrefix="desktop" />
      </div>
      <div className="sidebar-tip">
        <span>خوش‌سفر باشید!</span>
        <p>برای انتخاب بهتر، امتیاز و امکانات اقامتگاه‌ها را هم مقایسه کنید.</p>
        <span className="tip-line" />
      </div>
    </aside>
  );
}

export function MobileFilters({ query }: { query: HotelSearchQuery }) {
  const isMobile = useIsMobile();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const active = Object.values(query.filters).filter((value) => value !== undefined).length;
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    function onClose() {
      trigger.current?.focus();
    }
    node.addEventListener('close', onClose);
    return () => node.removeEventListener('close', onClose);
  }, []);
  return (
    <div className="mobile-filters" inert={!isMobile ? true : undefined}>
      <button
        ref={trigger}
        type="button"
        className="filter-drawer-trigger"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <SlidersHorizontal size={16} />
        فیلترها
        {active > 0 && <b className="count-badge">{formatNumber(active)}</b>}
      </button>
      <dialog
        ref={dialog}
        className="filter-drawer"
        aria-labelledby="filter-drawer-title"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="filter-drawer-sheet">
          <div className="dialog-heading">
            <h2 id="filter-drawer-title">فیلترهای جست‌وجو</h2>
            <button
              type="button"
              className="icon-button"
              aria-label="بستن فیلترها"
              onClick={() => dialog.current?.close()}
            >
              <X size={21} />
            </button>
          </div>
          <FilterPanel query={query} idPrefix="mobile" onApplied={() => dialog.current?.close()} />
        </div>
      </dialog>
    </div>
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
