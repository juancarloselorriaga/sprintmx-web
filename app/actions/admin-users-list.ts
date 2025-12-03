'use server';

import { db } from '@/db';
import { roles, users, userRoles } from '@/db/schema';
import { withAdminUser } from '@/lib/auth/action-wrapper';
import {
  getUserRolesWithInternalFlag,
  type CanonicalRole,
  type PermissionSet,
} from '@/lib/auth/roles';
import { eq, inArray } from 'drizzle-orm';

const INTERNAL_ROLE_NAMES = ['admin', 'staff'];

export type AdminUserRow = {
  userId: string;
  email: string;
  name: string;
  canonicalRoles: CanonicalRole[];
  permissions: PermissionSet;
  createdAt: Date;
  isInternal: boolean;
};

export type ListInternalUsersResult =
  | { ok: true; users: AdminUserRow[] }
  | { ok: false; error: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'SERVER_ERROR' };

export const listInternalUsers = withAdminUser<ListInternalUsersResult>({
  unauthenticated: () => ({ ok: false, error: 'UNAUTHENTICATED' }),
  forbidden: () => ({ ok: false, error: 'FORBIDDEN' }),
})(async () => {
  try {
    const rows = await db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(userRoles, eq(userRoles.userId, users.id))
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(inArray(roles.name, INTERNAL_ROLE_NAMES));

    const uniqueUsers = new Map<string, (typeof rows)[number]>();

    for (const row of rows) {
      if (!uniqueUsers.has(row.userId)) {
        uniqueUsers.set(row.userId, row);
      }
    }

    const resolved = await Promise.all(
      Array.from(uniqueUsers.values()).map(async (row) => {
        const lookup = await getUserRolesWithInternalFlag(row.userId);

        if (!lookup.isInternal) {
          return null;
        }

        return {
          userId: row.userId,
          email: row.email,
          name: row.name,
          createdAt: row.createdAt,
          canonicalRoles: lookup.canonicalRoles,
          permissions: lookup.permissions,
          isInternal: lookup.isInternal,
        };
      })
    );

    const internalUsers = resolved.filter(Boolean) as AdminUserRow[];
    internalUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { ok: true, users: internalUsers };
  } catch (error) {
    console.error('[admin-users-list] Failed to list internal users', error);
    return { ok: false, error: 'SERVER_ERROR' };
  }
});
