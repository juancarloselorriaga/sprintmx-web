import { siteUrl } from '@/config/url';
import type { Metadata } from 'next';

/**
 * Generates alternate language metadata for SEO
 * @param locale - The current locale (es or en)
 */
export function generateAlternateMetadata(locale: string): Metadata {
  const isSpanish = locale === 'es';
  const localeForOG = isSpanish ? 'es_MX' : 'en_US';
  const localePrefix = isSpanish ? '' : '/en';

  return {
    title: 'SprintMX',
    description: isSpanish
      ? 'SprintMX es la plataforma todo-en-uno para crear, administrar y promocionar carreras y eventos deportivos en México.'
      : 'SprintMX is the all-in-one platform to create, manage, and promote races and sporting events in Mexico.',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `${siteUrl}${localePrefix}`,
      languages: {
        'es-MX': siteUrl,
        es: siteUrl,
        en: `${siteUrl}/en`,
      },
    },
    openGraph: {
      type: 'website',
      locale: localeForOG,
      url: `${siteUrl}${localePrefix}`,
      siteName: 'SprintMX',
      title: 'SprintMX',
      description: isSpanish
        ? 'Plataforma todo-en-uno para organizar y promocionar carreras en México: inscripciones, pagos, resultados, rankings y más.'
        : 'All-in-one platform to organize and promote races in Mexico: registrations, payments, results, rankings and more.',
      images: [
        {
          url: `${siteUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: isSpanish
            ? 'SprintMX - Plataforma para carreras en México'
            : 'SprintMX - Platform for races in Mexico',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'SprintMX',
      description: isSpanish
        ? 'Plataforma todo-en-uno para organizar y promocionar carreras en México.'
        : 'All-in-one platform to organize and promote races in Mexico.',
      images: [`${siteUrl}/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    other: {
      'application-name': 'SprintMX',
      'apple-mobile-web-app-title': 'SprintMX',
    },
  };
}

// Legacy export for backward compatibility (defaults to Spanish)
export const metadata: Metadata = generateAlternateMetadata('es');
