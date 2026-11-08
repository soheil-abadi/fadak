'use client';
import { useRef, useState, type MouseEvent } from 'react';
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
} from 'lucide-react';
import { CITIES, type HotelError } from '../domain/types';
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const manualDates = useRef<HTMLDetailsElement>(null);
  const checkInInput = useRef<HTMLInputElement>(null);
  const checkOutInput = useRef<HTMLInputElement>(null);
  const committedCheckIn = useRef(raw.checkIn ?? '');
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
    setFocus,
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
  function focusInvalid(fields: FieldErrors<Draft>) {
    if (fields.city) setFocus('city');
    else if (fields.checkIn || fields.checkOut) {
      if (manualDates.current) manualDates.current.open = true;
      (fields.checkIn ? checkInInput : checkOutInput).current?.focus();
    } else if (fields.rooms) setFocus('rooms');
    else if (fields.guests) setFocus('guests');
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
      }}
      className="search-form"
      aria-label="جست‌وجوی اقامتگاه"
    >
      <fieldset disabled={pending} className="search-fields">
        <div className="search-field destination-field">
          <label htmlFor="city">
            <MapPin size={18} /> مقصد سفر
          </label>
          <select
            id="city"
            {...register('city')}
            aria-invalid={!!error('city')}
            aria-describedby={error('city') ? 'city-error' : undefined}
          >
            <option value="">کجا می‌خواهید بروید؟</option>
            {CITIES.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
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
                render={(value, openCalendar) => (
                  <button
                    ref={calendarTrigger}
                    type="button"
                    id="stay-dates"
                    className="date-input"
                    onClick={openCalendar}
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
          <label htmlFor="guests">
            <Users size={18} /> مسافران و اتاق‌ها
          </label>
          <div className="guest-selects">
            <select
              id="guests"
              {...register('guests')}
              aria-invalid={!!error('guests')}
              aria-describedby={error('guests') ? 'guests-error' : undefined}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {new Intl.NumberFormat('fa').format(i + 1)} مسافر
                </option>
              ))}
            </select>
            <span>،</span>
            <select
              aria-label="تعداد اتاق"
              {...register('rooms')}
              aria-invalid={!!error('rooms')}
              aria-describedby={error('rooms') ? 'guests-error' : undefined}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {new Intl.NumberFormat('fa').format(i + 1)} اتاق
                </option>
              ))}
            </select>
          </div>
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
