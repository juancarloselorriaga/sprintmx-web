'use client';

import { useTranslations } from 'next-intl';

export type UsersListLabels = {
  toolbar: {
    searchLabel: string;
    filtersLabel: string;
    searchPlaceholder: string;
    applyButton: string;
    clearFilters: string;
    displayLabel: string;
    columnsButton: string;
    columnsLabel: string;
  };
  table: {
    columns: {
      name: string;
      role: string;
      created: string;
      actions: string;
    };
    emptyNoMatches: {
      title: string;
      description: string;
      clearButton: string;
    };
    density: {
      comfortable: string;
      compact: string;
    };
  };
  paginationNamespace: 'pages.adminUsers.pagination' | 'pages.selfSignupUsers.pagination';
};

export function useUsersListLabels(config: {
  pageNamespace: 'pages.adminUsers' | 'pages.selfSignupUsers';
  roleColumnKey: 'internalRole' | 'role';
}): UsersListLabels {
  const tToolbar = useTranslations(`${config.pageNamespace}.toolbar`);
  const tTable = useTranslations(`${config.pageNamespace}.table`);

  return {
    toolbar: {
      searchLabel: tToolbar('searchLabel'),
      filtersLabel: tToolbar('filtersLabel'),
      searchPlaceholder: tToolbar('searchPlaceholder'),
      applyButton: tToolbar('applyButton'),
      clearFilters: tToolbar('clearFilters'),
      displayLabel: tToolbar('displayLabel'),
      columnsButton: tToolbar('columnsButton'),
      columnsLabel: tToolbar('columnsLabel'),
    },
    table: {
      columns: {
        name: tTable('columns.name'),
        role: tTable(`columns.${config.roleColumnKey}`),
        created: tTable('columns.created'),
        actions: tTable('columns.actions'),
      },
      emptyNoMatches: {
        title: tTable('emptyState.noMatches.title'),
        description: tTable('emptyState.noMatches.description'),
        clearButton: tTable('emptyState.noMatches.clearButton'),
      },
      density: {
        comfortable: tTable('density.comfortable'),
        compact: tTable('density.compact'),
      },
    },
    paginationNamespace:
      config.pageNamespace === 'pages.adminUsers'
        ? 'pages.adminUsers.pagination'
        : 'pages.selfSignupUsers.pagination',
  };
}

