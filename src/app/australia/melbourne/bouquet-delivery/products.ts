import {
  productHasFeaturedLabel,
  productInCategory,
  productInSubCategory,
} from '@/lib/productCategories'
import { formatPrice } from '@/utils/currency'
import { LINKS } from './seo'

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.florivagifts.com'

export type LandingProduct = {
  id: string
  name: string
  title: string
  href: string
  image: string
  priceLabel: string
  compareAtLabel: string | null
  discountPercent: number
  stock: number
  categoryName: string
}

type ApiProduct = {
  _id: string
  name?: string
  title?: string
  exactPrice?: number
  discountPrice?: number
  images?: string[]
  stock?: number
  category?: { _id?: string; name?: string } | null
  subCategory?: unknown
  FeaturedProduct?: unknown
  featuredProduct?: unknown
  featured_product?: unknown
}

const BOUQUET_SUBCATEGORY_ID = '6a018b153e000642ccb4d031'
const ARRANGEMENTS_CATEGORY_ID = '6a018a2b3e000642ccb4cfeb'
const ROSES_CATEGORY_ID = '6a018a383e000642ccb4cffb'
const OCCASION_CATEGORY_ID = '6a018a253e000642ccb4cfe8'

function resolveImage(path?: string | null): string {
  if (!path) return '/images/promo-australia.png'
  if (path.startsWith('http') || path.startsWith('//') || path.startsWith('data:')) return path
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

function toLandingProduct(product: ApiProduct): LandingProduct {
  const exact = Number(product.exactPrice || 0)
  const discount = Number(product.discountPrice || exact || 0)
  const discountPercent =
    exact > 0 && discount > 0 && discount < exact
      ? Math.round(((exact - discount) / exact) * 100)
      : 0

  return {
    id: product._id,
    name: product.name || product.title || 'Floriva Bouquet',
    title: product.title || product.category?.name || 'Handcrafted flowers',
    href: `/country/australia/product/${product._id}`,
    image: resolveImage(product.images?.[0]),
    priceLabel: formatPrice(discount || exact, 'australia'),
    compareAtLabel: discountPercent > 0 ? formatPrice(exact, 'australia') : null,
    discountPercent,
    stock: Number(product.stock ?? 0),
    categoryName: product.category?.name || 'Flowers',
  }
}

function uniqueById(products: LandingProduct[]): LandingProduct[] {
  const seen = new Set<string>()
  return products.filter((product) => {
    if (seen.has(product.id)) return false
    seen.add(product.id)
    return true
  })
}

async function fetchAustraliaProducts(): Promise<ApiProduct[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/countrywise?country=${encodeURIComponent('australia')}`,
      {
        next: { revalidate: 120 },
      }
    )
    if (!res.ok) return []
    const json = await res.json()
    if (Array.isArray(json)) return json
    if (Array.isArray(json?.data)) return json.data
    if (Array.isArray(json?.products)) return json.products
    return []
  } catch {
    return []
  }
}

function isBouquetLike(product: ApiProduct): boolean {
  return (
    productInSubCategory(product, BOUQUET_SUBCATEGORY_ID) ||
    productInCategory(product, ARRANGEMENTS_CATEGORY_ID) ||
    productInCategory(product, ROSES_CATEGORY_ID) ||
    productInCategory(product, OCCASION_CATEGORY_ID)
  )
}

export async function getMelbourneLandingProducts(): Promise<{
  bestsellers: LandingProduct[]
  bouquets: LandingProduct[]
  roses: LandingProduct[]
  allShopHref: string
  bouquetsHref: string
  bestsellersHref: string
  rosesHref: string
}> {
  const products = await fetchAustraliaProducts()

  const bestsellers = uniqueById(
    products
      .filter((product) => productHasFeaturedLabel(product, 'Best Seller'))
      .map(toLandingProduct)
  ).slice(0, 8)

  const bouquets = uniqueById(
    products.filter(isBouquetLike).map(toLandingProduct)
  ).slice(0, 12)

  const roses = uniqueById(
    products
      .filter((product) => productInCategory(product, ROSES_CATEGORY_ID))
      .map(toLandingProduct)
  ).slice(0, 8)

  // If featured best sellers are thin, fill from bouquets
  const filledBestsellers =
    bestsellers.length >= 4
      ? bestsellers
      : uniqueById([...bestsellers, ...bouquets]).slice(0, 8)

  return {
    bestsellers: filledBestsellers,
    bouquets: bouquets.length ? bouquets : filledBestsellers,
    roses,
    allShopHref: LINKS.allProducts,
    bouquetsHref: LINKS.bouquets,
    bestsellersHref: LINKS.bestSellers,
    rosesHref: LINKS.roses,
  }
}
