'use client';
import { useRef } from 'react';
import { ArrowUpLeft, Check, X, BedDouble } from 'lucide-react';
import type { HotelDetails } from '../domain/types';
import type { HotelSearchInput } from '../schemas/search-schema';
import { formatPersianDate } from '@/lib/dates/calendar';
import { formatNumber, formatPrice } from '../domain/search';
export function ReservationPreview({
  hotel,
  input,
}: {
  hotel: HotelDetails;
  input: HotelSearchInput;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className="button reservation-button"
        onClick={() => dialog.current?.showModal()}
      >
        پیش‌نمایش رزرو <ArrowUpLeft size={18} />
      </button>
      <dialog ref={dialog} className="reservation-dialog" aria-labelledby="preview-title">
        <div className="dialog-heading">
          <span className="eyebrow">یک قدم تا سفر</span>
          <button
            type="button"
            className="icon-button"
            aria-label="بستن پیش‌نمایش"
            onClick={() => dialog.current?.close()}
          >
            <X size={21} />
          </button>
        </div>
        <span className="dialog-check">
          <Check size={26} />
        </span>
        <h2 id="preview-title">خلاصه اقامت شما</h2>
        <p className="dialog-hotel">
          <BedDouble size={20} />
          {hotel.name}
        </p>
        <dl className="booking-summary">
          <div>
            <dt>ورود</dt>
            <dd>{formatPersianDate(input.checkIn)}</dd>
          </div>
          <div>
            <dt>خروج</dt>
            <dd>{formatPersianDate(input.checkOut)}</dd>
          </div>
          <div>
            <dt>مسافران و اتاق‌ها</dt>
            <dd>
              {formatNumber(input.guests)} مسافر، {formatNumber(input.rooms)} اتاق
            </dd>
          </div>
          <div>
            <dt>مدت اقامت</dt>
            <dd>{formatNumber(hotel.quote.nights)} شب</dd>
          </div>
          <div className="summary-total">
            <dt>مبلغ کل اقامت</dt>
            <dd>
              {formatPrice(hotel.quote.total.amount)} <small>تومان</small>
            </dd>
          </div>
        </dl>
        <p className="demo-notice">
          این فقط پیش‌نمایش است. رزرو واقعی ثبت نمی‌شود و پرداختی انجام نمی‌گیرد. مالیات یا هزینه
          دیگری به مبلغ نمایشی اضافه نمی‌شود.
        </p>
        <button
          type="button"
          className="button button-outline"
          onClick={() => dialog.current?.close()}
        >
          بازگشت به اقامتگاه
        </button>
      </dialog>
    </>
  );
}
