import { MetadataRoute } from 'next';
import { siteUrl } from '@/config/url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/dashboard/',
        '/settings',
        '/settings/',
        '/profile',
        '/profile/',
        '/configuracion',
        '/configuracion/',
        '/perfil',
        '/perfil/',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
