'use client'

import Heading from '@/components/Heading/Heading'
import { useCarouselArrowButtons } from '@/hooks/use-carousel-arrow-buttons'
import type { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import { FC, useCallback, useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Global Styles
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  /* ── Carousel ── */
  .bs-slide {
    flex: 0 0 60%;
    padding-left: 12px;
    min-width: 0;
  }
  @media (min-width: 480px)  { .bs-slide { flex: 0 0 50%;      padding-left: 16px; } }
  @media (min-width: 640px)  { .bs-slide { flex: 0 0 48%;      padding-left: 20px; } }
  @media (min-width: 768px)  { .bs-slide { flex: 0 0 33.333%;  padding-left: 24px; } }
  @media (min-width: 1280px) { .bs-slide { flex: 0 0 25%;      padding-left: 28px; } }
  .bs-track { margin-left: -12px; }
  @media (min-width: 480px)  { .bs-track { margin-left: -16px; } }
  @media (min-width: 640px)  { .bs-track { margin-left: -20px; } }
  @media (min-width: 768px)  { .bs-track { margin-left: -24px; } }
  @media (min-width: 1280px) { .bs-track { margin-left: -28px; } }

  /* ── Animations ── */
  @keyframes qvBackdrop  { from{opacity:0}     to{opacity:1} }
  @keyframes qvSlideUp   { from{transform:translateY(100%);opacity:.7} to{transform:translateY(0);opacity:1} }
  @keyframes qvSlideDown { to{transform:translateY(110%);opacity:0} }
  @keyframes qvScaleIn   { from{opacity:0;transform:scale(.93) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes qvImgFade   { from{opacity:0} to{opacity:1} }
  @keyframes badgePop    { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }
  @keyframes toastIn     { from{opacity:0;transform:translateY(14px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes spin        { to{transform:rotate(360deg)} }

  .qv-backdrop  { animation: qvBackdrop .25s ease forwards; }
  .qv-sheet     { animation: qvSlideUp  .4s cubic-bezier(.32,.72,0,1) forwards; }
  .qv-sheet-out { animation: qvSlideDown .28s cubic-bezier(.4,0,1,1) forwards; }
  .qv-dialog    { animation: qvScaleIn  .3s cubic-bezier(.34,1.1,.64,1) forwards; }
  .qv-img-fade  { animation: qvImgFade  .2s ease forwards; }
  .badge-pop    { animation: badgePop   .3s cubic-bezier(.34,1.56,.64,1) .1s both; }
  .toast-in     { animation: toastIn    .35s cubic-bezier(.34,1.2,.64,1) forwards; }
  .spin         { animation: spin .65s linear infinite; }

  /* ── Scrollbars ── */
  .qv-scroll::-webkit-scrollbar       { width:3px; }
  .qv-scroll::-webkit-scrollbar-track { background:transparent; }
  .qv-scroll::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:99px; }
  .no-scrollbar                        { -ms-overflow-style:none; scrollbar-width:none; }
  .no-scrollbar::-webkit-scrollbar    { display:none; }

  /* ── Image dot ── */
  .img-dot              { transition:all .2s ease; }
  .img-dot.active       { width:20px; opacity:1; }

  /* ── Card hover ── */
  .card-overlay {
    transform: translateY(100%);
    transition: transform .32s cubic-bezier(.4,0,.2,1);
  }
  @media (hover:hover) { .card-wrap:hover .card-overlay { transform:translateY(0); } }
  @media (hover:none)  { .card-overlay { transform:translateY(0); } }

  .card-img { transition: transform .55s cubic-bezier(.4,0,.2,1); }
  @media (hover:hover) { .card-wrap:hover .card-img { transform:scale(1.07); } }

  .qty-btn:active { background:#f3f4f6; }
`

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
}

interface TOrderProduct { product: string; quantity: number; _id: string }
interface TOrder {
  _id: string; products: TOrderProduct[]
  totalAmount: number; status: string; userEmail: string; createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000'
const POLL_INTERVAL = 30_000

// ─────────────────────────────────────────────────────────────────────────────
// Best Sellers Logic
// ─────────────────────────────────────────────────────────────────────────────

async function fetchBestSellerMap(): Promise<Map<string, number>> {
  try {
    const res = await fetch(`${BASE_URL}/api/orderview`, { cache: 'no-store' })
    if (!res.ok) return new Map()
    const json = await res.json()
    const orders: TOrder[] = Array.isArray(json) ? json : (json.data ?? [])
    const tally = new Map<string, number>()
    for (const order of orders)
      for (const item of order.products ?? [])
        if (item.product) tally.set(item.product, (tally.get(item.product) ?? 0) + item.quantity)
    return tally
  } catch { return new Map() }
}

function sortByBestSelling(products: TApiProduct[], tally: Map<string, number>): TApiProduct[] {
  if (tally.size === 0)
    return [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return [...products].sort((a, b) => {
    const diff = (tally.get(b._id) ?? 0) - (tally.get(a._id) ?? 0)
    return diff !== 0 ? diff : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('floriva_user')
    if (raw) { const p = JSON.parse(raw); if (p?.email) return p.email }
    const tok = localStorage.getItem('floriva_token')
    if (tok) {
      const parts = tok.split('.')
      if (parts.length === 3) {
        const pay = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
        if (pay?.email) return pay.email
      }
    }
    return null
  } catch { return null }
}

function imgSrc(path: string) {
  if (!path) return ''
  return path.startsWith('http') ? path : `${BASE_URL}${path}`
}

function calcDiscount(exact: number, disc: number) {
  if (!exact || exact <= disc) return 0
  return Math.round(((exact - disc) / exact) * 100)
}

function colorHex(name: string): string {
  const m: Record<string, string> = {
    red:'#dc2626', crimson:'#b91c1c', blue:'#2563eb', navy:'#1e3a5f',
    green:'#16a34a', olive:'#65a30d', black:'#171717', white:'#e5e7eb',
    yellow:'#ca8a04', gold:'#b45309', orange:'#ea580c', purple:'#9333ea',
    pink:'#ec4899', rose:'#e11d48', gray:'#6b7280', grey:'#6b7280',
    silver:'#9ca3af', brown:'#78350f', tan:'#92400e', beige:'#d6cfc4',
    cream:'#e8e0d0', camel:'#b08040', indigo:'#4338ca', teal:'#0d9488',
    cyan:'#0891b2', lime:'#65a30d', maroon:'#881337', coral:'#ef4444',
    salmon:'#fb923c', khaki:'#a3a35e', ivory:'#e8e0cc', lavender:'#a78bfa',
    peach:'#fb923c', mint:'#34d399', sky:'#38bdf8',
  }
  return m[name.toLowerCase()] ?? '#9ca3af'
}

function getSwatches(p: TApiProduct) {
  if (!p.color?.name) return []
  return [{ hex: colorHex(p.color.name), name: p.color.name }]
}

function fakeRating(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return { rating: Math.round((3.8 + (h % 13) * 0.1) * 10) / 10, reviews: 20 + (h % 160) }
}

function isNewIn(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
}

function formatPrice(n: number) { return '₹' + n.toLocaleString('en-IN') }

// ─────────────────────────────────────────────────────────────────────────────
// Cart API
// ─────────────────────────────────────────────────────────────────────────────

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
type TToast = { id: number; product: TApiProduct; qty: number; type: TToastType; message?: string }
let _toasts: TToast[] = []
let _toastId = 0
const _toastSubs = new Set<() => void>()
const _notifyToasts = () => _toastSubs.forEach(fn => fn())

function pushToast(product: TApiProduct, qty: number, type: TToastType, message?: string) {
  const id = ++_toastId
  _toasts = [..._toasts, { id, product, qty, type, message }]
  _notifyToasts()
  setTimeout(() => { _toasts = _toasts.filter(t => t.id !== id); _notifyToasts() }, 3500)
}

function CartToastContainer() {
  const [, re] = useState(0)
  useEffect(() => {
    const fn = () => re(n => n + 1)
    _toastSubs.add(fn)
    return () => { _toastSubs.delete(fn) }
  }, [])
  if (!_toasts.length) return null
  return (
    <div className="fixed bottom-4 left-3 right-3 z-[9999] flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-5 sm:bottom-5 sm:w-[340px]">
      {_toasts.map(t => {
        const img = t.product.images?.[0] ? imgSrc(t.product.images[0]) : null
        const err = t.type === 'error'
        return (
          <div key={t.id} className="toast-in pointer-events-auto flex items-center gap-3 rounded-2xl bg-white shadow-xl border border-gray-100 px-4 py-3">
            <div className={`h-11 w-11 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center ${err ? 'bg-red-50' : 'bg-gray-50'}`}>
              {!err && img ? <img src={img} alt="" className="h-full w-full object-cover"/> : <span className="text-lg">{err ? '⚠️' : '🛍️'}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-bold mb-0.5 ${err ? 'text-red-500' : 'text-emerald-600'}`}>{err ? 'Error' : '✓ Added to Bag!'}</p>
              {err
                ? <p className="text-xs text-gray-600 line-clamp-2">{t.message}</p>
                : <><p className="text-sm font-semibold text-gray-900 truncate">{t.product.name}</p>
                    <p className="text-[11px] text-gray-400">Qty {t.qty} · {formatPrice(t.product.discountPrice)}</p></>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// useAddToCart
// ─────────────────────────────────────────────────────────────────────────────

function useAddToCart(product: TApiProduct) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const addToCart = useCallback(async (qty = 1) => {
    if (loading || product.stock === 0) return
    setLoading(true)
    const r = await apiAddToCart(product._id, qty)
    setLoading(false)
    if (r.ok) { setAdded(true); pushToast(product, qty, 'success'); setTimeout(() => setAdded(false), 2200) }
    else pushToast(product, qty, 'error', r.message)
  }, [loading, product])
  return { addToCart, loading, added }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stars
// ─────────────────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`h-3 w-3 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QtyStepper
// ─────────────────────────────────────────────────────────────────────────────

function QtyStepper({ value, onChange, max }: { value: number; onChange: (n: number) => void; max: number }) {
  return (
    <div className="inline-flex h-11 items-center rounded-full border border-gray-200 bg-white overflow-hidden select-none flex-shrink-0">
      <button className="qty-btn flex h-full w-11 items-center justify-center text-gray-500"
        onClick={() => onChange(Math.max(1, value - 1))} aria-label="Decrease">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4"/></svg>
      </button>
      <span className="w-10 text-center text-sm font-bold text-gray-900 border-x border-gray-200">{value}</span>
      <button className="qty-btn flex h-full w-11 items-center justify-center text-gray-500"
        onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Accordion
// ─────────────────────────────────────────────────────────────────────────────

function AccordionRow({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm font-semibold text-gray-800">
        {title}
        <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && <div className="pb-4 text-sm leading-relaxed text-gray-500">{children}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Add To Bag Button
// ─────────────────────────────────────────────────────────────────────────────

function AddToBagBtn({ outOfStock, adding, added, onAdd, fullWidth = false }: {
  outOfStock: boolean; adding: boolean; added: boolean; onAdd: () => void; fullWidth?: boolean
}) {
  return (
    <button
      onClick={onAdd}
      disabled={outOfStock || adding}
      className={`flex items-center justify-center gap-2 rounded-full h-11 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${fullWidth ? 'w-full' : 'flex-1'} ${
        outOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : adding   ? 'bg-gray-800 text-white cursor-wait'
          : added    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
          : 'bg-gray-900 text-white hover:bg-gray-700 shadow-sm hover:shadow-md'
      }`}
    >
      {adding ? (
        <><svg className="h-4 w-4 spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>Adding…</>
      ) : added ? (
        <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
        </svg>Added!</>
      ) : outOfStock ? 'Out of Stock' : (
        <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>Add to Bag</>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick View Modal
// ─────────────────────────────────────────────────────────────────────────────

function QuickViewModal({ product, onClose, soldCount = 0 }: {
  product: TApiProduct; onClose: () => void; soldCount?: number
}) {
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [closing, setClosing] = useState(false)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const { addToCart, loading: adding, added } = useAddToCart(product)

  const { rating, reviews } = fakeRating(product._id)
  const discount = calcDiscount(product.exactPrice, product.discountPrice)
  const outOfStock = product.stock === 0
  const swatches = getSwatches(product)
  const hasImages = product.images.length > 0
  const isBestSeller = soldCount > 0

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 280)
  }, [onClose])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [handleClose])

  useEffect(() => {
    if (!thumbsRef.current) return
    const el = thumbsRef.current.children[activeImg] as HTMLElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeImg])

  return (
    <div
      className={`fixed inset-0 z-[9998] flex flex-col justify-end sm:items-center sm:justify-center sm:px-4 sm:py-6 ${closing ? '' : 'qv-backdrop'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      {/*
        ══════════════════════════════════════════════════════
        CONTAINER:
          mobile  → full-width bottom sheet, slides up, 94dvh max
          tablet  → centred card (max-w-2xl, rounded-3xl)
          desktop → side-by-side wide card (max-w-5xl)
        ══════════════════════════════════════════════════════
      */}
      <div
        className={`
          relative w-full bg-white overflow-hidden
          flex flex-col
          rounded-t-[28px] max-h-[94dvh]
          sm:rounded-3xl sm:max-w-[680px] sm:max-h-[90vh]
          lg:max-w-[940px] lg:flex-row lg:max-h-[84vh] lg:rounded-3xl
          ${closing ? 'qv-sheet-out' : 'qv-sheet sm:qv-dialog'}
        `}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Drag handle pill (mobile only) ── */}
        <div className="sm:hidden flex-shrink-0 pt-3 pb-2 flex justify-center bg-white">
          <div className="h-1 w-10 rounded-full bg-gray-300"/>
        </div>

        {/* ── Close ── */}
        <button onClick={handleClose} aria-label="Close"
          className="absolute right-3.5 top-3.5 z-40 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-gray-700 backdrop-blur-sm transition hover:bg-black/20 active:scale-90">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        {/* ══════════════════════════════════════════════════
            SCROLLABLE BODY (full on mobile, flex row on lg)
        ══════════════════════════════════════════════════ */}
        <div className="flex flex-col overflow-y-auto flex-1 min-h-0 lg:flex-row lg:overflow-hidden">

          {/* ────────────────────────────────
              LEFT / TOP  ─  Image section
          ──────────────────────────────── */}
          <div className="flex-shrink-0 w-full lg:w-[43%] lg:overflow-hidden">

            {/* Main image — portrait ratio on mobile, square on lg */}
            <div className="relative overflow-hidden bg-gray-50"
              style={{ aspectRatio: '1 / 1.08' }}>

              {hasImages ? (
                <img
                  key={activeImg}
                  src={imgSrc(product.images[activeImg])}
                  alt={product.name}
                  className="qv-img-fade h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              )}

              {/* Bottom gradient for dots */}
              {product.images.length > 1 && (
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"/>
              )}

              {/* Badges */}
              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                {isBestSeller ? (
                  <span className="badge-pop inline-flex items-center gap-1 rounded-full bg-[#EA597A] px-3 py-1.5 text-[11px] font-bold text-white shadow-lg">
                    🔥 Best Seller
                  </span>
                ) : isNewIn(product.createdAt) ? (
                  <span className="badge-pop inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-gray-800 shadow-md backdrop-blur-sm">
                    <svg className="h-3 w-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    New In
                  </span>
                ) : null}
                {discount >= 10 && (
                  <span className="badge-pop rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">{discount}% Off</span>
                )}
              </div>

              {/* Prev / Next */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg(i => (i - 1 + product.images.length) % product.images.length)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur-sm transition hover:bg-white active:scale-90"
                    aria-label="Previous">
                    <svg className="h-4 w-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button
                    onClick={() => setActiveImg(i => (i + 1) % product.images.length)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur-sm transition hover:bg-white active:scale-90"
                    aria-label="Next">
                    <svg className="h-4 w-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {product.images.length > 1 && (
                <div className="absolute bottom-3.5 left-0 right-0 flex items-center justify-center gap-1.5">
                  {product.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImg(idx)}
                      aria-label={`Image ${idx + 1}`}
                      className={`img-dot h-1.5 rounded-full bg-white shadow-sm ${idx === activeImg ? 'active w-5 opacity-100' : 'w-1.5 opacity-55'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail strip — only visible on tablet+ */}
            {product.images.length > 1 && (
              <div ref={thumbsRef} className="no-scrollbar hidden sm:flex gap-2 p-2.5 overflow-x-auto bg-white">
                {product.images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImg(idx)}
                    className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-150 ${
                      activeImg === idx ? 'border-gray-900 opacity-100' : 'border-transparent opacity-40 hover:opacity-65'
                    }`}>
                    <img src={imgSrc(img)} alt="" className="h-full w-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ────────────────────────────────
              RIGHT / BOTTOM  ─  Details
          ──────────────────────────────── */}
          <div className="qv-scroll flex-1 overflow-y-auto border-t border-gray-100 lg:border-t-0 lg:border-l lg:min-h-0">
            <div className="p-4 sm:p-5 lg:p-6">

              {/* Category breadcrumb */}
              {product.category?.name && (
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  {product.category.name}
                </p>
              )}

              {/* Name */}
              <h2 className="text-[18px] sm:text-xl lg:text-2xl font-extrabold text-gray-900 leading-tight pr-6 mb-1">
                {product.name}
              </h2>
              {product.title && product.title !== product.name && (
                <p className="text-xs sm:text-sm text-gray-400 mb-3 leading-relaxed">{product.title}</p>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <Stars rating={rating}/>
                <span className="text-xs font-semibold text-gray-600">{rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({reviews} reviews)</span>
              </div>

              {/* Trending badge */}
              {isBestSeller && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  {soldCount} sold · trending now
                </div>
              )}

              {/* Price block */}
              <div className="flex items-center gap-2.5 flex-wrap mb-4">
                <span className="text-2xl font-black text-gray-900 tracking-tight">
                  {formatPrice(product.discountPrice)}
                </span>
                {product.exactPrice > product.discountPrice && (
                  <>
                    <span className="text-sm text-gray-400 line-through">{formatPrice(product.exactPrice)}</span>
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-500">−{discount}%</span>
                  </>
                )}
              </div>

              {/* Color */}
              {swatches.length > 0 && (
                <div className="mb-4">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                    Colour: <span className="normal-case font-semibold text-gray-700 capitalize">{product.color?.name}</span>
                  </p>
                  <div className="flex gap-2">
                    {swatches.map((s, i) => (
                      <div key={i} title={s.name}
                        className="h-7 w-7 rounded-full border-[3px] border-gray-900 ring-2 ring-gray-900 ring-offset-2 cursor-default"
                        style={{ backgroundColor: s.hex }}/>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock */}
              <div className="mb-5">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  product.stock > 5  ? 'bg-emerald-50 text-emerald-700'
                  : product.stock > 0 ? 'bg-amber-50 text-amber-600'
                  : 'bg-red-50 text-red-600'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current"/>
                  {product.stock > 0 ? `${product.stock} left in stock` : 'Out of stock'}
                </span>
              </div>

              {/* ── Quantity + Add to Bag ── */}
              <div className="mb-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Quantity</p>
                <div className="flex items-stretch gap-2">
                  <QtyStepper value={qty} onChange={setQty} max={product.stock || 1}/>
                  <AddToBagBtn
                    outOfStock={outOfStock}
                    adding={adding}
                    added={added}
                    onAdd={() => addToCart(qty)}
                  />
                </div>
              </div>

              <hr className="border-gray-100 mb-3"/>

              {/* Accordions */}
              {product.description && <AccordionRow title="Description">{product.description}</AccordionRow>}
              {product.deliveryInfo && <AccordionRow title="Delivery & Returns">{product.deliveryInfo}</AccordionRow>}

              {/* Footer */}
              <div className="flex items-center justify-end pt-4 mt-1">
                <a href={`/product/${product._id}`}
                  className="text-xs font-bold text-gray-700 underline underline-offset-4 decoration-gray-300 hover:text-gray-900 hover:decoration-gray-600 transition-colors">
                  View full details →
                </a>
              </div>

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

function ProductCard({ data, onQuickView, soldCount, rank }: {
  data: TApiProduct; onQuickView: (p: TApiProduct) => void; soldCount: number; rank: number
}) {
  const imageUrl = data.images?.[0] ? imgSrc(data.images[0]) : null
  const discount = calcDiscount(data.exactPrice, data.discountPrice)
  const outOfStock = data.stock === 0
  const swatches = getSwatches(data)
  const isBestSeller = soldCount > 0
  const { addToCart, loading, added } = useAddToCart(data)

  return (
    <div className="card-wrap flex flex-col">

      {/* Image */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-100">
        {/* 1.2 portrait ratio */}
        <div className="relative w-full" style={{ paddingBottom: '120%' }}>
          <div className="absolute inset-0">

            {imageUrl ? (
              <img src={imageUrl} alt={data.name} className="card-img h-full w-full object-cover"/>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-300">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
            )}

            {/* Out-of-stock overlay */}
            {outOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/55 rounded-2xl sm:rounded-3xl">
                <span className="rounded-full bg-gray-900/75 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">Out of Stock</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
              {isBestSeller && !outOfStock && (
                <span className="inline-flex items-center rounded-full bg-[#EA597A] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                  Best Seller
                </span>
              )}
              {discount >= 10 && (
                <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">{discount}%</span>
              )}
            </div>

            {/* Hover / touch overlay */}
            <div className="card-overlay absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-2.5">
              <button
                onClick={e => { e.stopPropagation(); e.preventDefault(); onQuickView(data) }}
                className="w-full rounded-xl bg-white/95 py-2.5 text-[12px] font-semibold text-gray-900 shadow-md backdrop-blur-sm transition hover:bg-white active:scale-[0.97]"
              >
                Quick View
              </button>
              <button
                onClick={e => { e.stopPropagation(); e.preventDefault(); addToCart(1) }}
                disabled={outOfStock || loading}
                className={`w-full rounded-xl py-2.5 text-[12px] font-semibold transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                  outOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : loading ? 'bg-gray-800 text-white opacity-80'
                    : added   ? 'bg-emerald-500 text-white'
                    : 'bg-gray-900 text-white'}`}
              >
                {loading ? (
                  <><svg className="h-3.5 w-3.5 spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>Adding…</>
                ) : added ? (
                  <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Added!</>
                ) : outOfStock ? 'Out of Stock' : (
                  <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>Add to Bag</>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2.5 px-0.5">
        {swatches.length > 0 && (
          <div className="flex gap-1.5 mb-1.5">
            {swatches.map((s, i) => (
              <span key={i} title={s.name}
                className="h-3.5 w-3.5 rounded-full border border-white shadow ring-1 ring-gray-300 cursor-default"
                style={{ backgroundColor: s.hex }}/>
            ))}
          </div>
        )}
        <h3 className="text-[13px] sm:text-[15px] font-bold text-gray-900 leading-snug line-clamp-1 mb-0.5">{data.name}</h3>
        <p className="text-[11px] sm:text-[13px] text-gray-400 mb-1.5">
          {data.color?.name
            ? data.color.name.charAt(0).toUpperCase() + data.color.name.slice(1)
            : data.category?.name ?? ''}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs sm:text-sm font-bold text-emerald-700">
            {formatPrice(data.discountPrice)}
          </span>
          {data.exactPrice > data.discountPrice && (
            <span className="text-[11px] text-gray-400 line-through">{formatPrice(data.exactPrice)}</span>
          )}
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
      <div className="w-full animate-pulse rounded-2xl sm:rounded-3xl bg-gray-200" style={{ paddingBottom: '120%' }}/>
      <div className="mt-3 space-y-2 px-0.5">
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-gray-200"/>
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-gray-200"/>
        <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200"/>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
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

const BestSellerProduct: FC<SectionSliderProductCardProps> = ({
  className = '',
  headingFontClassName,
  headingClassName,
  heading,
  subHeading = 'Shop our most loved picks',
  emblaOptions = { slidesToScroll: 'auto', dragFree: true },
  pollInterval = POLL_INTERVAL,
}) => {
  const [products, setProducts] = useState<TApiProduct[]>([])
  const [salesTally, setSalesTally] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<TApiProduct | null>(null)
  const isMounted = useRef(true)

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    useCarouselArrowButtons(emblaApi)

  const fetchProducts = useCallback(async (bg = false) => {
    try {
      if (!bg) setLoading(true)
      setError(null)
      const [res, tally] = await Promise.all([
        fetch(`${BASE_URL}/api/productview`, { cache: 'no-store' }),
        fetchBestSellerMap(),
      ])
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      const list: TApiProduct[] = Array.isArray(json) ? json : (json.data ?? [])
      if (isMounted.current) {
        setProducts(sortByBestSelling(list, tally))
        setSalesTally(tally)
      }
    } catch (e: any) {
      if (isMounted.current) setError(e.message ?? 'Failed to load')
    } finally {
      if (isMounted.current && !bg) setLoading(false)
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

  const hasOrders = salesTally.size > 0
  const displayHeading = heading ?? (hasOrders ? 'Best Sellers' : 'New Arrivals')

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <CartToastContainer/>

      <div className={`nc-SectionSliderProductCard ${className}`}>
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
          {displayHeading}
        </Heading>

        {/* Loading skeletons */}
        {loading && (
          <div className="flex overflow-hidden bs-track">
            {[0,1,2,3].map(i => (
              <div key={i} className="bs-slide flex-shrink-0"><ProductCardSkeleton/></div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-red-50 border border-red-100 py-12 px-4 text-center">
            <p className="text-sm font-semibold text-red-600">Could not load products</p>
            <p className="mt-1 text-xs text-gray-400">{error}</p>
            <button onClick={() => fetchProducts(false)}
              className="mt-4 rounded-full bg-gray-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-gray-700 active:scale-95 transition-all">
              Try again
            </button>
          </div>
        )}

        {/* Carousel */}
        {!loading && !error && products.length > 0 && (
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container bs-track flex">
              {products.map((product, index) => (
                <div key={product._id} className="bs-slide embla__slide">
                  <ProductCard
                    data={product}
                    onQuickView={setQuickViewProduct}
                    soldCount={salesTally.get(product._id) ?? 0}
                    rank={index + 1}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div className="flex items-center justify-center rounded-3xl bg-gray-50 py-16">
            <p className="text-sm text-gray-400">No products available right now.</p>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          soldCount={salesTally.get(quickViewProduct._id) ?? 0}
        />
      )}
    </>
  )
}

export default BestSellerProduct 