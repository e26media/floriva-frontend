'use client'

import Heading from '@/components/Heading/Heading'
import { useCarouselArrowButtons } from '@/hooks/use-carousel-arrow-buttons'
import type { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'
import { FC, useCallback, useEffect, useRef, useState, Suspense } from 'react'

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
export interface TApiProduct {
  _id: string; name: string; title: string; description: string
  exactPrice: number; discountPrice: number
  category: TCategory | null; subCategory: string | null; color: TColor | null
  stock: number; deliveryInfo: string; images: string[]
  createdAt: string; updatedAt: string
  country?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000'
const POLL_INTERVAL = 30_000

// ─────────────────────────────────────────────────────────────────────────────
// Colour maps
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_FLOWER_IMAGES: Record<string, string> = {
  red:      'https://www.fnp.com/assets/images/custom/flowers_24/Choose%20a%20Favourite%20Colour/Red-25-9-24.png',
  purple:   'https://www.fnp.com/assets/images/custom/flowers_24/Choose%20a%20Favourite%20Colour/Purple-25-9-24.png',
  pink:     'https://www.fnp.com/assets/images/custom/flowers_24/Choose%20a%20Favourite%20Colour/Pink-25-9-24.png',
  peach:    'https://www.fnp.com/assets/images/custom/flowers_24/Choose%20a%20Favourite%20Colour/Peach-25-9-24.png',
  orange:   'https://www.fnp.com/assets/images/custom/flowers_24/Choose%20a%20Favourite%20Colour/Orange-25-9-24.png',
  yellow:   'https://www.fnp.com/assets/images/custom/flowers_24/Choose%20a%20Favourite%20Colour/Yellow-25-9-24.png',
  white:    'https://www.fnp.com/assets/images/custom/flowers_24/Choose%20a%20Favourite%20Colour/White-25-9-24.png',
  blue:     'https://www.fnp.com/assets/images/custom/flowers_24/Choose%20a%20Favourite%20Colour/Blue-25-9-24.png',
  green:    'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=220&h=220&fit=crop&crop=center',
  lavender: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=220&h=220&fit=crop&crop=center',
  mixed:    'https://images.unsplash.com/photo-1487530811015-780c4a0e7de5?w=220&h=220&fit=crop&crop=center',
  pastel:   'https://images.unsplash.com/photo-1533616688419-b7a585564566?w=220&h=220&fit=crop&crop=center',
  coral:    'https://images.unsplash.com/photo-1490750967868-88df5691166b?w=220&h=220&fit=crop&crop=center',
  black:    'https://images.unsplash.com/photo-1566138163-8e432bf4fb4a?w=220&h=220&fit=crop&crop=center',
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

// ─────────────────────────────────────────────────────────────────────────────
// Country extraction — reads from params synchronously (no async useEffect)
// ─────────────────────────────────────────────────────────────────────────────

function resolveCountryFromPathname(pathname: string): string {
  const match = pathname.match(/\/country\/([^/]+)/)
  if (match && match[1] && match[1] !== 'undefined') return match[1]
  return ''
}

function useCurrentCountry(): string {
  const params = useParams()
  const pathname = usePathname()

  // 1. Try Next.js route params first (most reliable in App Router)
  const paramCountry = params?.country as string | undefined
  if (paramCountry && paramCountry !== 'undefined') return paramCountry

  // 2. Parse from pathname (available synchronously on first render)
  if (pathname) {
    const fromPath = resolveCountryFromPathname(pathname)
    if (fromPath) return fromPath
  }

  // 3. Client-side fallback (also synchronous once window exists)
  if (typeof window !== 'undefined') {
    const fromWindow = resolveCountryFromPathname(window.location.pathname)
    if (fromWindow) return fromWindow
  }

  return ''
}

// ─────────────────────────────────────────────────────────────────────────────
// Cart helpers
// ─────────────────────────────────────────────────────────────────────────────

function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const userRaw = localStorage.getItem('floriva_user')
    if (userRaw) { const p = JSON.parse(userRaw); if (p?.email) return p.email }
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

async function apiAddToCart(productId: string, quantity: number) {
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
  } catch { return { ok: false, message: 'Network error. Please try again.' } }
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast System
// ─────────────────────────────────────────────────────────────────────────────

type TToastType = 'success' | 'error'
type TCartToast = { id: number; product: TApiProduct; qty: number; type: TToastType; message?: string }
let _toastItems: TCartToast[] = []
let _toastCounter = 0
const _toastListeners = new Set<() => void>()
const _notifyToast = () => _toastListeners.forEach(fn => fn())

function pushToast(product: TApiProduct, qty: number, type: TToastType, message?: string) {
  const id = ++_toastCounter
  _toastItems = [..._toastItems, { id, product, qty, type, message }]
  _notifyToast()
  setTimeout(() => { _toastItems = _toastItems.filter(t => t.id !== id); _notifyToast() }, 3500)
}

function CartToastContainer() {
  const [, rerender] = useState(0)
  useEffect(() => {
    const fn = () => rerender(n => n + 1)
    _toastListeners.add(fn)
    return () => { _toastListeners.delete(fn) }
  }, [])
  if (_toastItems.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <style>{`@keyframes toastSlide{from{opacity:0;transform:translateX(80px) scale(0.9)}to{opacity:1;transform:translateX(0) scale(1)}}`}</style>
      {_toastItems.map(toast => {
        const imageUrl = toast.product.images?.[0] ? imgSrc(toast.product.images[0]) : null
        const isError = toast.type === 'error'
        return (
          <div key={toast.id} style={{ animation: 'toastSlide 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards', minWidth: 300, maxWidth: 360 }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white shadow-2xl border border-gray-100 px-4 py-3">
            <div className={`h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden ${isError ? 'bg-red-50' : 'bg-gray-50'}`}>
              {!isError && imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-xl">{isError ? '⚠️' : '🛍️'}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold mb-0.5 ${isError ? 'text-red-600' : 'text-emerald-600'}`}>{isError ? 'Error' : '✓ Added to Bag!'}</p>
              {isError ? <p className="text-sm text-gray-700">{toast.message}</p> : <>
                <p className="text-sm font-semibold text-gray-900 truncate">{toast.product.name}</p>
                <p className="text-xs text-gray-400">Qty {toast.qty} · ₹{toast.product.discountPrice.toLocaleString('en-IN')}</p>
              </>}
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

function fakeRating(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return { rating: Math.round((3.8 + (hash % 13) * 0.1) * 10) / 10, reviews: 20 + (hash % 160) }
}

function isNewIn(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
}

function formatPrice(n: number) { return '₹' + n.toLocaleString('en-IN') }

function getSwatches(product: TApiProduct) {
  if (!product.color?.name) return []
  return [{ hex: colorHex(product.color.name), name: product.color.name }]
}

// ─────────────────────────────────────────────────────────────────────────────
// useAddToCart Hook
// ─────────────────────────────────────────────────────────────────────────────

function useAddToCart(product: TApiProduct) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const addToCart = useCallback(async (qty = 1) => {
    if (loading || product.stock === 0) return
    setLoading(true)
    const result = await apiAddToCart(product._id, qty)
    setLoading(false)
    if (result.ok) { setAdded(true); pushToast(product, qty, 'success'); setTimeout(() => setAdded(false), 2000) }
    else pushToast(product, qty, 'error', result.message)
  }, [loading, product])
  return { addToCart, loading, added }
}

// ─────────────────────────────────────────────────────────────────────────────
// StarRating Component
// ─────────────────────────────────────────────────────────────────────────────

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="text-xs font-medium text-gray-500">
        {rating.toFixed(1)} <span className="text-gray-400 font-normal">({reviews} reviews)</span>
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QtyStepper Component
// ─────────────────────────────────────────────────────────────────────────────

function QtyStepper({ value, onChange, max }: { value: number; onChange: (n: number) => void; max: number }) {
  return (
    <div className="flex h-11 items-center overflow-hidden rounded-full border border-gray-200 bg-white">
      <button onClick={() => onChange(Math.max(1, value - 1))} className="flex h-full w-11 items-center justify-center text-gray-500 transition hover:bg-gray-50">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
      </button>
      <span className="w-10 border-x border-gray-200 text-center text-sm font-bold text-gray-800">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="flex h-full w-11 items-center justify-center text-gray-500 transition hover:bg-gray-50">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>
    </div>
  )
}

function AccordionRow({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between py-3.5 text-left text-sm font-semibold text-gray-800">
        {title}
        <svg className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-4 text-sm leading-relaxed text-gray-500">{children}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick View Modal
// ─────────────────────────────────────────────────────────────────────────────

function QuickViewModal({ product, onClose }: { product: TApiProduct; onClose: () => void }) {
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const { addToCart, loading: adding, added } = useAddToCart(product)
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

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  useEffect(() => {
    if (!thumbsRef.current) return
    const thumb = thumbsRef.current.children[activeImg] as HTMLElement | undefined
    thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeImg])

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(24px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes imgIn{from{opacity:0}to{opacity:1}}`}</style>
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        style={{ animation: 'modalIn 0.3s cubic-bezier(0.34,1.1,0.64,1) forwards' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="flex flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <div className="w-full flex-shrink-0 lg:w-[48%]">
            <div className="relative aspect-square w-full overflow-hidden bg-gray-50 rounded-tl-3xl rounded-tr-3xl lg:rounded-tr-none lg:rounded-bl-3xl">
              {hasImages ? (
                <img key={activeImg} src={imgSrc(product.images[activeImg])} alt={product.name} className="h-full w-full object-cover" style={{ animation: 'imgIn 0.2s ease' }} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <svg className="h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              )}
              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                {isNewIn(product.createdAt) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-gray-700 shadow-sm">
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    New in
                  </span>
                )}
                {discount >= 10 && <span className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white">{discount}% Off</span>}
              </div>
              {product.images.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(i => (i - 1 + product.images.length) % product.images.length)} className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:shadow-lg">
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setActiveImg(i => (i + 1) % product.images.length)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:shadow-lg">
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div ref={thumbsRef} className="flex gap-2 overflow-x-auto p-3 bg-white" style={{ scrollbarWidth: 'none' }}>
                {product.images.map((im, idx) => (
                  <button key={idx} onClick={() => setActiveImg(idx)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${activeImg === idx ? 'border-gray-900' : 'border-transparent opacity-50 hover:opacity-75'}`}>
                    <img src={imgSrc(im)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex w-full flex-col overflow-y-auto border-l border-gray-100 p-6 lg:w-[52%] lg:max-h-[90vh]">
            {categoryName && <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">{categoryName}</p>}
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{product.name}</h2>
            {product.title && product.title !== product.name && <p className="text-sm text-gray-400 mb-3">{product.title}</p>}
            <div className="mb-4"><StarRating rating={rating} reviews={reviews} /></div>
            <div className="flex items-center gap-3 mb-5">
              <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-lg font-bold text-emerald-700">{formatPrice(product.discountPrice)}</span>
              {product.exactPrice > product.discountPrice && (
                <><span className="text-sm text-gray-400 line-through">{formatPrice(product.exactPrice)}</span>
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500">-{discount}%</span></>
              )}
            </div>
            {swatches.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 text-xs font-semibold text-gray-500">Colour: <span className="capitalize text-gray-800">{colorName}</span></p>
                <div className="flex items-center gap-2">
                  {swatches.map((sw, i) => (
                    <span key={i} title={sw.name} className="h-6 w-6 rounded-full border-2 border-gray-900 ring-2 ring-gray-900 ring-offset-1 cursor-default" style={{ backgroundColor: sw.hex }} />
                  ))}
                </div>
              </div>
            )}
            <div className="mb-5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${product.stock > 5 ? 'bg-emerald-50 text-emerald-700' : product.stock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>
            <div className="mb-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-gray-400">Quantity</p>
              <div className="flex gap-3">
                <QtyStepper value={qty} onChange={setQty} max={product.stock || 1} />
                <button onClick={() => addToCart(qty)} disabled={outOfStock || adding}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${outOfStock ? 'cursor-not-allowed bg-gray-100 text-gray-400' : adding ? 'cursor-wait bg-gray-800 text-white' : added ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-gray-900 text-white hover:bg-gray-700 hover:shadow-lg'}`}>
                  {adding ? <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Adding…</>
                    : added ? <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Added!</>
                      : <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>{outOfStock ? 'Out of Stock' : 'Add to Bag'}</>}
                </button>
              </div>
            </div>
            <hr className="border-gray-100 mb-4" />
            {product.description && <AccordionRow title="Description">{product.description}</AccordionRow>}
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400"></p>
              <a href={`/product/${product._id}`} className="text-xs font-semibold text-gray-700 underline-offset-2 hover:underline">View full page →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Card Component
// ─────────────────────────────────────────────────────────────────────────────

function ProductCard({ data, onQuickView }: { data: TApiProduct; onQuickView: (p: TApiProduct) => void }) {
  const imageUrl = data.images?.[0] ? imgSrc(data.images[0]) : null
  const colorName = data.color?.name ?? null
  const discount = calcDiscount(data.exactPrice, data.discountPrice)
  const newIn = isNewIn(data.createdAt)
  const outOfStock = data.stock === 0
  const swatches = getSwatches(data)
  const { addToCart, loading, added } = useAddToCart(data)

  return (
    <div className="group flex flex-col">
      <div className="relative overflow-hidden rounded-3xl bg-gray-100">
        <div className="relative aspect-square w-full">
          {imageUrl ? (
            <img src={imageUrl} alt={data.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-3xl">
              <span className="rounded-full bg-gray-800/80 px-4 py-1.5 text-xs font-semibold text-white">Out of Stock</span>
            </div>
          )}
        </div>
        {newIn && !outOfStock && (
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
              <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              New in
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full flex-col gap-2 p-3 transition-transform duration-300 group-hover:translate-y-0">
          <button onClick={e => { e.stopPropagation(); e.preventDefault(); onQuickView(data) }}
            className="w-full rounded-2xl bg-white/95 py-2.5 text-xs font-semibold text-gray-900 shadow-md backdrop-blur-sm transition hover:bg-white active:scale-[0.97]">
            Quick View
          </button>
          <button onClick={e => { e.stopPropagation(); e.preventDefault(); addToCart(1) }} disabled={outOfStock || loading}
            className={`w-full rounded-2xl py-2.5 text-xs font-semibold transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-1.5 ${outOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : loading ? 'bg-gray-800 text-white cursor-wait opacity-80' : added ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-900 text-white hover:bg-gray-700 shadow-md'}`}>
            {loading ? <><svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Adding…</>
              : added ? <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Added!</>
                : outOfStock ? 'Out of Stock'
                  : <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>Add to Bag</>}
          </button>
        </div>
      </div>
      <div className="mt-3 px-0.5">
        {swatches.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            {swatches.map((sw, i) => (
              <span key={i} title={sw.name} className="h-4 w-4 rounded-full border border-white shadow-sm ring-1 ring-gray-300 cursor-default" style={{ backgroundColor: sw.hex }} />
            ))}
          </div>
        )}
        <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-1 mb-0.5">{data.name}</h3>
        <p className="text-[13px] text-gray-400 mb-2">
          {colorName ? `${colorName.charAt(0).toUpperCase()}${colorName.slice(1)}` : data.category?.name ?? ''}
        </p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">{formatPrice(data.discountPrice)}</span>
          {data.exactPrice > data.discountPrice && <span className="text-xs text-gray-400 line-through">{formatPrice(data.exactPrice)}</span>}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Component
// ─────────────────────────────────────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-square w-full animate-pulse rounded-3xl bg-gray-200" />
      <div className="mt-3 space-y-2 px-0.5">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-gray-200" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-gray-200" />
        <div className="h-7 w-20 animate-pulse rounded-full bg-gray-200" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ColourPickerSection Component
// ─────────────────────────────────────────────────────────────────────────────

interface ColourPickerSectionProps {
  colors: Array<{ name: string; hex: string; count: number }>
}

function ColourPickerSection({ colors }: ColourPickerSectionProps) {
  const router = useRouter()
  const country = useCurrentCountry()

  if (colors.length === 0) return null

  const Sparkle = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="inline-block opacity-70">
      <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#4a5c2a" />
    </svg>
  )

  return (
    <div className="relative w-full rounded-3xl overflow-hidden py-10 px-6 mb-10"
      style={{ background: 'linear-gradient(135deg, #f8f1ec 0%, #fdf6f0 50%, #f0f4ec 100%)' }}>
      <style>{`
        @keyframes colourBubbleIn {
          from { opacity: 0; transform: translateY(18px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .colour-bubble-item {
          animation: colourBubbleIn 0.45s ease forwards;
          opacity: 0;
        }
        .colour-bubble-item:hover .colour-bubble-label {
          color: #2d3a1e;
          font-weight: 700;
        }
        .colour-bubble-label { transition: color 0.2s, font-weight 0.2s; }
      `}</style>

      <div className="flex items-center justify-center gap-3 mb-8">
        <Sparkle />
        <h2 className="text-xl font-bold text-center" style={{ color: '#3a4a28', letterSpacing: '-0.01em' }}>
          Choose a Favourite Colour
        </h2>
        <Sparkle />
      </div>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-8 max-w-5xl mx-auto">
        {colors.map((color, idx) => {
          const flowerImg = COLOR_FLOWER_IMAGES[color.name.toLowerCase()]
          const label = color.name.charAt(0).toUpperCase() + color.name.slice(1)

          return (
            <button
              key={color.name}
              className="colour-bubble-item flex flex-col items-center gap-2.5 bg-transparent border-none cursor-pointer p-0"
              style={{ animationDelay: `${idx * 0.055}s` }}
              onClick={() => {
                if (!country) return
                const targetUrl = `/country/${country}/allproduct?color=${encodeURIComponent(color.name.toLowerCase())}`
                router.push(targetUrl)
              }}
              aria-label={`Browse ${label} flowers`}
            >
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden">
                {flowerImg ? (
                  <img
                    src={flowerImg}
                    alt={label}
                    className="h-full w-full object-cover"
                    style={{ opacity: 0.9, mixBlendMode: 'multiply' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white text-3xl">🌸</div>
                )}
              </div>
              <span className="colour-bubble-label text-sm text-gray-600 font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — uses useSearchParams (must be inside Suspense)
// ─────────────────────────────────────────────────────────────────────────────

export interface SectionSliderProductCardProps {
  className?: string
  heading?: string
  headingFontClassName?: string
  headingClassName?: string
  subHeading?: string
  emblaOptions?: EmblaOptionsType
  pollInterval?: number
}

function CountryColorSectionInner({
  className = '',
  headingFontClassName,
  headingClassName,
  heading,
  subHeading = '',
  emblaOptions = { slidesToScroll: 'auto', align: 'start', loop: false },
  pollInterval = POLL_INTERVAL,
}: SectionSliderProductCardProps) {
  // ── All hooks called unconditionally at the top ──────────────────────────
  const country = useCurrentCountry()           // synchronous — no async
  const searchParams = useSearchParams()         // safe inside Suspense
  const colorFilter = searchParams?.get('color') ?? null

  const [allProducts, setAllProducts] = useState<TApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<TApiProduct | null>(null)

  const isMounted = useRef(true)
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = useCarouselArrowButtons(emblaApi)

  // ── Fetch products ────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (bg = false) => {
    if (!isMounted.current) return
    try {
      if (!bg) setLoading(true)
      setError(null)
      const res = await fetch(`${BASE_URL}/api/productview`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      const list: TApiProduct[] = Array.isArray(json) ? json : (json.data ?? [])
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      if (isMounted.current) {
        setAllProducts(list)
        setLoading(false)
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message ?? 'Failed to load products')
        setLoading(false)
      }
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

  // ── Derive filtered products synchronously (no extra useEffect needed) ───
  const filteredProducts = (() => {
    let list = allProducts

    if (country) {
      list = list.filter(p => {
        const pc = p.country
        if (pc && typeof pc === 'string' && pc.trim()) {
          return pc.toLowerCase() === country.toLowerCase()
        }
        return true // include products with no country field
      })
    }

    if (colorFilter) {
      list = list.filter(p =>
        p.color?.name?.toLowerCase() === colorFilter.toLowerCase()
      )
    }

    return list
  })()

  // ── Derive available colours from filtered products ──────────────────────
  const availableColors = (() => {
    const map = new Map<string, { hex: string; count: number }>()
    filteredProducts.forEach(p => {
      if (p.color?.name) {
        const name = p.color.name.toLowerCase()
        const ex = map.get(name)
        map.set(name, { hex: colorHex(name), count: (ex?.count ?? 0) + 1 })
      }
    })
    return Array.from(map.entries())
      .map(([name, { hex, count }]) => ({ name, hex, count }))
      .sort((a, b) => b.count - a.count)
  })()

  const handleQuickView = useCallback((product: TApiProduct) => setQuickViewProduct(product), [])

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`nc-SectionSliderProductCard ${className}`}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-300 border-r-gray-900" />
            <p className="mt-4 text-sm text-gray-500">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && allProducts.length === 0) {
    return (
      <div className={`nc-SectionSliderProductCard ${className}`}>
        <div className="flex flex-col items-center justify-center rounded-3xl border border-red-100 bg-red-50 py-14 text-center">
          <p className="text-sm font-semibold text-red-600">Failed to load products</p>
          <p className="mt-1 text-xs text-gray-400">{error}</p>
          <button
            onClick={() => fetchProducts(false)}
            className="mt-4 rounded-full bg-gray-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-gray-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!loading && filteredProducts.length === 0 && allProducts.length > 0) {
    return (
      <div className={`nc-SectionSliderProductCard ${className}`}>
        <div className="flex flex-col items-center justify-center rounded-3xl bg-gray-50 py-14 text-center">
          <p className="text-sm text-gray-500">
            {country ? `No products available in ${country}.` : 'No products available.'}
          </p>
          {colorFilter && (
            <p className="mt-2 text-xs text-gray-400">
              No products found for color: {colorFilter}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`nc-SectionSliderProductCard ${className}`}>
        {(heading || subHeading) && (
          <div className="mb-8">
            <Heading
              className={headingClassName}
              fontClass={headingFontClassName}
              // rightDescText={subHeading}
            >
              {heading || 'Shop by Colour'}
            </Heading>
          </div>
        )}

        {filteredProducts.length > 0 && availableColors.length > 0 && (
          <ColourPickerSection colors={availableColors} />
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

// ─────────────────────────────────────────────────────────────────────────────
// Public export — wraps inner component in Suspense so useSearchParams is safe
// ─────────────────────────────────────────────────────────────────────────────

const CountryColorSection: FC<SectionSliderProductCardProps> = (props) => (
  <>
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-300 border-r-gray-900" />
            <p className="mt-4 text-sm text-gray-500">Loading products...</p>
          </div>
        </div>
      }
    >
      <CountryColorSectionInner {...props} />
    </Suspense>
    <CartToastContainer />
  </>
)

export default CountryColorSection