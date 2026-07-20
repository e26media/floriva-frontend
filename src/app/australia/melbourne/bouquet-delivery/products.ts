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

export type LandingCategory = {
  id: string
  name: string
  href: string
  description: string
  image: string
  alt: string
  count: number
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

type ApiCategory = {
  _id: string
  name?: string
  categoriesimg?: string
  img?: string
  image?: string
  subCategories?: Array<{ _id: string; name?: string }>
  subcategories?: Array<{ _id: string; name?: string }>
}

const BOUQUET_SUBCATEGORY_ID = '6a018b153e000642ccb4d031'
const ARRANGEMENTS_CATEGORY_ID = '6a018a2b3e000642ccb4cfeb'
const ROSES_CATEGORY_ID = '6a018a383e000642ccb4cffb'
const OCCASION_CATEGORY_ID = '6a018a253e000642ccb4cfe8'

/** Preferred Melbourne shop cards mapped to real Floriva category/subcategory IDs */
const CATEGORY_CARD_DEFS: Array<{
  id: string
  name: string
  description: string
  match: 'category' | 'subcategory' | 'featured'
}> = [
  {
    id: '6a018ade3e000642ccb4d016',
    name: 'Birthday Bouquets',
    description: 'Bright celebratory flowers for Melbourne birthday surprises.',
    match: 'subcategory',
  },
  {
    id: '6a018ade3e000642ccb4d017',
    name: 'Anniversary Bouquets',
    description: 'Elegant blooms for milestone moments across Melbourne.',
    match: 'subcategory',
  },
  {
    id: '6a018ade3e000642ccb4d018',
    name: 'Romantic Bouquets',
    description: 'Love & romance florals for thoughtful Melbourne gifting.',
    match: 'subcategory',
  },
  {
    id: ROSES_CATEGORY_ID,
    name: 'Rose Bouquets',
    description: 'Classic red, pink, and luxury rose collections.',
    match: 'category',
  },
  {
    id: '6a018b3e3e000642ccb4d052',
    name: 'Luxury Roses',
    description: 'Statement luxury rose designs for special celebrations.',
    match: 'subcategory',
  },
  {
    id: BOUQUET_SUBCATEGORY_ID,
    name: 'Bouquets',
    description: 'Handcrafted Floriva bouquets ready for Melbourne delivery.',
    match: 'subcategory',
  },
  {
    id: '6a018b153e000642ccb4d02f',
    name: 'Flower Boxes',
    description: 'Premium boxed floral arrangements from our Australia shop.',
    match: 'subcategory',
  },
  {
    id: '6a018b153e000642ccb4d030',
    name: 'Flower Baskets',
    description: 'Beautiful basket arrangements for homes and offices.',
    match: 'subcategory',
  },
  {
    id: '6a018b153e000642ccb4d032',
    name: 'Vase Arrangements',
    description: 'Ready-to-display vase designs crafted by Floriva florists.',
    match: 'subcategory',
  },
  {
    id: '6a018ade3e000642ccb4d019',
    name: 'Congratulations Flowers',
    description: 'Uplifting florals for promotions, wins, and proud moments.',
    match: 'subcategory',
  },
  {
    id: '6a018ba43e000642ccb4d0a7',
    name: 'Custom Bouquets',
    description: 'Custom florist designs for weddings and personal requests.',
    match: 'subcategory',
  },
  {
    id: '6a018c223e000642ccb4d1db',
    name: 'Best Sellers',
    description: 'Customer-favourite Floriva designs Melburnians order most.',
    match: 'featured',
  },
]

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
      { next: { revalidate: 120 } }
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

async function fetchCategories(): Promise<ApiCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/api/categoryview`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const json = await res.json()
    if (Array.isArray(json)) return json
    if (Array.isArray(json?.categories)) return json.categories
    if (Array.isArray(json?.data)) return json.data
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

function productsForCard(
  def: (typeof CATEGORY_CARD_DEFS)[number],
  products: ApiProduct[]
): ApiProduct[] {
  if (def.match === 'featured') {
    return products.filter((product) => productHasFeaturedLabel(product, 'Best Seller'))
  }
  if (def.match === 'category') {
    return products.filter((product) => productInCategory(product, def.id))
  }
  return products.filter((product) => productInSubCategory(product, def.id))
}

function categoryApiImage(categories: ApiCategory[], id: string): string | null {
  for (const cat of categories) {
    if (cat._id === id) {
      return cat.categoriesimg || cat.img || cat.image || null
    }
    const subs = cat.subCategories || cat.subcategories || []
    for (const sub of subs) {
      if (sub._id === id) {
        // Prefer parent category banner if subcategory has none
        return cat.categoriesimg || cat.img || cat.image || null
      }
    }
  }
  return null
}

function buildCategories(
  products: ApiProduct[],
  categories: ApiCategory[]
): LandingCategory[] {
  const fallbackImage =
    resolveImage(products.find((p) => p.images?.[0])?.images?.[0]) ||
    '/images/promo-australia.png'

  return CATEGORY_CARD_DEFS.map((def) => {
    const matched = productsForCard(def, products)
    const productImage = matched.find((p) => p.images?.[0])?.images?.[0]
    const apiImage = categoryApiImage(categories, def.id)
    const image = resolveImage(productImage || apiImage) || fallbackImage

    return {
      id: def.id,
      name: def.name,
      href: `/country/australia/category/${def.id}`,
      description: def.description,
      image,
      alt: `${def.name} — Floriva Gifts flower delivery Melbourne`,
      count: matched.length,
    }
  }).filter((card) => card.count > 0 || card.id === BOUQUET_SUBCATEGORY_ID || card.id === ROSES_CATEGORY_ID)
}

export async function getMelbourneLandingProducts(): Promise<{
  bestsellers: LandingProduct[]
  bouquets: LandingProduct[]
  roses: LandingProduct[]
  categories: LandingCategory[]
  heroImage: string
  allShopHref: string
  bouquetsHref: string
  bestsellersHref: string
  rosesHref: string
}> {
  const [products, categories] = await Promise.all([
    fetchAustraliaProducts(),
    fetchCategories(),
  ])

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

  const filledBestsellers =
    bestsellers.length >= 4
      ? bestsellers
      : uniqueById([...bestsellers, ...bouquets]).slice(0, 8)

  const landingCategories = buildCategories(products, categories)
  const heroImage =
    bouquets[0]?.image ||
    filledBestsellers[0]?.image ||
    resolveImage(categories.find((c) => c.categoriesimg)?.categoriesimg) ||
    '/images/promo-australia.png'

  return {
    bestsellers: filledBestsellers,
    bouquets: bouquets.length ? bouquets : filledBestsellers,
    roses,
    categories: landingCategories,
    heroImage,
    allShopHref: LINKS.allProducts,
    bouquetsHref: LINKS.bouquets,
    bestsellersHref: LINKS.bestSellers,
    rosesHref: LINKS.roses,
  }
}
