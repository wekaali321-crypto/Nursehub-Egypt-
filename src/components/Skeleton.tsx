export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="h-44 w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonLines({ lines = 5 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}
