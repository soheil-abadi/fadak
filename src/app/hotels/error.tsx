'use client';
import { TriangleAlert } from 'lucide-react';
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="container">
      <div className="result-state">
        <span className="state-icon">
          <TriangleAlert size={28} />
        </span>
        <h1>مشکلی پیش آمد</h1>
        <p>این صفحه درست بارگذاری نشد. لطفاً دوباره تلاش کنید.</p>
        <button type="button" className="button" onClick={reset}>
          تلاش مجدد
        </button>
      </div>
    </main>
  );
}
