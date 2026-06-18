export const STORAGE_KEY = 'floriva_selected_country';
export const DEFAULT_COUNTRY_SLUG = 'australia';
export const SUPPORTED_COUNTRY_SLUGS = ['india', 'australia'] as const;

export type StoreCountrySlug = (typeof SUPPORTED_COUNTRY_SLUGS)[number];

export interface StoreCountry {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface SelectedCountryData {
  country: StoreCountry;
  city: string;
  locked?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000';

export function normalizeCountrySlug(value?: string | null): StoreCountrySlug | null {
  const slug = String(value || '').trim().toLowerCase();
  return SUPPORTED_COUNTRY_SLUGS.includes(slug as StoreCountrySlug)
    ? (slug as StoreCountrySlug)
    : null;
}

export function capitalizeCountry(slug: string): string {
  if (!slug) return '';
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

const FLAG_MAP: Record<string, string> = {
  india: '🇮🇳',
  australia: '🇦🇺',
  usa: '🇺🇸',
  canada: '🇨🇦',
  uk: '🇬🇧',
  'united kingdom': '🇬🇧',
};

export function getFlag(name: string): string {
  return FLAG_MAP[name.toLowerCase()] ?? '🌐';
}

export function capitalize(str: string): string {
  return capitalizeCountry(str);
}

export function getStoredUser(): { email?: string; username?: string; countrySlug?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('floriva_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('floriva_token') && localStorage.getItem('floriva_user'));
}

export function getUserCountrySlug(): StoreCountrySlug | null {
  const user = getStoredUser();
  return normalizeCountrySlug(user?.countrySlug);
}

export function getSelectedCountrySlug(): StoreCountrySlug {
  if (typeof window === 'undefined') return DEFAULT_COUNTRY_SLUG;

  if (isLoggedIn()) {
    const locked = getUserCountrySlug();
    if (locked) return locked;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_COUNTRY_SLUG;
    const parsed = JSON.parse(saved);
    return normalizeCountrySlug(parsed?.country?.name) || DEFAULT_COUNTRY_SLUG;
  } catch {
    return DEFAULT_COUNTRY_SLUG;
  }
}

export function getSelectedCountryData(): SelectedCountryData | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export async function fetchStoreCountries(): Promise<StoreCountry[]> {
  try {
    const res = await fetch(`${API_BASE}/api/allCountries`);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch {
    return [];
  }
}

export async function detectCountryFromGeo(): Promise<{
  countrySlug: StoreCountrySlug;
  country: StoreCountry | null;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/geo/detect`);
    const json = await res.json();
    const slug = normalizeCountrySlug(json.countrySlug) || DEFAULT_COUNTRY_SLUG;
    if (json.country?._id) {
      return { countrySlug: slug, country: json.country };
    }
    const countries = await fetchStoreCountries();
    const match = countries.find((c) => normalizeCountrySlug(c.name) === slug);
    return { countrySlug: slug, country: match || null };
  } catch {
    return { countrySlug: DEFAULT_COUNTRY_SLUG, country: null };
  }
}

export function persistSelectedCountry(
  country: StoreCountry,
  city = '',
  locked = false,
) {
  const data: SelectedCountryData = { country, city, locked };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('floriva_country_changed'));
  return data;
}

export async function applyCountrySlug(
  countrySlug: StoreCountrySlug,
  locked = false,
): Promise<SelectedCountryData | null> {
  const countries = await fetchStoreCountries();
  const match = countries.find((c) => normalizeCountrySlug(c.name) === countrySlug);
  if (!match) return null;
  return persistSelectedCountry(match, '', locked);
}

export async function syncCountryForUser(user: { countrySlug?: string | null }) {
  const slug = normalizeCountrySlug(user?.countrySlug);
  if (!slug) return null;
  return applyCountrySlug(slug, true);
}

export async function initializeVisitorCountry() {
  if (isLoggedIn()) {
    const slug = getUserCountrySlug();
    if (slug) return applyCountrySlug(slug, true);
  }

  const existing = getSelectedCountryData();
  if (existing?.country?.name) {
    return existing;
  }

  const detected = await detectCountryFromGeo();
  if (detected.country) {
    return persistSelectedCountry(detected.country, '', isLoggedIn());
  }
  return null;
}

export function canAccessCountry(pathCountrySlug: string): boolean {
  const pathSlug = normalizeCountrySlug(pathCountrySlug);
  if (!pathSlug) return true;

  if (isLoggedIn()) {
    const userSlug = getUserCountrySlug() || getSelectedCountrySlug();
    return pathSlug === userSlug;
  }

  return true;
}

export function buildCountryRedirectPath(
  currentPath: string,
  targetSlug: StoreCountrySlug,
): string {
  if (currentPath.startsWith('/country/')) {
    const rest = currentPath.replace(/^\/country\/[^/]+/i, '');
    return `/country/${targetSlug}${rest || ''}`;
  }
  return `/country/${targetSlug}`;
}

export function getLoginUrl(redirectPath?: string): string {
  const redirect = redirectPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
  return `/login?redirect=${encodeURIComponent(redirect)}`;
}

export function categoryHref(categoryId: string, countrySlug?: string): string {
  const slug = countrySlug || getSelectedCountrySlug();
  return `/country/${slug}/category/${categoryId}`;
}
