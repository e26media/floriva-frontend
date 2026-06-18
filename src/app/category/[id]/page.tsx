'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSelectedCountrySlug } from '@/lib/siteCountry';

export default function CategoryRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const urlId = (params?.id as string) ?? '';

  useEffect(() => {
    if (!urlId) return;
    const country = getSelectedCountrySlug();
    router.replace(`/country/${country}/category/${urlId}`);
  }, [urlId, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[#f7f3ee] pt-20">
      <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#e6ddd3] border-t-[#b5623b]" />
      <p className="text-sm text-[#7a6b5e]">Loading category...</p>
    </div>
  );
}
