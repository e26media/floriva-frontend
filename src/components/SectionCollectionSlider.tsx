'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import type { EmblaOptionsType } from 'embla-carousel'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  _id: string
  name: string
  categoriesimg?: string
  img?: string
  image?: string
  photo?: string
  thumbnail?: string
  count?: number
  slug?: string
  description?: string
  subtitle?: string
  tag?: string
}

// ─── API / Image base URL ─────────────────────────────────────────────────────

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000'

const API_URL = `${BASE_URL}/api/categoryview`

// ─── Resolve image — prefix relative paths with BASE_URL ─────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveImage(cat: any): string | null {
  const raw =
    cat.categoriesimg ||   // ← your backend field, first priority
    cat.img ||
    cat.image ||
    cat.photo ||
    cat.thumbnail ||
    cat.cover ||
    cat.banner ||
    cat.picture ||
    null

  if (!raw) return null
  if (raw.startsWith('http') || raw.startsWith('blob:') || raw.startsWith('/')) {
    return raw
  }
  // Relative path like "uploads/categories/file.png" → full URL
  return `${BASE_URL}/${raw}`
}

// ─── Pastel card palettes ─────────────────────────────────────────────────────

const CARD_PALETTES = [
  { bg: '#FEF6EE', label: 'Explore new arrivals' },
  { bg: '#EEFAF3', label: 'Sale collection' },
  { bg: '#EEF4FD', label: 'Sale collection' },
  { bg: '#FDF0F5', label: 'New collection' },
  { bg: '#F5F0FD', label: 'Featured picks' },
  { bg: '#F0FAF9', label: 'Top sellers' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCategories(data: any): Category[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.categories)) return data.categories
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.result)) return data.result
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.payload)) return data.payload
  if (Array.isArray(data.response)) return data.response
  if (data.data && Array.isArray(data.data.categories)) return data.data.categories
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key]) && data[key].length > 0) return data[key]
  }
  return []
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveId(cat: any): string {
  return String(cat._id || cat.id || cat.slug || Math.random())
}

// ─── Collection Card ──────────────────────────────────────────────────────────

