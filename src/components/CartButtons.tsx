'use client'

import { useState, useEffect } from 'react'
import ButtonPrimary from '@/shared/Button/ButtonPrimary'
import ButtonSecondary from '@/shared/Button/ButtonSecondary'

export default function CartButtons() {
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('floriva_selected_country');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.country?.name) {
            setTimeout(() => {
              setCountry(parsed.country.name.toLowerCase());
            }, 0);
          }
        } catch (e) {}
      }
    }
  }, []);

  const cartHref = country ? `/country/${country}/cart` : '/cart';
  const checkoutHref = country ? `/checkout?country=${country}` : '/checkout';

  return (
    <>
      <ButtonSecondary href={cartHref}>View cart</ButtonSecondary>
      <ButtonPrimary href={checkoutHref}>Check out</ButtonPrimary>
    </>
  );
}
