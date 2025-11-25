import { AppLocale } from '@/i18n/routing';
import { type Messages } from '@/i18n/types';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import React from 'react';

type IntlProviderProps = {
  locale: AppLocale;
  messages: Messages;
  children: React.ReactNode;
};

export async function IntlProvider({
  locale,
  messages,
  children,
}: IntlProviderProps) {
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
