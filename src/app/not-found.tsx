import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="container">
      <div className="result-state">
        <h1>این صفحه پیدا نشد</h1>
        <p>از جست‌وجوی اقامتگاه‌ها شروع کنید.</p>
        <Link href="/hotels" className="button">
          جست‌وجوی هتل
        </Link>
      </div>
    </main>
  );
}
