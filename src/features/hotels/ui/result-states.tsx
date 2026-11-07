'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { SearchX, RefreshCw, TriangleAlert } from 'lucide-react';
import type { HotelError } from '../domain/types';
export function RetryError({ error }: { error: HotelError }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="result-state error-state" role="alert">
      <span className="state-icon">
        <TriangleAlert size={27} />
      </span>
      <h2>این بار به نتیجه نرسیدیم</h2>
      <p>{error.message}</p>
      {error.retryable ? (
        <button
          type="button"
          className="button"
          disabled={pending}
          onClick={() => startTransition(() => router.refresh())}
        >
          <RefreshCw size={16} className={pending ? 'spin' : ''} />
          {pending ? 'در حال تلاش…' : 'تلاش مجدد'}
        </button>
      ) : (
        <Link href="/hotels" className="button">
          اصلاح جست‌وجو
        </Link>
      )}
    </div>
  );
}
export function EmptyResults({ resetHref }: { resetHref: string }) {
  return (
    <div className="result-state">
      <span className="state-icon">
        <SearchX size={30} />
      </span>
      <h2>برای این جست‌وجو اقامتگاهی پیدا نشد</h2>
      <p>
        بازه قیمت، تعداد اتاق‌ها یا مقصد را تغییر دهید؛ شاید انتخاب دلخواهتان کمی آن‌طرف‌تر باشد.
      </p>
      <Link href={resetHref} className="button button-outline">
        پاک‌کردن فیلترها
      </Link>
      <Link className="text-link" href="/hotels">
        شروع جست‌وجوی جدید
      </Link>
    </div>
  );
}
