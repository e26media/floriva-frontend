'use client'

import Heading from '@/components/Heading/Heading'
import { useCarouselArrowButtons } from '@/hooks/use-carousel-arrow-buttons'
import type { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import { FC, useCallback, useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TSubCategory {
  _id: string
  name: string
}

export interface TCategory {
  _id: string
  name: string
  subCategories: TSubCategory[]
  createdAt: string
  updatedAt: string
}

export interface TColor {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface TApiProduct {
  _id: string
  name: string
  title: string
  description: string
  exactPrice: number
  discountPrice: number
  category: TCategory | null
  subCategory: string | null
  color: TColor | null
  stock: number
  deliveryInfo: string
  images: string[]
  createdAt: string
  updatedAt: string
}

export interface TCartItem {
  product: TApiProduct
  qty: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000'
const POLL_INTERVAL = 30_000

// ─────────────────────────────────────────────────────────────────────────────
// ✅ Cart API helpers — calls your Express backend
// ─────────────────────────────────────────────────────────────────────────────

async function apiAddToCart(userEmail: string, productId: string, quantity: number) {
  const res = await fetch(`${BASE_URL}/api/addtocart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail, productId, quantity }),
  })
  if (!res.ok) throw new Error(`Cart API error ${res.status}`)
  return res.json()
}

async function apiViewCart(userEmail: string) {
  const res = await fetch(`${BASE_URL}/api/cart/view/${encodeURIComponent(userEmail)}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Cart API error ${res.status}`)
  return res.json()
}

async function apiUpdateCart(cartItemId: string, quantity: number) {
  const res = await fetch(`${BASE_URL}/api/cart/update/${cartItemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  })
  if (!res.ok) throw new Error(`Cart API error ${res.status}`)
  return res.json()
}

async function apiDeleteCart(cartItemId: string) {
  const res = await fetch(`${BASE_URL}/api/cart/delete/${cartItemId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Cart API error ${res.status}`)
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ Bag store — synced with backend
//
// USAGE:
//   const { items, addItem, removeItem, updateItem, getQty, total, userEmail, setUserEmail } = useBag()
//
// Call setUserEmail(email) once you know the logged-in user's email.
// Until then, actions are queued and run after email is set.
// ─────────────────────────────────────────────────────────────────────────────

type TBackendCartItem = {
  _id: string           // MongoDB cart document _id
  productId: TApiProduct
  quantity: number
  userEmail: string
}

type BagStore = {
  items: TCartItem[]
  addItem: (product: TApiProduct, qty?: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateItem: (productId: string, qty: number) => Promise<void>
  getQty: (productId: string) => number
  total: number
  userEmail: string
  setUserEmail: (email: string) => void
  syncing: boolean
}

// Module-level shared state
let _userEmail = ''
let _bagItems: TCartItem[] = []
let _cartDocMap: Record<string, string> = {}   // productId → cart _id
let _syncing = false
const _bagListeners = new Set<() => void>()
const _notifyBag = () => _bagListeners.forEach((fn) => fn())

function useBag(): BagStore {
  const [, rerender] = useState(0)

  useEffect(() => {
    const fn = () => rerender((n) => n + 1)
    _bagListeners.add(fn)
    return () => { _bagListeners.delete(fn) }
  }, [])

  // ── setUserEmail: fetch existing cart from backend ──
  const setUserEmail = useCallback((email: string) => {
    if (!email || _userEmail === email) return
    _userEmail = email
    _notifyBag()

    // Load existing cart from backend
    apiViewCart(email)
      .then((res) => {
        const backendItems: TBackendCartItem[] = res.data ?? []
        _bagItems = backendItems
          .filter((i) => i.productId)
          .map((i) => ({ product: i.productId, qty: i.quantity }))
        _cartDocMap = {}
        backendItems.forEach((i) => {
          if (i.productId) _cartDocMap[i.productId._id] = i._id
        })
        _notifyBag()
      })
      .catch((err) => console.warn('Failed to load cart:', err))
  }, [])

  // ── addItem ──
  const addItem = useCallback(async (product: TApiProduct, qty = 1) => {
    // Optimistic update
    const existing = _bagItems.find((i) => i.product._id === product._id)
    if (existing) {
      _bagItems = _bagItems.map((i) =>
        i.product._id === product._id
          ? { ...i, qty: Math.min(i.qty + qty, product.stock) }
          : i,
      )
    } else {
      _bagItems = [..._bagItems, { product, qty }]
    }
    _notifyBag()

    // Sync to backend
    if (!_userEmail) {
      console.warn('useBag: userEmail not set — cart not saved to backend')
      return
    }
    try {
      _syncing = true
      _notifyBag()
      const res = await apiAddToCart(_userEmail, product._id, qty)
      if (res.data?._id) {
        _cartDocMap[product._id] = res.data._id
      }
    } catch (err) {
      console.error('Failed to add to cart:', err)
    } finally {
      _syncing = false
      _notifyBag()
    }
  }, [])

  // ── removeItem ──
  const removeItem = useCallback(async (productId: string) => {
    // Optimistic update
    _bagItems = _bagItems.filter((i) => i.product._id !== productId)
    _notifyBag()

    const cartDocId = _cartDocMap[productId]
    if (!cartDocId) return

    try {
      await apiDeleteCart(cartDocId)
      delete _cartDocMap[productId]
    } catch (err) {
      console.error('Failed to remove from cart:', err)
    }
  }, [])

  // ── updateItem ──
  const updateItem = useCallback(async (productId: string, qty: number) => {
    if (qty < 1) return removeItem(productId)

    // Optimistic update
    _bagItems = _bagItems.map((i) =>
      i.product._id === productId ? { ...i, qty } : i
    )
    _notifyBag()

    const cartDocId = _cartDocMap[productId]
    if (!cartDocId) return

    try {
      await apiUpdateCart(cartDocId, qty)
    } catch (err) {
      console.error('Failed to update cart:', err)
    }
  }, [removeItem])

  const getQty = useCallback(
    (id: string) => _bagItems.find((i) => i.product._id === id)?.qty ?? 0,
    [],
  )

  const total = _bagItems.reduce(
    (sum, i) => sum + i.product.discountPrice * i.qty,
    0,
  )

  return {
    items: _bagItems,
    addItem,
    removeItem,
    updateItem,
    getQty,
    total,
    userEmail: _userEmail,
    setUserEmail,
    syncing: _syncing,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
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
    red: '#ef4444', crimson: '#dc143c', blue: '#3b82f6', navy: '#1e3a5f',
    green: '#22c55e', olive: '#708238', black: '#1a1a1a', white: '#e5e5e5',
    yellow: '#eab308', gold: '#d4a017', orange: '#f97316', purple: '#a855f7',
    pink: '#ec4899', rose: '#f43f5e', gray: '#9ca3af', grey: '#9ca3af',
    silver: '#c0c0c0', brown: '#92400e', tan: '#d2b48c', beige: '#f5f0e0',
    cream: '#fffdd0', camel: '#c19a6b', indigo: '#4f46e5', teal: '#14b8a6',
    cyan: '#06b6d4', lime: '#84cc16', maroon: '#800000', coral: '#ff6b6b',
    salmon: '#fa8072', khaki: '#c3b091', ivory: '#fffff0',
  }
  return map[name.toLowerCase()] ?? '#9ca3af'
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

function formatPrice(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1">
      <svg className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="text-xs text-neutral-500 dark:text-neutral-400">
        {rating.toFixed(1)}{' '}
        <span className="text-neutral-400">({reviews})</span>
      </span>
    </div>
  )
}

function PlaceholderImg({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center text-neutral-300 dark:text-neutral-600 ${className}`}>
      <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  )
}

function WishlistBtn({ productId }: { productId: string }) {
  const [wished, setWished] = useState(false)
  return (
    <button
      onClick={(e) => { e.stopPropagation(); setWished((w) => !w) }}
      aria-label="Save to wishlist"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 hover:scale-110 dark:bg-neutral-800"
    >
      {wished ? (
        <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Add-to-Bag Button — calls real API
// ─────────────────────────────────────────────────────────────────────────────

function AddToBagBtn({
  product,
  variant = 'full',
  className = '',
}: {
  product: TApiProduct
  variant?: 'pill' | 'full'
  className?: string
}) {
  const { addItem, getQty } = useBag()
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)
  const inBag = getQty(product._id) > 0
  const outOfStock = product.stock === 0

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (outOfStock || loading) return
    setLoading(true)
    await addItem(product, 1)
    setLoading(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const BagIcon = () => (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )
  const CheckIcon = () => (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
  const SpinIcon = () => (
    <svg className="h-4 w-4 flex-shrink-0 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )

  if (variant === 'pill') {
    return (
      <button
        onClick={handleClick}
        disabled={outOfStock || loading}
        className={[
          'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold shadow-lg transition-all duration-200',
          outOfStock ? 'cursor-not-allowed bg-neutral-200 text-neutral-400'
            : loading ? 'bg-neutral-300 text-neutral-500'
            : added ? 'bg-green-500 text-white'
            : inBag ? 'bg-neutral-900 text-white hover:bg-neutral-700'
            : 'bg-white text-neutral-900 hover:bg-neutral-50',
          className,
        ].join(' ')}
      >
        {loading ? <><SpinIcon /> Adding…</>
          : added ? <><CheckIcon /> Added!</>
          : outOfStock ? 'Out of Stock'
          : <><BagIcon /> {inBag ? 'In Bag' : 'Add to Bag'}</>}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={outOfStock || loading}
      className={[
        'flex w-full items-center justify-center gap-2.5 rounded-full py-4 text-sm font-semibold transition-all duration-200',
        outOfStock
          ? 'cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
          : loading
          ? 'cursor-wait bg-neutral-300 text-neutral-500'
          : added
          ? 'bg-green-500 text-white'
          : 'bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100',
        className,
      ].join(' ')}
    >
      {loading ? <><SpinIcon /> Adding to Bag…</>
        : added ? <><CheckIcon /> Added to Bag!</>
        : outOfStock ? 'Out of Stock'
        : <><BagIcon /> {inBag ? 'Add More to Bag' : 'Add to Bag'}</>}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Qty Stepper
// ─────────────────────────────────────────────────────────────────────────────

function QtyStepper({ value, onChange, max }: { value: number; onChange: (n: number) => void; max: number }) {
  return (
    <div className="flex h-11 items-center overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-full w-11 items-center justify-center text-neutral-600 transition hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <span className="w-10 text-center text-sm font-semibold text-neutral-800 dark:text-white">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-full w-11 items-center justify-center text-neutral-600 transition hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Accordion Row
// ─────────────────────────────────────────────────────────────────────────────

function AccordionRow({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-neutral-100 dark:border-neutral-800">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm font-semibold text-neutral-800 dark:text-white"
      >
        {title}
        <svg
          className={`h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-4 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {children}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick View Modal — with real API add-to-cart
// ─────────────────────────────────────────────────────────────────────────────

function QuickViewModal({ product, onClose }: { product: TApiProduct; onClose: () => void }) {
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [wished, setWished] = useState(false)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const { addItem, getQty } = useBag()
  const { rating, reviews } = fakeRating(product._id)

  const discount = calcDiscount(product.exactPrice, product.discountPrice)
  const inBag = getQty(product._id) > 0
  const outOfStock = product.stock === 0

  const categoryName = product.category?.name ?? null
  const subCategoryName =
    product.category && product.subCategory
      ? product.category.subCategories.find((s) => s._id === product.subCategory)?.name ?? null
      : null
  const colorName = product.color?.name ?? null

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (!thumbsRef.current) return
    const thumb = thumbsRef.current.children[activeImg] as HTMLElement | undefined
    thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeImg])

  // ✅ Calls real API
  const handleAddToBag = async () => {
    if (outOfStock || adding) return
    setAdding(true)
    await addItem(product, qty)
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const getStatusBadge = () => {
    if (outOfStock) return { icon: '⊘', label: 'Sold Out', color: 'text-red-600' }
    if (discount >= 50) return { icon: '%', label: `${discount}% Off`, color: 'text-orange-600' }
    if (isNewIn(product.createdAt)) return { icon: '✦', label: 'New in', color: 'text-neutral-700 dark:text-neutral-200' }
    return null
  }
  const statusBadge = getStatusBadge()
  const hasImages = product.images.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-950"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-md backdrop-blur-sm transition hover:bg-white hover:text-neutral-900 dark:bg-neutral-800/90 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">

          {/* LEFT — Image gallery */}
          <div className="flex w-full flex-shrink-0 flex-col lg:w-[52%] lg:overflow-y-auto">
            <div className="relative bg-[#f5f5f5] dark:bg-neutral-900">
              <div className="relative aspect-square w-full overflow-hidden">
                {hasImages ? (
                  <img
                    key={activeImg}
                    src={imgSrc(product.images[activeImg])}
                    alt={product.name}
                    className="h-full w-full object-contain p-8 transition-opacity duration-300"
                  />
                ) : (
                  <PlaceholderImg className="h-full w-full" />
                )}

                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg((i) => (i - 1 + product.images.length) % product.images.length)}
                      className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition hover:bg-white dark:bg-neutral-800/90 dark:hover:bg-neutral-700"
                    >
                      <svg className="h-4 w-4 text-neutral-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setActiveImg((i) => (i + 1) % product.images.length)}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition hover:bg-white dark:bg-neutral-800/90 dark:hover:bg-neutral-700"
                    >
                      <svg className="h-4 w-4 text-neutral-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {statusBadge && (
                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm dark:bg-neutral-900/95">
                    <span className={statusBadge.color}>{statusBadge.icon}</span>
                    <span className="text-neutral-700 dark:text-neutral-200">{statusBadge.label}</span>
                  </div>
                )}

                <button
                  onClick={() => setWished((w) => !w)}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition hover:scale-110 dark:bg-neutral-900/95"
                >
                  {wished ? (
                    <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>

                {product.images.length > 1 && (
                  <div className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {activeImg + 1} / {product.images.length}
                  </div>
                )}
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="border-t border-neutral-100 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                <div
                  ref={thumbsRef}
                  className="flex gap-2.5 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImg(idx)}
                      className={[
                        'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#f5f5f5] transition-all duration-200 dark:bg-neutral-800 mt-2 ml-2',
                        activeImg === idx
                          ? 'ring-2 ring-neutral-900 ring-offset-1 dark:ring-white'
                          : 'opacity-55 hover:opacity-90',
                      ].join(' ')}
                    >
                      <img src={imgSrc(img)} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-contain p-1.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Product details */}
          <div className="flex w-full flex-col gap-5 overflow-y-auto border-l border-neutral-100 p-6 dark:border-neutral-800 lg:w-[48%] lg:max-h-[95vh] lg:py-8">

            {(categoryName || subCategoryName) && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                {categoryName && <span>{categoryName}</span>}
                {categoryName && subCategoryName && <span>›</span>}
                {subCategoryName && <span className="text-neutral-500 dark:text-neutral-300">{subCategoryName}</span>}
              </div>
            )}

            <div>
              <h2 className="text-2xl font-semibold leading-snug text-neutral-900 dark:text-white">
                {product.name}
              </h2>
              {product.title && product.title !== product.name && (
                <p className="mt-1 text-sm text-neutral-400">{product.title}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-green-100 px-4 py-1.5 text-lg font-bold text-green-700 dark:bg-green-900/25 dark:text-green-400">
                  {formatPrice(product.discountPrice)}
                </span>
                {product.exactPrice > product.discountPrice && (
                  <>
                    <span className="text-sm text-neutral-400 line-through">{formatPrice(product.exactPrice)}</span>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>
              <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
              <StarRating rating={rating} reviews={reviews} />
            </div>

            {colorName && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Colour: <span className="capitalize text-neutral-700 dark:text-neutral-200">{colorName}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="h-7 w-7 cursor-pointer rounded-full border-2 border-white shadow-md ring-2 ring-neutral-900 dark:ring-white"
                    style={{ backgroundColor: colorHex(colorName) }}
                  />
                </div>
              </div>
            )}

            {/* Qty + Add to Bag — ✅ Calls real API */}
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-400">Quantity</p>
              <div className="flex gap-3">
                <QtyStepper value={qty} onChange={setQty} max={product.stock || 1} />
                <button
                  onClick={handleAddToBag}
                  disabled={outOfStock || adding}
                  className={[
                    'flex flex-1 items-center justify-center gap-2.5 rounded-full py-3 text-sm font-semibold transition-all duration-200',
                    outOfStock
                      ? 'cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                      : adding
                      ? 'cursor-wait bg-neutral-300 text-neutral-600'
                      : added
                      ? 'bg-green-500 text-white'
                      : 'bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900',
                  ].join(' ')}
                >
                  {adding ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      Added to Bag!
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {outOfStock ? 'Out of Stock' : inBag ? 'Add More to Bag' : 'Add to Bag'}
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => setWished((w) => !w)}
              className={[
                'flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-sm font-semibold transition-all duration-200',
                wished
                  ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400'
                  : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800',
              ].join(' ')}
            >
              <svg className="h-4 w-4" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wished ? 'Saved to Wishlist' : 'Save to Wishlist'}
            </button>

            <div className="flex flex-wrap gap-2">
              <span
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                  product.stock > 5
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : product.stock > 0
                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                    : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
                ].join(' ')}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <hr className="border-neutral-100 dark:border-neutral-800" />

            <div>
              {product.description && (
                <AccordionRow title="Description">{product.description}</AccordionRow>
              )}
              <AccordionRow title="Shipping & Returns">
                Free shipping on all orders over ₹999. Returns accepted within 30 days for a full refund.
              </AccordionRow>
              <AccordionRow title="Care Instructions">
                Machine wash cold with like colours. Do not bleach. Tumble dry low. Iron low if needed.
              </AccordionRow>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <p className="text-xs text-neutral-400">Added {formatDate(product.createdAt)}</p>
              <a
                href={`/products/${product._id}`}
                className="text-xs font-semibold uppercase tracking-wide text-neutral-700 underline-offset-2 hover:underline dark:text-neutral-300"
              >
                View full page →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Card
// ─────────────────────────────────────────────────────────────────────────────

function ProductCard({
  data,
  onQuickView,
}: {
  data: TApiProduct
  onQuickView: (p: TApiProduct) => void
}) {
  const imageUrl = data.images?.[0] ? imgSrc(data.images[0]) : null
  const colorName = data.color?.name ?? null
  const discount = calcDiscount(data.exactPrice, data.discountPrice)
  const { rating, reviews } = fakeRating(data._id)
  const newIn = isNewIn(data.createdAt)

  return (
    <div className="group flex flex-col">
      <div className="relative overflow-hidden rounded-2xl bg-[#f0f0f0] dark:bg-neutral-800">
        <div className="relative aspect-square w-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={data.name}
              className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <PlaceholderImg className="h-full w-full" />
          )}
        </div>

        {newIn && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 shadow-sm backdrop-blur-sm dark:bg-neutral-900/90 dark:text-neutral-200">
            <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            New in
          </div>
        )}

        <div className="absolute right-3 top-3">
          <WishlistBtn productId={data._id} />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-end gap-2 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-transparent pb-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            onClick={() => onQuickView(data)}
            className="translate-y-3 rounded-full bg-white/95 px-5 py-2 text-xs font-semibold text-neutral-900 shadow-md backdrop-blur-sm transition-all duration-300 hover:bg-white group-hover:translate-y-0"
          >
            Quick View
          </button>
          <div className="translate-y-4 transition-all duration-300 delay-75 group-hover:translate-y-0">
            <AddToBagBtn product={data} variant="pill" />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 px-0.5">
        {colorName && (
          <div className="flex items-center gap-1.5">
            {[colorHex(colorName), colorHex(colorName) + 'bb', colorHex(colorName) + '77'].map((hex, i) => (
              <span key={i} className="h-4 w-4 rounded-full border border-white shadow ring-1 ring-neutral-200 dark:ring-neutral-700" style={{ backgroundColor: hex }} />
            ))}
          </div>
        )}
        <h3 className="line-clamp-1 text-sm font-bold text-neutral-900 dark:text-white">{data.name}</h3>
        {colorName && (
          <p className="text-xs capitalize text-neutral-400 dark:text-neutral-500">
            {colorName.charAt(0).toUpperCase() + colorName.slice(1)}
          </p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {formatPrice(data.discountPrice)}
            {data.exactPrice > data.discountPrice && (
              <span className="ml-1.5 text-xs font-normal text-green-500 line-through opacity-75">
                {formatPrice(data.exactPrice)}
              </span>
            )}
          </span>
          <StarRating rating={rating} reviews={reviews} />
        </div>
        {data.stock > 0 && data.stock <= 5 && (
          <p className="text-[11px] font-medium text-orange-500">Only {data.stock} left!</p>
        )}
        {data.stock === 0 && (
          <p className="text-[11px] font-medium text-red-500">Out of stock</p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main exported component
// ─────────────────────────────────────────────────────────────────────────────

export interface SectionSliderProductCardProps {
  className?: string
  heading?: string
  headingFontClassName?: string
  headingClassName?: string
  subHeading?: string
  emblaOptions?: EmblaOptionsType
  pollInterval?: number
  /**
   * ✅ Pass the logged-in user's email here so cart saves to the backend.
   * Example: userEmail={session?.user?.email}
   */
  userEmail?: string
}

const SectionSliderProductCard: FC<SectionSliderProductCardProps> = ({
  className = '',
  headingFontClassName,
  headingClassName,
  heading,
  subHeading = 'REY backpacks & bags',
  emblaOptions = { slidesToScroll: 'auto' },
  pollInterval = POLL_INTERVAL,
  userEmail,
}) => {
  const [products, setProducts] = useState<TApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<TApiProduct | null>(null)
  const isMounted = useRef(true)
  const bag = useBag()

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    useCarouselArrowButtons(emblaApi)

  // ✅ Set user email into bag store when prop is provided
  useEffect(() => {
    if (userEmail) {
      bag.setUserEmail(userEmail)
    }
  }, [userEmail])

  const fetchProducts = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true)
      setError(null)
      const res = await fetch(`${BASE_URL}/api/productview`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      const list: TApiProduct[] = Array.isArray(json) ? json : (json.data ?? [])
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      if (isMounted.current) {
        setProducts(list)
        setLastUpdated(new Date())
      }
    } catch (err: any) {
      if (isMounted.current) setError(err.message ?? 'Failed to load products')
    } finally {
      if (isMounted.current && !isBackground) setLoading(false)
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    fetchProducts(false)
    return () => { isMounted.current = false }
  }, [fetchProducts])

  useEffect(() => {
    if (!pollInterval) return
    const id = setInterval(() => fetchProducts(true), pollInterval)
    return () => clearInterval(id)
  }, [fetchProducts, pollInterval])

  return (
    <>
      <div className={`nc-SectionSliderProductCard ${className}`}>
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

          {pollInterval > 0 && lastUpdated && !loading && (
            <div className="absolute right-28 top-1/2 hidden -translate-y-1/2 items-center gap-1.5 lg:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs text-neutral-400">
                Live · {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex gap-5 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-[86%] flex-shrink-0 sm:w-1/2 md:w-1/3 xl:w-1/4">
                <div className="animate-pulse">
                  <div className="aspect-square w-full rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
                  <div className="mt-3 space-y-2 px-0.5">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((j) => (
                        <div key={j} className="h-4 w-4 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                      ))}
                    </div>
                    <div className="h-4 w-3/4 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    <div className="h-3 w-1/3 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    <div className="flex items-center justify-between">
                      <div className="h-7 w-24 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                      <div className="h-4 w-20 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-14 text-center dark:border-red-900/20 dark:bg-red-900/10">
            <svg className="mb-3 h-10 w-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Failed to load products</p>
            <p className="mt-1 text-xs text-neutral-400">{error}</p>
            <button
              onClick={() => fetchProducts(false)}
              className="mt-4 rounded-full bg-red-500 px-5 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="embla" ref={emblaRef}>
            <div className="-ms-5 embla__container sm:-ms-8">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="embla__slide basis-[86%] ps-5 sm:ps-8 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <ProductCard data={product} onQuickView={setQuickViewProduct} />
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl bg-neutral-50 py-14 dark:bg-neutral-800">
            <p className="text-sm text-neutral-400">No products available.</p>
          </div>
        )}
      </div>

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </>
  )
}

export default SectionSliderProductCard