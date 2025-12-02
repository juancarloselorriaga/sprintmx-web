import ProtectedLayoutWrapper from '@/components/layout/protected-layout-wrapper';
import { getPathname } from '@/i18n/navigation';
import { AppLocale } from '@/i18n/routing';
import { getAuthContext } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

type ProtectedLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: AppLocale }>;
};

export default async function ProtectedLayout({
  children,
  params,
}: ProtectedLayoutProps) {
  const { locale } = await params;
  const authContext = await getAuthContext();

  if (!authContext.session) {
    redirect(getPathname({ href: '/sign-in', locale }));
  }

  return <ProtectedLayoutWrapper>{children}</ProtectedLayoutWrapper>;
}
