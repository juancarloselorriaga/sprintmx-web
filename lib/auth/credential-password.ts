'use server';

import { db } from '@/db';
import { accounts } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { verifyPassword } from 'better-auth/crypto';

export type CredentialPasswordCheckResult =
  | { ok: true }
  | { ok: false; error: 'NO_PASSWORD' | 'INVALID_PASSWORD' };

/**
 * Verifies the current credential password for a user against the hashed password
 * stored in Better Auth's `accounts` table (providerId = "credential").
 */
export async function verifyUserCredentialPassword(
  userId: string,
  password: string,
): Promise<CredentialPasswordCheckResult> {
  const rows = await db
    .select({ passwordHash: accounts.password })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'credential'), isNull(accounts.deletedAt)));

  const account = rows[0];
  const passwordHash = account?.passwordHash ?? null;

  if (!passwordHash) {
    return { ok: false, error: 'NO_PASSWORD' };
  }

  const isValid = await verifyPassword({ hash: passwordHash, password });

  if (!isValid) {
    return { ok: false, error: 'INVALID_PASSWORD' };
  }

  return { ok: true };
}

