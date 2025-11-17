// app/layout.tsx
import { siteUrl } from '@/config/url';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SprintMX',
  description:
    'SprintMX es la plataforma todo-en-uno para crear, administrar y promocionar carreras y eventos deportivos en México.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
    languages: {
      'es-MX': siteUrl,
      'es': siteUrl,
      'en': `${siteUrl}/en`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: siteUrl,
    siteName: 'SprintMX',
    title: 'SprintMX',
    description:
      'Plataforma todo-en-uno para organizar y promocionar carreras en México: inscripciones, pagos, resultados, rankings y más.',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'SprintMX - Plataforma para carreras en México',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SprintMX',
    description:
      'Plataforma todo-en-uno para organizar y promocionar carreras en México.',
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
