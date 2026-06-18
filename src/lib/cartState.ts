import { getApiBase, getAuthHeaders } from '@/lib/auth';
import { getUserCartKey } from '@/lib/cart';
import { getSelectedCountrySlug } from '@/lib/userCountry';

export const CART_CHANGED_EVENT = 'floriva-cart-changed';
const CART_PRODUCTS_KEY = 'floriva_cart_product_ids';
const CART_COUNT_KEY = 'floriva_cart_count';

export type CartLineItem = {
  _id: string;
  quantity: number;
  productId?: { _id?: string } | string | null;
};

export function getCartHref(countrySlug?: string | null): string {
  const slug = (countrySlug || getSelectedCountrySlug() || 'india').toLowerCase();
  return `/country/${slug}/cart`;
}

export function getCachedCartCount(): number {
  if (typeof window === 'undefined') return 0;
  const raw = sessionStorage.getItem(CART_COUNT_KEY);
  return raw ? Math.max(0, Number(raw) || 0) : 0;
}

export function notifyCartChanged(count?: number) {
  if (typeof window === 'undefined') return;
  if (typeof count === 'number') {
    sessionStorage.setItem(CART_COUNT_KEY, String(count));
  }
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail: { count } }));
}

export function rememberProductInCart(productId: string) {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const ids = new Set<string>(JSON.parse(localStorage.getItem(CART_PRODUCTS_KEY) || '[]'));
    ids.add(productId);
    localStorage.setItem(CART_PRODUCTS_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function isProductInCart(productId: string): boolean {
  if (typeof window === 'undefined' || !productId) return false;
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(CART_PRODUCTS_KEY) || '[]');
    return ids.includes(productId);
  } catch {
    return false;
  }
}

export async function fetchCartItems(): Promise<CartLineItem[]> {
  const key = getUserCartKey();
  if (!key) return [];

  const res = await fetch(`${getApiBase()}/api/view/${encodeURIComponent(key)}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: CartLineItem[] };
  if (!res.ok || !json.success || !Array.isArray(json.data)) return [];
  return json.data;
}

export async function syncCartState(): Promise<number> {
  const items = await fetchCartItems();
  const count = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const productIds = items
    .map((item) => {
      const product = item.productId;
      if (typeof product === 'string') return product;
      return product?._id ? String(product._id) : '';
    })
    .filter(Boolean);

  if (typeof window !== 'undefined') {
    localStorage.setItem(CART_PRODUCTS_KEY, JSON.stringify(productIds));
    sessionStorage.setItem(CART_COUNT_KEY, String(count));
  }

  notifyCartChanged(count);
  return count;
}

export function bumpCartCount(delta: number) {
  const next = Math.max(0, getCachedCartCount() + delta);
  notifyCartChanged(next);
}
