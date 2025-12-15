'use server';

import { auth } from '@/lib/auth';
import { withAuthenticatedUser } from '@/lib/auth/action-wrapper';
import { verifyUserCredentialPassword } from '@/lib/auth/credential-password';
import { deleteUser } from '@/lib/users/delete-user';
import { headers } from 'next/headers';
import { z } from 'zod';

const deleteOwnAccountSchema = z.object({
  password: z.string().min(1),
});

export type DeleteOwnAccountResult =
  | { ok: true }
  | {
      ok: false;
      error: 'UNAUTHENTICATED' | 'NO_PASSWORD' | 'INVALID_PASSWORD' | 'SERVER_ERROR';
    };

export const deleteOwnAccount = withAuthenticatedUser<DeleteOwnAccountResult>({
  unauthenticated: () => ({ ok: false, error: 'UNAUTHENTICATED' }),
})(async ({ user }, input: unknown) => {
  const parsed = deleteOwnAccountSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: 'SERVER_ERROR' };
  }

  const { password } = parsed.data;

  try {
    const passwordCheck = await verifyUserCredentialPassword(user.id, password);
    if (!passwordCheck.ok) {
      return { ok: false, error: passwordCheck.error };
    }

    const result = await deleteUser({ targetUserId: user.id, deletedByUserId: user.id });
    if (!result.ok && result.error !== 'NOT_FOUND') {
      return { ok: false, error: 'SERVER_ERROR' };
    }

    try {
      await auth.api.signOut({ headers: await headers() });
    } catch (error) {
      console.warn('[account-delete] Sign out failed after deletion', error);
    }

    return { ok: true };
  } catch (error) {
    console.error('[account-delete] Failed to delete own account', error);
    return { ok: false, error: 'SERVER_ERROR' };
  }
});
