import type { ReactNode } from 'react';

export type ListViewSortDir = 'asc' | 'desc';

export type ListViewSortState<TSortKey extends string> = {
  key: TSortKey;
  dir: ListViewSortDir;
};

export type ListViewColumn<
  TItem,
  TColumnKey extends string,
  TSortKey extends string = never,
> = {
  key: TColumnKey;
  header: ReactNode;
  cell: (item: TItem) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
  headerClassName?: string;
  visible?: boolean;
  hideable?: boolean;
  sortKey?: TSortKey;
  defaultSortDir?: ListViewSortDir;
};

