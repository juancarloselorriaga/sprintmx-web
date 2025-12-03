'use client';

import type { AdminUserRow } from '@/app/actions/admin-users-list';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

type AdminUsersTableProps = {
  users: AdminUserRow[];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function PermissionBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        enabled
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-muted text-muted-foreground border border-border/60'
      )}
    >
      <ShieldCheck className="size-3.5" />
      {label}
    </span>
  );
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  const data = useMemo(() => users, [users]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo<ColumnDef<AdminUserRow>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        ),
        filterFn: 'includesString',
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="text-sm text-foreground">{row.original.email}</div>
        ),
        filterFn: 'includesString',
      },
      {
        id: 'canonicalRoles',
        header: 'Internal role',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.canonicalRoles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20"
              >
                {role.replace('internal.', '')}
              </span>
            ))}
          </div>
        ),
        sortingFn: (a, b) =>
          (a.original.canonicalRoles[0] ?? '').localeCompare(b.original.canonicalRoles[0] ?? ''),
      },
      {
        id: 'permissions',
        header: 'Permissions',
        enableSorting: false,
        cell: ({ row }) => {
          const { permissions } = row.original;

          return (
            <div className="flex flex-wrap gap-2">
              <PermissionBadge label="Admin area" enabled={permissions.canAccessAdminArea} />
              <PermissionBadge label="Manage users" enabled={permissions.canManageUsers} />
              <PermissionBadge label="Staff tools" enabled={permissions.canViewStaffTools} />
            </div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </div>
        ),
        sortingFn: (a, b) =>
          new Date(a.original.createdAt).getTime() - new Date(b.original.createdAt).getTime(),
      },
    ];
  }, []);

  // TanStack's hook returns dynamic helpers; React Compiler flags it as incompatible for memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const nameFilter = (table.getColumn('name')?.getFilterValue() as string) ?? '';
  const emailFilter = (table.getColumn('email')?.getFilterValue() as string) ?? '';

  const totalRows = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const pageEnd = Math.min(totalRows, (pageIndex + 1) * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold leading-tight">Internal users</h3>
          <p className="text-sm text-muted-foreground">
            Admins and staff with access to the control panel.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={nameFilter}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            placeholder="Filter by name"
            className="h-9 rounded-md border bg-background px-3 text-sm shadow-sm outline-none ring-0 transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <input
            type="text"
            value={emailFilter}
            onChange={(event) => table.getColumn('email')?.setFilterValue(event.target.value)}
            placeholder="Filter by email"
            className="h-9 rounded-md border bg-background px-3 text-sm shadow-sm outline-none ring-0 transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-semibold text-foreground"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={cn(
                          'flex items-center gap-2',
                          header.column.getCanSort() ? 'cursor-pointer select-none' : 'cursor-default'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: '↑',
                          desc: '↓',
                        }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={columns.length}>
                  No internal users found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {pageStart}-{pageEnd} of {totalRows} users
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
