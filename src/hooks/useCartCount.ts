'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUserCartKey } from '@/lib/cart';
import {
  CART_CHANGED_EVENT,
  fetchCartItems,
  getCachedCartCount,
} from '@/lib/cartState';

export function useCartCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!getUserCartKey()) {
      setCount(0);
      return;
    }

    setCount(getCachedCartCount());

    try {
      const items = await fetchCartItems();
      const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
      setCount(total);
    } catch {
      /* keep cached count */
    }
  }, []);

  useEffect(() => {
    refresh();

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ count?: number }>).detail;
      if (typeof detail?.count === 'number') {
        setCount(detail.count);
        return;
      }
      refresh();
    };

    window.addEventListener(CART_CHANGED_EVENT, onChange);
    window.addEventListener('floriva-auth-changed', refresh);
    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, onChange);
      window.removeEventListener('floriva-auth-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  return count;
}
