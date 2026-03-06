'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// simple redirect for users hitting /product without id
export default function ProductIndexRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/allproduct');
  }, [router]);
  return null;
}
