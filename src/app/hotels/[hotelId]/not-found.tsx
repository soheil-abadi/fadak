import Link from 'next/link';
import { MapPin } from 'lucide-react';
export default function NotFound() {
  return (
    <main id="main" className="container">
      <div className="result-state">
        <span className="state-icon">
          <MapPin size={28} />
        </span>
        <h1>این اقامتگاه پیدا نشد</h1>
        <p>شاید نشانی تغییر کرده باشد. از میان اقامتگاه‌های دیگر انتخاب کنید.</p>
        <Link href="/hotels" className="button">
          بازگشت به جست‌وجو
        </Link>
      </div>
    </main>
  );
}
