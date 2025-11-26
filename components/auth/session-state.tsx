'use client';

import { useSession } from '@/lib/auth/client';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

type SessionStateProps = {
  initialEmail?: string | null;
};

export function SessionState({ initialEmail }: SessionStateProps) {
  const t = useTranslations('pages.home.session');
  const { data, error, isPending } = useSession();

  const email = data?.user.email ?? initialEmail ?? null;

  let content = t('clientSignedOut');

  if (isPending) {
    content = t('pending');
  } else if (email) {
    content = t('clientSignedIn', { email });
  } else if (error) {
    content = t('clientSignedOut');
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('clientTitle')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('clientDescription')}
          </p>
        </div>
        {isPending ? <Loader2 className="size-5 animate-spin text-primary"/> : null}
      </div>

      <p className="mt-4 text-muted-foreground">
        {content}
      </p>
    </div>
  );
}
