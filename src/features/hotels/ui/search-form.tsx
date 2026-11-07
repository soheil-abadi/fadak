'use client';
import { useRef, type FocusEvent } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
  persian,
  persianFa,
  toPersianDate,
} from '@/lib/dates/calendar';

type Draft = z.input<ReturnType<typeof createSearchSchema>>;
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
  const schema = createSearchSchema(today);
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<Draft, unknown, HotelSearchInput>({
    resolver: zodResolver(schema),
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
    errors[key]?.message ?? serverError?.fieldErrors?.[key]?.[0];
  const datesError = error('checkIn') ?? error('checkOut');
  function submit(input: HotelSearchInput) {
    push(`/hotels?${serializeSearch({ input, filters: {}, sort: 'price_asc' })}`);
  }
  function updateTypedDate(event: FocusEvent<HTMLInputElement>, field: 'checkIn' | 'checkOut') {
    const value = parsePersianInput(event.currentTarget.value);
    setValue(field, value ?? '', { shouldValidate: true });
    if (field === 'checkIn') setValue('checkOut', '', { shouldValidate: true });
    event.currentTarget.setCustomValidity(
      event.currentTarget.value && !value ? 'تاریخ شمسی معتبر وارد کنید.' : '',
    );
    event.currentTarget.reportValidity();
  }
  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape') picker.current?.closeCalendar();
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
                disableMonthPicker
                disableYearPicker
                renderButton={(direction: string, handleClick: () => void, disabled: boolean) => (
                  <button
                    type="button"
                    className="calendar-arrow"
                    onClick={handleClick}
                    disabled={disabled}
                    aria-label={direction === 'right' ? 'ماه قبل' : 'ماه بعد'}
                  >
                    {direction === 'right' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
                  field.onChange(dates[0] ? fromCalendarDate(dates[0]) : '');
                  setValue('checkOut', dates[1] ? fromCalendarDate(dates[1]) : '', {
                    shouldValidate: true,
                  });
                }}
                minDate={toPersianDate(today)}
                maxDate={toPersianDate(addDays(today, 365))}
                currentDate={toPersianDate(today)}
                format="D MMMM"
                dateSeparator=" تا "
                calendarPosition="bottom-right"
                placeholder="انتخاب بازه اقامت"
                inputClass="date-input"
                containerClassName="date-container"
                onClose={() => field.onBlur()}
                editable={false}
                fixMainPosition
                aria-invalid={!!datesError}
                aria-describedby={datesError ? 'dates-error' : 'dates-help'}
              />
            )}
          />
          <input type="hidden" {...register('checkOut')} />
          <span className="sr-only" id="dates-help">
            تاریخ شمسی ورود و خروج را انتخاب کنید. برای ورود متنی از گزینه زیر فرم استفاده کنید.
          </span>
          {datesError && (
            <p className="field-error" id="dates-error">
              {datesError}
            </p>
          )}
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
      <details className="manual-dates">
        <summary>وارد کردن تاریخ به‌صورت متنی</summary>
        <p>تاریخ شمسی را با قالب سال/ماه/روز وارد کنید.</p>
        <div className="manual-date-fields">
          <label>
            تاریخ ورود شمسی
            <input
              aria-label="تاریخ ورود شمسی"
              placeholder={toPersianDate(addDays(today, 7)).format('YYYY/MM/DD')}
              dir="ltr"
              disabled={pending}
              defaultValue={
                raw.checkIn && isDateOnly(raw.checkIn)
                  ? toPersianDate(raw.checkIn).format('YYYY/MM/DD')
                  : ''
              }
              onBlur={(event) => updateTypedDate(event, 'checkIn')}
            />
          </label>
          <label>
            تاریخ خروج شمسی
            <input
              aria-label="تاریخ خروج شمسی"
              placeholder={toPersianDate(addDays(today, 9)).format('YYYY/MM/DD')}
              dir="ltr"
              disabled={pending}
              defaultValue={
                raw.checkOut && isDateOnly(raw.checkOut)
                  ? toPersianDate(raw.checkOut).format('YYYY/MM/DD')
                  : ''
              }
              onBlur={(event) => updateTypedDate(event, 'checkOut')}
            />
          </label>
        </div>
      </details>
    </form>
  );
}
