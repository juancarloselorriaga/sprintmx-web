import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-56" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="flex flex-col justify-between rounded-xl border bg-card/80 p-4 shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-2 h-3 w-40" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="mt-4 h-[200px] w-full" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((key) => (
            <div
              key={key}
              className="flex flex-col justify-between rounded-xl border bg-card/80 p-4 shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-2 h-3 w-44" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="mt-4 h-[200px] w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
