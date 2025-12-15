import { UsersListTable, type UsersListRow } from '@/components/admin/users/users-list-table';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

jest.mock('@/components/ui/dropdown-menu', () => {
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuSeparator: () => <div />,
    DropdownMenuItem: ({
      children,
      onSelect,
      ...props
    }: {
      children: React.ReactNode;
      onSelect?: (event: { preventDefault: () => void }) => void;
    }) => (
      <button
        type="button"
        onClick={() => onSelect?.({ preventDefault: () => undefined })}
        {...props}
      >
        {children}
      </button>
    ),
    DropdownMenuCheckboxItem: ({
      children,
      onCheckedChange,
      ...props
    }: {
      children: React.ReactNode;
      onCheckedChange?: () => void;
    }) => (
      <button type="button" onClick={() => onCheckedChange?.()} {...props}>
        {children}
      </button>
    ),
  };
});

const deleteInternalUserMock = jest.fn();
jest.mock('@/app/actions/admin-users-delete', () => ({
  deleteInternalUser: (...args: unknown[]) => deleteInternalUserMock(...args),
}));

const toastErrorMock = jest.fn();
const toastSuccessMock = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({
    dateTime: () => 'formatted-date',
  }),
}));

jest.mock('next-intl/routing', () => ({
  defineRouting: jest.fn(() => ({
    locales: ['es', 'en'] as const,
    defaultLocale: 'es',
    localePrefix: 'as-needed',
    pathnames: {},
  })),
}));

const routerPushMock = jest.fn();
const routerReplaceMock = jest.fn();
const routerRefreshMock = jest.fn();

jest.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    ...props
  }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a {...props}>{children}</a>
  ),
  useRouter: () => ({
    push: routerPushMock,
    replace: routerReplaceMock,
    refresh: routerRefreshMock,
  }),
  usePathname: () => '/admin/users',
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}));

describe('UsersListTable', () => {
  beforeEach(() => {
    routerPushMock.mockReset();
    routerReplaceMock.mockReset();
    routerRefreshMock.mockReset();
    deleteInternalUserMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    window.localStorage.clear();
  });

  const baseProps = {
    query: {
      page: 1,
      pageSize: 10,
      role: 'all' as const,
      search: '',
      sortBy: 'createdAt' as const,
      sortDir: 'desc' as const,
    },
    paginationMeta: {
      page: 1,
      pageSize: 10,
      total: 0,
      pageCount: 0,
    },
    densityStorageKey: 'test.tableDensity',
    labels: {
      toolbar: {
        searchLabel: 'Search',
        filtersLabel: 'Filters',
        searchPlaceholder: 'Search by name or email',
        applyButton: 'Apply',
        clearFilters: 'Clear filters',
        displayLabel: 'Display',
        columnsButton: 'Columns',
        columnsLabel: 'Show columns',
      },
      density: {
        comfortable: 'Comfortable',
        compact: 'Compact',
      },
      table: {
        columns: {
          name: 'Name',
          role: 'Role',
          created: 'Created',
          actions: 'Actions',
        },
        noMatches: {
          title: 'No matches',
          description: 'Try adjusting your search.',
          clearButton: 'Clear filters',
        },
      },
    },
    roleOptions: [
      { key: 'all' as const, label: 'All' },
      { key: 'admin' as const, label: 'Admin' },
    ],
    paginationTranslationNamespace: 'pages.adminUsers.pagination' as const,
    renderActionsAction: () => <div>Row actions</div>,
  };

  it('renders empty state for 0 users and can clear filters', () => {
    render(<UsersListTable users={[]} {...baseProps} />);

    expect(screen.getByText('No matches')).toBeInTheDocument();
    const emptyStateCell = screen.getByText('No matches').closest('td');
    expect(emptyStateCell).not.toBeNull();
    fireEvent.click(within(emptyStateCell as HTMLElement).getByRole('button', { name: 'Clear filters' }));

    expect(routerPushMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/admin/users',
        query: expect.objectContaining({ page: '1' }),
      }),
      expect.anything(),
    );
  });

  it('renders rows and does not render a permissions column', () => {
    const users: UsersListRow[] = [
      {
        userId: 'u1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        canonicalRoles: ['internal.admin'],
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ];

    render(
      <UsersListTable
        {...baseProps}
        users={users}
        paginationMeta={{ ...baseProps.paginationMeta, total: 1, pageCount: 1 }}
        getRoleBadgeLabelAction={(role) => (role === 'internal.admin' ? 'Admin' : role)}
        renderActionsAction={() => <div>Row actions</div>}
      />,
    );

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    const row = screen.getByText('Ada Lovelace').closest('tr');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('Admin')).toBeInTheDocument();
    expect(screen.getAllByText('Row actions')).toHaveLength(1);

    expect(screen.queryByText(/permissions/i)).not.toBeInTheDocument();
  });

  it('navigates on sort when clicking sortable headers', () => {
    const users: UsersListRow[] = [
      {
        userId: 'u1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        canonicalRoles: ['internal.admin'],
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ];

    render(
      <UsersListTable
        {...baseProps}
        users={users}
        paginationMeta={{ ...baseProps.paginationMeta, total: 1, pageCount: 1 }}
        renderActionsAction={() => <div>Row actions</div>}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /name/i }));
    expect(routerPushMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/admin/users',
        query: expect.objectContaining({ sort: 'name', dir: 'asc', page: '1' }),
      }),
      expect.anything(),
    );
  });

  it('keeps the delete dialog open and does not toggle table loading on INVALID_PASSWORD', async () => {
    const { UsersTableActions } = await import('@/components/admin/users/users-table-actions');

    deleteInternalUserMock.mockResolvedValue({ ok: false, error: 'INVALID_PASSWORD' });

    const users: UsersListRow[] = [
      {
        userId: 'u1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        canonicalRoles: ['internal.admin'],
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ];

    function Wrapper() {
      const [isLoading, setIsLoading] = React.useState(false);
      return (
        <UsersListTable
          {...baseProps}
          users={users}
          isLoading={isLoading}
          onLoadingChangeAction={setIsLoading}
          paginationMeta={{ ...baseProps.paginationMeta, total: 1, pageCount: 1 }}
          renderActionsAction={({ user, currentUserId, onDeletedAction }) => (
            <UsersTableActions
              userId={user.userId}
              userName={user.name}
              userEmail={user.email}
              currentUserId={currentUserId}
              onDeletedAction={onDeletedAction}
            />
          )}
        />
      );
    }

    render(<Wrapper />);

    const row = screen.getByText('Ada Lovelace').closest('tr');
    expect(row).not.toBeNull();

    const actionsButton = within(row as HTMLElement).getAllByRole('button')[0];
    fireEvent.click(actionsButton);
    fireEvent.click(screen.getByText('deleteUser'));

    expect(await screen.findByText('title')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'buttons.delete' }));

    expect(await screen.findAllByText('errors.invalidPassword')).toHaveLength(2);
    const table = screen.getByRole('table', { hidden: true });
    expect(within(table).getByText('Ada Lovelace')).toBeInTheDocument();
    expect(toastErrorMock).toHaveBeenCalled();
  });
});
