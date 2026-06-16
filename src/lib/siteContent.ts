function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:7000'
    }
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.florivagifts.com'
  }
  return 'http://localhost:7000'
}

const API_BASE = getApiBase()

export type HeroSlide = {
  _id: string
  heading: string
  subHeading: string
  btnText: string
  btnLink?: string
  imageUrl: string
  imageAlt?: string
  imageTitle?: string
  imageDescription?: string
  sortOrder: number
  isActive: boolean
  fullBanner?: boolean
}

export type SiteImage = {
  _id: string
  key: string
  label: string
  imageUrl: string
  linkUrl?: string
  imageAlt?: string
  imageTitle?: string
  imageDescription?: string
  isActive: boolean
}

export type SocialLink = {
  _id: string
  platform: 'instagram' | 'facebook' | 'tiktok' | 'pinterest'
  label: string
  url: string
  isActive: boolean
}

export type SiteContentPayload = {
  heroSlides: HeroSlide[]
  siteImages: SiteImage[]
  socialLinks: SocialLink[]
}

export function resolveMediaUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

export async function fetchSiteContent(): Promise<SiteContentPayload> {
  const apiBase = getApiBase()
  try {
    const res = await fetch(`${apiBase}/api/site-content`, { cache: 'no-store' })
    if (!res.ok) return { heroSlides: [], siteImages: [], socialLinks: [] }
    const json = await res.json()
    if (!json.success || !json.data) return { heroSlides: [], siteImages: [], socialLinks: [] }
    return {
      heroSlides: json.data.heroSlides ?? [],
      siteImages: json.data.siteImages ?? [],
      socialLinks: json.data.socialLinks ?? [],
    }
  } catch {
    return { heroSlides: [], siteImages: [], socialLinks: [] }
  }
}

export function getSiteImageByKey(
  siteImages: SiteImage[],
  key: string
): SiteImage | undefined {
  return siteImages.find((img) => img.key === key && img.imageUrl)
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function resolveSlideHref(
  btnLink: string | undefined,
  fallbackHref: string
): string {
  const link = btnLink?.trim()
  if (!link) return fallbackHref
  if (link.startsWith('http://') || link.startsWith('https://')) return link
  return link.startsWith('/') ? link : `/${link}`
}

export function resolveImageHref(
  linkUrl: string | undefined,
  fallbackHref: string
): string {
  return resolveSlideHref(linkUrl, fallbackHref)
}
