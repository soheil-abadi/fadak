export function ResultsSkeleton() {
  return (
    <div className="results-skeleton" role="status" aria-label="در حال دریافت اقامتگاه‌ها">
      <span className="sr-only">در حال دریافت اقامتگاه‌ها</span>
      {[0, 1, 2].map((index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton-photo shimmer" />
          <div className="skeleton-lines">
            <span className="shimmer" />
            <span className="shimmer" />
            <span className="shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
