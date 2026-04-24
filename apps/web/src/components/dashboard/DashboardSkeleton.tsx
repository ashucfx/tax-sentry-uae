function Bone({ className }: { className?: string }) {
  return <div className={`bg-muted rounded animate-pulse ${className ?? ''}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* De-minimis row — 2 gauge cards */}
      <section>
        <div className="mb-4 space-y-1.5">
          <Bone className="h-4 w-52" />
          <Bone className="h-3 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-card rounded-lg border shadow-card p-5 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-1.5">
                  <Bone className="h-3 w-36" />
                  <Bone className="h-2.5 w-52" />
                </div>
              </div>
              <div className="flex items-center gap-5">
                <Bone className="w-28 h-20 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Bone className="h-6 w-24" />
                  <Bone className="h-3 w-40" />
                  <div className="border-t pt-2 space-y-2">
                    <Bone className="h-2.5 w-full" />
                    <Bone className="h-2.5 w-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Period bar */}
        <div className="mt-3 bg-card rounded-lg border px-5 py-3 shadow-card space-y-2">
          <div className="flex justify-between">
            <Bone className="h-3 w-28" />
            <Bone className="h-3 w-40" />
          </div>
          <Bone className="h-1.5 w-full rounded-full" />
        </div>
      </section>

      {/* Revenue mix row */}
      <section>
        <Bone className="h-4 w-32 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-lg border shadow-card p-6 space-y-3">
            <Bone className="h-3 w-64" />
            <Bone className="h-56 w-full" />
          </div>
          <div className="bg-card rounded-lg border shadow-card p-6 space-y-4">
            <Bone className="h-4 w-40" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <Bone className="h-3 w-28" />
                <Bone className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-card rounded-lg border shadow-card p-5 space-y-3">
          <div className="flex justify-between mb-2">
            <Bone className="h-4 w-40" />
            <Bone className="h-5 w-20 rounded-full" />
          </div>
          <Bone className="h-1.5 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Bone key={i} className="h-10 rounded-md" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-3">
          <Bone className="h-4 w-32" />
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
