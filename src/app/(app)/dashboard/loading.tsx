export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-xl border border-card-border bg-card p-1">
        <div className="flex-1 rounded-lg bg-primary/10 py-2.5" />
        <div className="flex-1 rounded-lg bg-card-border/30 py-2.5" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-card-border bg-card">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 animate-shimmer rounded-full" />
              <div className="h-4 w-24 animate-shimmer rounded" />
            </div>
            <div className="aspect-square w-full animate-shimmer" />
            <div className="px-4 py-3">
              <div className="h-10 w-full animate-shimmer rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
