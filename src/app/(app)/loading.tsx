export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-8 sm:px-8 sm:pb-20 sm:pt-10 md:px-10">
      <div className="flex animate-pulse flex-col gap-8">
        <div className="space-y-3">
          <div className="h-3 w-20 bg-surface-2" />
          <div className="h-9 w-48 bg-surface-2" />
          <div className="h-4 w-72 max-w-full bg-surface-2/70" />
        </div>
        <div className="h-40 border border-border bg-surface/50" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-2/60" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-3 w-28 bg-surface-2" />
          <div className="h-24 border border-border bg-surface/40" />
          <div className="h-24 border border-border bg-surface/40" />
        </div>
      </div>
    </div>
  );
}
