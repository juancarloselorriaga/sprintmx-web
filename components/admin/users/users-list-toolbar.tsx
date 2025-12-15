'use client';

import { adminUsersTextInputClassName } from '@/components/admin/users/styles';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, LayoutList, Search, SlidersHorizontal } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

export type UsersListColumnKey = 'name' | 'role' | 'created' | 'actions';
export type UsersListDensity = 'comfortable' | 'compact';

type UsersListToolbarProps<TRoleFilter extends string> = {
  labels: {
    searchLabel: string;
    filtersLabel: string;
    searchPlaceholder: string;
    applyButton: string;
    clearFilters: string;
    displayLabel: string;
    columnsButton: string;
    columnsLabel: string;
  };
  densityLabels: {
    comfortable: string;
    compact: string;
  };
  query: {
    role: TRoleFilter;
    search: string;
  };
  defaultRoleKey: TRoleFilter;
  roleOptions: ReadonlyArray<{ key: TRoleFilter; label: string }>;
  density: UsersListDensity;
  onDensityChangeAction: (density: UsersListDensity) => void;
  columnVisibility: Record<UsersListColumnKey, boolean>;
  columnOptions: ReadonlyArray<{ key: Exclude<UsersListColumnKey, 'name'>; label: string }>;
  onToggleColumnAction: (key: Exclude<UsersListColumnKey, 'name'>) => void;
  onNavigateAction: (updates: Record<string, string | null | undefined>) => void;
};

export function UsersListToolbar<TRoleFilter extends string>({
  labels,
  densityLabels,
  query,
  defaultRoleKey,
  roleOptions,
  density,
  onDensityChangeAction,
  columnVisibility,
  columnOptions,
  onToggleColumnAction,
  onNavigateAction,
}: UsersListToolbarProps<TRoleFilter>) {
  const [searchValue, setSearchValue] = useState(query.search);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onNavigateAction({ search: searchValue.trim() || null, page: '1' });
  };

  const handleClearFilters = () => {
    setSearchValue('');
    onNavigateAction({ role: String(defaultRoleKey), search: null, page: '1' });
  };

  const hasActiveFilters = query.search.trim() !== '' || query.role !== defaultRoleKey;

  const densityOptions = useMemo(
    () =>
      [
        { key: 'comfortable', label: densityLabels.comfortable },
        { key: 'compact', label: densityLabels.compact },
      ] as const,
    [densityLabels],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Search className="size-3.5" />
          <span>{labels.searchLabel}</span>
        </div>
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
          key={query.search}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={labels.searchPlaceholder}
              className={`min-w-[180px] pl-10 pr-3 ${adminUsersTextInputClassName}`}
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="w-full shrink-0 sm:w-auto">
            {labels.applyButton}
          </Button>
        </form>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 rounded-lg border bg-card p-3">
          <div className="mb-2 flex justify-between gap-2 text-xs font-medium text-muted-foreground">
            <div className="flex gap-2">
              <Filter className="size-3.5" />
              <span>{labels.filtersLabel}</span>
            </div>
            <Button
              variant="ghost"
              type="button"
              disabled={!hasActiveFilters}
              onClick={handleClearFilters}
              className="h-auto min-w-auto p-0 text-xs text-destructive hover:bg-destructive/80 hover:text-destructive"
            >
              {labels.clearFilters}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {roleOptions.map(({ key, label }) => (
              <Button
                key={String(key)}
                type="button"
                size="sm"
                variant={query.role === key ? 'default' : 'outline'}
                onClick={() => onNavigateAction({ role: String(key), page: '1' })}
                className="h-8 flex-1"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            <span>{labels.displayLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-1 items-center gap-0.5 rounded-md border bg-muted/30 p-0.5">
              {densityOptions.map((option) => (
                <Button
                  key={option.key}
                  size="sm"
                  variant={density === option.key ? 'secondary' : 'ghost'}
                  className="h-7 flex-1 px-2.5 text-xs"
                  onClick={() => onDensityChangeAction(option.key)}
                  type="button"
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 flex-1 gap-1.5 text-xs">
                  <LayoutList className="size-3.5" />
                  {labels.columnsButton}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>{labels.columnsLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columnOptions.map(({ key, label }) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={columnVisibility[key]}
                    onCheckedChange={() => onToggleColumnAction(key)}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
