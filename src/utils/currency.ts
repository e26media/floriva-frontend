export interface CurrencyInfo {
  symbol: string
  code: string
  locale: string
  position: 'before' | 'after'
  flag: string
}

export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  india: { symbol: '₹', code: 'INR', locale: 'en-IN', position: 'before', flag: '🇮🇳' },
  in: { symbol: '₹', code: 'INR', locale: 'en-IN', position: 'before', flag: '🇮🇳' },
  usa: { symbol: '$', code: 'USD', locale: 'en-US', position: 'before', flag: '🇺🇸' },
  us: { symbol: '$', code: 'USD', locale: 'en-US', position: 'before', flag: '🇺🇸' },
  'united-states': { symbol: '$', code: 'USD', locale: 'en-US', position: 'before', flag: '🇺🇸' },
  'united states': { symbol: '$', code: 'USD', locale: 'en-US', position: 'before', flag: '🇺🇸' },
  uk: { symbol: '£', code: 'GBP', locale: 'en-GB', position: 'before', flag: '🇬🇧' },
  'united-kingdom': { symbol: '£', code: 'GBP', locale: 'en-GB', position: 'before', flag: '🇬🇧' },
  'united kingdom': { symbol: '£', code: 'GBP', locale: 'en-GB', position: 'before', flag: '🇬🇧' },
  gb: { symbol: '£', code: 'GBP', locale: 'en-GB', position: 'before', flag: '🇬🇧' },
  europe: { symbol: '€', code: 'EUR', locale: 'de-DE', position: 'before', flag: '🇪🇺' },
  eu: { symbol: '€', code: 'EUR', locale: 'de-DE', position: 'before', flag: '🇪🇺' },
  germany: { symbol: '€', code: 'EUR', locale: 'de-DE', position: 'before', flag: '🇩🇪' },
  france: { symbol: '€', code: 'EUR', locale: 'fr-FR', position: 'before', flag: '🇫🇷' },
  japan: { symbol: '¥', code: 'JPY', locale: 'ja-JP', position: 'before', flag: '🇯🇵' },
  jp: { symbol: '¥', code: 'JPY', locale: 'ja-JP', position: 'before', flag: '🇯🇵' },
  canada: { symbol: '$', code: 'CAD', locale: 'en-CA', position: 'before', flag: '🇨🇦' },
  ca: { symbol: '$', code: 'CAD', locale: 'en-CA', position: 'before', flag: '🇨🇦' },
  australia: { symbol: '$', code: 'AUD', locale: 'en-AU', position: 'before', flag: '🇦🇺' },
  au: { symbol: '$', code: 'AUD', locale: 'en-AU', position: 'before', flag: '🇦🇺' },
  uae: { symbol: 'AED', code: 'AED', locale: 'ar-AE', position: 'before', flag: '🇦🇪' },
  'united-arab-emirates': { symbol: 'AED', code: 'AED', locale: 'ar-AE', position: 'before', flag: '🇦🇪' },
  'united arab emirates': { symbol: 'AED', code: 'AED', locale: 'ar-AE', position: 'before', flag: '🇦🇪' },
  singapore: { symbol: '$', code: 'SGD', locale: 'en-SG', position: 'before', flag: '🇸🇬' },
  sg: { symbol: '$', code: 'SGD', locale: 'en-SG', position: 'before', flag: '🇸🇬' },
  qatar: { symbol: 'QR', code: 'QAR', locale: 'en-QA', position: 'before', flag: '🇶🇦' },
  qa: { symbol: 'QR', code: 'QAR', locale: 'en-QA', position: 'before', flag: '🇶🇦' },
}

export const DEFAULT_CURRENCY: CurrencyInfo = COUNTRY_CURRENCY_MAP['australia']

export function getCurrencyForCountry(countrySlug: string | null): CurrencyInfo {
  if (!countrySlug) return DEFAULT_CURRENCY
  const key = countrySlug.toLowerCase().trim()
  // Try exact match, then try replacing spaces with hyphens
  return COUNTRY_CURRENCY_MAP[key] || COUNTRY_CURRENCY_MAP[key.replace(/\s+/g, '-')] || DEFAULT_CURRENCY
}

export function formatPrice(amount: number, currencyOrSlug: CurrencyInfo | string | null): string {
  const currency = typeof currencyOrSlug === 'string' || currencyOrSlug === null
    ? getCurrencyForCountry(currencyOrSlug)
    : currencyOrSlug

  try {
    const formatted = new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
    
    // Standardized format: [Symbol] [Amount] [Code]
    return `${currency.symbol} ${formatted} ${currency.code}`
  } catch {
    return `${currency.symbol} ${amount.toLocaleString()} ${currency.code}`
  }
}
