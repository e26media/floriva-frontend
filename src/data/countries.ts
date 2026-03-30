// src/data/countries.ts

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000/api'

export interface Country {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface Product {
  _id: string
  name: string
  title: string
  description: string
  exactPrice: number
  discountPrice: number
  category: {
    _id: string
    name: string
    subCategories: { name: string; _id: string }[]
  }
  subCategory: string
  color: { _id: string; name: string }
  county: Country
  FeaturedProduct: { _id: string; name: string }[]
  stock: number
  deliveryInfo: string
  images: string[]
  createdAt: string
  updatedAt: string
}

// ── Fetch ALL countries from  GET /api/allCounties ─────────────────────────
export async function getAllCountries(): Promise<Country[]> {
  try {
    const res = await fetch(`${API_BASE}/allCounties`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`getAllCountries: HTTP ${res.status}`)
    const json = await res.json()
    // API returns { data: [...] }  or  [...] directly — handle both
    return Array.isArray(json) ? json : (json.data ?? [])
  } catch (error) {
    console.error('getAllCountries error:', error)
    return []
  }
}

// ── Fetch single country   GET /api/allCounties/:id ────────────────────────
export async function getCountryById(id: string): Promise<Country | null> {
  try {
    const res = await fetch(`${API_BASE}/allCounties/${id}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`getCountryById: HTTP ${res.status}`)
    const json = await res.json()
    return json.data ?? json ?? null
  } catch (error) {
    console.error('getCountryById error:', error)
    return null
  }
}

// ── Fetch products filtered by country name ────────────────────────────────
export async function getProductsByCountry(countryName: string): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/products?county=${countryName}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error(`getProductsByCountry: HTTP ${res.status}`)
    const json = await res.json()
    return Array.isArray(json) ? json : (json.data ?? [])
  } catch (error) {
    console.error('getProductsByCountry error:', error)
    return []
  }
}