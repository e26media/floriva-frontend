export const DEFAULT_COUNTRY_SLUG = 'australia';

export function getSelectedCountrySlug(): string {
  if (typeof window === 'undefined') return DEFAULT_COUNTRY_SLUG;

  try {
    const saved = localStorage.getItem('floriva_selected_country');
    if (!saved) return DEFAULT_COUNTRY_SLUG;

    const parsed = JSON.parse(saved);
    const name = parsed?.country?.name?.toLowerCase?.().trim();
    return name || DEFAULT_COUNTRY_SLUG;
  } catch {
    return DEFAULT_COUNTRY_SLUG;
  }
}

export function categoryHref(categoryId: string, countrySlug?: string): string {
  const slug = countrySlug || getSelectedCountrySlug();
  return `/country/${slug}/category/${categoryId}`;
}
