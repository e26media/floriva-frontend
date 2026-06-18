'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  buildCountryRedirectPath,
  canAccessCountry,
  getSelectedCountrySlug,
  getUserCountrySlug,
  initializeVisitorCountry,
  isLoggedIn,
  normalizeCountrySlug,
} from '@/lib/userCountry';

export default function CountryAccessProvider() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    initializeVisitorCountry().catch(() => {});
  }, []);

  useEffect(() => {
    const onAuthChanged = () => {
      initializeVisitorCountry()
        .then((data) => {
          if (!data?.country?.name) return;
          const slug = normalizeCountrySlug(data.country.name);
          if (!slug) return;
          if (pathname?.startsWith('/country/')) {
            const current = pathname.match(/^\/country\/([^/]+)/i)?.[1];
            if (current && !canAccessCountry(current)) {
              router.replace(buildCountryRedirectPath(pathname, slug));
            }
          }
        })
        .catch(() => {});
    };

    window.addEventListener('floriva-auth-changed', onAuthChanged);
    window.addEventListener('floriva_country_changed', onAuthChanged);
    return () => {
      window.removeEventListener('floriva-auth-changed', onAuthChanged);
      window.removeEventListener('floriva_country_changed', onAuthChanged);
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!pathname?.startsWith('/country/')) return;
    const current = pathname.match(/^\/country\/([^/]+)/i)?.[1];
    if (!current) return;

    if (!canAccessCountry(current)) {
      const target = getUserCountrySlug() || getSelectedCountrySlug();
      router.replace(buildCountryRedirectPath(pathname, target));
    }
  }, [pathname, router]);

  return null;
}