function CollectionCard({
  category,
  index,
  onClick,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category: any
  index: number
  onClick: () => void
}) {
  const imgSrc = resolveImage(category)
  const id = resolveId(category)
  const palette = CARD_PALETTES[index % CARD_PALETTES.length]

  const headline = category.name || 'Collection'
  const subLabel = category.subtitle || category.tag || palette.label

  return (
    <Link
      href={`/category/${id}`}
      onClick={onClick}
      className="group relative flex h-full w-full select-none items-center overflow-hidden rounded-3xl transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
      style={{ backgroundColor: palette.bg, minHeight: '200px' }}
    >
      {/* ── Left: text ── */}
      <div className="relative z-10 flex flex-1 flex-col justify-between self-stretch p-6 sm:p-7">
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-neutral-500">
            {subLabel}
          </p>
          <h3 className="text-xl font-bold leading-snug text-neutral-900 sm:text-2xl">
            {headline}
          </h3>
          {category.count !== undefined && (
            <p className="mt-1 text-sm text-neutral-500">{category.count}+ items</p>
          )}
        </div>
        <div className="mt-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm ring-1 ring-neutral-200 transition-all duration-200 group-hover:shadow-md group-hover:ring-neutral-300">
            Show me all
          </span>
        </div>
      </div>

      {/* ── Right: product image ── */}
      <div className="relative flex w-36 flex-shrink-0 items-center justify-center self-stretch overflow-hidden sm:w-44 md:w-52">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={headline}
            className="absolute bottom-0 right-0 h-full max-h-[200px] w-auto max-w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // Hide broken image gracefully — show initials fallback
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          // No image — show initial avatar
          <div
            className="flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-black"
            style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.25)' }}
          >
            {headline.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </Link>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard({ bg }: { bg: string }) {
  return (
    <div
      className="flex h-full min-h-[200px] w-full animate-pulse items-center overflow-hidden rounded-3xl"
      style={{ backgroundColor: bg }}
    >
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="h-3 w-28 rounded-full bg-neutral-200" />
        <div className="h-7 w-3/4 rounded-xl bg-neutral-200" />
        <div className="h-3 w-1/3 rounded-full bg-neutral-200" />
        <div className="mt-4 h-9 w-32 rounded-full bg-white shadow-sm" />
      </div>
      <div className="flex w-44 flex-shrink-0 items-end justify-center self-stretch pb-4 pr-4">
        <div className="h-36 w-28 rounded-2xl bg-neutral-200" />
      </div>
    </div>
  )
}

// ─── Dot ─────────────────────────────────────────────────────────────────────

function Dot({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full transition-all duration-300 ${
        active ? 'h-2 w-6 bg-neutral-800' : 'h-2 w-2 bg-neutral-300 hover:bg-neutral-400'
      }`}
    />
  )
}

// ─── Arrow button ─────────────────────────────────────────────────────────────

function ArrowBtn({
  dir,
  onClick,
  disabled,
}: {
  dir: 'prev' | 'next'
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous' : 'Next'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:border-neutral-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <svg className="h-4 w-4 text-neutral-700 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d={dir === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
        />
      </svg>
    </button>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  className?: string
  emblaOptions?: EmblaOptionsType
  headingDim?: string
  heading?: string
  autoPlayInterval?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubCategoryClick?: (category: any) => void
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SectionCollectionSlider = ({
  className = '',
  headingDim = 'Good things are waiting for you',
  heading = 'Discover more',
  emblaOptions = { slidesToScroll: 1, align: 'start', loop: true },
  autoPlayInterval = 5000,
  onSubCategoryClick,
}: Props) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [prevDisabled, setPrevDisabled] = useState(false)
  const [nextDisabled, setNextDisabled] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progressKey, setProgressKey] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)

  // ── Embla select ──────────────────────────────────────────────────────────

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    const idx = emblaApi.selectedScrollSnap()
    setSelectedIndex(idx)
    setProgressKey(k => k + 1)
    setPrevDisabled(!emblaApi.canScrollPrev())
    setNextDisabled(!emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', () => {
      setScrollSnaps(emblaApi.scrollSnapList())
      onSelect()
    })
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  // ── Auto-play ─────────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startTimer = useCallback(() => {
    if (!emblaApi) return
    stopTimer()
    timerRef.current = setInterval(() => emblaApi.scrollNext(), autoPlayInterval)
  }, [emblaApi, autoPlayInterval, stopTimer])

  useEffect(() => {
    if (isPaused || categories.length === 0) { stopTimer(); return }
    startTimer()
    return stopTimer
  }, [isPaused, categories.length, startTimer, stopTimer])

  // ── Nav ───────────────────────────────────────────────────────────────────

  const handlePrev = useCallback(() => { emblaApi?.scrollPrev(); stopTimer(); if (!isPaused) startTimer() }, [emblaApi, isPaused, startTimer, stopTimer])
  const handleNext = useCallback(() => { emblaApi?.scrollNext(); stopTimer(); if (!isPaused) startTimer() }, [emblaApi, isPaused, startTimer, stopTimer])
  const handleDot  = useCallback((i: number) => { emblaApi?.scrollTo(i); stopTimer(); if (!isPaused) startTimer() }, [emblaApi, isPaused, startTimer, stopTimer])

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(API_URL, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        const data = await res.json()
        if (process.env.NODE_ENV === 'development') {
          console.log('[SectionCollectionSlider] Raw →', data)
          setDebugInfo(JSON.stringify(data, null, 2))
        }
        const list = extractCategories(data)
        setCategories(list.slice(0, 6))
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const handleCardClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cat: any) => { console.log('[SectionCollectionSlider] clicked:', cat); onSubCategoryClick?.(cat) },
    [onSubCategoryClick]
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes prog { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        .sc-prog { transform-origin: left; animation: prog ${autoPlayInterval}ms linear forwards; }
      `}</style>

      <div className={`${className}`}>

        {/* ── Section heading ── */}
        <div className="container mb-8 flex items-end justify-between lg:mb-10">
          <div>
            <p className="mb-1.5 text-sm font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              {headingDim}
            </p>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 lg:text-4xl">
              {heading}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <ArrowBtn dir="prev" onClick={handlePrev} disabled={prevDisabled} />
            <ArrowBtn dir="next" onClick={handleNext} disabled={nextDisabled} />
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="container grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CARD_PALETTES.map((p, i) => <SkeletonCard key={i} bg={p.bg} />)}
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="container">
            <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
              <svg className="h-5 w-5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* ── Slider ── */}
        {!loading && !error && categories.length > 0 && (
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="overflow-hidden pl-4 sm:pl-6 lg:pl-8" ref={emblaRef}>
              <div className="-ml-4 flex sm:-ml-5">
                {categories.map((cat, i) => (
                  <div
                    key={resolveId(cat)}
                    className="min-w-0 flex-shrink-0 basis-[92%] pl-4 sm:basis-[62%] sm:pl-5 lg:basis-[38%] xl:basis-[34%] 2xl:basis-[30%]"
                  >
                    <CollectionCard
                      category={cat}
                      index={i}
                      onClick={() => handleCardClick(cat)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Dots + progress bar ── */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5">
                {scrollSnaps.map((_, i) => (
                  <Dot key={i} active={i === selectedIndex} onClick={() => handleDot(i)} />
                ))}
              </div>
              <div className="h-[3px] w-24 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  key={progressKey}
                  className={`h-full rounded-full bg-neutral-700 dark:bg-neutral-300 ${isPaused ? '' : 'sc-prog'}`}
                  style={isPaused ? { transform: 'scaleX(0)' } : undefined}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && categories.length === 0 && (
          <div className="container">
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 py-16 dark:border-neutral-700 dark:bg-neutral-900">
              <svg className="mb-3 h-10 w-10 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm font-medium text-neutral-400">No categories found</p>
              <p className="mt-1 text-xs text-neutral-300">Check your API connection and try again</p>
              {process.env.NODE_ENV === 'development' && debugInfo && (
                <details className="mt-4 w-full max-w-md px-6">
                  <summary className="cursor-pointer text-xs text-neutral-400">Dev — raw API response</summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-neutral-100 p-3 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {debugInfo}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default SectionCollectionSlider