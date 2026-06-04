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
  imageUrl: string
  sortOrder: number
  isActive: boolean
}

export type SiteImage = {
  _id: string
  key: string
  label: string
  imageUrl: string
  isActive: boolean
}

export type SiteContentPayload = {
  heroSlides: HeroSlide[]
  siteImages: SiteImage[]
}

export function resolveMediaUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

export async function fetchSiteContent(): Promise<SiteContentPayload> {
  try {
    const res = await fetch(`${API_BASE}/api/site-content`, { cache: 'no-store' })
    if (!res.ok) return { heroSlides: [], siteImages: [] }
    const json = await res.json()
    if (!json.success || !json.data) return { heroSlides: [], siteImages: [] }
    return {
      heroSlides: json.data.heroSlides ?? [],
      siteImages: json.data.siteImages ?? [],
    }
  } catch {
    return { heroSlides: [], siteImages: [] }
  }
}

export function getSiteImageByKey(
  siteImages: SiteImage[],
  key: string
): SiteImage | undefined {
  return siteImages.find((img) => img.key === key && img.imageUrl)
}
