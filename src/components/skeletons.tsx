export function SectionSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-40 border border-border bg-surface/50" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface-2/60" />
        ))}
      </div>
    </div>
  );
}

export function GallerySkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[63/88] bg-surface-2/60" />
      ))}
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="mt-6 flex animate-pulse flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 border border-border bg-surface/40" />
      ))}
    </div>
  );
}
