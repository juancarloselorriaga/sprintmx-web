'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('LocaleSwitcher');

  const handleLocaleChange = (targetLocale: AppLocale) => {
    if (targetLocale === locale) return;
    router.replace(pathname, { locale: targetLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
        >
          <Languages className="h-[1.2rem] w-[1.2rem]"/>
          <span className="sr-only">{t('label')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((availableLocale) => (
          <DropdownMenuItem
            key={availableLocale}
            onClick={() => handleLocaleChange(availableLocale)}
            className={availableLocale === locale ? 'font-semibold' : ''}
          >
            {t('locale', { locale: availableLocale })}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
