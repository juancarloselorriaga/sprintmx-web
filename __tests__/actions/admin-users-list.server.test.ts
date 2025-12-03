import { listInternalUsers } from '@/app/actions/admin-users-list';
import type { PermissionSet } from '@/lib/auth/roles';

type MockAdminContext = {
  user: { id: string };
};

const mockRequireAdmin = jest.fn<Promise<MockAdminContext>, unknown[]>();
const mockGetUserRolesWithInternalFlag = jest.fn<
  Promise<{ canonicalRoles: string[]; permissions: PermissionSet; isInternal: boolean }>,
  unknown[]
>();

type MockDbModule = {
  db: { select: jest.Mock };
  __pushSelect: (rows: Array<{ userId: string; email: string; name: string; createdAt: Date }>) => void;
  __reset: () => void;
};

jest.mock('@/lib/auth/guards', () => ({
  requireAdminUser: (...args: unknown[]) => mockRequireAdmin(...args),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRolesWithInternalFlag: (...args: unknown[]) => mockGetUserRolesWithInternalFlag(...args),
}));

jest.mock('drizzle-orm', () => ({
  eq: (...args: unknown[]) => ({ type: 'eq', args }),
  inArray: (...args: unknown[]) => ({ type: 'inArray', args }),
}));

jest.mock('@/db', () => {
  const state = {
    selectQueue: [] as ReturnType<typeof buildSelect>[],
  };

  function buildSelect(rows: unknown[]) {
    const where = jest.fn(async () => rows);
    const innerJoinSecond = jest.fn(() => ({ where }));
    const innerJoinFirst = jest.fn(() => ({ innerJoin: innerJoinSecond, where }));
    const from = jest.fn(() => ({ innerJoin: innerJoinFirst, where }));
    return { from, innerJoin: innerJoinFirst, where };
  }

  const __pushSelect = (rows: unknown[]) => {
    state.selectQueue.push(buildSelect(rows));
  };

  const select = jest.fn(() => {
    const next = state.selectQueue.shift();
    if (!next) throw new Error('Unexpected select call');
    return next;
  });

  const __reset = () => {
    state.selectQueue = [];
    select.mockClear();
  };

  return {
    db: {
      select,
    },
    __pushSelect,
    __reset,
  };
});

const { __pushSelect, __reset, db } = require('@/db') as MockDbModule;

describe('listInternalUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockReset();
    mockGetUserRolesWithInternalFlag.mockReset();
    __reset();
  });

  it('returns UNAUTHENTICATED when the admin guard rejects', async () => {
    mockRequireAdmin.mockRejectedValueOnce({ code: 'UNAUTHENTICATED' });

    const result = await listInternalUsers();

    expect(result).toEqual({ ok: false, error: 'UNAUTHENTICATED' });
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns FORBIDDEN when the admin guard blocks access', async () => {
    mockRequireAdmin.mockRejectedValueOnce({ code: 'FORBIDDEN' });

    const result = await listInternalUsers();

    expect(result).toEqual({ ok: false, error: 'FORBIDDEN' });
    expect(db.select).not.toHaveBeenCalled();
  });

  it('lists internal users with canonical roles and permissions', async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin-1' } });
    const adminCreatedAt = new Date('2024-02-01T12:00:00Z');
    const staffCreatedAt = new Date('2024-01-15T09:30:00Z');

    __pushSelect([
      {
        userId: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        createdAt: adminCreatedAt,
      },
      {
        userId: 'user-2',
        email: 'staff@example.com',
        name: 'Staff User',
        createdAt: staffCreatedAt,
      },
    ]);

    const adminPermissions: PermissionSet = {
      canAccessAdminArea: true,
      canAccessUserArea: false,
      canManageUsers: true,
      canManageEvents: true,
      canViewStaffTools: true,
      canViewOrganizersDashboard: false,
      canViewAthleteDashboard: false,
    };
    const staffPermissions: PermissionSet = {
      ...adminPermissions,
      canManageUsers: false,
    };

    mockGetUserRolesWithInternalFlag.mockResolvedValueOnce({
      canonicalRoles: ['internal.admin'],
      permissions: adminPermissions,
      isInternal: true,
    });

    mockGetUserRolesWithInternalFlag.mockResolvedValueOnce({
      canonicalRoles: ['internal.staff'],
      permissions: staffPermissions,
      isInternal: true,
    });

    const result = await listInternalUsers();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toEqual(
        expect.objectContaining({
          userId: 'user-1',
          email: 'admin@example.com',
          canonicalRoles: ['internal.admin'],
          permissions: adminPermissions,
          createdAt: adminCreatedAt,
          isInternal: true,
        })
      );
      expect(result.users[1]).toEqual(
        expect.objectContaining({
          userId: 'user-2',
          canonicalRoles: ['internal.staff'],
          permissions: staffPermissions,
          createdAt: staffCreatedAt,
          isInternal: true,
        })
      );
    }

    expect(mockGetUserRolesWithInternalFlag).toHaveBeenCalledTimes(2);
  });

  it('filters out users that are not internal after role resolution', async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin-1' } });
    const createdAt = new Date('2024-03-10T10:00:00Z');

    __pushSelect([
      {
        userId: 'user-1',
        email: 'maybe-internal@example.com',
        name: 'Maybe Internal',
        createdAt,
      },
      {
        userId: 'user-2',
        email: 'not-internal@example.com',
        name: 'Not Internal',
        createdAt,
      },
    ]);

    const internalPermissions: PermissionSet = {
      canAccessAdminArea: true,
      canAccessUserArea: false,
      canManageUsers: true,
      canManageEvents: true,
      canViewStaffTools: true,
      canViewOrganizersDashboard: false,
      canViewAthleteDashboard: false,
    };

    mockGetUserRolesWithInternalFlag.mockResolvedValueOnce({
      canonicalRoles: ['internal.admin'],
      permissions: internalPermissions,
      isInternal: true,
    });
    mockGetUserRolesWithInternalFlag.mockResolvedValueOnce({
      canonicalRoles: ['external.organizer'],
      permissions: {
        canAccessAdminArea: false,
        canAccessUserArea: true,
        canManageUsers: false,
        canManageEvents: true,
        canViewStaffTools: false,
        canViewOrganizersDashboard: true,
        canViewAthleteDashboard: false,
      },
      isInternal: false,
    });

    const result = await listInternalUsers();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.users).toHaveLength(1);
      expect(result.users[0].userId).toBe('user-1');
    }
  });

  it('returns SERVER_ERROR when the query fails', async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin-1' } });
    db.select.mockImplementationOnce(() => {
      throw new Error('db failure');
    });

    const result = await listInternalUsers();

    expect(result).toEqual({ ok: false, error: 'SERVER_ERROR' });
  });
});
