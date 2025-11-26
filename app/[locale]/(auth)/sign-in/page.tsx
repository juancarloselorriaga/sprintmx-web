import { SignInForm } from '@/components/auth/sign-in-form';
import { Link } from '@/i18n/navigation';
import { LocalePageProps } from '@/types/next';
import { configPageLocale } from '@/utils/config-page-locale';
import { createLocalizedPageMetadata } from '@/utils/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  return createLocalizedPageMetadata(
    locale,
    '/sign-in',
    (messages) => messages.Pages?.SignIn?.metadata,
    { robots: { index: false, follow: false } }
  );
}

export default async function SignInPage({ params }: LocalePageProps) {
  await configPageLocale(params, { pathname: '/sign-in' });
  const t = await getTranslations('pages.signIn');
  const authT = await getTranslations('auth');

  return (
    <div className="space-y-6 rounded-lg border bg-card p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <SignInForm/>

      <p className="text-center text-sm text-muted-foreground">
        {authT('noAccount')}{' '}
        <Link className="font-semibold text-primary hover:underline" href="/sign-up">
          {authT('createAccount')}
        </Link>
      </p>
    </div>
  );
}
