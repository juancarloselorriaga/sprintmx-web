import { auth } from '@/lib/auth';
import { resolveUserContext, EMPTY_PROFILE_STATUS } from '@/lib/auth/user-context';
import type { ProfileStatus } from '@/lib/profiles';
import { headers } from 'next/headers';
import { cache } from 'react';
import type { Session } from './types';

export type AuthContext = {
  session: Session | null;
  user: Session['user'] | null;
  roles: string[];
  isInternal: boolean;
  profileStatus: ProfileStatus;
};

export const getSession = cache(async () => {
  'use cache: private';
  return await auth.api.getSession({
    headers: await headers(),
  });
});

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  'use cache: private';
  const session = await getSession();

  if (!session?.user) {
    return {
      session: null,
      user: null,
      roles: [],
      isInternal: false,
      profileStatus: EMPTY_PROFILE_STATUS,
    };
  }

  const projectedProfileStatus =
    (session.user as { profileStatus?: ProfileStatus | undefined }).profileStatus ?? null;
  const projectedRoles = (session as { roles?: string[] }).roles ?? [];
  const projectedIsInternal =
    (session as { isInternal?: boolean }).isInternal ??
    (session.user as { isInternal?: boolean }).isInternal ??
    false;

  if (projectedProfileStatus) {
    return {
      session,
      user: session.user,
      roles: projectedRoles,
      isInternal: projectedIsInternal,
      profileStatus: projectedProfileStatus,
    };
  }

  const resolved = await resolveUserContext(session.user);

  return {
    session,
    user: session.user,
    ...resolved,
  };
});

export const getCurrentUser = cache(async () => {
  'use cache: private';
  const context = await getAuthContext();
  return context.user;
});
