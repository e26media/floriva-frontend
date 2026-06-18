'use client';

import { useEffect, useState } from 'react';
import { getUserCartKey } from '@/lib/cart';
import { CART_CHANGED_EVENT, isProductInCart, syncCartState } from '@/lib/cartState';

export function useProductInCart(productId?: string) {
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    if (!productId) {
      setInCart(false);
      return;
    }

    const sync = () => setInCart(isProductInCart(productId));
    sync();

    if (getUserCartKey()) {
      syncCartState().then(sync).catch(() => {});
    }

    window.addEventListener(CART_CHANGED_EVENT, sync);
    window.addEventListener('floriva-auth-changed', sync);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, sync);
      window.removeEventListener('floriva-auth-changed', sync);
    };
  }, [productId]);

  return inCart;
}
