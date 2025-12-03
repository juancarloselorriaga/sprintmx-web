import { listInternalUsers, type AdminUserRow } from '@/app/actions/admin-users-list';
import { AdminUsersClient } from '@/components/admin/users/admin-users-client';
import { getAuthContext } from '@/lib/auth/server';
import { LocalePageProps } from '@/types/next';
import { configPageLocale } from '@/utils/config-page-locale';
import { createLocalizedPageMetadata } from '@/utils/seo';
import type { Metadata } from 'next';

type SerializedAdminUserRow = Omit<AdminUserRow, 'createdAt'> & { createdAt: string };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;

  return createLocalizedPageMetadata(locale, '/admin/users', () => ({
    title: 'Admin users',
    description: 'Manage internal administrators and staff accounts.',
  }), { robots: { index: false, follow: false } });
}

export default async function AdminUsersPage({ params }: LocalePageProps) {
  await configPageLocale(params, { pathname: '/admin/users' });
  await getAuthContext();

  const result = await listInternalUsers();

  const initialUsers: SerializedAdminUserRow[] = result.ok
    ? result.users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      }))
    : [];

  const initialError = result.ok ? null : result.error;

  return (
    <AdminUsersClient initialUsers={initialUsers} initialError={initialError} />
  );
}
