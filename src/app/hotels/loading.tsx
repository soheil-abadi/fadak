import { ResultsSkeleton } from '@/features/hotels/ui/skeleton';
export default function Loading() {
  return (
    <main id="main" className="container route-loading">
      <h1>در حال آماده‌کردن سفر شما…</h1>
      <ResultsSkeleton />
    </main>
  );
}
