'use client';

import type { ReactNode } from 'react';

import type { ListViewColumn, ListViewSortDir, ListViewSortState } from '@/components/list-view/types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

type EntityListViewProps<TItem, TColumnKey extends string, TSortKey extends string = never> = {
  items: TItem[];
  getRowIdAction: (item: TItem) => string;
  columns: Array<ListViewColumn<TItem, TColumnKey, TSortKey>>;
  sort?: ListViewSortState<TSortKey>;
  onSortChangeAction?: (next: ListViewSortState<TSortKey>) => void;
  isLoading?: boolean;
  emptyContent?: ReactNode;
  controls?: ReactNode;
  pagination?: ReactNode;
  rowPadding?: 'py-2' | 'py-3';
  minWidthClassName?: string;
  renderSkeletonRowsAction?: (args: {
    rows: number;
    visibleColumns: Array<ListViewColumn<TItem, TColumnKey, TSortKey>>;
    rowPadding: 'py-2' | 'py-3';
  }) => ReactNode;
  skeletonRows?: number;
};

/**
 * Generic, config-driven list view for SSR-provided data.
 * It stays UI-only: domain logic (fetching, filters semantics, URL conventions) stays outside.
 */
export function EntityListView<TItem, TColumnKey extends string, TSortKey extends string = never>({
  items,
  getRowIdAction,
  columns,
  sort,
  onSortChangeAction,
  isLoading = false,
  emptyContent,
  controls,
  pagination,
  rowPadding = 'py-3',
  minWidthClassName,
  renderSkeletonRowsAction,
  skeletonRows = 5,
}: EntityListViewProps<TItem, TColumnKey, TSortKey>) {
  const visibleColumns = columns.filter((column) => column.visible !== false);
  const colSpan = Math.max(1, visibleColumns.length);

  const handleSort = (column: ListViewColumn<TItem, TColumnKey, TSortKey>) => {
    if (!column.sortKey || !onSortChangeAction) return;

    const isSameColumn = sort?.key === column.sortKey;
    const nextDir: ListViewSortDir = isSameColumn
      ? sort?.dir === 'asc'
        ? 'desc'
        : 'asc'
      : (column.defaultSortDir ?? 'asc');

    onSortChangeAction({ key: column.sortKey, dir: nextDir });
  };

  return (
    <div className="space-y-4">
      {controls ? <div>{controls}</div> : null}

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className={cn('w-full text-sm', minWidthClassName)}>
          <thead className="bg-muted/60">
            <tr>
              {visibleColumns.map((column) => {
                const isSortable = Boolean(column.sortKey && onSortChangeAction);
                const sortDir = column.sortKey && sort?.key === column.sortKey ? sort.dir : null;
                const alignClassName = column.align === 'right' ? 'text-right' : 'text-left';

                return (
                  <th
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                      alignClassName,
                      column.headerClassName,
                    )}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column)}
                        className="inline-flex items-center gap-1 rounded-sm hover:text-foreground"
                      >
                        {column.header}
                        {sortDir ? (
                          sortDir === 'asc' ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )
                        ) : null}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              renderSkeletonRowsAction ? (
                renderSkeletonRowsAction({ rows: skeletonRows, visibleColumns, rowPadding })
              ) : (
                <tr>
                  <td className="px-4 py-8" colSpan={colSpan} />
                </tr>
              )
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-muted-foreground" colSpan={colSpan}>
                  {emptyContent}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={getRowIdAction(item)} className="border-t hover:bg-muted/30">
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 align-top',
                        rowPadding,
                        column.align === 'right' ? 'text-right' : 'text-left',
                        column.className,
                      )}
                    >
                      {column.cell(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination ? <div>{pagination}</div> : null}
    </div>
  );
}
