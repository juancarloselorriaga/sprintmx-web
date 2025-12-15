import { UsersTableSkeleton } from '@/components/admin/users/users-table-skeleton';

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

      <UsersTableSkeleton
        rows={5}
        columns={{ user: true, role: true, created: true, actions: true }}
        showHeader
        minWidthClassName="min-w-[720px]"
      />
    </div>
  );
}
