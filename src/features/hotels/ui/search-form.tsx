'use client';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Controller, useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import DatePicker, { type DatePickerRef } from 'react-multi-date-picker';
import { useSearchNavigation } from './search-navigation';
import {
  CalendarDays,
  MapPin,
  Search,
  Users,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from 'lucide-react';
import { CITIES, type CityId, type HotelError } from '../domain/types';
import { createSearchSchema, type HotelSearchInput } from '../schemas/search-schema';
import { serializeSearch } from '../url-state';
import {
  addDays,
  parsePersianInput,
  fromCalendarDate,
  isDateOnly,
  nightsBetween,
  persian,
  persianFa,
  toPersianDate,
} from '@/lib/dates/calendar';

type Draft = z.input<ReturnType<typeof createSearchSchema>>;
type DateField = 'checkIn' | 'checkOut';
const formatDraft = (value: string | undefined) =>
  value && isDateOnly(value) ? toPersianDate(value).format('YYYY/MM/DD') : '';
const cityLabel = (id: string | undefined) => CITIES.find((city) => city.id === id)?.name ?? '';
const formatCount = (value: number) => new Intl.NumberFormat('fa').format(value);
function filterCities(query: string) {
  const normalized = query.trim();
  if (!normalized) return CITIES;
  return CITIES.filter(
    (city) => city.name.includes(normalized) || city.description.includes(normalized),
  );
}
export function SearchForm({
  today,
  raw,
  serverError,
}: {
  today: string;
  raw: Record<string, string>;
  serverError?: HotelError;
}) {
  const { pending, push } = useSearchNavigation();
  const picker = useRef<DatePickerRef>(null);
  const calendarTrigger = useRef<HTMLButtonElement>(null);
  const occupancyTrigger = useRef<HTMLButtonElement>(null);
  const cityInput = useRef<HTMLInputElement>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [monthCount, setMonthCount] = useState(1);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState(cityLabel(raw.city));
  const [cityHighlight, setCityHighlight] = useState(0);
  const [occupancyOpen, setOccupancyOpen] = useState(false);
  const manualDates = useRef<HTMLDetailsElement>(null);
  const checkInInput = useRef<HTMLInputElement>(null);
  const checkOutInput = useRef<HTMLInputElement>(null);
  const committedCheckIn = useRef(raw.checkIn ?? '');
  const cityListId = useId();
  const [dateText, setDateText] = useState({
    checkIn: formatDraft(raw.checkIn),
    checkOut: formatDraft(raw.checkOut),
  });
  const [checkoutNotice, setCheckoutNotice] = useState('');
  const schema = createSearchSchema(today);
  const {
    register,
    control,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<Draft, unknown, HotelSearchInput>({
    resolver: zodResolver(schema),
    shouldFocusError: false,
    defaultValues: {
      city: CITIES.find((city) => city.id === raw.city)?.id,
      checkIn: raw.checkIn && isDateOnly(raw.checkIn) ? raw.checkIn : '',
      checkOut: raw.checkOut && isDateOnly(raw.checkOut) ? raw.checkOut : '',
      rooms: raw.rooms ?? 1,
      guests: raw.guests ?? 2,
    },
  });
  const checkout = useWatch({ control, name: 'checkOut' });
  const rooms = Number(useWatch({ control, name: 'rooms' }) ?? 1);
  const guests = Number(useWatch({ control, name: 'guests' }) ?? 2);
  const selectedCity = useWatch({ control, name: 'city' });
  const cityOptions = filterCities(cityQuery);
  const error = (key: keyof HotelSearchInput) =>
    errors[key]?.message ?? (!dirtyFields[key] ? serverError?.fieldErrors?.[key]?.[0] : undefined);
  const dateError = (field: DateField) =>
    dateText[field] && !parsePersianInput(dateText[field])
      ? 'تاریخ شمسی معتبر با قالب سال/ماه/روز وارد کنید.'
      : error(field);
  const dateDescription = [
    'dates-help',
    dateError('checkIn') && 'check-in-error',
    dateError('checkOut') && 'check-out-error',
    checkoutNotice && 'checkout-notice',
  ]
    .filter(Boolean)
    .join(' ');
  useEffect(() => {
    if (!cityOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (cityInput.current?.contains(target)) return;
      const list = document.getElementById(cityListId);
      if (list?.contains(target)) return;
      setCityOpen(false);
      if (!selectedCity) setCityQuery('');
      else setCityQuery(cityLabel(selectedCity));
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [cityListId, cityOpen, selectedCity]);
  useEffect(() => {
    if (!occupancyOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const panel = document.getElementById('occupancy-panel');
      if (occupancyTrigger.current?.contains(target) || panel?.contains(target)) return;
      setOccupancyOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [occupancyOpen]);
  function submit(input: HotelSearchInput) {
    push(`/hotels?${serializeSearch({ input, filters: {}, sort: 'price_asc' })}`);
  }
  function updateTypedDate(text: string, field: DateField) {
    const value = parsePersianInput(text) ?? '';
    setDateText((current) => ({ ...current, [field]: text }));
    setValue(field, value, { shouldValidate: true, shouldDirty: true });
    if (field === 'checkOut') setCheckoutNotice('');
  }
  function reconcileCheckout() {
    const value = getValues('checkIn');
    const existingCheckout = getValues('checkOut');
    if (isDateOnly(value) && value !== committedCheckIn.current && isDateOnly(existingCheckout)) {
      const nights = nightsBetween(value, existingCheckout);
      if (nights < 1 || nights > 30 || existingCheckout > addDays(today, 365)) {
        setValue('checkOut', '', { shouldValidate: true, shouldDirty: true });
        setDateText((current) => ({ ...current, checkOut: '' }));
        setCheckoutNotice(
          'با تغییر تاریخ ورود، تاریخ خروج قبلی معتبر نیست. خروج را دوباره انتخاب کنید.',
        );
      }
    }
    if (isDateOnly(value)) committedCheckIn.current = value;
  }
  function selectCity(id: CityId) {
    setValue('city', id, { shouldValidate: true, shouldDirty: true });
    setCityQuery(cityLabel(id));
    setCityOpen(false);
    setCityHighlight(0);
  }
  function onCityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCityOpen(true);
      setCityHighlight((index) => Math.min(index + 1, Math.max(cityOptions.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCityOpen(true);
      setCityHighlight((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter' && cityOpen && cityOptions[cityHighlight]) {
      event.preventDefault();
      selectCity(cityOptions[cityHighlight].id);
      return;
    }
    if (event.key === 'Escape' && cityOpen) {
      event.preventDefault();
      event.stopPropagation();
      setCityOpen(false);
      setCityQuery(cityLabel(selectedCity));
      cityInput.current?.focus();
    }
  }
  function changeRooms(next: number) {
    const roomsValue = Math.min(5, Math.max(1, next));
    setValue('rooms', roomsValue, { shouldValidate: true, shouldDirty: true });
    if (guests < roomsValue)
      setValue('guests', roomsValue, { shouldValidate: true, shouldDirty: true });
  }
  function changeGuests(next: number) {
    const guestsValue = Math.min(10, Math.max(1, next));
    setValue('guests', guestsValue, { shouldValidate: true, shouldDirty: true });
    if (guestsValue < rooms)
      setValue('rooms', guestsValue, { shouldValidate: true, shouldDirty: true });
  }
  function focusInvalid(fields: FieldErrors<Draft>) {
    if (fields.city) cityInput.current?.focus();
    else if (fields.checkIn || fields.checkOut) {
      if (manualDates.current) manualDates.current.open = true;
      (fields.checkIn ? checkInInput : checkOutInput).current?.focus();
    } else if (fields.rooms || fields.guests) {
      setOccupancyOpen(true);
      occupancyTrigger.current?.focus();
    }
  }
  return (
    <form
      onSubmit={(event) => {
        reconcileCheckout();
        void handleSubmit(submit, focusInvalid)(event);
      }}
      noValidate
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape' && calendarOpen) {
          event.preventDefault();
          event.stopPropagation();
          picker.current?.closeCalendar();
          calendarTrigger.current?.focus();
        }
        if (event.key === 'Escape' && occupancyOpen) {
          event.preventDefault();
          event.stopPropagation();
          setOccupancyOpen(false);
          occupancyTrigger.current?.focus();
        }
      }}
      className="search-form"
      aria-label="جست‌وجوی اقامتگاه"
    >
      <fieldset disabled={pending} className="search-fields">
        <div className="search-field destination-field">
          <label htmlFor="city">
            <MapPin size={18} /> مقصد سفر
          </label>
          <input type="hidden" {...register('city')} />
          <input
            ref={cityInput}
            id="city"
            role="combobox"
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="کجا می‌خواهید بروید؟"
            value={cityQuery}
            aria-expanded={cityOpen}
            aria-controls={cityListId}
            aria-autocomplete="list"
            aria-activedescendant={
              cityOpen && cityOptions[cityHighlight]
                ? `${cityListId}-${cityOptions[cityHighlight].id}`
                : undefined
            }
            aria-invalid={!!error('city')}
            aria-describedby={error('city') ? 'city-error' : undefined}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setCityQuery(value);
              setCityOpen(true);
              setCityHighlight(0);
              const exact = CITIES.find((city) => city.name === value.trim());
              setValue('city', (exact?.id ?? '') as Draft['city'], {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            onKeyDown={onCityKeyDown}
          />
          {cityOpen && (
            <ul
              id={cityListId}
              role="listbox"
              className="city-suggestions"
              aria-label="مقصدهای موجود"
            >
              {cityOptions.length === 0 ? (
                <li className="city-empty" role="presentation">
                  مقصدی با این نام پیدا نشد.
                </li>
              ) : (
                cityOptions.map((city, index) => (
                  <li
                    key={city.id}
                    id={`${cityListId}-${city.id}`}
                    role="option"
                    aria-selected={selectedCity === city.id || cityHighlight === index}
                    className={
                      cityHighlight === index || selectedCity === city.id ? 'is-active' : undefined
                    }
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setCityHighlight(index)}
                      onClick={() => selectCity(city.id)}
                    >
                      <strong>{city.name}</strong>
                      <small>{city.description}</small>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
          {error('city') && (
            <p className="field-error" id="city-error">
              {error('city')}
            </p>
          )}
        </div>
        <div className="search-field dates-field">
          <label htmlFor="stay-dates">
            <CalendarDays size={18} /> تاریخ ورود و خروج
          </label>
          <Controller
            name="checkIn"
            control={control}
            render={({ field }) => (
              <DatePicker
                ref={picker}
                id="stay-dates"
                numberOfMonths={monthCount}
                render={(value, openCalendar) => (
                  <button
                    ref={calendarTrigger}
                    type="button"
                    id="stay-dates"
                    className="date-input"
                    onClick={() => {
                      setMonthCount(
                        typeof window.matchMedia === 'function' &&
                          window.matchMedia('(min-width: 768px)').matches
                          ? 2
                          : 1,
                      );
                      openCalendar();
                    }}
                    aria-expanded={calendarOpen}
                    aria-describedby={dateDescription}
                  >
                    {value || 'انتخاب بازه اقامت'}
                  </button>
                )}
                disableMonthPicker
                disableYearPicker
                renderButton={(
                  direction: string,
                  handleClick: (event: MouseEvent<HTMLButtonElement>) => void,
                  disabled: boolean,
                ) => (
                  <button
                    type="button"
                    className="calendar-arrow"
                    onClick={(event) => {
                      if (!disabled) handleClick(event);
                    }}
                    aria-disabled={disabled}
                    aria-label={direction === 'left' ? 'ماه قبل' : 'ماه بعد'}
                  >
                    {direction === 'left' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                  </button>
                )}
                mapDays={({ date }) => {
                  const day = fromCalendarDate(date);
                  const disabled = pending || day < today || day > addDays(today, 365);
                  return {
                    disabled,
                    'aria-label': `انتخاب ${date.format('dddd D MMMM YYYY')}`,
                    'aria-disabled': disabled,
                    role: 'button',
                    tabIndex: disabled ? -1 : 0,
                    onKeyDown: (event) => {
                      if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        event.currentTarget.click();
                      }
                    },
                  };
                }}
                calendar={persian}
                locale={persianFa}
                range
                value={[field.value, checkout]
                  .filter((value) => value && isDateOnly(value))
                  .map((value) => toPersianDate(value))}
                onChange={(dates) => {
                  const checkIn = dates[0] ? fromCalendarDate(dates[0]) : '';
                  const checkOut = dates[1] ? fromCalendarDate(dates[1]) : '';
                  setDateText({ checkIn: formatDraft(checkIn), checkOut: formatDraft(checkOut) });
                  setCheckoutNotice('');
                  committedCheckIn.current = checkIn;
                  setValue('checkIn', checkIn, { shouldValidate: true, shouldDirty: true });
                  setValue('checkOut', checkOut, { shouldValidate: true, shouldDirty: true });
                }}
                minDate={toPersianDate(today)}
                maxDate={toPersianDate(addDays(today, 365))}
                currentDate={toPersianDate(today)}
                format="D MMMM"
                dateSeparator=" تا "
                calendarPosition="bottom-right"
                placeholder="انتخاب بازه اقامت"
                containerClassName="date-container"
                onOpen={() => setCalendarOpen(true)}
                onClose={() => {
                  setCalendarOpen(false);
                  field.onBlur();
                }}
                editable={false}
                fixMainPosition
              />
            )}
          />
          <input type="hidden" {...register('checkOut')} />
          <span className="sr-only" id="dates-help">
            تاریخ شمسی ورود و خروج را انتخاب کنید. برای ورود متنی از گزینه زیر فرم استفاده کنید.
          </span>
          {dateError('checkIn') && (
            <p className="field-error" id="check-in-error">
              ورود: {dateError('checkIn')}
            </p>
          )}
          {dateError('checkOut') && (
            <p className="field-error" id="check-out-error">
              خروج: {dateError('checkOut')}
            </p>
          )}
          <p className="field-error" id="checkout-notice" role="status">
            {checkoutNotice}
          </p>
        </div>
        <div className="search-field guests-field">
          <span className="field-label" id="occupancy-label">
            <Users size={18} /> مسافران و اتاق‌ها
          </span>
          <button
            ref={occupancyTrigger}
            type="button"
            className="occupancy-trigger"
            aria-expanded={occupancyOpen}
            aria-controls="occupancy-panel"
            aria-describedby={`occupancy-label${error('guests') || error('rooms') ? ' guests-error' : ''}`}
            onClick={() => setOccupancyOpen((open) => !open)}
          >
            {formatCount(guests)} مسافر، {formatCount(rooms)} اتاق
          </button>
          {occupancyOpen && (
            <div
              id="occupancy-panel"
              className="occupancy-panel"
              role="group"
              aria-label="تعداد مسافر و اتاق"
            >
              <div className="occupancy-row">
                <div>
                  <strong>اتاق</strong>
                  <small>از ۱ تا ۵</small>
                </div>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="کاهش تعداد اتاق"
                    disabled={rooms <= 1}
                    onClick={() => changeRooms(rooms - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span aria-live="polite">{formatCount(rooms)}</span>
                  <button
                    type="button"
                    aria-label="افزایش تعداد اتاق"
                    disabled={rooms >= 5}
                    onClick={() => changeRooms(rooms + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="occupancy-row">
                <div>
                  <strong>مسافر</strong>
                  <small>از ۱ تا ۱۰؛ حداقل یک نفر برای هر اتاق</small>
                </div>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="کاهش تعداد مسافر"
                    disabled={guests <= 1}
                    onClick={() => changeGuests(guests - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span aria-live="polite">{formatCount(guests)}</span>
                  <button
                    type="button"
                    aria-label="افزایش تعداد مسافر"
                    disabled={guests >= 10}
                    onClick={() => changeGuests(guests + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
          <input type="hidden" {...register('rooms')} />
          <input type="hidden" {...register('guests')} />
          {(error('guests') || error('rooms')) && (
            <p className="field-error" id="guests-error">
              {error('guests') ?? error('rooms')}
            </p>
          )}
        </div>
        <button className="button search-button" type="submit">
          {pending ? <LoaderCircle className="spin" size={19} /> : <Search size={19} />}{' '}
          {pending ? 'در حال جست‌وجو' : 'جست‌وجوی هتل'}
        </button>
      </fieldset>
      <details ref={manualDates} className="manual-dates">
        <summary>وارد کردن تاریخ به‌صورت متنی</summary>
        <p id="manual-dates-help">تاریخ شمسی را با قالب سال/ماه/روز وارد کنید.</p>
        <div className="manual-date-fields">
          <label>
            تاریخ ورود شمسی
            <input
              ref={checkInInput}
              aria-label="تاریخ ورود شمسی"
              aria-invalid={!!dateError('checkIn')}
              aria-describedby={`manual-dates-help${dateError('checkIn') ? ' check-in-error' : ''}`}
              placeholder={toPersianDate(addDays(today, 7)).format('YYYY/MM/DD')}
              dir="ltr"
              disabled={pending}
              value={dateText.checkIn}
              onChange={(event) => updateTypedDate(event.currentTarget.value, 'checkIn')}
              onBlur={reconcileCheckout}
            />
          </label>
          <label>
            تاریخ خروج شمسی
            <input
              ref={checkOutInput}
              aria-label="تاریخ خروج شمسی"
              aria-invalid={!!dateError('checkOut')}
              aria-describedby={`manual-dates-help${dateError('checkOut') ? ' check-out-error' : ''}${checkoutNotice ? ' checkout-notice' : ''}`}
              placeholder={toPersianDate(addDays(today, 9)).format('YYYY/MM/DD')}
              dir="ltr"
              disabled={pending}
              value={dateText.checkOut}
              onChange={(event) => updateTypedDate(event.currentTarget.value, 'checkOut')}
            />
          </label>
        </div>
      </details>
    </form>
  );
}
