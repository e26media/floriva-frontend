// components/CountryCategory.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid'
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

function buildCategoryHref(id: string, countryName?: string | null) {
  if (countryName) return `/country/${countryName}/category/${id}`
  return `/category/${id}`
}

// ─── Desktop Dropdown Menu Item ────────────────────────────────────────────────

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
              <li key={sub._id}>
                <Link
                  href={buildCategoryHref(sub._id, countryName)}
                  className="block rounded-md px-4 py-2 text-sm font-normal text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

// ─── Mobile Category Item Component (Direct Show) ─────────────────────────────

interface MobileCategoryItemProps {
  category: Category
  countryName?: string | null
  onNavigate?: () => void
}

const MobileCategoryItem = ({ category, countryName, onNavigate }: MobileCategoryItemProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = category.subCategories?.length > 0

  const toggleOpen = () => {
    if (hasChildren) {
      setIsOpen(!isOpen)
    }
  }

  const handleLinkClick = () => {
    if (!hasChildren && onNavigate) {
      onNavigate()
    }
  }

  const handleSubLinkClick = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between">
        <Link
          href={buildCategoryHref(category._id, countryName)}
          onClick={handleLinkClick}
          className="flex-1 py-3 px-4 text-base font-medium text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        >
          {category.name}
        </Link>
        
        {hasChildren && (
          <button
            onClick={toggleOpen}
            className="p-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${category.name}`}
          >
            <ChevronDownIcon
              className={clsx(
                'h-4 w-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="bg-neutral-50 dark:bg-neutral-800/50">
          {category.subCategories.map((sub) => (
            <Link
              key={sub._id}
              href={buildCategoryHref(sub._id, countryName)}
              onClick={handleSubLinkClick}
              className="block py-2.5 px-8 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mobile Direct Category View ───────────────────────────────────────────────

interface MobileDirectViewProps {
  categories: Category[]
  countryName?: string | null
  showHomeLink?: boolean
  showAllProductsLink?: boolean
  isOpen?: boolean
  onClose?: () => void
}

const MobileDirectView = ({ 
  categories, 
  countryName,
  showHomeLink = true,
  showAllProductsLink = true,
  isOpen = true,
  onClose
}: MobileDirectViewProps) => {
  const pathname = usePathname()

  // Close sidebar when route changes (navigation occurs)
  useEffect(() => {
    if (isOpen && onClose) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const handleNavigate = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Close Button */}
      {onClose && (
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {countryName ? `${countryName.charAt(0).toUpperCase() + countryName.slice(1)}` : 'Categories'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className={clsx('flex-1 overflow-y-auto', !onClose && 'pt-2')} aria-label="Mobile category navigation">
        <div className="space-y-1">
          {/* Home Link */}
          {/* {showHomeLink && (
            <div className="border-b border-neutral-200 dark:border-neutral-700">
              <Link
                href="/"
                onClick={handleNavigate}
                className="block py-3 px-4 text-base font-medium text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                Home
              </Link>
            </div>
          )} */}

          {/* All Products Links */}
          {showAllProductsLink && (
            <>
              <div className="border-b border-neutral-200 dark:border-neutral-700">
                <Link
                  href={countryName ? `/country/${countryName}` : '/allproduct'}
                  onClick={handleNavigate}
                  className="block py-3 px-4 text-base font-medium text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  {countryName ? `All in ${countryName}` : 'All Products'}
                </Link>
              </div>
              <div className="border-b border-neutral-200 dark:border-neutral-700">
                <Link
                  href={countryName ? `/country/${countryName}/allproduct` : '/allproduct'}
                  onClick={handleNavigate}
                  className="block py-3 px-4 text-base font-medium text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  All Products
                </Link>
              </div>
            </>
          )}

          {/* Categories */}
          {categories.map((category) => (
            <MobileCategoryItem
              key={category._id}
              category={category}
              countryName={countryName}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </nav>
    </div>
  )
}

// ─── Skeleton loader ───────────────────────────────────────────────────────────

const NavSkeleton = () => (
  <>
    {/* Desktop Skeleton */}
    <ul className="hidden lg:flex gap-1" aria-label="Loading navigation">
      {[1, 2, 3, 4, 5].map((i) => (
        <li key={i} aria-hidden="true">
          <div
            className="h-9 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700"
            style={{ width: [120, 90, 110, 80, 100][i % 5] }}
          />
        </li>
      ))}
    </ul>
    
    {/* Mobile Skeleton */}
    <div className="lg:hidden space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between py-3 px-4">
            <div className="h-5 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      ))}
    </div>
  </>
)

// ─── Static nav link for desktop ──────────────────────────────────────────────

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
  countryName?: string
  showHomeLink?: boolean
  showAllProductsLink?: boolean
  /** For mobile: whether to show as a sidebar with close button or direct view */
  isSidebar?: boolean
  isOpen?: boolean
  onClose?: () => void
}

const CountryCategory = ({ 
  className, 
  apiUrl = API_URL, 
  countryName: propCountry,
  showHomeLink = true,
  showAllProductsLink = true,
  isSidebar = false,
  isOpen = true,
  onClose
}: CategoryNavProps) => {
  const { categories, loading, error } = useCategoryData(apiUrl)
  
  // Auto-detect country from URL params if not passed as prop
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
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      <nav className="hidden lg:block" aria-label="Category navigation">
        <ul className={clsx('flex flex-wrap items-center gap-1', className)}>
          {showHomeLink && <StaticNavLink href="/" label="Home" />}
          {showAllProductsLink && (
            <>
              <StaticNavLink
                href={countryName ? `/country/${countryName}` : '/allproduct'}
                label={countryName ? `All in ${countryName}` : 'All Products'}
              />
              <StaticNavLink
                href={countryName ? `/country/${countryName}/allproduct` : '/allproduct'}
                label="All Products"
              />
            </>
          )}
          {categories.map((category) => (
            <CategoryDropdown
              key={category._id}
              category={category}
              countryName={countryName}
            />
          ))}
        </ul>
      </nav>

      {/* Mobile Direct View - Always visible on mobile, no menu button needed */}
      <div className="lg:hidden">
        <MobileDirectView
          categories={categories}
          countryName={countryName}
          showHomeLink={showHomeLink}
          showAllProductsLink={showAllProductsLink}
          isOpen={isOpen}
          onClose={isSidebar ? onClose : undefined}
        />
      </div>
    </>
  )
}

export default CountryCategory