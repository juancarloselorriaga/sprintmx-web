import { db } from '@/db';
import { roles, userRoles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const INTERNAL_ROLE_NAMES = ['admin'] as const;

export type RoleLookupResult = {
  roles: string[];
  isInternal: boolean;
};

export function deriveIsInternal(roleNames: string[]) {
  const normalized = roleNames.map((role) => role.toLowerCase());
  return normalized.some((role) => INTERNAL_ROLE_NAMES.includes(role as (typeof INTERNAL_ROLE_NAMES)[number]));
}

export async function getUserRolesWithInternalFlag(userId: string): Promise<RoleLookupResult> {
  const rows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = Array.from(new Set(rows.map((row) => row.roleName)));

  return {
    roles: roleNames,
    isInternal: deriveIsInternal(roleNames),
  };
}
