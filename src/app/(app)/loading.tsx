export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-6 sm:px-8 sm:pb-32 sm:pt-8 md:px-10 md:pb-32 md:pt-36">
      <div className="flex animate-pulse flex-col gap-8">
        <div className="space-y-3">
          <div className="h-3 w-20 rounded bg-zinc-900" />
          <div className="h-9 w-48 rounded bg-zinc-900" />
          <div className="h-4 w-72 max-w-full rounded bg-zinc-900/70" />
        </div>
        <div className="h-40 rounded-xl border border-zinc-900 bg-zinc-950/50" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-900/60" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-3 w-28 rounded bg-zinc-900" />
          <div className="h-24 rounded-xl border border-zinc-900 bg-zinc-950/40" />
          <div className="h-24 rounded-xl border border-zinc-900 bg-zinc-950/40" />
        </div>
      </div>
    </div>
  );
}
