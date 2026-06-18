import {
  getLoginUrl,
  getSelectedCountrySlug,
  getStoredUser,
  getUserCountrySlug,
  normalizeCountrySlug,
  applyCountrySlug,
  type StoreCountrySlug,
} from '@/lib/userCountry';
import { decodeJwtPayload, getApiBase, getAuthHeaders, getAuthToken, withAuthBody } from '@/lib/auth';
import { bumpCartCount, rememberProductInCart, syncCartState } from '@/lib/cartState';

export function getUserCartKey(): string | null {
  const user = getStoredUser();
  if (user?.email) return String(user.email).trim().toLowerCase();
  if (user?.phone) return String(user.phone).trim().toLowerCase();

  const token = getAuthToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const email = payload.email;
  if (typeof email === 'string' && email.trim()) {
    return email.trim().toLowerCase();
  }

  const phone = payload.phone;
  if (typeof phone === 'string' && phone.trim()) {
    return phone.trim().toLowerCase();
  }

  const id = payload.id || payload.userId || payload._id;
  if (id) return String(id).trim().toLowerCase();

  return null;
}

/** @deprecated use getUserCartKey */
export function getUserEmail(): string | null {
  return getUserCartKey();
}

export function isLoggedIn(): boolean {
  return Boolean(getAuthToken() && getUserCartKey());
}

export function getProductCountrySlug(product: unknown): StoreCountrySlug | null {
  if (!product || typeof product !== 'object') return null;
  const country = (product as { country?: { name?: string } | string | null }).country;
  if (!country) return null;
  if (typeof country === 'string') return normalizeCountrySlug(country);
  return normalizeCountrySlug(country?.name);
}

export type AddToCartResult = {
  ok: boolean;
  message: string;
  requiresLogin?: boolean;
  countryMismatch?: boolean;
  userCountry?: StoreCountrySlug | null;
  productCountry?: StoreCountrySlug | null;
};

export async function addProductToCart(
  productId: string,
  quantity = 1,
  product?: unknown,
): Promise<AddToCartResult> {
  const token = getAuthToken();
  const userKey = getUserCartKey();

  if (!token || !userKey) {
    const redirect = typeof window !== 'undefined' ? window.location.pathname : '/';
    if (typeof window !== 'undefined') {
      window.location.href = getLoginUrl(redirect);
    }
    return {
      ok: false,
      message: 'Please log in to add items to cart.',
      requiresLogin: true,
    };
  }

  const userCountry = getUserCountrySlug() || getSelectedCountrySlug();
  const productCountry = product ? getProductCountrySlug(product) : null;

  if (productCountry && productCountry !== userCountry) {
    await applyCountrySlug(userCountry, true);
    if (typeof window !== 'undefined') {
      window.location.href = `/country/${userCountry}`;
    }
    return {
      ok: false,
      message: `This product is only available in ${productCountry}. You are shopping from ${userCountry}.`,
      countryMismatch: true,
      userCountry,
      productCountry,
    };
  }

  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/addtocart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(withAuthBody({
        productId,
        userEmail: userKey,
        quantity,
      })),
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      localStorage.removeItem('floriva_token');
      localStorage.removeItem('floriva_user');
      window.dispatchEvent(new Event('floriva-auth-changed'));
      return {
        ok: false,
        message: data?.message ?? 'Session expired. Please log in again.',
        requiresLogin: true,
      };
    }

    if (!res.ok) {
      if (res.status === 403 && data?.userCountry) {
        await applyCountrySlug(data.userCountry, true);
        if (typeof window !== 'undefined') {
          window.location.href = `/country/${data.userCountry}`;
        }
      }
      return {
        ok: false,
        message: data?.message ?? `Failed (${res.status})`,
        countryMismatch: res.status === 403,
        userCountry: normalizeCountrySlug(data?.userCountry),
        productCountry: normalizeCountrySlug(data?.productCountry),
      };
    }
    rememberProductInCart(productId);
    bumpCartCount(quantity);
    syncCartState().catch(() => {});
    return { ok: true, message: data?.message ?? 'Added to cart!' };
  } catch {
    return { ok: false, message: 'Network error. Please try again.' };
  }
}
