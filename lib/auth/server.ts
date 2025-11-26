import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { cache } from 'react';

export const getCurrentUser = cache(async () => {
  'use cache: private';
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
});

export const getSession = cache(async () => {
  'use cache: private';
  return await auth.api.getSession({
    headers: await headers(),
  });
});
