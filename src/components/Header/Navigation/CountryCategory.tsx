// components/CountryCategory.tsx  (or wherever your component lives)
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubCategory {
  _id: string
  name: string
}

interface Category {
  _id: string
  name: string
  description: string
  subCategories: SubCategory[]
}

interface CategoryViewResponse {
  categories: Category[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categoryview`
    : 'http://localhost:7000/api/categoryview'

const POLL_INTERVAL = 30_000

// ─── Helper: build correct href ───────────────────────────────────────────────
// If countryName is known  → /country/india/category/[id]
// Otherwise fallback       → /category/[id]

function buildCategoryHref(id: string, countryName?: string | null) {
  if (countryName) return `/country/${countryName}/category/${id}`
  return `/category/${id}`
}

// ─── Sub-item link ─────────────────────────────────────────────────────────────

const SubCategoryLink = ({
  sub,
  countryName,
  onClick,
}: {
  sub: SubCategory
  countryName?: string | null
  onClick?: () => void
}) => (
  <li>
    <Link
      href={buildCategoryHref(sub._id, countryName)}
      onClick={onClick}
      className="block rounded-md px-4 py-2 text-sm font-normal text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
    >
      {sub.name}
    </Link>
  </li>
)

// ─── Dropdown Menu Item ────────────────────────────────────────────────────────

const CategoryDropdown = ({
  category,
  countryName,
}: {
  category: Category
  countryName?: string | null
}) => {
  const hasChildren = Array.isArray(category.subCategories) && category.subCategories.length > 0
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <li ref={ref} className="relative group menu-item">
      {/* Parent category link — also scoped to country if available */}
      <Link
        href={buildCategoryHref(category._id, countryName)}
        aria-haspopup={hasChildren ? 'listbox' : undefined}
        aria-expanded={hasChildren ? open : undefined}
        onMouseEnter={() => hasChildren && setOpen(true)}
        onMouseLeave={() => hasChildren && setOpen(false)}
        onFocus={() => hasChildren && setOpen(true)}
        onBlur={(e) => {
          if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false)
        }}
        className="flex items-center self-center rounded-full px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 lg:text-[15px] xl:px-5 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
      >
        {category.name}
        {hasChildren && (
          <ChevronDownIcon
            className={clsx(
              'ml-1 -mr-1 h-4 w-4 text-neutral-400 transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden="true"
          />
        )}
      </Link>

      {/* Dropdown panel */}
      {hasChildren && (
        <div
          role="listbox"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={clsx(
            'absolute top-full left-0 z-50 w-52 pt-1',
            'transition-all duration-200 ease-out',
            open
              ? 'visible opacity-100 translate-y-0 pointer-events-auto'
              : 'invisible opacity-0 translate-y-1 pointer-events-none',
          )}
        >
          <ul className="rounded-lg bg-white py-2 text-sm shadow-lg ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
            {category.subCategories.map((sub) => (
              <SubCategoryLink
                key={sub._id}
                sub={sub}
                countryName={countryName}
                onClick={() => setOpen(false)}
              />
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

// ─── Skeleton loader ───────────────────────────────────────────────────────────

const NAV_SKELETON_WIDTHS = [120, 90, 110, 80, 100] as const

const NavSkeleton = () => (
  <ul className="flex gap-1" aria-label="Loading navigation">
    {NAV_SKELETON_WIDTHS.map((w, i) => (
      <li key={i} aria-hidden="true">
        <div
          className="h-9 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700"
          style={{ width: w }}
        />
      </li>
    ))}
  </ul>
)

// ─── Static nav link ──────────────────────────────────────────────────────────

const StaticNavLink = ({ href, label }: { href: string; label: string }) => (
  <li>
    <Link
      href={href}
      className="flex items-center self-center rounded-full px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 lg:text-[15px] xl:px-5 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
    >
      {label}
    </Link>
  </li>
)

// ─── Custom hook: fetch with polling ──────────────────────────────────────────

function useCategoryData(apiUrl: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  const fetchCategories = useCallback(
    async (signal: AbortSignal, isBackground = false) => {
      try {
        if (!isBackground) setLoading(true)
        setError(null)
        const res = await fetch(apiUrl, {
          signal,
          cache: 'no-store',
        } as RequestInit)
        if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
        const data: CategoryViewResponse = await res.json()
        if (isMounted.current) setCategories(data.categories ?? [])
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        if (isMounted.current) setError((err as Error).message ?? 'Unknown error')
      } finally {
        if (isMounted.current) setLoading(false)
      }
    },
    [apiUrl],
  )

  useEffect(() => {
    isMounted.current = true
    const controller = new AbortController()
    fetchCategories(controller.signal, false)

    let timer: ReturnType<typeof setInterval> | null = null
    if (POLL_INTERVAL > 0) {
      timer = setInterval(() => {
        const bg = new AbortController()
        fetchCategories(bg.signal, true)
      }, POLL_INTERVAL)
    }
    return () => {
      isMounted.current = false
      controller.abort()
      if (timer) clearInterval(timer)
    }
  }, [fetchCategories])

  return { categories, loading, error }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export interface CategoryNavProps {
  className?: string
  apiUrl?: string
  /** Pass explicitly, OR leave undefined to auto-read from URL params */
  countryName?: string
}

const CountryCategory = ({ className, apiUrl = API_URL, countryName: propCountry }: CategoryNavProps) => {
  const { categories, loading, error } = useCategoryData(apiUrl)

  // ✅ Auto-detect country from URL params if not passed as prop
  // Works inside /country/[name]/... routes automatically
  const params = useParams()
  const countryName = propCountry ?? (params?.name as string | undefined) ?? null

  if (loading) return <NavSkeleton />

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-500 dark:text-red-400">
        Failed to load categories: {error}
      </p>
    )
  }

  if (!categories.length) return null

  return (
    <nav aria-label="Category navigation">
      <ul className={clsx('flex flex-wrap items-center gap-1', className)}>
        <StaticNavLink href="/" label="Home" />
        {/* If inside a country page, link "All Products" scoped to country */}
        <StaticNavLink
          href={countryName ? `/country/${countryName}` : '/allproduct'}
          label={countryName ? `All in ${countryName}` : 'All Products'}
        />
   <StaticNavLink
  href={countryName ? `/country/${countryName}/allproduct` : '/allproduct'}
  label="All Products"
/>
        {categories.map((category) => (
          <CategoryDropdown
            key={category._id}
            category={category}
            countryName={countryName}
          />
        ))}
      </ul>
    </nav>
  )
}

export default CountryCategory