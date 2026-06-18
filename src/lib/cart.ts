import {
  getLoginUrl,
  getSelectedCountrySlug,
  getStoredUser,
  getUserCountrySlug,
  isLoggedIn,
  normalizeCountrySlug,
  applyCountrySlug,
  type StoreCountrySlug,
} from '@/lib/userCountry';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000';

export function getUserEmail(): string | null {
  const user = getStoredUser();
  return user?.email ? String(user.email).trim().toLowerCase() : null;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('floriva_token');
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
  if (!isLoggedIn()) {
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

  const userEmail = getUserEmail();
  const token = getAuthToken();
  if (!userEmail || !token) {
    if (typeof window !== 'undefined') {
      window.location.href = getLoginUrl();
    }
    return { ok: false, message: 'Please log in to add items to cart.', requiresLogin: true };
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
    const res = await fetch(`${API_BASE}/api/addtocart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, userEmail, quantity }),
    });
    const data = await res.json().catch(() => ({}));
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
    return { ok: true, message: data?.message ?? 'Added to cart!' };
  } catch {
    return { ok: false, message: 'Network error. Please try again.' };
  }
}
