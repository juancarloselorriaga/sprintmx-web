import { Skeleton } from '@/components/ui/skeleton';

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-12 rounded bg-primary/20" />
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-4 w-[480px] max-w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-60 rounded bg-muted animate-pulse" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 rounded-lg border bg-background/60 p-1">
          {[1, 2].map((key) => (
            <div
              key={`nav-${key}`}
              className="h-12 w-full rounded-md bg-muted/80 sm:w-[240px] animate-pulse"
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-4 w-16 rounded bg-muted/80" />
        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-64 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-20 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-16 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-16 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-24 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-28 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-28 rounded-md bg-muted animate-pulse" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/60">
            <tr>
              {[1, 2, 3, 4, 5].map((col) => (
                <th key={`col-${col}`} className="px-4 py-3">
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={`row-${index}`} className="border-t">
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-40 rounded bg-muted animate-pulse" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="ml-auto h-8 w-16 rounded bg-muted animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
