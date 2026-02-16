export default function CreditsLoading() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-card-border bg-card p-6">
        <div className="mx-auto h-4 w-24 animate-shimmer rounded" />
        <div className="mx-auto mt-3 h-10 w-32 animate-shimmer rounded" />
        <div className="mx-auto mt-2 h-3 w-36 animate-shimmer rounded" />
      </div>
      <div>
        <div className="mb-4 h-6 w-32 animate-shimmer rounded" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-card-border bg-card p-5">
              <div className="mx-auto h-8 w-16 animate-shimmer rounded" />
              <div className="mx-auto mt-2 h-4 w-12 animate-shimmer rounded" />
              <div className="mx-auto mt-3 h-8 w-20 animate-shimmer rounded" />
              <div className="mx-auto mt-4 h-10 w-full animate-shimmer rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-4 h-6 w-40 animate-shimmer rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-card-border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-shimmer rounded-full" />
                <div>
                  <div className="h-4 w-24 animate-shimmer rounded" />
                  <div className="mt-1 h-3 w-32 animate-shimmer rounded" />
                </div>
              </div>
              <div className="h-4 w-12 animate-shimmer rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
