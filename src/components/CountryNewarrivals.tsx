'use client'

import Heading from '@/components/Heading/Heading'
import { useCarouselArrowButtons } from '@/hooks/use-carousel-arrow-buttons'
import type { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import { usePathname } from 'next/navigation'
import { FC, useCallback, useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TSubCategory { _id: string; name: string }
export interface TCategory {
  _id: string; name: string
  subCategories: TSubCategory[]
  createdAt: string; updatedAt: string
}
export interface TColor { _id: string; name: string; createdAt: string; updatedAt: string }
export interface TCountry { _id: string; name: string; createdAt: string; updatedAt: string }
export interface TFeaturedProduct {
  _id: string; name: string; createdAt: string; updatedAt: string
}

export interface TApiProduct {
  _id: string; name: string; title: string; description: string
  exactPrice: number; discountPrice: number
  category: TCategory | null; subCategory: string | null; color: TColor | null
  country?: TCountry | null
  stock: number; deliveryInfo: string; images: string[]
  featuredProduct?: TFeaturedProduct | TFeaturedProduct[] | string | string[] | null
  FeaturedProduct?: TFeaturedProduct | TFeaturedProduct[] | string | string[] | null
  featured_product?: TFeaturedProduct | TFeaturedProduct[] | string | string[] | null
  createdAt: string; updatedAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000'
const POLL_INTERVAL = 30_000
const NEW_ARRIVALS_LABEL = 'New Arrivals' // Changed from 'Best Seller' to 'New Arrivals'

// ─────────────────────────────────────────────────────────────────────────────
// Country → Currency mapping
// ─────────────────────────────────────────────────────────────────────────────

interface CurrencyInfo {
  symbol: string       // e.g. "₹"
  code: string         // e.g. "INR"
  locale: string       // e.g. "en-IN"
  position: 'before' | 'after'
}

const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  india:          { symbol: '₹',  code: 'INR', locale: 'en-IN', position: 'before' },
  in:             { symbol: '₹',  code: 'INR', locale: 'en-IN', position: 'before' },
  usa:            { symbol: '$',  code: 'USD', locale: 'en-US', position: 'before' },
  us:             { symbol: '$',  code: 'USD', locale: 'en-US', position: 'before' },
  'united-states':{ symbol: '$',  code: 'USD', locale: 'en-US', position: 'before' },
  uk:             { symbol: '£',  code: 'GBP', locale: 'en-GB', position: 'before' },
  'united-kingdom':{ symbol: '£', code: 'GBP', locale: 'en-GB', position: 'before' },
  gb:             { symbol: '£',  code: 'GBP', locale: 'en-GB', position: 'before' },
  europe:         { symbol: '€',  code: 'EUR', locale: 'de-DE', position: 'before' },
  eu:             { symbol: '€',  code: 'EUR', locale: 'de-DE', position: 'before' },
  germany:        { symbol: '€',  code: 'EUR', locale: 'de-DE', position: 'before' },
  france:         { symbol: '€',  code: 'EUR', locale: 'fr-FR', position: 'before' },
  japan:          { symbol: '¥',  code: 'JPY', locale: 'ja-JP', position: 'before' },
  jp:             { symbol: '¥',  code: 'JPY', locale: 'ja-JP', position: 'before' },
  canada:         { symbol: 'CA$',code: 'CAD', locale: 'en-CA', position: 'before' },
  ca:             { symbol: 'CA$',code: 'CAD', locale: 'en-CA', position: 'before' },
  australia:      { symbol: 'A$', code: 'AUD', locale: 'en-AU', position: 'before' },
  au:             { symbol: 'A$', code: 'AUD', locale: 'en-AU', position: 'before' },
  uae:            { symbol: 'AED',code: 'AED', locale: 'ar-AE', position: 'before' },
  singapore:      { symbol: 'S$', code: 'SGD', locale: 'en-SG', position: 'before' },
  sg:             { symbol: 'S$', code: 'SGD', locale: 'en-SG', position: 'before' },
}

const DEFAULT_CURRENCY: CurrencyInfo = { symbol: '₹', code: 'INR', locale: 'en-IN', position: 'before' }

function getCurrencyForCountry(countrySlug: string | null): CurrencyInfo {
  if (!countrySlug) return DEFAULT_CURRENCY
  const key = countrySlug.toLowerCase().trim()
  return COUNTRY_CURRENCY_MAP[key] ?? DEFAULT_CURRENCY
}

// ─────────────────────────────────────────────────────────────────────────────
// URL helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts country slug from pathname.
 *   "/country/india"               → "india"
 *   "/country/india/category/abc"  → "india"
 *   "/category/abc"                → null
 */
function getCountryFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/country\/([^/]+)/i)
  return match ? match[1] : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Format price using country currency
// ─────────────────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: CurrencyInfo): string {
  try {
    // Use Intl for proper locale number formatting
    const formatted = new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
    return `${currency.symbol}${formatted}`
  } catch {
    return `${currency.symbol}${amount.toLocaleString()}`
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// New Arrivals filter helpers
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFeaturedProductRaw(product: TApiProduct): unknown {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (product as any).FeaturedProduct ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (product as any).featuredProduct ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (product as any).featured_product ??
    null
  )
}

/**
 * Returns true if the product's FeaturedProduct array contains an entry
 * whose name matches "New Arrivals" (case-insensitive).
 */
function isNewArrival(product: TApiProduct): boolean {
  const raw = getFeaturedProductRaw(product)
  if (!raw) return false
  const arr: unknown[] = Array.isArray(raw) ? raw : [raw]
  return arr.some((item) => {
    if (!item) return false
    if (typeof item === 'string') return false // bare ID string — no name to compare
    if (typeof item === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj = item as Record<string, any>
      return obj.name?.trim().toLowerCase() === NEW_ARRIVALS_LABEL.toLowerCase()
    }
    return false
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// User email (for cart)
// ─────────────────────────────────────────────────────────────────────────────

function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const userRaw = localStorage.getItem('floriva_user')
    if (userRaw) {
      const parsed = JSON.parse(userRaw)
      if (parsed?.email) return parsed.email
    }
    const token = localStorage.getItem('floriva_token')
    if (token) {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
        if (payload?.email) return payload.email
      }
    }
    return null
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cart API
// ─────────────────────────────────────────────────────────────────────────────

async function apiAddToCart(
  productId: string,
  quantity: number
): Promise<{ ok: boolean; message: string }> {
  const userEmail = getUserEmail()
  if (!userEmail) return { ok: false, message: 'Please log in to add items to cart.' }
  try {
    const res = await fetch(`${BASE_URL}/api/addtocart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, userEmail, quantity }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, message: data?.message ?? `Failed (${res.status})` }
    return { ok: true, message: data?.message ?? 'Added to cart!' }
  } catch {
    return { ok: false, message: 'Network error. Please try again.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast system (currency-aware)
// ─────────────────────────────────────────────────────────────────────────────

type TToastType = 'success' | 'error'
interface TCartToast {
  id: number
  product: TApiProduct
  qty: number
  type: TToastType
  message?: string
  currency: CurrencyInfo   // ← carry currency into toast
}

let _toastItems: TCartToast[] = []
let _toastCounter = 0
const _toastListeners = new Set<() => void>()
const _notifyToast = () => _toastListeners.forEach((fn) => fn())

function pushToast(
  product: TApiProduct,
  qty: number,
  type: TToastType,
  currency: CurrencyInfo,
  message?: string
) {
  const id = ++_toastCounter
  _toastItems = [..._toastItems, { id, product, qty, type, currency, message }]
  _notifyToast()
  setTimeout(() => {
    _toastItems = _toastItems.filter((t) => t.id !== id)
    _notifyToast()
  }, 3500)
}

function CartToastContainer() {
  const [, rerender] = useState(0)
  useEffect(() => {
    const fn = () => rerender((n) => n + 1)
    _toastListeners.add(fn)
    return () => { _toastListeners.delete(fn) }
  }, [])
  if (_toastItems.length === 0) return null
  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      <style>{`
        @keyframes toastSlide {
          from { opacity:0; transform:translateX(80px) scale(0.9); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
      `}</style>
      {_toastItems.map((toast) => {
        const imageUrl = toast.product.images?.[0] ? imgSrc(toast.product.images[0]) : null
        const isError = toast.type === 'error'
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white shadow-2xl border border-gray-100 px-3 py-2.5"
            style={{
              animation: 'toastSlide 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
              minWidth: 220,
              maxWidth: 320,
            }}
          >
            <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden ${isError ? 'bg-red-50' : 'bg-gray-50'}`}>
              {!isError && imageUrl
                ? <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                : <span className="text-lg">{isError ? '⚠️' : '🛍️'}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold mb-0.5 ${isError ? 'text-red-600' : 'text-emerald-600'}`}>
                {isError ? 'Error' : '✓ Added to Bag!'}
              </p>
              {isError ? (
                <p className="text-xs text-gray-700 line-clamp-2">{toast.message}</p>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-900 truncate">{toast.product.name}</p>
                  {/* ✅ Uses the country-correct currency symbol */}
                  <p className="text-xs text-gray-400">
                    Qty {toast.qty} · {formatPrice(toast.product.discountPrice, toast.currency)}
                  </p>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Misc helpers
// ─────────────────────────────────────────────────────────────────────────────

function imgSrc(path: string) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${BASE_URL}${path}`
}

function calcDiscount(exact: number, discounted: number) {
  if (!exact || exact <= discounted) return 0
  return Math.round(((exact - discounted) / exact) * 100)
}

function colorHex(name: string): string {
  const map: Record<string, string> = {
    red: '#dc2626', crimson: '#b91c1c', blue: '#2563eb', navy: '#1e3a5f',
    green: '#16a34a', olive: '#65a30d', black: '#171717', white: '#d4d4d4',
    yellow: '#ca8a04', gold: '#b45309', orange: '#ea580c', purple: '#9333ea',
    pink: '#ec4899', rose: '#e11d48', gray: '#6b7280', grey: '#6b7280',
    silver: '#9ca3af', brown: '#78350f', tan: '#92400e', beige: '#d6cfc4',
    cream: '#e8e0d0', camel: '#b08040', indigo: '#4338ca', teal: '#0d9488',
    cyan: '#0891b2', lime: '#65a30d', maroon: '#881337', coral: '#ef4444',
    salmon: '#fb923c', khaki: '#a3a35e', ivory: '#e8e0cc', lavender: '#a78bfa',
    peach: '#fb923c', mint: '#34d399', sky: '#38bdf8',
  }
  return map[name.toLowerCase()] ?? '#9ca3af'
}

function getSwatches(product: TApiProduct): Array<{ hex: string; name: string }> {
  if (!product.color?.name) return []
  return [{ hex: colorHex(product.color.name), name: product.color.name }]
}

function fakeRating(id: string): { rating: number; reviews: number } {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return {
    rating: Math.round((3.8 + (hash % 13) * 0.1) * 10) / 10,
    reviews: 20 + (hash % 160),
  }
}

function isNewIn(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
}

// ─────────────────────────────────────────────────────────────────────────────
// useAddToCart — now currency-aware
// ─────────────────────────────────────────────────────────────────────────────

function useAddToCart(product: TApiProduct, currency: CurrencyInfo) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  const addToCart = useCallback(
    async (qty: number = 1) => {
      if (loading || product.stock === 0) return
      setLoading(true)
      const result = await apiAddToCart(product._id, qty)
      setLoading(false)
      if (result.ok) {
        setAdded(true)
        // ✅ Pass currency so toast shows correct symbol
        pushToast(product, qty, 'success', currency)
        setTimeout(() => setAdded(false), 2000)
      } else {
        pushToast(product, qty, 'error', currency, result.message)
      }
    },
    [loading, product, currency]
  )

  return { addToCart, loading, added }
}

// ─────────────────────────────────────────────────────────────────────────────
// StarRating
// ─────────────────────────────────────────────────────────────────────────────

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="text-xs font-medium text-gray-500">
        {rating.toFixed(1)}{' '}
        <span className="text-gray-400 font-normal">({reviews} reviews)</span>
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QtyStepper
// ─────────────────────────────────────────────────────────────────────────────

function QtyStepper({
  value,
  onChange,
  max,
}: {
  value: number
  onChange: (n: number) => void
  max: number
}) {
  return (
    <div className="flex h-11 items-center overflow-hidden rounded-full border border-gray-200 bg-white">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-full w-11 items-center justify-center text-gray-500 transition hover:bg-gray-50 active:bg-gray-100"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <span className="w-10 border-x border-gray-200 text-center text-sm font-bold text-gray-800">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-full w-11 items-center justify-center text-gray-500 transition hover:bg-gray-50 active:bg-gray-100"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AccordionRow
// ─────────────────────────────────────────────────────────────────────────────

function AccordionRow({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm font-semibold text-gray-800"
      >
        {title}
        <svg
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-4 text-sm leading-relaxed text-gray-500">{children}</div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QuickViewModal — currency-aware
// ─────────────────────────────────────────────────────────────────────────────

function QuickViewModal({
  product,
  currency,
  countrySlug,
  onClose,
}: {
  product: TApiProduct
  currency: CurrencyInfo
  countrySlug: string | null
  onClose: () => void
}) {
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const { addToCart, loading: adding, added } = useAddToCart(product, currency)

  const { rating, reviews } = fakeRating(product._id)
  const discount = calcDiscount(product.exactPrice, product.discountPrice)
  const outOfStock = product.stock === 0
  const categoryName = product.category?.name ?? null
  const colorName = product.color?.name ?? null
  const swatches = getSwatches(product)
  const hasImages = product.images.length > 0

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    if (!thumbsRef.current) return
    const thumb = thumbsRef.current.children[activeImg] as HTMLElement | undefined
    thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeImg])

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        @keyframes modalInMobile {
          from { opacity:0; transform:translateY(60px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes modalInDesktop {
          from { opacity:0; transform:scale(0.95) translateY(16px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes imgFadeIn { from{opacity:0;}to{opacity:1;} }
        .modal-mobile { animation: modalInMobile 0.32s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
        @media (min-width: 640px) {
          .modal-mobile { animation: modalInDesktop 0.28s cubic-bezier(0.34,1.1,0.64,1) forwards; }
        }
        .thumbs-no-scroll::-webkit-scrollbar { display: none; }
        .details-panel::-webkit-scrollbar { width: 3px; }
        .details-panel::-webkit-scrollbar-track { background: transparent; }
        .details-panel::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>

      <div
        className="modal-mobile relative w-full bg-white shadow-2xl flex flex-col rounded-t-3xl max-h-[93dvh] sm:rounded-3xl sm:max-w-3xl sm:mx-4 sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100/90 text-gray-500 transition hover:bg-gray-200 active:scale-95"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col overflow-y-auto sm:flex-row sm:overflow-hidden flex-1 min-h-0">

          {/* LEFT — Image panel */}
          <div className="w-full flex-shrink-0 sm:w-[44%] sm:overflow-y-auto sm:flex sm:flex-col">
            <div
              className="relative bg-gray-50 w-full overflow-hidden"
              style={{ aspectRatio: '1 / 1' }}
            >
              {hasImages ? (
                <img
                  key={activeImg}
                  src={imgSrc(product.images[activeImg])}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  style={{ animation: 'imgFadeIn 0.18s ease' }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
                {isNewIn(product.createdAt) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-gray-700 shadow-sm">
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    New in
                  </span>
                )}
                {discount >= 10 && (
                  <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                    {discount}% Off
                  </span>
                )}
              </div>

              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((i) => (i - 1 + product.images.length) % product.images.length)}
                    className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:shadow-lg active:scale-95"
                  >
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setActiveImg((i) => (i + 1) % product.images.length)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:shadow-lg active:scale-95"
                  >
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {product.images.length > 1 && (
              <div
                ref={thumbsRef}
                className="thumbs-no-scroll flex gap-2 overflow-x-auto p-2.5 bg-white"
                style={{ scrollbarWidth: 'none' }}
              >
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      activeImg === idx
                        ? 'border-gray-900'
                        : 'border-transparent opacity-50 hover:opacity-75'
                    }`}
                  >
                    <img src={imgSrc(img)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Details panel */}
          <div className="details-panel w-full flex flex-col border-t border-gray-100 sm:border-t-0 sm:border-l sm:w-[56%] sm:overflow-y-auto p-4 sm:p-6">
            {categoryName && (
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
                {categoryName}
              </p>
            )}
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight mb-1">
              {product.name}
            </h2>
            {product.title && product.title !== product.name && (
              <p className="text-sm text-gray-400 mb-2">{product.title}</p>
            )}
            <div className="mb-3">
              <StarRating rating={rating} reviews={reviews} />
            </div>

            {/* ✅ Prices use country currency */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-base font-bold text-emerald-700">
                {formatPrice(product.discountPrice, currency)}
              </span>
              {product.exactPrice > product.discountPrice && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.exactPrice, currency)}
                  </span>
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {swatches.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-gray-500">
                  Colour:{' '}
                  <span className="capitalize text-gray-800">{colorName}</span>
                </p>
                <div className="flex items-center gap-2">
                  {swatches.map((swatch, i) => (
                    <span
                      key={i}
                      title={swatch.name}
                      className="h-6 w-6 rounded-full border-2 border-gray-900 ring-2 ring-gray-900 ring-offset-1 cursor-default"
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                product.stock > 5
                  ? 'bg-emerald-50 text-emerald-700'
                  : product.stock > 0
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-red-50 text-red-600'
              }`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Quantity
              </p>
              <div className="flex gap-2">
                <QtyStepper value={qty} onChange={setQty} max={product.stock || 1} />
                <button
                  onClick={() => addToCart(qty)}
                  disabled={outOfStock || adding}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
                    outOfStock
                      ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                      : adding
                      ? 'cursor-wait bg-gray-800 text-white'
                      : added
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                      : 'bg-gray-900 text-white hover:bg-gray-700 hover:shadow-lg'
                  }`}
                >
                  {adding ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Adding…
                    </>
                  ) : added ? (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Added!
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </>
                  )}
                </button>
              </div>
            </div>

            <hr className="border-gray-100 mb-3" />
            {product.description && (
              <AccordionRow title="Description">{product.description}</AccordionRow>
            )}

            <div className="flex items-center justify-end pt-4 mt-auto border-t border-gray-100">
              <a
                href={
                  countrySlug
                    ? `/country/${countrySlug}/product/${product._id}`
                    : `/product/${product._id}`
                }
                className="text-xs font-semibold text-gray-700 underline-offset-2 hover:underline"
              >
                View full page →
              </a>
            </div>
            <div
              className="h-safe-bottom sm:h-0 flex-shrink-0"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductCard — currency-aware
// ─────────────────────────────────────────────────────────────────────────────

function ProductCard({
  data,
  currency,
  onQuickView,
}: {
  data: TApiProduct
  currency: CurrencyInfo
  onQuickView: (p: TApiProduct) => void
}) {
  const imageUrl = data.images?.[0] ? imgSrc(data.images[0]) : null
  const colorName = data.color?.name ?? null
  const discount = calcDiscount(data.exactPrice, data.discountPrice)
  const { rating, reviews } = fakeRating(data._id)
  const outOfStock = data.stock === 0
  const swatches = getSwatches(data)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const touchedRef = useRef(false)
  const { addToCart, loading, added } = useAddToCart(data, currency)

  const handleTouchStart = useCallback(() => {
    if (!touchedRef.current) {
      touchedRef.current = true
      setOverlayVisible(true)
      const timer = setTimeout(() => {
        touchedRef.current = false
        setOverlayVisible(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <div className="group flex flex-col">
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-100"
        onMouseEnter={() => setOverlayVisible(true)}
        onMouseLeave={() => setOverlayVisible(false)}
        onTouchStart={handleTouchStart}
      >
        <div className="relative aspect-square w-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={data.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl sm:rounded-3xl">
              <span className="rounded-full bg-gray-800/80 px-3 py-1.5 text-xs font-semibold text-white">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* New Arrivals badge - Changed from Best Seller to New Arrivals */}
        {!outOfStock && isNewArrival(data) && (
          <div className="absolute left-2.5 top-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/95 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              New Arrivals
            </span>
          </div>
        )}

        <div className={`absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-2.5 transition-transform duration-300 ease-out ${overlayVisible ? 'translate-y-0' : 'translate-y-full'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onQuickView(data)
            }}
            className="w-full rounded-xl bg-white/95 py-2 text-xs font-semibold text-gray-900 shadow-md backdrop-blur-sm transition hover:bg-white active:scale-[0.97]"
          >
            Quick View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              addToCart(1)
            }}
            disabled={outOfStock || loading}
            className={`w-full rounded-xl py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-1.5 ${
              outOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : loading
                ? 'bg-gray-800 text-white cursor-wait opacity-80'
                : added
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-900 text-white hover:bg-gray-700 shadow-md'
            }`}
          >
            {loading ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Adding…
              </>
            ) : added ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                ✓ Added to Bag!
              </>
            ) : outOfStock ? (
              'Out of Stock'
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-2.5 px-0.5">
        {swatches.length > 0 && (
          <div className="flex items-center gap-1.5 mb-1.5">
            {swatches.map((swatch, i) => (
              <span
                key={i}
                title={swatch.name}
                className="h-3.5 w-3.5 rounded-full border border-white shadow-sm ring-1 ring-gray-300 cursor-default"
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
          </div>
        )}
        <h3 className="text-[13px] sm:text-[15px] font-bold text-gray-900 leading-snug line-clamp-1 mb-0.5">
          {data.name}
        </h3>
        <p className="text-[11px] sm:text-[13px] text-gray-400 mb-1.5">
          {colorName
            ? `${colorName.charAt(0).toUpperCase()}${colorName.slice(1)}`
            : data.category?.name ?? ''}
        </p>
        {/* ✅ Prices use country currency */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs sm:text-sm font-bold text-emerald-700">
            {formatPrice(data.discountPrice, currency)}
          </span>
          {data.exactPrice > data.discountPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(data.exactPrice, currency)}
            </span>
          )}
        </div>
        <div className="mt-1">
          <StarRating rating={rating} reviews={reviews} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-square w-full animate-pulse rounded-2xl sm:rounded-3xl bg-gray-200" />
      <div className="mt-3 space-y-2 px-0.5">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3.5 w-3.5 animate-pulse rounded-full bg-gray-200" />
          ))}
        </div>
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-gray-200" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="h-3 w-14 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component Props
// ─────────────────────────────────────────────────────────────────────────────

export interface BestSellersProps {
  className?: string
  heading?: string
  headingFontClassName?: string
  headingClassName?: string
  subHeading?: string
  emblaOptions?: EmblaOptionsType
  pollInterval?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// CountryBestSellers — Main Component (New Arrivals version)
// ─────────────────────────────────────────────────────────────────────────────

const CountryNewarrivals: FC<BestSellersProps> = ({
  className = '',
  headingFontClassName,
  headingClassName,
  heading,
  subHeading = 'Fresh arrivals just landed',
  emblaOptions = { slidesToScroll: 'auto' },
  pollInterval = POLL_INTERVAL,
}) => {

  // ── 1. Detect country from URL ─────────────────────────────────────────────
  const pathname    = usePathname()
  const countrySlug = getCountryFromPathname(pathname)

  // ── 2. Derive currency from country ───────────────────────────────────────
  const currency = getCurrencyForCountry(countrySlug)

  // ── 3. Build country-aware API URL ────────────────────────────────────────
  const apiUrl = countrySlug
    ? `${BASE_URL}/api/countrywise?country=${encodeURIComponent(countrySlug)}`
    : `${BASE_URL}/api/productview`

  // ── State ─────────────────────────────────────────────────────────────────
  const [products, setProducts]           = useState<TApiProduct[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<TApiProduct | null>(null)
  const isMounted = useRef(true)

  const [emblaRef, emblaApi] = useEmblaCarousel({ ...emblaOptions, align: 'start', dragFree: false })
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    useCarouselArrowButtons(emblaApi)

  // ── 4. Fetch products and filter by New Arrivals ──────────────────────────
  const fetchProducts = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true)
        setError(null)

        const res = await fetch(apiUrl, { cache: 'no-store' })
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        const json = await res.json()

        // API returns { data: [...] } or bare array
        const all: TApiProduct[] = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : []

        // ── 5. Filter: keep only products tagged "New Arrivals" ─────────────
        //   FeaturedProduct: [{ name: "New Arrivals" }, { name: "Best Seller" }]
        //   → kept (has New Arrivals)
        //
        //   FeaturedProduct: [{ name: "Best Seller" }]
        //   → filtered out (no New Arrivals)
        const newArrivals = all.filter(isNewArrival)

        if (process.env.NODE_ENV === 'development') {
          console.log('[CountryBestSellers] pathname     →', pathname)
          console.log('[CountryBestSellers] countrySlug  →', countrySlug)
          console.log('[CountryBestSellers] apiUrl       →', apiUrl)
          console.log('[CountryBestSellers] currency     →', currency)
          console.log('[CountryBestSellers] total fetched:', all.length)
          console.log('[CountryBestSellers] new arrivals :', newArrivals.length)
          if (all.length > 0) {
            console.log('[CountryBestSellers] sample FeaturedProduct:', getFeaturedProductRaw(all[0]))
          }
        }

        if (isMounted.current) setProducts(newArrivals)
      } catch (err: unknown) {
        if (isMounted.current)
          setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        if (isMounted.current && !isBackground) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiUrl]
  )

  useEffect(() => {
    isMounted.current = true
    fetchProducts(false)
    return () => { isMounted.current = false }
  }, [fetchProducts])

  // Background poll
  useEffect(() => {
    if (!pollInterval) return
    const id = setInterval(() => fetchProducts(true), pollInterval)
    return () => clearInterval(id)
  }, [fetchProducts, pollInterval])

  const handleQuickView = useCallback(
    (product: TApiProduct) => setQuickViewProduct(product),
    []
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <CartToastContainer />

      <div className={`nc-BestSellers ${className}`}>
        <div className="relative">
          <Heading
            className={headingClassName}
            fontClass={headingFontClassName}
            headingDim={subHeading}
            hasNextPrev
            prevBtnDisabled={prevBtnDisabled}
            nextBtnDisabled={nextBtnDisabled}
            onClickPrev={onPrevButtonClick}
            onClickNext={onNextButtonClick}
          >
            {heading || 'New Arrivals'}
          </Heading>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-red-100 bg-red-50 py-12 text-center px-4">
            <p className="text-sm font-semibold text-red-600">Failed to load products</p>
            <p className="mt-1 text-xs text-gray-400">{error}</p>
            <button
              onClick={() => fetchProducts(false)}
              className="mt-4 rounded-full bg-gray-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 active:scale-95"
            >
              Retry
            </button>
          </div>
        )}

        {/* Carousel */}
        {!loading && !error && products.length > 0 && (
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex -ml-3 sm:-ml-5">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="embla__slide flex-[0_0_calc(100%-6px)] sm:flex-[0_0_calc(50%-10px)] md:flex-[0_0_calc(33.333%-14px)] xl:flex-[0_0_calc(25%-15px)] pl-3 sm:pl-5 min-w-0"
                >
                  <ProductCard
                    data={product}
                    currency={currency}
                    onQuickView={handleQuickView}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl sm:rounded-3xl bg-gray-50 py-12">
            <p className="text-sm text-gray-400">No new arrivals available.</p>
          </div>
        )}
      </div>

      {/* Quick view modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          currency={currency}
          countrySlug={countrySlug}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </>
  )
}

export default CountryNewarrivals