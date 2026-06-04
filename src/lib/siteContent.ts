const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000'

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
