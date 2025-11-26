import ProtectedLayoutWrapper from '@/components/layout/protected-layout-wrapper';
import { getPathname } from '@/i18n/navigation';
import { AppLocale } from '@/i18n/routing';
import { getSession } from '@/lib/auth/server';
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
  const session = await getSession();

  if (!session) {
    redirect(getPathname({ href: '/sign-in', locale }));
  }

  return <ProtectedLayoutWrapper>{children}</ProtectedLayoutWrapper>;
}
